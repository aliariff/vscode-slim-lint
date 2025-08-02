# Test Suite for Slim Lint Extension

This directory contains comprehensive tests for the Slim Lint VS Code extension.

## Test Structure

### Test Files

1. **`extension.test.ts`** - Main extension functionality tests
   - Extension activation and deactivation
   - Language support registration
   - Diagnostic collection creation
   - Configuration handling
   - Error handling scenarios

2. **`linter.test.ts`** - Linter class unit tests
   - Linter instantiation and disposal
   - File processing (slim vs non-slim files)
   - Diagnostic clearing
   - Error handling for malformed content
   - Multiple document handling
   - Configuration changes

3. **`activation.test.ts`** - Extension activation tests
   - Extension availability and metadata
   - Activation on slim language files
   - Non-activation on other file types
   - Command and configuration registration
   - Workspace event handling
   - File close events
   - Configuration change handling

### Test Configuration

- **`test-config.json`** - Test scenarios and file templates
- **`index.ts`** - Test runner configuration

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile the extension:
   ```bash
   npm run compile
   ```

### Test Commands

1. **Run all tests** (integration tests):
   ```bash
   npm test
   ```

2. **Run unit tests** (requires ts-node):
   ```bash
   npm run test:unit
   ```

3. **Run integration tests**:
   ```bash
   npm run test:integration
   ```

## Test Scenarios

### 1. Extension Activation
- ✅ Extension loads correctly
- ✅ Activates on slim files
- ✅ Doesn't activate on non-slim files
- ✅ Registers configuration properly

### 2. Linting Functionality
- ✅ Processes slim files correctly
- ✅ Ignores non-slim files
- ✅ Creates diagnostic collections
- ✅ Handles malformed content gracefully
- ✅ Clears diagnostics properly

### 3. Configuration Handling
- ✅ Default configuration values
- ✅ Configuration updates
- ✅ Custom executable paths
- ✅ Custom configuration files

### 4. Error Handling
- ✅ Missing slim-lint executable
- ✅ Malformed slim content
- ✅ Empty files
- ✅ Multiple documents
- ✅ Workspace folder changes

### 5. Workspace Events
- ✅ File open events
- ✅ File save events
- ✅ File close events
- ✅ Multiple file handling

## Test Coverage

### Extension Features Tested

- [x] Extension activation/deactivation
- [x] Language support registration
- [x] Diagnostic collection management
- [x] Configuration system
- [x] File event handling
- [x] Error handling
- [x] Workspace integration
- [x] Multiple file support

### Edge Cases Tested

- [x] Empty files
- [x] Malformed content
- [x] Missing dependencies
- [x] Configuration changes
- [x] File close events
- [x] Non-slim files
- [x] Multiple simultaneous files

## Test Environment

### Temporary Files
Tests create temporary files in the system temp directory:
- `slim-lint-test-*` - Main extension tests
- `linter-test-*` - Linter unit tests
- `activation-test-*` - Activation tests

### Cleanup
All temporary files are automatically cleaned up after tests complete.

## Debugging Tests

### VS Code Test Environment
Tests run in a separate VS Code instance to avoid conflicts with the development environment.

### Test Timeouts
- Default timeout: 10 seconds
- Async operations: 1-2 second waits for processing

### Common Issues

1. **Tests fail to start**: Ensure VS Code is not running
2. **Timeout errors**: Increase timeout in `index.ts`
3. **File permission errors**: Check temp directory permissions
4. **Extension not found**: Ensure extension is compiled

## Adding New Tests

### Test File Structure
```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Test Suite Name', () => {
  setup(() => {
    // Setup code
  });

  teardown(() => {
    // Cleanup code
  });

  test('Test description', async () => {
    // Test implementation
    assert.ok(true);
  });
});
```

### Best Practices

1. **Use descriptive test names**
2. **Test one feature per test**
3. **Clean up resources in teardown**
4. **Use async/await for async operations**
5. **Add appropriate timeouts**
6. **Test both success and failure cases**

## Continuous Integration

Tests are designed to run in CI environments:
- No external dependencies (except slim-lint)
- Automatic cleanup
- Deterministic results
- Proper error reporting 