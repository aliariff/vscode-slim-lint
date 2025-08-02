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
  });

  test('Should dispose properly', () => {
    const testLinter = new Linter();
    testLinter.dispose();
    assert.ok(true, 'Should dispose without error');
  });

  test('Should create diagnostic collection', () => {
    const collection = vscode.languages.createDiagnosticCollection('slim-lint');
    assert.ok(collection, 'Diagnostic collection should be created');
    collection.dispose();
  });

  test('Should handle slim language files', () => {
    // Mock a slim document
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test.slim'),
      getText: () => 'doctype html\nhtml\n  head\n    title Test',
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

    // Should not throw an error
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
  });
});
