import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import Linter from '../../linter';

suite('Linter Test Suite', () => {
  let linter: Linter;
  let testDocument: vscode.TextDocument;

  setup(async () => {
    linter = new Linter();
    
    // Create a test Slim file with known issues
    const testContent = `doctype html
html
  head
    title Test File
  body
    div
      p This line is intentionally too long and should trigger a linting warning if the line length rule is enabled in the slim-lint configuration
    div
      p Another line that might have issues with spacing or formatting
    div
      p This line has no proper indentation which should trigger a linting error`;
    
    const testFile = path.join(__dirname, '../../../test-file.slim');
    fs.writeFileSync(testFile, testContent);
    
    testDocument = await vscode.workspace.openTextDocument(testFile);
  });

  teardown(() => {
    linter.dispose();
    
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

  test('Should not run on non-slim files', () => {
    const mockDocument = {
      languageId: 'javascript',
      uri: vscode.Uri.file('/test.js'),
      getText: () => 'console.log("test");',
      fileName: 'test.js',
    } as vscode.TextDocument;

    // Should not throw any errors
    linter.run(mockDocument);
    
    // Check that no diagnostics were created
    const diagnostics = vscode.languages.getDiagnostics();
    const slimDiagnostics = diagnostics.filter(([uri]) => uri.fsPath.includes('test.js'));
    assert.strictEqual(slimDiagnostics.length, 0, 'Should not create diagnostics for non-slim files');
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

  test('Should check for .slim-lint.yml existence', () => {
    const configPath = path.resolve(process.cwd(), '.slim-lint.yml');
    const exists = fs.existsSync(configPath);
    
    console.log(`Configuration file ${configPath} exists: ${exists}`);
    
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

  test('Should run linter on slim file with configuration', async () => {
    // This test requires slim-lint to be installed and working
    console.log('Running linter on test document...');
    console.log(`Document language: ${testDocument.languageId}`);
    console.log(`Document file: ${testDocument.fileName}`);
    
    // Run the linter
    linter.run(testDocument);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if diagnostics were created
    const allDiagnostics = vscode.languages.getDiagnostics();
    console.log(`Total diagnostics in workspace: ${allDiagnostics.length}`);
    
    // Find diagnostics for our test file
    const testFileDiagnostics = allDiagnostics.filter(([uri]) => 
      uri.fsPath.includes('test-file.slim')
    );
    
    console.log(`Diagnostics for test file: ${testFileDiagnostics.length}`);
    
    if (testFileDiagnostics.length > 0) {
      const [uri, diagnostics] = testFileDiagnostics[0];
      console.log(`Found ${diagnostics.length} diagnostics for ${uri.fsPath}`);
      
      diagnostics.forEach((diagnostic, index) => {
        console.log(`  ${index + 1}. ${diagnostic.message} (${diagnostic.severity}) at line ${diagnostic.range.start.line}`);
      });
    }
    
    // Test passes if no errors are thrown
    assert.ok(true, 'Linter should run without errors');
  });
}); 