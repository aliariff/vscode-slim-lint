import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { suite, test, setup, teardown } from 'mocha';
import Linter from '../../linter';

suite('Linter Test Suite', () => {
  let linter: Linter;
  let outputChannel: vscode.OutputChannel;

  // Helper function to get project root
  const getProjectRoot = (): string => {
    return path.resolve(__dirname, '../../../');
  };

  // Helper function to get fixture file path
  const getFixturePath = (filename: string): string => {
    return path.join(getProjectRoot(), 'src/test/fixtures', filename);
  };

  // Helper function to create mock document
  const createMockDocument = (
    languageId: string,
    content: string,
    fileName: string
  ): vscode.TextDocument => {
    return {
      languageId,
      uri: vscode.Uri.file(`/${fileName}`),
      getText: () => content,
      lineCount: content.split('\n').length,
      lineAt: (line: number) => ({
        range: new vscode.Range(line, 0, line, 10),
        firstNonWhitespaceCharacterIndex: 0,
      }),
      fileName,
    } as vscode.TextDocument;
  };

  // Helper function to run linter on file and get diagnostics
  const runLinterOnFile = async (
    filename: string,
    timeout: number = 10000
  ): Promise<readonly vscode.Diagnostic[]> => {
    const filePath = getFixturePath(filename);
    const document = await vscode.workspace.openTextDocument(filePath);
    linter.run(document);
    await new Promise(resolve => setTimeout(resolve, timeout));
    return linter['collection'].get(document.uri) || [];
  };

  setup(async () => {
    outputChannel = vscode.window.createOutputChannel('Slim Lint Test');
    linter = new Linter(outputChannel);

    // Configure slim-lint executable path for tests using global settings
    const config = vscode.workspace.getConfiguration('slimLint');
    await config.update(
      'executablePath',
      'bundle exec slim-lint',
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'configurationPath',
      '.slim-lint.yml',
      vscode.ConfigurationTarget.Global
    );
  });

  teardown(async () => {
    if (linter) {
      linter.dispose();
    }
    if (outputChannel) {
      outputChannel.dispose();
    }

    // Reset slim-lint configuration after tests
    const config = vscode.workspace.getConfiguration('slimLint');
    await config.update(
      'executablePath',
      'slim-lint',
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'configurationPath',
      '.slim-lint.yml',
      vscode.ConfigurationTarget.Global
    );
  });

  test('Should not run on non-slim files', async () => {
    const jsDiagnostics = await runLinterOnFile('test-file.js', 3000);
    assert.strictEqual(
      jsDiagnostics.length,
      0,
      'Should not create diagnostics for non-slim files'
    );
  });

  test('Should parse slim-lint output correctly', () => {
    const mockOutput = `test-file.slim:3 [W] LineLength: Line is too long. [80/120]
test-file.slim:5 [E] TrailingWhitespace: Trailing whitespace detected`;

    const mockDocument = createMockDocument(
      'slim',
      'doctype html\nhtml\n  head\n    title Test\n  body\n    div',
      'test-file.slim'
    );

    const diagnostics = (
      linter as unknown as {
        parseOutput: (
          output: string,
          document: vscode.TextDocument
        ) => vscode.Diagnostic[];
      }
    ).parseOutput(mockOutput, mockDocument);

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
    const mockDocument = createMockDocument(
      'slim',
      'doctype html',
      'test-file.slim'
    );

    const diagnostics = (
      linter as unknown as {
        parseOutput: (
          output: string,
          document: vscode.TextDocument
        ) => vscode.Diagnostic[];
      }
    ).parseOutput(mockOutput, mockDocument);

    assert.strictEqual(
      diagnostics.length,
      0,
      'Should return empty array for empty output'
    );
  });

  test('Should handle malformed slim-lint output', () => {
    const mockOutput = `Invalid output format
Another invalid line`;

    const mockDocument = createMockDocument(
      'slim',
      'doctype html',
      'test-file.slim'
    );

    const diagnostics = (
      linter as unknown as {
        parseOutput: (
          output: string,
          document: vscode.TextDocument
        ) => vscode.Diagnostic[];
      }
    ).parseOutput(mockOutput, mockDocument);

    assert.strictEqual(
      diagnostics.length,
      0,
      'Should return empty array for malformed output'
    );
  });

  test('Should handle valid slim files without issues', async () => {
    const diagnostics = await runLinterOnFile('valid-test.slim', 15000);

    assert.strictEqual(
      diagnostics.length,
      0,
      'Valid file should have no diagnostics'
    );
  });

  test('Should run linter and produce real diagnostics from slim-lint execution', async () => {
    const diagnostics = await runLinterOnFile('complex-test.slim', 20000);

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
    const diagnostics = await runLinterOnFile('tab-test.slim', 15000);

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
