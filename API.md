# API Documentation

This document provides detailed information about the vscode-slim-lint extension's API and configuration options.

## Extension Configuration

### Settings Schema

The extension provides the following configuration options:

```json
{
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
```

### Configuration Examples

#### Basic Configuration

```json
{
  "slimLint.executablePath": "slim-lint",
  "slimLint.configurationPath": ".slim-lint.yml"
}
```

#### Using Bundler

```json
{
  "slimLint.executablePath": "bundle exec slim-lint",
  "slimLint.configurationPath": ".slim-lint.yml"
}
```

#### Custom Configuration Path

```json
{
  "slimLint.executablePath": "slim-lint",
  "slimLint.configurationPath": "/path/to/custom/.slim-lint.yml"
}
```

## Extension Activation

### Activation Events

The extension activates on:

- `onLanguage:slim` - When a Slim file is opened

### Supported File Types

- `.slim` files
- `.html.slim` files

## Diagnostic System

### Diagnostic Severity Levels

The extension maps slim-lint output to VS Code diagnostic severities:

- **Warning (W)**: `DiagnosticSeverity.Warning`
- **Error (E)**: `DiagnosticSeverity.Error`

### Diagnostic Format

Diagnostics are created with:

- **Range**: Line-based range from first non-whitespace character to end of line
- **Message**: Format: `{RuleName}: {Description}`
- **Severity**: Warning or Error based on slim-lint output

### Diagnostic Collection

Diagnostics are managed through VS Code's `DiagnosticCollection`:

- Collection name: `slim-lint`
- Automatic cleanup on file close
- Proper disposal on extension deactivation

## Output Channel

### Channel Name

- **Name**: "Slim Lint"
- **Purpose**: Detailed logging and debugging information

### Log Levels

The extension provides comprehensive logging:

1. **Configuration Validation**:
   - Executable path validation
   - Configuration file validation
   - Warning messages for potential issues

2. **Execution Logging**:
   - Command execution details
   - Performance timing
   - Error messages and stack traces

3. **Diagnostic Information**:
   - Number of diagnostics found
   - Parsing results
   - File processing status

## Error Handling

### Error Types

1. **Configuration Errors**:
   - Missing executable path
   - Invalid configuration file
   - Permission issues

2. **Execution Errors**:
   - Command not found
   - Timeout errors
   - Permission denied

3. **Parsing Errors**:
   - Malformed slim-lint output
   - Invalid line numbers
   - Range calculation errors

### Error Recovery

- Graceful degradation when slim-lint is unavailable
- Clear user feedback for common issues
- Comprehensive error logging for debugging

## Performance Characteristics

### Timeout Protection

- **Default timeout**: 30 seconds
- **Purpose**: Prevents hanging processes
- **Recovery**: Automatic cleanup on timeout

### Performance Monitoring

The extension logs performance metrics:

- Linting duration
- Number of diagnostics found
- File size information
- Memory usage patterns

### Optimization Features

- Content change detection
- Debounced linting
- Resource cleanup
- Memory leak prevention

## Event System

### Document Events

The extension listens for these VS Code events:

1. **onDidSaveTextDocument**:
   - Triggers: When a document is saved
   - Action: Runs linter on the saved document

2. **onDidOpenTextDocument**:
   - Triggers: When a document is opened
   - Action: Runs linter on the opened document

3. **onDidCloseTextDocument**:
   - Triggers: When a document is closed
   - Action: Clears diagnostics for the closed document

4. **onDidChangeTextDocument**:
   - Triggers: When document content changes
   - Action: Runs linter on the changed document

### Event Filtering

Events are filtered to only process:

- Slim files (`.slim`, `.html.slim`)
- File documents (not untitled or other schemes)
- Valid document URIs

## Command Execution

### Executable Validation

The extension validates executables by:

1. Checking PATH for the command
2. Validating common slim-lint patterns
3. Testing bundle/gem installations
4. Providing helpful error messages

### Command Building

Commands are built with:

- Executable path from settings
- Configuration file path (if exists)
- Target file path
- Proper argument escaping

### Execution Environment

- **Working directory**: Current workspace root
- **Environment**: Inherits system environment
- **Timeout**: 30 seconds maximum
- **Error handling**: Comprehensive error capture

## Configuration Validation

### Executable Path Validation

1. **Presence check**: Ensures path is provided
2. **Format validation**: Validates command structure
3. **Pattern matching**: Checks for known slim-lint patterns
4. **Warning system**: Alerts for potential issues

### Configuration File Validation

1. **Existence check**: Verifies file exists
2. **Readability check**: Ensures file is readable
3. **Size validation**: Warns for large files (>1MB)
4. **Extension validation**: Checks for .yml/.yaml extensions
5. **Alternative detection**: Suggests other config files

## Slim-lint Integration

### Output Parsing

The extension parses slim-lint output using regex:

```typescript
const SLIM_LINT_OUTPUT_REGEX = /.+?:(\d+) \[(W|E)] (\w+): (.+)/g;
```

### Supported Output Format

Expected slim-lint output format:

```
filename.slim:line [W|E] RuleName: Description
```

### Rule Support

The extension supports all slim-lint rules:

- LineLength
- TrailingWhitespace
- Tab
- TrailingBlankLines
- And all other slim-lint rules

## Extension Lifecycle

### Activation

1. **Configuration validation**: Validates settings on activation
2. **Output channel creation**: Sets up logging
3. **Linter initialization**: Creates linter instance
4. **Event listener setup**: Registers document event handlers
5. **Initial linting**: Lints all open Slim documents

### Deactivation

1. **Resource cleanup**: Disposes of linter and output channel
2. **Event listener removal**: Unregisters event handlers
3. **Diagnostic cleanup**: Clears all diagnostic collections
4. **Memory cleanup**: Frees allocated resources

## Development API

### Testing Support

The extension provides testing utilities:

- Mock document creation
- Diagnostic collection access
- Output channel inspection
- Configuration testing

### Debugging Support

1. **Output channel**: Detailed logging for debugging
2. **Performance metrics**: Timing information
3. **Error details**: Comprehensive error information
4. **Configuration validation**: Detailed validation feedback

## Future API Extensions

### Planned Features

1. **Custom rule support**: User-defined linting rules
2. **Quick fix API**: Automatic fix suggestions
3. **Configuration API**: Programmatic configuration management
4. **Event API**: Custom event handling

### Extension Points

The extension is designed for future extensibility:

- Modular linter architecture
- Pluggable configuration system
- Extensible diagnostic creation
- Customizable error handling
