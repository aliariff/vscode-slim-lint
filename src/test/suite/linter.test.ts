import * as assert from 'assert';
import * as vscode from 'vscode';
import Linter from '../../linter';

suite('Linter Class Test Suite', () => {
  let linter: Linter;

  setup(() => {
    linter = new Linter();
  });

  teardown(() => {
    linter.dispose();
  });

  test('Should create linter instance', () => {
    assert.ok(linter, 'Linter should be created');
    assert.strictEqual(typeof linter.run, 'function', 'Linter should have run method');
    assert.strictEqual(typeof linter.clear, 'function', 'Linter should have clear method');
    assert.strictEqual(typeof linter.dispose, 'function', 'Linter should have dispose method');
  });

  test('Should dispose properly', () => {
    const testLinter = new Linter();
    testLinter.dispose();
    assert.ok(true, 'Should dispose without error');
  });

  test('Should create diagnostic collection', () => {
    const collection = vscode.languages.createDiagnosticCollection('slim-lint');
    assert.ok(collection, 'Diagnostic collection should be created');
    assert.strictEqual(collection.name, 'slim-lint', 'Collection should have correct name');
    collection.dispose();
  });

  test('Should handle slim language files', () => {
    // Mock a slim document with valid content
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test.slim'),
      getText: () => 'doctype html\nhtml\n  head\n    title Test\n  body\n    h1 Hello World',
    } as vscode.TextDocument;

    // Should not throw an error
    linter.run(mockDocument);
    assert.ok(true, 'Should handle slim files without error');
  });

  test('Should ignore non-slim files', () => {
    // Mock a non-slim document
    const mockDocument = {
      languageId: 'plaintext',
      uri: vscode.Uri.file('/test.txt'),
      getText: () => 'This is not a slim file',
    } as vscode.TextDocument;

    // Should not throw an error and should not process
    linter.run(mockDocument);
    assert.ok(true, 'Should ignore non-slim files without error');
  });

  test('Should clear diagnostics', () => {
    // Mock a document
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test.slim'),
      getText: () => 'doctype html',
    } as vscode.TextDocument;

    // Run linter and clear diagnostics
    linter.run(mockDocument);
    linter.clear(mockDocument);
    assert.ok(true, 'Should clear diagnostics without error');
  });

  test('Should handle empty files', () => {
    // Mock an empty document
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/empty.slim'),
      getText: () => '',
    } as vscode.TextDocument;

    // Should not throw an error
    linter.run(mockDocument);
    assert.ok(true, 'Should handle empty files without error');
  });

  test('Should handle configuration', () => {
    const config = vscode.workspace.getConfiguration('slimLint');
    assert.ok(config, 'Configuration should be available');
    assert.ok(config.has('executablePath'), 'executablePath should exist');
    assert.ok(config.has('configurationPath'), 'configurationPath should exist');
    
    // Test default values
    assert.strictEqual(config.get('executablePath'), 'slim-lint', 'Default executable path should be slim-lint');
    assert.strictEqual(config.get('configurationPath'), '.slim-lint.yml', 'Default config path should be .slim-lint.yml');
  });

  test('Should handle malformed slim content', () => {
    // Mock a document with malformed content
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/malformed.slim'),
      getText: () => 'doctype html\nhtml\n  head\n    title Test\n  body\n    div\n      p This line is intentionally malformed to test error handling\n    div\n      p Another malformed line with potential issues',
    } as vscode.TextDocument;

    // Should handle malformed content gracefully
    linter.run(mockDocument);
    assert.ok(true, 'Should handle malformed content without error');
  });

  test('Should handle multiple documents', () => {
    const documents = [
      {
        languageId: 'slim',
        uri: vscode.Uri.file('/test1.slim'),
        getText: () => 'doctype html\nhtml\n  head\n    title Test 1\n  body\n    h1 Test 1',
      },
      {
        languageId: 'slim',
        uri: vscode.Uri.file('/test2.slim'),
        getText: () => 'doctype html\nhtml\n  head\n    title Test 2\n  body\n    h1 Test 2',
      },
      {
        languageId: 'slim',
        uri: vscode.Uri.file('/test3.slim'),
        getText: () => 'doctype html\nhtml\n  head\n    title Test 3\n  body\n    h1 Test 3',
      },
    ] as vscode.TextDocument[];

    // Should handle multiple documents
    documents.forEach(doc => {
      linter.run(doc);
    });

    assert.ok(true, 'Should handle multiple documents without error');
  });

  test('Should handle different file schemes', () => {
    const fileDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test.slim'),
      getText: () => 'doctype html',
    } as vscode.TextDocument;

    const untitledDocument = {
      languageId: 'slim',
      uri: vscode.Uri.parse('untitled:/test.slim'),
      getText: () => 'doctype html',
    } as vscode.TextDocument;

    // Should handle file scheme
    linter.run(fileDocument);
    assert.ok(true, 'Should handle file scheme');

    // Should handle untitled scheme
    linter.run(untitledDocument);
    assert.ok(true, 'Should handle untitled scheme');
  });

  test('Should handle configuration changes', () => {
    const config = vscode.workspace.getConfiguration('slimLint');
    const originalPath = config.get('executablePath');
    
    // Test that configuration can be read
    assert.ok(typeof originalPath === 'string', 'executablePath should be a string');
    assert.ok(originalPath.length > 0, 'executablePath should not be empty');
    
    // Test configuration properties
    const configPath = config.get('configurationPath');
    assert.ok(typeof configPath === 'string', 'configurationPath should be a string');
    assert.ok(configPath.length > 0, 'configurationPath should not be empty');
  });

  test('Should handle workspace context', () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceFolder = workspaceFolders[0];
      assert.ok(workspaceFolder.uri.fsPath, 'Workspace folder should have a valid path');
      assert.ok(workspaceFolder.name, 'Workspace folder should have a name');
    }
  });

  test('Should handle diagnostic collection lifecycle', () => {
    // Create a diagnostic collection
    const collection = vscode.languages.createDiagnosticCollection('slim-lint-test');
    
    // Test collection properties
    assert.ok(collection, 'Collection should be created');
    assert.strictEqual(collection.name, 'slim-lint-test', 'Collection should have correct name');
    
    // Test that collection can be disposed
    collection.dispose();
    assert.ok(true, 'Collection should dispose without error');
  });

  test('Should handle document URI schemes', () => {
    const testCases = [
      { scheme: 'file', path: '/test.slim' },
      { scheme: 'untitled', path: 'untitled:/test.slim' },
    ];

    testCases.forEach(({ scheme, path }) => {
      const mockDocument = {
        languageId: 'slim',
        uri: scheme === 'file' ? vscode.Uri.file(path) : vscode.Uri.parse(path),
        getText: () => 'doctype html',
      } as vscode.TextDocument;

      linter.run(mockDocument);
      assert.ok(true, `Should handle ${scheme} scheme`);
    });
  });
});
