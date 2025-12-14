import { Command } from "@commander-js/extra-typings";
import { bundle } from "./type-bundler";

export const program = new Command();

program
    .name("type-bundler")
    .description("Simple typescript file utility")
    .version("1.0.0");

program
    .command("bundle", { isDefault: true })
    .description("Bundle typescript types into a single .d.ts file")
    .argument("[source]", "Source typescript file", "./")
    .argument("<output>", "Output file")
    .option("--no-imports", "Skip crawling dependency tree")
    .option(
        "-r, --recurse",
        "Also search for .ts files in subdirectories",
        false,
    )
    .option("-a, --all", "Output all types, including non-exports", false)
    .action(bundle);
