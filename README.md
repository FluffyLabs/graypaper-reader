# Gray Paper Reader

- **Production @ https://graypaper.fluffylabs.dev**
- Beta @ https://graypaper-reader.netlify.app

A tool to help with reading and analyzing the Gray Paper.

# Related repositories
- Gray Paper Reader community notes [graypaper-notes](https://github.com/fluffylabs/graypaper-notes).
- Gray Paper Archive [graypaper-archive](https://github.com/fluffylabs/graypaper-archive).

# Tooling

- [matrix-bot](./tools/matrix-bot) - Listens to Matrix channel messages and
  collects the ones containing GP Reader links. These messages can later be
  turned into notes JSON file.
- [links-check](./tools/links-check) - Scan a set of files for GP Reader links
  and check their versions or generate notes JSON file.

# Updating available versions of the Gray Paper

Gray Paper versions are stored in [a separate repository](https://github.com/fluffylabs/graypaper-archive),
added as a git submodule.

```bash
$ git submodule update --init 
```

# Running locally

```bash
$ npm ci      # install dependencies
$ npm run dev # run the development version
```

# Running e2e (snapshosts) tests locally

Visual snapshots tests checks for visual regression.

To run visual snapshots tests:

```bash
cd tools/snapshot-tests
npm install
npm run test 
```

One can also run test with UI simply via:

```bash
npm start
```
