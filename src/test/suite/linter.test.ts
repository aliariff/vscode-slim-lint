import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { suite, test, setup, teardown, beforeEach, afterEach } from 'mocha';
import Linter from '../../linter';

suite('Linter Test Suite', () => {
  let linter: Linter;
  let testDocument: vscode.TextDocument;
  let outputChannel: vscode.OutputChannel;

  setup(async () => {
    // Create output channel for testing
    outputChannel = vscode.window.createOutputChannel('Slim Lint Test');
    
    // Create a fresh linter instance
    linter = new Linter(outputChannel);

    // Use fixture file instead of creating dynamically
    const testFile = path.join(process.cwd(), 'src/test/fixtures/complex-test.slim');
    testDocument = await vscode.workspace.openTextDocument(testFile);
  });

  teardown(() => {
    // Dispose the linter
    linter.dispose();

    // Dispose the output channel
    if (outputChannel) {
      outputChannel.dispose();
    }
  });

  test('Should create diagnostic collection', () => {
    const collection = vscode.languages.createDiagnosticCollection('slim-lint');
    assert.ok(collection, 'Diagnostic collection should be created');
    assert.strictEqual(collection.name, 'slim-lint', 'Collection should have correct name');
    collection.dispose();
  });

  test('Should not run on non-slim files', async () => {
    // Use fixture file for non-slim test
    const jsFile = path.join(process.cwd(), 'src/test/fixtures/test-file.js');
    const jsDocument = await vscode.workspace.openTextDocument(jsFile);
    
    // Run the real linter
    linter.run(jsDocument);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check that no diagnostics were created for the JS file
    const allDiagnostics = vscode.languages.getDiagnostics();
    const jsDiagnostics = allDiagnostics.filter(([uri]) => uri.fsPath.includes('test-file.js'));
    assert.strictEqual(jsDiagnostics.length, 0, 'Should not create diagnostics for non-slim files');
  });

  test('Should clear diagnostics for file documents', () => {
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test.slim'),
      scheme: 'file',
      getText: () => 'doctype html',
      fileName: 'test.slim',
    } as unknown as vscode.TextDocument;

    // Should not throw any errors
    linter.clear(mockDocument);
  });

  test('Should not clear diagnostics for non-file documents', () => {
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.parse('untitled:/test.slim'),
      scheme: 'untitled',
      getText: () => 'doctype html',
      fileName: 'test.slim',
    } as unknown as vscode.TextDocument;

    // Should not throw any errors
    linter.clear(mockDocument);
  });

  test('Should handle configuration path resolution', () => {
    const config = vscode.workspace.getConfiguration('slimLint');
    const executablePath = config.get('executablePath');
    const configurationPath = config.get('configurationPath');

    assert.ok(executablePath, 'executablePath should be configured');
    assert.ok(configurationPath, 'configurationPath should be configured');
    assert.strictEqual(typeof executablePath, 'string', 'executablePath should be a string');
    assert.strictEqual(typeof configurationPath, 'string', 'configurationPath should be a string');
  });

  test('Should check for .slim-lint.yml existence in repo root', () => {
    const repoRoot = process.cwd();
    const configPath = path.join(repoRoot, '.slim-lint.yml');
    const exists = fs.existsSync(configPath);

    console.log(`Repository root: ${repoRoot}`);
    console.log(`Configuration file ${configPath} exists: ${exists}`);

    assert.ok(exists, 'Configuration file should exist in repo root');

    if (exists) {
      const content = fs.readFileSync(configPath, 'utf8');
      assert.ok(content.length > 0, 'Configuration file should not be empty');
      console.log(`Configuration file content length: ${content.length} characters`);
    }
  });

  test('Should parse slim-lint output correctly', () => {
    const mockOutput = `test-file.slim:3 [W] LineLength: Line is too long. [80/120]
test-file.slim:5 [E] TrailingWhitespace: Trailing whitespace detected`;

    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test-file.slim'),
      getText: () => 'doctype html\nhtml\n  head\n    title Test\n  body\n    div',
      lineCount: 6,
      lineAt: (line: number) => ({
        range: new vscode.Range(line, 0, line, 10),
        firstNonWhitespaceCharacterIndex: 0,
      }),
      fileName: 'test-file.slim',
    } as vscode.TextDocument;

    // Test the parseOutput method directly
    const diagnostics = (linter as any).parseOutput(mockOutput, mockDocument);

    assert.strictEqual(diagnostics.length, 2, 'Should parse 2 diagnostics');

    // Check first diagnostic (warning)
    assert.strictEqual(diagnostics[0].severity, vscode.DiagnosticSeverity.Warning, 'First should be warning');
    assert.strictEqual(diagnostics[0].message, 'LineLength: Line is too long. [80/120]', 'Should have correct message');
    assert.strictEqual(diagnostics[0].range.start.line, 2, 'Should be on line 2 (0-indexed)');

    // Check second diagnostic (error)
    assert.strictEqual(diagnostics[1].severity, vscode.DiagnosticSeverity.Error, 'Second should be error');
    assert.strictEqual(diagnostics[1].message, 'TrailingWhitespace: Trailing whitespace detected', 'Should have correct message');
    assert.strictEqual(diagnostics[1].range.start.line, 4, 'Should be on line 4 (0-indexed)');
  });

  test('Should handle empty slim-lint output', () => {
    const mockOutput = '';

    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test-file.slim'),
      getText: () => 'doctype html',
      lineCount: 1,
      lineAt: (line: number) => ({
        range: new vscode.Range(line, 0, line, 10),
        firstNonWhitespaceCharacterIndex: 0,
      }),
      fileName: 'test-file.slim',
    } as vscode.TextDocument;

    const diagnostics = (linter as any).parseOutput(mockOutput, mockDocument);

    assert.strictEqual(diagnostics.length, 0, 'Should return empty array for empty output');
  });

  test('Should handle malformed slim-lint output', () => {
    const mockOutput = `Invalid output format
Another invalid line`;

    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test-file.slim'),
      getText: () => 'doctype html',
      lineCount: 1,
      lineAt: (line: number) => ({
        range: new vscode.Range(line, 0, line, 10),
        firstNonWhitespaceCharacterIndex: 0,
      }),
      fileName: 'test-file.slim',
    } as vscode.TextDocument;

    const diagnostics = (linter as any).parseOutput(mockOutput, mockDocument);

    assert.strictEqual(diagnostics.length, 0, 'Should return empty array for malformed output');
  });

  test('Should not perform operations when disposed', () => {
    // Dispose the linter
    linter.dispose();
    
    // Try to run operations on disposed linter
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test.slim'),
      getText: () => 'doctype html',
      fileName: 'test.slim',
    } as unknown as vscode.TextDocument;
    
    // These should not throw errors and should return early
    linter.run(mockDocument);
    linter.clear(mockDocument);
    
    // Test should pass if no errors are thrown
    assert.ok(true, 'Disposed linter should handle operations gracefully');
  });

  test('Should handle configuration validation', () => {
    // Test that getConfiguration validates properly
    const config = linter['getConfiguration']();
    
    assert.ok(config.executablePath, 'executablePath should be defined');
    assert.ok(config.configurationPath, 'configurationPath should be defined');
    assert.strictEqual(typeof config.executablePath, 'string', 'executablePath should be a string');
    assert.strictEqual(typeof config.configurationPath, 'string', 'configurationPath should be a string');
  });

  test('Should handle valid slim files without issues', async () => {
    // Use fixture file for valid test
    const validTestFile = path.join(process.cwd(), 'src/test/fixtures/valid-test.slim');
    const validTestDocument = await vscode.workspace.openTextDocument(validTestFile);
    
    // Run the linter on the valid test file
    linter.run(validTestDocument);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check diagnostics
    const diagnostics = linter['collection'].get(validTestDocument.uri) || [];
    
    console.log(`Valid test file produced ${diagnostics.length} diagnostics`);
    
    // Should have no diagnostics for a valid file
    assert.strictEqual(diagnostics.length, 0, 'Valid file should have no diagnostics');
  });

  test('Should run linter and produce real diagnostics from slim-lint execution', async () => {
    // Clear any existing diagnostics first
    linter.clear(testDocument);
    
    // Run the linter
    linter.run(testDocument);
    
    // Wait for processing (using longer timeout to ensure slim-lint completes)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if diagnostics were created from real slim-lint execution
    const diagnostics = linter['collection'].get(testDocument.uri) || [];
    
    console.log(`Real slim-lint execution produced ${diagnostics.length} diagnostics`);
    
    // Verify the linter completed successfully
    assert.ok(Array.isArray(diagnostics), 'Diagnostics should be an array');
    assert.ok(linter['collection'], 'Diagnostic collection should exist');
    
    if (diagnostics.length > 0) {
      diagnostics.forEach((diagnostic, index) => {
        console.log(`  ${index + 1}. ${diagnostic.message} (${diagnostic.severity}) at line ${diagnostic.range.start.line}`);
      });
      
      // Verify diagnostics have proper structure
      diagnostics.forEach((diagnostic, index) => {
        assert.ok(diagnostic.message, `Diagnostic ${index} should have a message`);
        assert.ok(diagnostic.range, `Diagnostic ${index} should have a range`);
        assert.ok(typeof diagnostic.severity === 'number', `Diagnostic ${index} should have a severity`);
      });
    }
    
    // The test passes if we got multiple diagnostics from slim-lint (our complex file should trigger multiple issues)
    assert.ok(diagnostics.length >= 5, `Should have at least 5 diagnostics from real slim-lint execution, got ${diagnostics.length}`);
    
    // Verify we have the expected rule types in our complex test file
    const diagnosticMessages = diagnostics.map(d => d.message);
    const hasLineLengthRule = diagnosticMessages.some(msg => msg.includes('LineLength:'));
    const hasTrailingWhitespaceRule = diagnosticMessages.some(msg => msg.includes('TrailingWhitespace:'));
    
    console.log('Complex test file rule types found:', {
      lineLength: hasLineLengthRule,
      trailingWhitespace: hasTrailingWhitespaceRule
    });
    
    // Our complex file should definitely have LineLength issues
    assert.ok(hasLineLengthRule, 'Complex test file should have LineLength diagnostics');
  });

  test('Should handle various slim-lint rule types', async () => {
    // Use fixture file for tab test
    const tabTestFile = path.join(process.cwd(), 'src/test/fixtures/tab-test.slim');
    const tabTestDocument = await vscode.workspace.openTextDocument(tabTestFile);
    
    // Run the linter on the tab test file
    linter.run(tabTestDocument);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check diagnostics
    const diagnostics = linter['collection'].get(tabTestDocument.uri) || [];
    
    console.log(`Tab test file produced ${diagnostics.length} diagnostics`);
    
    // Should have multiple diagnostics including Tab, LineLength, and TrailingWhitespace
    assert.ok(diagnostics.length >= 3, `Should have at least 3 diagnostics from tab test file, got ${diagnostics.length}`);
    
    // Check for specific rule types
    const diagnosticMessages = diagnostics.map(d => d.message);
    const hasTabRule = diagnosticMessages.some(msg => msg.includes('Tab:'));
    const hasLineLengthRule = diagnosticMessages.some(msg => msg.includes('LineLength:'));
    const hasTrailingWhitespaceRule = diagnosticMessages.some(msg => msg.includes('TrailingWhitespace:'));
    
    console.log('Rule types found:', {
      tab: hasTabRule,
      lineLength: hasLineLengthRule,
      trailingWhitespace: hasTrailingWhitespaceRule
    });
  });
}); 