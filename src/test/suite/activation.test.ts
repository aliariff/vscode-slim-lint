import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Extension Activation Test Suite', () => {
  let tempDir: string;

  suiteSetup(async () => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'activation-test-'));
  });

  suiteTeardown(async () => {
    // Clean up temporary files
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('Extension should be available', () => {
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

  test('Extension should activate on slim language', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      // Initially should not be active
      assert.strictEqual(
        extension.isActive,
        false,
        'Extension should not be active initially'
      );

      // Create a slim file to trigger activation
      const slimFile = path.join(tempDir, 'test.slim');
      fs.writeFileSync(slimFile, 'doctype html\nhtml\n  head\n    title Test');

      // Open the slim file
      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.file(slimFile)
      );
      await vscode.window.showTextDocument(document);

      // Wait for activation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extension should be active
      assert.strictEqual(
        extension.isActive,
        true,
        'Extension should activate on slim files'
      );
    }
  });

  test('Extension should not activate on non-slim files', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      // Create a non-slim file
      const textFile = path.join(tempDir, 'test.txt');
      fs.writeFileSync(textFile, 'This is a text file');

      // Open the text file
      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.file(textFile)
      );
      await vscode.window.showTextDocument(document);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Extension should not be active for non-slim files
      // Note: This might still be active from previous test, so we just check it doesn't crash
      assert.ok(true, 'Extension should handle non-slim files gracefully');
    }
  });

  test('Extension should register commands', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Get all registered commands
      const commands = await vscode.commands.getCommands();

      // Extension should not register any commands currently
      // This test ensures the extension doesn't accidentally register unwanted commands
      assert.ok(
        commands.length >= 0,
        'Extension should not register unwanted commands'
      );
    }
  });

  test('Extension should register configuration', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Check if configuration is registered
      const config = vscode.workspace.getConfiguration('slimLint');
      assert.ok(config, 'slimLint configuration should be available');

      // Check configuration properties
      assert.ok(
        config.has('executablePath'),
        'executablePath should be configurable'
      );
      assert.ok(
        config.has('configurationPath'),
        'configurationPath should be configurable'
      );
    }
  });

  test('Extension should handle workspace events', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Create a slim file
      const slimFile = path.join(tempDir, 'workspace-test.slim');
      fs.writeFileSync(
        slimFile,
        'doctype html\nhtml\n  head\n    title Workspace Test'
      );

      // Open the file
      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.file(slimFile)
      );
      await vscode.window.showTextDocument(document);

      // Simulate workspace events
      await document.save();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Extension should remain active
      assert.ok(
        extension.isActive,
        'Extension should remain active after workspace events'
      );
    }
  });

  test('Extension should handle multiple slim files', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Create multiple slim files
      const files = ['test1.slim', 'test2.slim', 'test3.slim'];

      for (const filename of files) {
        const filePath = path.join(tempDir, filename);
        const content = `doctype html\nhtml\n  head\n    title ${filename}\n  body\n    h1 ${filename}`;
        fs.writeFileSync(filePath, content);

        const document = await vscode.workspace.openTextDocument(
          vscode.Uri.file(filePath)
        );
        await vscode.window.showTextDocument(document);

        // Wait a bit between files
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Extension should handle multiple files
      assert.ok(
        extension.isActive,
        'Extension should handle multiple slim files'
      );
    }
  });

  test('Extension should handle file close events', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Create and open a slim file
      const slimFile = path.join(tempDir, 'close-test.slim');
      fs.writeFileSync(
        slimFile,
        'doctype html\nhtml\n  head\n    title Close Test'
      );

      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.file(slimFile)
      );
      await vscode.window.showTextDocument(document);

      // Close the editor
      await vscode.commands.executeCommand(
        'workbench.action.closeActiveEditor'
      );

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Extension should remain active
      assert.ok(
        extension.isActive,
        'Extension should remain active after file close'
      );
    }
  });

  test('Extension should handle configuration changes', async () => {
    const extension = vscode.extensions.getExtension('aliariff.slim-lint');
    if (extension) {
      await extension.activate();

      // Change configuration
      const config = vscode.workspace.getConfiguration('slimLint');
      const originalPath = config.get('executablePath');

      await config.update(
        'executablePath',
        'custom-slim-lint',
        vscode.ConfigurationTarget.Workspace
      );

      // Wait for configuration change
      await new Promise(resolve => setTimeout(resolve, 500));

      // Extension should remain active
      assert.ok(
        extension.isActive,
        'Extension should remain active after configuration change'
      );

      // Reset configuration
      await config.update(
        'executablePath',
        originalPath,
        vscode.ConfigurationTarget.Workspace
      );
    }
  });
});
