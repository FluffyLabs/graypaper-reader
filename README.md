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

# Running e2e (snapshots) tests locally

Visual snapshot tests checks for visual regression.

## Docker-based Testing (Recommended)

For consistent snapshots that match GitHub Actions:

```bash
# Build Docker images
npm run docker:build

# Run tests
npm run docker:test
# Then open tools/snapshot-test/playwright-report/index.html for visual regression report

# Update snapshots
npm run docker:test:update
```
This will update all the snapshots. You can compare it afterwards in your local Git GUI or Github web interface, and take actions if something is wrong.

## Local Testing 

To run all visual snapshots tests locally:

```bash
cd tools/snapshot-tests
npm install
npm run test 
```

One can also run tests with UI simply via:

```bash
npm start
```

**Note**: Local testing may produce different snapshots than CI due to environment differences. Use Docker-based testing for consistent results.
