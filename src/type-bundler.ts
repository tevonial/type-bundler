import fs from "node:fs";
import path from "node:path";
import { exit } from "node:process";
import ts from "typescript";

export interface BundleOptions {
    imports: boolean;
    recurse: boolean;
    all: boolean;
}

interface ExtractedTypes {
    text: string;
    count: number;
}

const checkExtension = (file: string, extension: string) =>
    file + (file.endsWith(extension) ? "" : extension);

// Get all .ts files recursively
function listFiles(dir: string, recurse: boolean): string[] {
    let results: string[] = [];
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && recurse) {
            results = results.concat(listFiles(fullPath, recurse));
        } else if (file.endsWith(".ts")) {
            results.push(fullPath);
        }
    }

    return results;
}

// Extract relative imports
function getImports(filePath: string): string[] {
    const content = fs.readFileSync(filePath, "utf8");
    const regex = /^\s*(?:import|export type)\s+.*from\s+?['"](.*?)['"];?/gm;
    const imports: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (match[1].startsWith(".")) {
            const resolved = checkExtension(
                path.resolve(path.dirname(filePath), match[1]),
                ".ts",
            );

            if (fs.existsSync(resolved)) imports.push(resolved);
        }
    }
    return imports;
}

// Add each unique dependency once, return sorted list
function addDependencies(files: string[]): string[] {
    const graph: Record<string, string[]> = {};
    const visited: Record<string, boolean> = {};
    const sorted: string[] = [];

    function visit(file: string) {
        if (visited[file]) return;
        visited[file] = true;
        for (const dep of graph[file] || []) {
            visit(dep);
        }
        sorted.push(file);
    }

    files.forEach((file) => {
        file = path.resolve(file);
        graph[file] = getImports(file);
        visit(file);
    });

    return sorted;
}

function extractTypes(files: string[], all: boolean): ExtractedTypes {
    let extractedTypes: string[] = [];
    let count = 0;

    for (const file of files) {
        // Create AST from file contents
        const sourceFile = ts.createSourceFile(
            file,
            fs.readFileSync(file, "utf8"),
            ts.ScriptTarget.Latest,
            true,
        );

        let types: string[] = [];

        sourceFile.forEachChild((node) => {
            // Check for Type, Interface, or Enum
            if (
                ts.isInterfaceDeclaration(node) ||
                ts.isTypeAliasDeclaration(node) ||
                ts.isEnumDeclaration(node) ||
                ts.isFunctionDeclaration(node)
            ) {
                // Check if it has the 'export' modifier
                const isExported = node.modifiers?.some(
                    (m) => m.kind === ts.SyntaxKind.ExportKeyword,
                );

                // Get the full text of the node (including JSDoc comments)
                if (all || isExported)
                    types.push(node.getFullText(sourceFile).trim());
            }
        });

        if (types.length > 0) {
            extractedTypes.push(`// Source: ${file}`);
            extractedTypes.push(types.join("\n\n") + "\n");
            count += types.length;
        }
    }

    return {
        text: extractedTypes.join("\n\n"),
        count,
    };
}

export function bundle(
    source: string,
    outputFile: string,
    { imports, recurse, all }: BundleOptions,
) {
    try {
        let list: string[];
        let stat = fs.statSync(source);

        if (stat.isFile()) {
            list = [source];
        } else if (stat.isDirectory()) {
            list = listFiles(source, recurse);
        } else {
            throw new Error("Invalid source provided");
        }

        if (imports) list = addDependencies(list);

        const { text, count } = extractTypes(list, all);
        outputFile = checkExtension(outputFile, ".d.ts");

        fs.mkdirSync(path.dirname(outputFile), { recursive: true });
        fs.writeFileSync(outputFile, text);

        console.log(
            `Found ${count} exported types from ${list.length} files\n`,
        );
    } catch (err) {
        console.error(err);
        exit(1);
    }
}
