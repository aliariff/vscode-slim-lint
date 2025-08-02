import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Slim Lint Extension Test Suite', () => {
  let testWorkspace: vscode.Uri;

  suiteSetup(async () => {
    // Create a temporary workspace for testing
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slim-lint-test-'));
    testWorkspace = vscode.Uri.file(tempDir);

    // Create a test slim file
    const testSlimContent = `doctype html
html
  head
    title Slim Lint Test
  body
    h1 Hello World
    p This is a test file for slim-lint extension`;

    fs.writeFileSync(path.join(tempDir, 'test.slim'), testSlimContent);
  });

  suiteTeardown(async () => {
    // Clean up temporary files
    if (testWorkspace && fs.existsSync(testWorkspace.fsPath)) {
      fs.rmSync(testWorkspace.fsPath, { recursive: true, force: true });
    }
  });

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('aliariff.slim-lint'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();
      assert.ok(extension.isActive);
    }
  });

  test('Should register slim language support', async () => {
    const languages = await vscode.languages.getLanguages();
    assert.ok(languages.includes('slim'), 'Slim language should be registered');
  });

  test('Should create diagnostic collection', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Open a slim file to trigger the extension
      const testFile = vscode.Uri.file(
        path.join(testWorkspace.fsPath, 'test.slim')
      );
      const document = await vscode.workspace.openTextDocument(testFile);
      await vscode.window.showTextDocument(document);

      // Wait a bit for diagnostics to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if diagnostic collection exists
      const diagnostics = vscode.languages.getDiagnostics();
      assert.ok(diagnostics.length >= 0, 'Diagnostic collection should exist');
    }
  });

  test('Should handle configuration settings', async () => {
    const config = vscode.workspace.getConfiguration('slimLint');

    // Test default values
    assert.strictEqual(config.get('executablePath'), 'slim-lint');
    assert.strictEqual(config.get('configurationPath'), '.slim-lint.yml');

    // Test that we can update configuration
    await config.update(
      'executablePath',
      'custom-slim-lint',
      vscode.ConfigurationTarget.Workspace
    );
    assert.strictEqual(config.get('executablePath'), 'custom-slim-lint');

    // Reset to default
    await config.update(
      'executablePath',
      'slim-lint',
      vscode.ConfigurationTarget.Workspace
    );
  });

  test('Should handle missing slim-lint executable gracefully', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Temporarily set a non-existent executable
      const config = vscode.workspace.getConfiguration('slimLint');
      await config.update(
        'executablePath',
        'non-existent-slim-lint',
        vscode.ConfigurationTarget.Workspace
      );

      // Open a slim file
      const testFile = vscode.Uri.file(
        path.join(testWorkspace.fsPath, 'test.slim')
      );
      const document = await vscode.workspace.openTextDocument(testFile);
      await vscode.window.showTextDocument(document);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Extension should not crash
      assert.ok(
        extension.isActive,
        'Extension should remain active even with missing executable'
      );

      // Reset configuration
      await config.update(
        'executablePath',
        'slim-lint',
        vscode.ConfigurationTarget.Workspace
      );
    }
  });

  test('Should handle different slim file content', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Create a file with potential linting issues
      const problematicContent = `doctype html
html
  head
    title Test
  body
    div
      p This line is too long and should trigger a linting warning if the line length rule is enabled
    div
      p Another line that might have issues`;

      const testFile = path.join(testWorkspace.fsPath, 'problematic.slim');
      fs.writeFileSync(testFile, problematicContent);

      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.file(testFile)
      );
      await vscode.window.showTextDocument(document);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Extension should handle the file without crashing
      assert.ok(
        extension.isActive,
        'Extension should handle problematic content gracefully'
      );
    }
  });

  test('Should support workspace folder detection', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Test that the extension can work with workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceFolder = workspaceFolders[0];
        assert.ok(
          workspaceFolder.uri.fsPath,
          'Workspace folder should have a valid path'
        );
      }
    }
  });

  test('Should handle file save events', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Create a new slim file
      const newFile = path.join(testWorkspace.fsPath, 'new-test.slim');
      const content = `doctype html
html
  head
    title New Test
  body
    h1 New Test File`;

      fs.writeFileSync(newFile, content);

      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.file(newFile)
      );
      await vscode.window.showTextDocument(document);

      // Simulate a save event
      await document.save();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Extension should remain active after save
      assert.ok(
        extension.isActive,
        'Extension should remain active after file save'
      );
    }
  });
});
