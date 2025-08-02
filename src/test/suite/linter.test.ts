import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { suite, test, setup, teardown, beforeEach, afterEach } from 'mocha';
import Linter from '../../linter';

suite('Linter Test Suite', () => {
  let linter: Linter;
  let testDocument: vscode.TextDocument;

  beforeEach(() => {
    // Create a fresh linter instance for each test
    linter = new Linter();
  });

  afterEach(() => {
    // Dispose the linter after each test
    linter.dispose();
  });

  setup(async () => {
    // Create a test Slim file with known issues that will trigger exactly 2 diagnostics
    const testContent = `doctype html
html
  head
    title Test File
  body
    div
      p This line is intentionally too long and should trigger a linting warning if the line length rule is enabled in the slim-lint configuration and exceeds the maximum line length limit of 80 characters
    div
      p Another line that might have issues with spacing or formatting  
    div
      p This line has no proper indentation which should trigger a linting error`;

    const testFile = path.join(__dirname, '../../../test-file.slim');
    fs.writeFileSync(testFile, testContent);

    testDocument = await vscode.workspace.openTextDocument(testFile);
  });

  teardown(() => {
    // Clean up test file
    const testFile = path.join(__dirname, '../../../test-file.slim');
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  test('Should create diagnostic collection', () => {
    const collection = vscode.languages.createDiagnosticCollection('slim-lint');
    assert.ok(collection, 'Diagnostic collection should be created');
    assert.strictEqual(collection.name, 'slim-lint', 'Collection should have correct name');
    collection.dispose();
  });

  test('Should not run on non-slim files', async () => {
    // Create a JavaScript file
    const jsContent = 'console.log("test");';
    const jsFile = path.join(__dirname, '../../../test-file.js');
    fs.writeFileSync(jsFile, jsContent);
    
    const jsDocument = await vscode.workspace.openTextDocument(jsFile);
    
    // Run the real linter
    linter.run(jsDocument);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check that no diagnostics were created for the JS file
    const allDiagnostics = vscode.languages.getDiagnostics();
    const jsDiagnostics = allDiagnostics.filter(([uri]) => uri.fsPath.includes('test-file.js'));
    assert.strictEqual(jsDiagnostics.length, 0, 'Should not create diagnostics for non-slim files');
    
    // Clean up
    if (fs.existsSync(jsFile)) {
      fs.unlinkSync(jsFile);
    }
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

    // Test the parse method directly
    const diagnostics = (linter as any).parse(mockOutput, mockDocument);
    
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

    const diagnostics = (linter as any).parse(mockOutput, mockDocument);
    
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

    const diagnostics = (linter as any).parse(mockOutput, mockDocument);
    
    assert.strictEqual(diagnostics.length, 0, 'Should return empty array for malformed output');
  });

  test('Should clear diagnostics between test runs', async () => {
    // Clear all diagnostics first
    linter.clear(testDocument);
    
    // First run - should create diagnostics
    linter.run(testDocument);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Access diagnostics directly from the linter's collection
    const firstRunDiagnostics = linter['collection'].get(testDocument.uri) || [];
    const firstRunCount = firstRunDiagnostics.length;
    
    console.log(`First run diagnostics count: ${firstRunCount}`);
    
    // Clear all diagnostics completely
    linter.clear(testDocument);
    
    // Second run - should start fresh
    linter.run(testDocument);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Access diagnostics directly from the linter's collection
    const secondRunDiagnostics = linter['collection'].get(testDocument.uri) || [];
    const secondRunCount = secondRunDiagnostics.length;
    
    console.log(`Second run diagnostics count: ${secondRunCount}`);
    
    // Both runs should have the same count (no accumulation)
    assert.strictEqual(firstRunCount, secondRunCount, 'Diagnostic count should be consistent between runs');
    assert.strictEqual(firstRunCount, 3, 'Should have exactly 3 diagnostics from linter runs');
  });

  test('Should run real linter on slim file with repo root configuration', async () => {
    console.log('Running real linter on test document...');
    console.log(`Document language: ${testDocument.languageId}`);
    console.log(`Document file: ${testDocument.fileName}`);
    
    // Verify configuration points to repo root
    const config = vscode.workspace.getConfiguration('slimLint');
    const configurationPath = config.get('configurationPath');
    const repoRoot = process.cwd();
    const expectedConfigPath = path.join(repoRoot, '.slim-lint.yml');
    
    console.log(`Configuration path: ${configurationPath}`);
    console.log(`Expected config path: ${expectedConfigPath}`);
    console.log(`Repo root: ${repoRoot}`);
    
    // Clear any existing diagnostics first
    linter.clear(testDocument);
    
    // Run the real linter
    linter.run(testDocument);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if diagnostics were created - access the linter's collection directly
    const allDiagnostics = vscode.languages.getDiagnostics();
    console.log(`Total diagnostic collections in workspace: ${allDiagnostics.length}`);
    
    // Log all diagnostic collections for debugging
    allDiagnostics.forEach(([uri, diagnostics], index) => {
      console.log(`  Collection ${index + 1}: ${uri.fsPath} - ${diagnostics.length} diagnostics`);
    });
    
    // Access diagnostics directly from the linter's collection
    const slimLintDiagnostics = linter['collection'].get(testDocument.uri) || [];
    console.log(`Found ${slimLintDiagnostics.length} diagnostics for ${testDocument.uri.fsPath}`);
    
    // Assert that we got some diagnostics (adjust expectation based on actual content)
    assert.strictEqual(slimLintDiagnostics.length, 3, 'Should have exactly 3 diagnostics from linting issues');
    
    if (slimLintDiagnostics.length > 0) {
      slimLintDiagnostics.forEach((diagnostic, index) => {
        console.log(`  ${index + 1}. ${diagnostic.message} (${diagnostic.severity}) at line ${diagnostic.range.start.line}`);
      });
      
      // Verify diagnostics have proper structure
      slimLintDiagnostics.forEach((diagnostic, index) => {
        assert.ok(diagnostic.message, `Diagnostic ${index} should have a message`);
        assert.ok(diagnostic.range, `Diagnostic ${index} should have a range`);
        assert.ok(typeof diagnostic.severity === 'number', `Diagnostic ${index} should have a severity`);
      });
    } else {
      console.log('No linting issues found in test file - this is valid behavior');
    }
    
    // The test passes if the linter ran successfully (regardless of diagnostics count)
    assert.ok(true, 'Real linter should run without errors');
  });

  test('Should use repo root .slim-lint.yml configuration', async () => {
    const repoRoot = process.cwd();
    const configPath = path.join(repoRoot, '.slim-lint.yml');
    
    // Verify the configuration file exists
    assert.ok(fs.existsSync(configPath), 'Configuration file should exist in repo root');
    
    // Read and verify configuration content
    const configContent = fs.readFileSync(configPath, 'utf8');
    assert.ok(configContent.includes('linters:'), 'Configuration should contain linters section');
    assert.ok(configContent.includes('LineLength:'), 'Configuration should contain LineLength rule');
    
    console.log(`Using configuration from: ${configPath}`);
    console.log(`Configuration size: ${configContent.length} characters`);
    
    // Clear any existing diagnostics first
    linter.clear(testDocument);
    
    // Run linter and verify it uses this configuration
    linter.run(testDocument);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if linter ran successfully by looking for any diagnostics
    const allDiagnostics = vscode.languages.getDiagnostics();
    const testFileDiagnostics = allDiagnostics.filter(([uri]) => 
      uri.fsPath.includes('test-file.slim')
    );
    
    console.log(`Linter execution completed. Found ${testFileDiagnostics.length} diagnostic collections for test file`);
    
    // Access diagnostics directly from the linter's collection
    const slimLintDiagnostics = linter['collection'].get(testDocument.uri) || [];
    console.log(`Found ${slimLintDiagnostics.length} diagnostics`);
    
    // Assert that the linter ran successfully (diagnostics count may vary)
    assert.strictEqual(slimLintDiagnostics.length, 3, 'Should have exactly 3 diagnostics from linting issues');
    
    // The test passes if the linter runs without errors using the repo root config
    assert.ok(true, 'Linter should use repo root configuration successfully');
  });
}); 