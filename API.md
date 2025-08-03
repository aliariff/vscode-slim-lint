# Slim Lint for VS Code - API Documentation

This document provides detailed information about the internal API and architecture of the Slim Lint VS Code extension.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Testing](#testing)
- [Extension Points](#extension-points)

## Architecture Overview

The extension follows a modular architecture with clear separation of concerns:

```
src/
├── extension.ts      # Extension entry point and lifecycle management
├── linter.ts         # Core linting engine
└── test/
    ├── fixtures/     # Test files for integration testing
    ├── runTest.ts    # Test runner configuration
    └── suite/        # Test suites
```

### Data Flow

1. **Document Events**: VS Code triggers events for document changes
2. **Extension Activation**: Extension activates and sets up event listeners
3. **Linting Process**: Linter executes slim-lint and parses output
4. **Diagnostic Updates**: Results are displayed in VS Code

## Core Components

### Extension Entry Point (`extension.ts`)

The main entry point that handles extension lifecycle and event management.

#### Key Functions

- `activate(context)`: Extension activation
- `deactivate()`: Extension cleanup
- `validateConfiguration()`: Configuration validation
- Event handlers for document changes

#### Event Handling

```typescript
// Document save events
vscode.workspace.onDidSaveTextDocument(updateDiagnostics);

// Document open events
vscode.workspace.onDidOpenTextDocument(updateDiagnostics);

// Document close events
vscode.workspace.onDidCloseTextDocument(clearDiagnostics);

// Document change events
vscode.workspace.onDidChangeTextDocument(handleDocumentChange);
```

### Linter Engine (`linter.ts`)

The core linting engine that manages slim-lint execution and diagnostic creation.

#### Class: `Linter`

Main linter class that implements `vscode.Disposable`.

##### Constructor

```typescript
constructor(outputChannel: vscode.OutputChannel)
```

Creates a new linter instance with an output channel for logging.

##### Public Methods

###### `run(document: TextDocument): void`

Runs the linter on a document. This is the main entry point for linting.

**Parameters:**

- `document`: The VS Code text document to lint

**Behavior:**

- Validates the document should be linted
- Executes slim-lint command
- Parses output and creates diagnostics
- Updates VS Code diagnostic collection

###### `clear(document: TextDocument): void`

Clears diagnostics for a document.

**Parameters:**

- `document`: The VS Code text document to clear diagnostics for

###### `dispose(): void`

Disposes of the linter and cleans up resources.

##### Private Methods

###### `shouldLintDocument(document: TextDocument): boolean`

Determines if a document should be linted.

**Returns:** `true` if the document is a Slim file and is a file document.

###### `getConfiguration(): SlimLintConfig`

Retrieves and validates slim-lint configuration from VS Code settings.

**Returns:** Configuration object with executable and config paths.

**Throws:** Error if configuration is invalid.

###### `resolveConfigurationPath(configPath: string): string`

Resolves the configuration file path relative to the workspace.

**Parameters:**

- `configPath`: Configuration path from settings

**Returns:** Absolute path to configuration file.

###### `buildCommandArgs(config: SlimLintConfig, documentPath: string): string[]`

Builds the command arguments for slim-lint execution.

**Parameters:**

- `config`: Slim-lint configuration
- `documentPath`: Path to document to lint

**Returns:** Array of command arguments.

###### `executeSlimLint(commandArgs: string[]): Promise<SlimLintOutput>`

Executes the slim-lint command.

**Parameters:**

- `commandArgs`: Command arguments array

**Returns:** Promise resolving to slim-lint output.

**Throws:** Error if execution fails.

###### `parseOutput(output: string, document: TextDocument): Diagnostic[]`

Parses slim-lint output and creates VS Code diagnostics.

**Parameters:**

- `output`: Raw slim-lint output
- `document`: VS Code text document

**Returns:** Array of VS Code diagnostics.

###### `createDiagnostic(match: RegExpExecArray, document: TextDocument): Diagnostic | null`

Creates a single diagnostic from a regex match.

**Parameters:**

- `match`: Regex match from slim-lint output
- `document`: VS Code text document

**Returns:** VS Code diagnostic or null if invalid.

###### `updateDiagnostics(document: TextDocument, diagnostics: Diagnostic[]): void`

Updates VS Code diagnostic collection for a document.

**Parameters:**

- `document`: VS Code text document
- `diagnostics`: Array of diagnostics to set

###### `lint(document: TextDocument): Promise<void>`

Main linting method that orchestrates the entire process.

**Parameters:**

- `document`: VS Code text document to lint

## API Reference

### Types

#### `SlimLintConfig`

```typescript
interface SlimLintConfig {
  executablePath: string;
  configurationPath: string;
}
```

Configuration object containing slim-lint executable and configuration file paths.

#### `SlimLintOutput`

```typescript
interface SlimLintOutput {
  stdout: string;
  stderr: string;
  failed?: boolean;
  code?: string;
}
```

Output from slim-lint execution.

### Constants

```typescript
const SLIM_LANGUAGE_ID = 'slim';
const DIAGNOSTIC_COLLECTION_NAME = 'slim-lint';
const DEFAULT_CONFIG_FILE = '.slim-lint.yml';
const SLIM_LINT_OUTPUT_REGEX = /.+?:(\d+) \[(W|E)] (\w+): (.+)/g;
const LINT_TIMEOUT = 30000; // 30 seconds
```

### Error Handling

The extension implements comprehensive error handling:

#### Configuration Errors

- Missing executable path
- Invalid configuration file
- Permission issues
- File size warnings

#### Execution Errors

- Command not found
- Timeout errors
- Permission denied
- Invalid output format

#### User Feedback

- Error messages in VS Code
- Warning notifications
- Output channel logging
- Debug information

### Performance Considerations

#### Timeout Protection

- 30-second timeout for slim-lint execution
- Prevents hanging on large files
- Configurable timeout value

#### Caching

- Diagnostic collection management
- Efficient document change handling
- Resource cleanup on disposal

#### Memory Management

- Proper disposal of resources
- Diagnostic collection cleanup
- Output channel management

## Configuration

### VS Code Settings

The extension uses VS Code's configuration system:

```json
{
  "slimLint.executablePath": "slim-lint",
  "slimLint.configurationPath": ".slim-lint.yml"
}
```

### Configuration Validation

The extension validates configuration on activation:

1. **Executable Path**: Must be non-empty and contain valid command
2. **Configuration Path**: Must be non-empty
3. **File Accessibility**: Configuration file must be readable
4. **File Size**: Warns if configuration file is very large
5. **File Extension**: Validates YAML file extensions

### Configuration Resolution

Configuration paths are resolved relative to the workspace root:

```typescript
// Relative paths are resolved against workspace root
const resolvedPath = path.join(workspaceRoot, configPath);

// Absolute paths are used as-is
const resolvedPath = path.normalize(configPath);
```

## Testing

### Test Structure

```
src/test/
├── fixtures/           # Test files
│   ├── complex-test.slim
│   ├── tab-test.slim
│   ├── valid-test.slim
│   └── test-file.js
├── runTest.ts         # Test runner
└── suite/
    └── linter.test.ts # Main test suite
```

### Test Categories

#### Unit Tests

- Configuration validation
- Output parsing
- Diagnostic creation
- Error handling

#### Integration Tests

- Real slim-lint execution
- File system operations
- VS Code integration
- Performance testing

#### Fixture Files

- `complex-test.slim`: Tests multiple linting rules
- `tab-test.slim`: Tests tab-related issues
- `valid-test.slim`: Tests clean files
- `test-file.js`: Tests non-Slim files

### Test Utilities

#### `createMockDocument()`

Creates mock VS Code text documents for testing.

#### `runLinterOnFile()`

Runs the linter on fixture files and returns diagnostics.

#### `getFixturePath()`

Resolves paths to test fixture files.

## Extension Points

### VS Code Integration

#### Language Support

```json
{
  "languages": [
    {
      "id": "slim",
      "aliases": ["Slim", "slim"],
      "extensions": [".slim", ".html.slim"]
    }
  ]
}
```

#### Configuration Schema

```json
{
  "configuration": {
    "type": "object",
    "title": "Slim Lint Configuration",
    "properties": {
      "slimLint.executablePath": {
        "type": "string",
        "default": "slim-lint",
        "description": "Path to slim-lint executable"
      },
      "slimLint.configurationPath": {
        "type": "string",
        "default": ".slim-lint.yml",
        "description": "Path to slim-lint configuration file"
      }
    }
  }
}
```

#### Activation Events

```json
{
  "activationEvents": ["onLanguage:slim"]
}
```

### Diagnostic Collection

The extension creates and manages a diagnostic collection:

```typescript
const collection = languages.createDiagnosticCollection('slim-lint');
```

### Output Channel

Provides logging and debugging information:

```typescript
const outputChannel = window.createOutputChannel('Slim Lint');
```

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Add JSDoc comments for public methods

### Error Handling

- Always check disposal state
- Provide meaningful error messages
- Log errors to output channel
- Show user-friendly notifications

### Performance

- Use timeouts for external commands
- Implement proper cleanup
- Avoid blocking operations
- Cache expensive operations

### Testing

- Write unit tests for all public methods
- Include integration tests
- Use fixture files for complex scenarios
- Test error conditions

## Troubleshooting

### Common Issues

#### Extension Not Activating

- Check VS Code version compatibility
- Verify slim-lint installation
- Review configuration settings

#### Linting Not Working

- Validate slim-lint executable path
- Check configuration file permissions
- Review output channel for errors

#### Performance Issues

- Check configuration file size
- Review slim-lint rules
- Monitor timeout settings

### Debugging

Enable debug logging by checking the output channel:

1. Open Command Palette
2. Select "Developer: Show Output"
3. Choose "Slim Lint" from dropdown
4. Review log messages

### Log Levels

- **Info**: Normal operation messages
- **Warning**: Non-critical issues
- **Error**: Critical failures

## Related Projects

- **[slim-lint](https://github.com/sds/slim-lint)**: The core linting tool that powers this extension
- **[Shopify vscode-shopify-ruby](https://github.com/Shopify/vscode-shopify-ruby)**: Comprehensive Ruby development extension pack
- **[Ruby LSP](https://github.com/Shopify/ruby-lsp)**: Language Server Protocol for Ruby

---

This API documentation provides comprehensive information for developers working with or extending the Slim Lint VS Code extension.
