Feature: Type Bundler

  Background:
    Given target files exist in the following locations:
      | path       | file     | imports                 |
      | target     | index.ts | ["target/a/file1.ts"]   |
      | target/a   | file1.ts | ["target/a/b/file3.ts"] |
      | target/a   | file2.ts | ["target/a/b/file4.ts"] |
      | target/a/b | file3.ts | []                      |
      | target/a/b | file4.ts | []                      |

  Scenario Outline: Bundling
    When bundle is ran with the following options:
      | source   | recurse   | imports   |
      | <source> | <recurse> | <imports> |
    Then output file should contain: <files>

    Examples:
      | source          | recurse | imports | files                                                                                                       |
      | target          | false   | false   | ["target/index.ts"]                                                                                         |
      | target          | true    | false   | ["target/index.ts", "target/a/file1.ts", "target/a/file2.ts", "target/a/b/file3.ts", "target/a/b/file4.ts"] |
      | target          | false   | true    | ["target/index.ts", "target/a/file1.ts", "target/a/b/file3.ts"]                                             |
      | target          | true    | true    | ["target/index.ts", "target/a/file1.ts", "target/a/file2.ts", "target/a/b/file3.ts", "target/a/b/file4.ts"] |
      | target/index.ts | false   | false   | ["target/index.ts"]                                                                                         |
      | target/index.ts | true    | false   | ["target/index.ts"]                                                                                         |
      | target/index.ts | false   | true    | ["target/index.ts", "target/a/file1.ts", "target/a/b/file3.ts"]                                             |
      | target/index.ts | true    | true    | ["target/index.ts", "target/a/file1.ts", "target/a/b/file3.ts"]                                             |
      | target/a        | false   | false   | ["target/a/file1.ts", "target/a/file2.ts"]                                                                  |
      | target/a        | true    | false   | ["target/a/file1.ts", "target/a/file2.ts", "target/a/b/file3.ts", "target/a/b/file4.ts"]                    |
      | target/a        | false   | true    | ["target/a/file1.ts", "target/a/file2.ts", "target/a/b/file3.ts", "target/a/b/file4.ts"]                    |
      | target/a        | true    | true    | ["target/a/file1.ts", "target/a/file2.ts", "target/a/b/file3.ts", "target/a/b/file4.ts"]                    |

  Rule: If source is file, recurse has no effect

    Background:
      Given recurse is true
      And imports is false

    Example: source: file
      Given source is "target/index.ts"
      Then output contains: ["target/index.ts"]

    Example: source: dir
      Given source is "target"
      Then output contains: ["target/index.ts", "target/a/file1.ts", "target/a/file2.ts", "target/a/b/file3.ts", "target/a/b/file4.ts"]

  Rule: If imports is true, bundler crawls deps

    Background:
      Given source is target/index.ts
      And recurse is false

    Example: imports: true
      Given imports is true
      Then output contains: ["target/index.ts", "target/a/file1.ts", "target/a/b/file3.ts"]

    Example: imports: false
      Given imports is false
      Then output contains: ["target/index.ts"]
