# Gray Paper Reader - Links Checker

This CLI tool allows you to scan files passed as parameters
in a lookout for links to the Gray Paper (GP) Reader.

Each of these links is then evaluated:

1. We check if the links points to the latest version of the GP.
2. If not, we propose an updated link.
3. We indicate if the updated link is most likely broken due to changes in the GP.

On top the tool is able to:
- automatically update the links to recent version (`--write`)
- generate a JSON file that can be imported to Gray Paper Reader
  (or used as remote notes source) containing notes with filenames with the links
  (`--generate-notes`)

## Quick Start

```bash
npx @fluffylabs/links-check ./path-to-my-project/**/*.ts
```

## Results

```
scanning 3703: 405.271ms

⌛ Outdated links 57/82
  📜 packages/block/assurances.ts
     17: 🧹 https://graypaper.fluffylabs.dev/#/c71229b/135201135601 (version: 0.4.1)
      Can be safely updated (but please check!):
      👉 https://graypaper.fluffylabs.dev/#/364735a/135201135601 (version: 0.4.5)
     42: 🧹 https://graypaper.fluffylabs.dev/#/c71229b/135201135601 (version: 0.4.1)
      Can be safely updated (but please check!):
      👉 https://graypaper.fluffylabs.dev/#/364735a/135201135601 (version: 0.4.5)
     65: 🧹 https://graypaper.fluffylabs.dev/#/c71229b/135201135601 (version: 0.4.1)
      Can be safely updated (but please check!):
      👉 https://graypaper.fluffylabs.dev/#/364735a/135201135601 (version: 0.4.5)

      (...snip...)

  📜 packages/trie/nodes.ts
     13: 🧹 https://graypaper.fluffylabs.dev/#/387103d/0cb0000cb400 (version: 0.3.8)
      Can be safely updated (but please check!):
      👉 https://graypaper.fluffylabs.dev/#/364735a/0cb0000cb400 (version: 0.4.5)

✅ No broken links found amongst 82 total.
⚠️  Yet there are 57 outdated links. See above.
```

## Options

```
Usage: gp-links-check [options] <paths...>

Arguments:
  paths                           Paths of files to be scanned. Supports glob patterns.

Options:
  --ignore-file <path>            Path to a file containing patterns to ignore. Gitignore
                                  format applies. Patterns are resolved according to current
                                  working directory.
  --fail-on-broken                Exit with an error code when broken links are detected.
  --version <name>                Commit hash of specific version to update to (instead of
                                  latest).
  --write                         Modify the files and update reader links to
                                  requested/lastest versions.
  --fix                           Alias for --write.
  --generate-notes <file.json>    Generate notes for the Gray Paper Reader.
  --generate-notes-label <label>  Label assigned to all generated notes.
  -h, --help                      display help for command
```
