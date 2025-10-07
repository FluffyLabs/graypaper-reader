# Snapshot Tests

This directory contains Playwright snapshot tests for the Gray Paper Reader application.

## Setup

The tests are configured to work both locally and in CI environments. The key feature is that the web server can be started automatically by Playwright when needed.

### Environment Variables

- `PLAYWRIGHT_START_SERVER`: Set to "true" to automatically start the web server before running tests
- `PLAYWRIGHT_PORT`: Port number for the web server (default: 5173)
- `PLAYWRIGHT_HOST`: Hostname for the web server (default: localhost)

## Running Tests

### Local Development

1. **With automatic server startup** (recommended for development):
   ```bash
   npm run test:local
   ```
   This will automatically start the web server and run the tests.

2. **With manual server startup**:
   ```bash
   # In one terminal, start the dev server from the root directory
   cd ../../
   npm run dev
   
   # In another terminal, run tests
   cd tools/snapshot-tests
   npm run test
   ```

3. **Interactive mode**:
   ```bash
   npm run start
   ```

### CI Environment

In GitHub Actions, the tests run with:
- `PLAYWRIGHT_START_SERVER=true`
- `PLAYWRIGHT_PORT=5173` 
- `PLAYWRIGHT_HOST=localhost`

The web server is automatically started using `npm run serve` from the root directory.

### Updating Snapshots

```bash
npm run test:update
```

## Test Structure

The tests are organized into several suites:

- **Homepage Tests**: Basic functionality and screenshot tests
- **Notes Tab**: Testing note-taking features with localStorage
- **Search Functionality**: Search interface and results
- **Top Bar Tests**: Navigation and dropdown interactions
- **Settings**: Settings modal and configuration

## Configuration

The Playwright configuration (`playwright.config.ts`) includes:
- Light and dark mode testing
- Automatic web server startup when `PLAYWRIGHT_START_SERVER` is set
- Configurable port/hostname via environment variables
- CI-specific settings (retries, workers, etc.)

## Troubleshooting

1. **Port conflicts**: If port 5173 is in use, set `PLAYWRIGHT_PORT` to a different port
2. **Server timeout**: The server has a 120-second startup timeout; increase if needed
3. **Browser installation**: Run `npx playwright install --with-deps` if browsers are missing