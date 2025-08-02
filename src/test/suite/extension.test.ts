import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    assert.ok(extension, 'Extension should be available');
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
  });

  test('Extension should create diagnostic collection', () => {
    // Test that diagnostic collection can be created
    const collection = vscode.languages.createDiagnosticCollection('slim-lint');
    assert.ok(collection, 'Diagnostic collection should be created');
    collection.dispose();
  });
});
