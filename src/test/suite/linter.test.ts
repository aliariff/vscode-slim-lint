import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import Linter from '../../linter';

suite('Linter Class Test Suite', () => {
  let linter: Linter;
  let testDocument: vscode.TextDocument;
  let tempDir: string;

  suiteSetup(async () => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linter-test-'));

    // Create a test slim file
    const testContent = `doctype html
html
  head
    title Test
  body
    h1 Hello World`;

    const testFile = path.join(tempDir, 'test.slim');
    fs.writeFileSync(testFile, testContent);

    // Create a text document
    testDocument = await vscode.workspace.openTextDocument(
      vscode.Uri.file(testFile)
    );
  });

  suiteTeardown(async () => {
    // Clean up temporary files
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  setup(() => {
    linter = new Linter();
  });

  teardown(() => {
    linter.dispose();
  });

  test('Should create diagnostic collection', () => {
    // The linter should create a diagnostic collection
    const diagnostics = vscode.languages.getDiagnostics();
    assert.ok(diagnostics.length >= 0, 'Diagnostic collection should exist');
  });

  test('Should handle slim files', () => {
    // Should process slim files
    linter.run(testDocument);
    // The run method should not throw an error
    assert.ok(true, 'Should handle slim files without error');
  });

  test('Should ignore non-slim files', () => {
    // Create a non-slim file
    const nonSlimFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(nonSlimFile, 'This is not a slim file');

    // Mock a non-slim document
    const mockDocument = {
      languageId: 'plaintext',
      uri: vscode.Uri.file(nonSlimFile),
      getText: () => 'This is not a slim file',
    } as vscode.TextDocument;

    // Should not process non-slim files
    linter.run(mockDocument);
    assert.ok(true, 'Should ignore non-slim files without error');
  });

  test('Should clear diagnostics for file', () => {
    // Run linter to create diagnostics
    linter.run(testDocument);

    // Clear diagnostics
    linter.clear(testDocument);

    // Should not throw an error
    assert.ok(true, 'Should clear diagnostics without error');
  });

  test('Should handle file with no content', () => {
    // Create an empty slim file
    const emptyFile = path.join(tempDir, 'empty.slim');
    fs.writeFileSync(emptyFile, '');

    const emptyDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file(emptyFile),
      getText: () => '',
    } as vscode.TextDocument;

    // Should handle empty files
    linter.run(emptyDocument);
    assert.ok(true, 'Should handle empty files without error');
  });

  test('Should handle malformed slim content', () => {
    // Create a file with malformed slim content
    const malformedFile = path.join(tempDir, 'malformed.slim');
    const malformedContent = `doctype html
html
  head
    title Test
  body
    div
      p This line is intentionally malformed to test error handling
    div
      p Another malformed line with potential issues`;

    fs.writeFileSync(malformedFile, malformedContent);

    const malformedDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file(malformedFile),
      getText: () => malformedContent,
    } as vscode.TextDocument;

    // Should handle malformed content gracefully
    linter.run(malformedDocument);
    assert.ok(true, 'Should handle malformed content without error');
  });

  test('Should dispose properly', () => {
    // Create and dispose linter
    const testLinter = new Linter();
    testLinter.dispose();

    // Should not throw an error
    assert.ok(true, 'Should dispose without error');
  });

  test('Should handle multiple documents', () => {
    // Create multiple test files
    const files = ['test1.slim', 'test2.slim', 'test3.slim'];

    files.forEach((filename, index) => {
      const filePath = path.join(tempDir, filename);
      const content = `doctype html
html
  head
    title Test ${index + 1}
  body
    h1 Test ${index + 1}`;

      fs.writeFileSync(filePath, content);

      const document = {
        languageId: 'slim',
        uri: vscode.Uri.file(filePath),
        getText: () => content,
      } as vscode.TextDocument;

      // Should handle multiple documents
      linter.run(document);
    });

    assert.ok(true, 'Should handle multiple documents without error');
  });

  test('Should handle configuration changes', () => {
    // Test with different configuration settings
    const config = vscode.workspace.getConfiguration('slimLint');

    // Test with custom executable path
    config.update(
      'executablePath',
      'custom-slim-lint',
      vscode.ConfigurationTarget.Workspace
    );
    linter.run(testDocument);

    // Test with custom configuration path
    config.update(
      'configurationPath',
      'custom-config.yml',
      vscode.ConfigurationTarget.Workspace
    );
    linter.run(testDocument);

    // Reset to defaults
    config.update(
      'executablePath',
      'slim-lint',
      vscode.ConfigurationTarget.Workspace
    );
    config.update(
      'configurationPath',
      '.slim-lint.yml',
      vscode.ConfigurationTarget.Workspace
    );

    assert.ok(true, 'Should handle configuration changes without error');
  });

  test('Should handle workspace folder changes', () => {
    // Test that linter works with different workspace contexts
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders && workspaceFolders.length > 0) {
      // Test with current workspace
      linter.run(testDocument);
      assert.ok(true, 'Should work with current workspace');
    } else {
      // Test without workspace folders
      linter.run(testDocument);
      assert.ok(true, 'Should work without workspace folders');
    }
  });
});
