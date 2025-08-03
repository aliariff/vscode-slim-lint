# Development Guide

This document provides technical details for developers working on the vscode-slim-lint extension.

## Architecture Overview

The extension consists of two main components:

1. **Extension Entry Point** (`src/extension.ts`): Handles VS Code extension lifecycle and event management
2. **Linter Core** (`src/linter.ts`): Implements the actual linting logic and diagnostic management

## Core Components

### Extension Entry Point (`src/extension.ts`)

The extension entry point manages:

- Extension activation and deactivation
- Configuration validation
- Event listeners for document changes
- Output channel management

#### Key Functions

- `activate()`: Initializes the extension and sets up event listeners
- `deactivate()`: Cleans up resources when the extension is deactivated
- `validateConfiguration()`: Validates slim-lint executable and configuration paths

#### Event Handling

The extension listens for these VS Code events:

- `onDidSaveTextDocument`: Lint files when saved
- `onDidOpenTextDocument`: Lint files when opened
- `onDidCloseTextDocument`: Clear diagnostics when files are closed
- `onDidChangeTextDocument`: Lint files when content changes

### Linter Core (`src/linter.ts`)

The linter core implements:

- slim-lint command execution
- Output parsing and diagnostic creation
- Configuration management
- Error handling and logging

#### Key Classes

**Linter Class**

- Manages diagnostic collections
- Handles slim-lint command execution
- Parses slim-lint output into VS Code diagnostics
- Provides comprehensive error handling

#### Key Methods

- `run(document)`: Main entry point for linting a document
- `clear(document)`: Clears diagnostics for a document
- `dispose()`: Cleans up resources
- `lint(document)`: Executes slim-lint and processes results
- `parseOutput(output, document)`: Converts slim-lint output to diagnostics

## Configuration System

### Extension Settings

The extension uses VS Code's configuration system with these settings:

```json
{
  "slimLint.executablePath": "slim-lint",
  "slimLint.configurationPath": ".slim-lint.yml"
}
```

### Configuration Validation

The extension performs comprehensive validation:

1. **Executable Path Validation**:
   - Checks if path is provided and not empty
   - Validates command structure
   - Warns about unknown executable patterns

2. **Configuration File Validation**:
   - Checks file existence and readability
   - Validates file size (warns if > 1MB)
   - Validates file extension (.yml or .yaml)
   - Suggests alternative configuration files if found

## Linting Process

### 1. Document Filtering

Only `.slim` and `.html.slim` files are processed:

```typescript
private shouldLintDocument(document: TextDocument): boolean {
  return document.languageId === SLIM_LANGUAGE_ID;
}
```

### 2. Command Building

The extension builds slim-lint commands with:

- Executable path from settings
- Configuration file path
- Target file path

### 3. Command Execution

Uses the `execa` library for reliable command execution:

- 30-second timeout protection
- Proper error handling
- Working directory management

### 4. Output Parsing

Parses slim-lint output using regex:

```typescript
const SLIM_LINT_OUTPUT_REGEX = /.+?:(\d+) \[(W|E)] (\w+): (.+)/g;
```

### 5. Diagnostic Creation

Creates VS Code diagnostics with:

- Proper line and character ranges
- Warning/Error severity levels
- Descriptive messages

## Error Handling

### Common Error Scenarios

1. **Executable Not Found**:
   - Checks PATH for slim-lint
   - Validates bundle/gem installations
   - Provides installation instructions

2. **Configuration Issues**:
   - Validates configuration file existence
   - Checks file permissions
   - Suggests alternative configurations

3. **Execution Errors**:
   - Handles timeouts gracefully
   - Provides specific error messages
   - Logs detailed error information

### Error Recovery

- Graceful degradation when slim-lint is unavailable
- Clear user feedback for common issues
- Comprehensive logging for debugging

## Performance Considerations

### Optimization Strategies

1. **Debouncing**: Prevents excessive linting during rapid changes
2. **Content Change Detection**: Skips updates if document content changed during linting
3. **Resource Management**: Proper disposal of diagnostic collections
4. **Timeout Protection**: Prevents hanging processes

### Performance Monitoring

The extension logs performance metrics:

- Linting duration
- Number of diagnostics found
- File size information

## Testing

### Test Structure

Tests are located in `src/test/` with:

- **Unit tests**: Test individual components
- **Integration tests**: Test slim-lint integration
- **Fixture files**: Test data for various scenarios

### Test Categories

1. **Basic Functionality**:
   - File type detection
   - Configuration handling
   - Diagnostic creation

2. **Error Handling**:
   - Invalid configurations
   - Missing executables
   - Malformed output

3. **Real Integration**:
   - Actual slim-lint execution
   - Real file processing
   - Performance testing

### Running Tests

```bash
npm test
```

## Development Workflow

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Compile: `npm run compile`
4. Run tests: `npm test`

### Development Commands

```bash
npm run compile      # Compile TypeScript
npm run watch        # Watch for changes
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm test             # Run tests
```

### Debugging

1. **Output Channel**: Check "Slim Lint" output channel for detailed logs
2. **Extension Host**: Use VS Code's developer tools for debugging
3. **Manual Testing**: Test slim-lint commands manually in terminal

## Contributing

### Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Add comprehensive error handling
- Include appropriate logging

### Testing Requirements

- Add tests for new functionality
- Ensure existing tests pass
- Test error scenarios
- Validate performance impact

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit pull request with description

## Dependencies

### Production Dependencies

- `execa`: Reliable command execution
- `@types/vscode`: VS Code API types

### Development Dependencies

- `typescript`: TypeScript compiler
- `eslint`: Code linting
- `prettier`: Code formatting
- `mocha`: Testing framework
- `@vscode/test-electron`: VS Code testing utilities

## Future Enhancements

### Planned Features

1. **Quick Fixes**: Automatic fixes for common issues
2. **Custom Rules**: User-defined linting rules
3. **Performance Improvements**: Faster linting for large files
4. **Enhanced Configuration**: More granular control options

### Technical Debt

1. **Error Handling**: More specific error types
2. **Testing**: More comprehensive test coverage
3. **Documentation**: API documentation
4. **Performance**: Further optimization opportunities
