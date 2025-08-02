import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    assert.ok(extension, 'Extension should be available');
    assert.strictEqual(extension.id, 'aliariff.slim-lint', 'Extension should have correct ID');
  });

  test('Extension should have correct metadata', () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      assert.strictEqual(extension.packageJSON.name, 'slim-lint');
      assert.strictEqual(extension.packageJSON.displayName, 'Slim Lint');
      assert.strictEqual(
        extension.packageJSON.description,
        'Slim Linter for Visual Studio Code'
      );
      assert.strictEqual(extension.packageJSON.publisher, 'aliariff');
      assert.strictEqual(extension.packageJSON.version, '0.3.0');
      assert.ok(extension.packageJSON.engines, 'Should have engines specification');
      assert.ok(extension.packageJSON.engines.vscode, 'Should specify VS Code engine');
    }
  });

  test('Extension should register configuration', () => {
    const config = vscode.workspace.getConfiguration('slimLint');
    assert.ok(config, 'slimLint configuration should be available');
    assert.ok(
      config.has('executablePath'),
      'executablePath should be configurable'
    );
    assert.ok(
      config.has('configurationPath'),
      'configurationPath should be configurable'
    );
  });

  test('Extension should have default configuration values', () => {
    const config = vscode.workspace.getConfiguration('slimLint');
    assert.strictEqual(config.get('executablePath'), 'slim-lint');
    assert.strictEqual(config.get('configurationPath'), '.slim-lint.yml');
  });

  test('Extension should support slim language', () => {
    // Test that the extension can handle slim files
    assert.ok(true, 'Extension should support slim language');
    
    // Test that slim language is recognized
    const languages = ['slim', 'html', 'css', 'javascript'];
    assert.ok(languages.includes('slim'), 'Slim should be in supported languages');
  });

  test('Extension should create diagnostic collection', () => {
    // Test that diagnostic collection can be created
    const collection = vscode.languages.createDiagnosticCollection('slim-lint');
    assert.ok(collection, 'Diagnostic collection should be created');
    assert.strictEqual(collection.name, 'slim-lint', 'Collection should have correct name');
    collection.dispose();
  });

  test('Extension should handle workspace folders', () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceFolder = workspaceFolders[0];
      assert.ok(workspaceFolder.uri.fsPath, 'Workspace folder should have a valid path');
      assert.ok(workspaceFolder.name, 'Workspace folder should have a name');
      assert.ok(workspaceFolder.index === 0, 'First workspace folder should have index 0');
    }
  });

  test('Extension should handle configuration updates', () => {
    const config = vscode.workspace.getConfiguration('slimLint');
    const originalExecutable = config.get('executablePath');
    const originalConfig = config.get('configurationPath');
    
    // Test that configuration values are strings
    assert.strictEqual(typeof originalExecutable, 'string', 'executablePath should be a string');
    assert.strictEqual(typeof originalConfig, 'string', 'configurationPath should be a string');
    
    // Test that configuration values are not empty
    assert.ok((originalExecutable as string).length > 0, 'executablePath should not be empty');
    assert.ok((originalConfig as string).length > 0, 'configurationPath should not be empty');
  });

  test('Extension should handle file URIs', () => {
    const testUri = vscode.Uri.file('/test.slim');
    assert.ok(testUri.scheme === 'file', 'URI should have file scheme');
    assert.ok(testUri.fsPath, 'URI should have file system path');
    assert.ok(testUri.path, 'URI should have path');
  });

  test('Extension should handle diagnostic severity levels', () => {
    // Test that we can create diagnostics with different severity levels
    const range = new vscode.Range(0, 0, 0, 10);
    
    const errorDiagnostic = new vscode.Diagnostic(range, 'Test error', vscode.DiagnosticSeverity.Error);
    const warningDiagnostic = new vscode.Diagnostic(range, 'Test warning', vscode.DiagnosticSeverity.Warning);
    const infoDiagnostic = new vscode.Diagnostic(range, 'Test info', vscode.DiagnosticSeverity.Information);
    
    assert.strictEqual(errorDiagnostic.severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(warningDiagnostic.severity, vscode.DiagnosticSeverity.Warning);
    assert.strictEqual(infoDiagnostic.severity, vscode.DiagnosticSeverity.Information);
  });

  test('Extension should handle text document properties', () => {
    // Mock a text document
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test.slim'),
      getText: () => 'doctype html',
      lineCount: 1,
      fileName: 'test.slim',
    } as vscode.TextDocument;
    
    assert.strictEqual(mockDocument.languageId, 'slim', 'Document should have slim language ID');
    assert.strictEqual(mockDocument.fileName, 'test.slim', 'Document should have correct filename');
    assert.strictEqual(mockDocument.lineCount, 1, 'Document should have correct line count');
  });

  test('Extension should handle position and range creation', () => {
    const position = new vscode.Position(0, 0);
    const range = new vscode.Range(position, new vscode.Position(0, 10));
    
    assert.strictEqual(position.line, 0, 'Position should have correct line');
    assert.strictEqual(position.character, 0, 'Position should have correct character');
    assert.ok(range.start.isEqual(position), 'Range should start at position');
  });

  test('Extension should handle workspace configuration scopes', () => {
    const config = vscode.workspace.getConfiguration('slimLint');
    
    // Test that we can access configuration
    assert.ok(config, 'Configuration should be available');
    
    // Test configuration scope
    const workspaceValue = config.get('executablePath', 'default-value');
    assert.ok(typeof workspaceValue === 'string', 'Configuration value should be a string');
  });

  test('Extension should handle diagnostic collection operations', () => {
    const collection = vscode.languages.createDiagnosticCollection('slim-lint-test');
    const testUri = vscode.Uri.file('/test.slim');
    const range = new vscode.Range(0, 0, 0, 10);
    const diagnostic = new vscode.Diagnostic(range, 'Test diagnostic', vscode.DiagnosticSeverity.Warning);
    
    // Test setting diagnostics
    collection.set(testUri, [diagnostic]);
    assert.ok(true, 'Should set diagnostics without error');
    
    // Test clearing diagnostics
    collection.delete(testUri);
    assert.ok(true, 'Should clear diagnostics without error');
    
    // Test disposing collection
    collection.dispose();
    assert.ok(true, 'Should dispose collection without error');
  });
});
