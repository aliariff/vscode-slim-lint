# Slim Lint for VS Code

A Visual Studio Code extension that provides linting for Slim templates using the `slim-lint` gem.

## Features

![Demo GIF](https://drive.google.com/uc?export=view&id=1-2YvJzWVsaBu9xOLLFc1OTU7UobOgTmJ)

## Requirements

```
gem install slim_lint
```

## Extension Settings

- `slimLint.executablePath`: Path to slim-lint executable (default: slim-lint)
- `slimLint.configurationPath`: Path to slim-lint configuration file (default: .slim-lint.yml)

## Development

### Prerequisites

- Node.js 18.x or higher
- npm

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Compile the extension: `npm run compile`
4. Run tests: `npm test`

### Available Scripts

- `npm run compile` - Compile TypeScript to JavaScript
- `npm run lint` - Run ESLint for code linting
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run the test suite

## Continuous Integration

This project uses GitHub Actions for continuous integration with the following workflows:

### CI Workflow (`ci.yml`)

- Runs on push to `main`/`develop` branches and pull requests
- Tests on Node.js 18.x, 20.x, and 22.x
- Performs static analysis (ESLint)
- Checks code formatting (Prettier)
- Compiles TypeScript
- Runs test suite
- Uploads test results as artifacts

### Security Workflow (`security.yml`)

- Runs on push, pull requests, and weekly (Mondays)
- Performs npm audit for vulnerability scanning
- Checks for outdated dependencies
- Optional Snyk security scanning (requires `SNYK_TOKEN` secret)

### Package Workflow (`package.yml`)

- Runs on version tag pushes (e.g., `v1.0.0`)
- Performs full validation and testing
- Packages the extension as `.vsix` file
- Uploads packaged extension as artifact

### Local Development

To run the same checks locally that CI performs:

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Check formatting
npm run format:check

# Compile TypeScript
npm run compile

# Run tests
npm test
```
