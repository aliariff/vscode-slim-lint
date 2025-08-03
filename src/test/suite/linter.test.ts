import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { suite, test, setup, teardown } from 'mocha';
import Linter from '../../linter';



suite('Linter Test Suite', () => {
  let linter: Linter;
  let outputChannel: vscode.OutputChannel;

  setup(async () => {
    outputChannel = vscode.window.createOutputChannel('Slim Lint Test');
    linter = new Linter(outputChannel);
  });

  teardown(() => {
    if (linter) {
      linter.dispose();
    }
    if (outputChannel) {
      outputChannel.dispose();
    }
  });

  test('Should not run on non-slim files', async () => {
    const jsFile = path.join(process.cwd(), 'src/test/fixtures/test-file.js');
    const jsDocument = await vscode.workspace.openTextDocument(jsFile);

    linter.run(jsDocument);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const jsDiagnostics = linter['collection'].get(jsDocument.uri) || [];
    assert.strictEqual(
      jsDiagnostics.length,
      0,
      'Should not create diagnostics for non-slim files'
    );
  });

  test('Should parse slim-lint output correctly', () => {
    const mockOutput = `test-file.slim:3 [W] LineLength: Line is too long. [80/120]
test-file.slim:5 [E] TrailingWhitespace: Trailing whitespace detected`;

    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test-file.slim'),
      getText: () =>
        'doctype html\nhtml\n  head\n    title Test\n  body\n    div',
      lineCount: 6,
      lineAt: (line: number) => ({
        range: new vscode.Range(line, 0, line, 10),
        firstNonWhitespaceCharacterIndex: 0,
      }),
      fileName: 'test-file.slim',
    } as vscode.TextDocument;

    const diagnostics = (linter as unknown as { parseOutput: (output: string, document: vscode.TextDocument) => vscode.Diagnostic[] }).parseOutput(mockOutput, mockDocument);

    assert.strictEqual(diagnostics.length, 2, 'Should parse 2 diagnostics');

    // Check first diagnostic (warning)
    assert.strictEqual(
      diagnostics[0].severity,
      vscode.DiagnosticSeverity.Warning,
      'First should be warning'
    );
    assert.strictEqual(
      diagnostics[0].message,
      'LineLength: Line is too long. [80/120]',
      'Should have correct message'
    );
    assert.strictEqual(
      diagnostics[0].range.start.line,
      2,
      'Should be on line 2 (0-indexed)'
    );

    // Check second diagnostic (error)
    assert.strictEqual(
      diagnostics[1].severity,
      vscode.DiagnosticSeverity.Error,
      'Second should be error'
    );
    assert.strictEqual(
      diagnostics[1].message,
      'TrailingWhitespace: Trailing whitespace detected',
      'Should have correct message'
    );
    assert.strictEqual(
      diagnostics[1].range.start.line,
      4,
      'Should be on line 4 (0-indexed)'
    );
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

    const diagnostics = (linter as unknown as { parseOutput: (output: string, document: vscode.TextDocument) => vscode.Diagnostic[] }).parseOutput(mockOutput, mockDocument);

    assert.strictEqual(
      diagnostics.length,
      0,
      'Should return empty array for empty output'
    );
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

    const diagnostics = (linter as unknown as { parseOutput: (output: string, document: vscode.TextDocument) => vscode.Diagnostic[] }).parseOutput(mockOutput, mockDocument);

    assert.strictEqual(
      diagnostics.length,
      0,
      'Should return empty array for malformed output'
    );
  });

  test('Should handle valid slim files without issues', async () => {
    const validTestFile = path.join(
      process.cwd(),
      'src/test/fixtures/valid-test.slim'
    );
    const validTestDocument =
      await vscode.workspace.openTextDocument(validTestFile);

    linter.run(validTestDocument);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const diagnostics = linter['collection'].get(validTestDocument.uri) || [];

    assert.strictEqual(
      diagnostics.length,
      0,
      'Valid file should have no diagnostics'
    );
  });

  test('Should run linter and produce real diagnostics from slim-lint execution', async () => {
    const complexTestFile = path.join(
      process.cwd(),
      'src/test/fixtures/complex-test.slim'
    );
    const complexTestDocument =
      await vscode.workspace.openTextDocument(complexTestFile);

    linter.clear(complexTestDocument);
    linter.run(complexTestDocument);
    await new Promise(resolve => setTimeout(resolve, 5000));

    const diagnostics = linter['collection'].get(complexTestDocument.uri) || [];

    assert.strictEqual(
      diagnostics.length,
      7,
      `Should have exactly 7 diagnostics from real slim-lint execution, got ${diagnostics.length}`
    );

    // Verify we have the expected rule types in our complex test file
    const diagnosticMessages = diagnostics.map(d => d.message);
    const hasLineLengthRule = diagnosticMessages.some(msg =>
      msg.includes('LineLength:')
    );
    const hasTrailingWhitespaceRule = diagnosticMessages.some(msg =>
      msg.includes('TrailingWhitespace:')
    );
    const hasTrailingBlankLinesRule = diagnosticMessages.some(msg =>
      msg.includes('TrailingBlankLines:')
    );

    // Our complex file should have specific rule types
    assert.ok(
      hasLineLengthRule,
      'Complex test file should have LineLength diagnostics'
    );
    assert.ok(
      hasTrailingWhitespaceRule,
      'Complex test file should have TrailingWhitespace diagnostics'
    );
    assert.ok(
      hasTrailingBlankLinesRule,
      'Complex test file should have TrailingBlankLines diagnostics'
    );
  });

  test('Should handle various slim-lint rule types', async () => {
    const tabTestFile = path.join(
      process.cwd(),
      'src/test/fixtures/tab-test.slim'
    );
    const tabTestDocument =
      await vscode.workspace.openTextDocument(tabTestFile);

    linter.run(tabTestDocument);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const diagnostics = linter['collection'].get(tabTestDocument.uri) || [];

    assert.strictEqual(
      diagnostics.length,
      10,
      `Should have exactly 10 diagnostics from tab test file, got ${diagnostics.length}`
    );

    // Check for specific rule types
    const diagnosticMessages = diagnostics.map(d => d.message);
    const hasTabRule = diagnosticMessages.some(msg => msg.includes('Tab:'));
    const hasLineLengthRule = diagnosticMessages.some(msg =>
      msg.includes('LineLength:')
    );
    const hasTrailingWhitespaceRule = diagnosticMessages.some(msg =>
      msg.includes('TrailingWhitespace:')
    );

    assert.ok(hasTabRule, 'Tab test file should have Tab diagnostics');
    assert.ok(
      hasLineLengthRule,
      'Tab test file should have LineLength diagnostics'
    );
    assert.ok(
      hasTrailingWhitespaceRule,
      'Tab test file should have TrailingWhitespace diagnostics'
    );
  });
});
