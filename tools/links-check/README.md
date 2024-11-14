# Gray Paper Reader - Links Checker

This CLI tool allows you to scan files passed as parameters
in a lookout for links to Gray Paper (GP) Reader.

Each of these links is then evaluated:

1. We check if the links points to the latest version of the GP.
2. If not, we propose an updated link.
3. We indicate if the updated link is most likely broken due to changes in the GP.

## Usage

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
⚠️  Yet there are 57 links. See above.
```

