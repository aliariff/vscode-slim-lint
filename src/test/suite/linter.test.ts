import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { suite, test, setup, teardown } from 'mocha';
import Linter from '../../linter';

suite('Linter Test Suite', () => {
  let linter: Linter;
  let outputChannel: vscode.OutputChannel;

  setup(async () => {
    console.log('🔧 Setting up test environment...');

    // Create output channel for testing
    outputChannel = vscode.window.createOutputChannel('Slim Lint Test');
    console.log('✅ Output channel created');

    // Create a fresh linter instance
    linter = new Linter(outputChannel);
    console.log('✅ Linter instance created');
  });

  teardown(() => {
    console.log('🧹 Cleaning up test environment...');

    // Dispose the linter
    if (linter) {
      linter.dispose();
      console.log('✅ Linter disposed');
    }

    // Dispose the output channel
    if (outputChannel) {
      outputChannel.dispose();
      console.log('✅ Output channel disposed');
    }

    console.log('✅ Test cleanup completed');
  });

  test('Should not run on non-slim files', async () => {
    console.log('🧪 Testing non-slim file handling...');

    // Use fixture file for non-slim test
    const jsFile = path.join(process.cwd(), 'src/test/fixtures/test-file.js');
    console.log(`📁 Loading JavaScript fixture: ${jsFile}`);
    const jsDocument = await vscode.workspace.openTextDocument(jsFile);

    // Run the real linter
    console.log('⚡ Running linter on JavaScript file...');
    linter.run(jsDocument);

    // Wait for processing (including debounce delay)
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check that no diagnostics were created for the JS file
    const jsDiagnostics = linter['collection'].get(jsDocument.uri) || [];
    console.log(
      `📊 Found ${jsDiagnostics.length} diagnostics for JavaScript file`
    );

    assert.strictEqual(
      jsDiagnostics.length,
      0,
      'Should not create diagnostics for non-slim files'
    );
    console.log('✅ Non-slim file test completed');
  });

  test('Should parse slim-lint output correctly', () => {
    console.log('🧪 Testing slim-lint output parsing...');

    const mockOutput = `test-file.slim:3 [W] LineLength: Line is too long. [80/120]
test-file.slim:5 [E] TrailingWhitespace: Trailing whitespace detected`;

    console.log(`📝 Mock slim-lint output:\n${mockOutput}`);

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

    // Test the parseOutput method directly
    console.log('🔍 Parsing slim-lint output...');
    const diagnostics = (
      linter as unknown as {
        parseOutput: (
          output: string,
          document: vscode.TextDocument
        ) => vscode.Diagnostic[];
      }
    ).parseOutput(mockOutput, mockDocument);

    console.log(`📊 Parsed ${diagnostics.length} diagnostics`);
    assert.strictEqual(diagnostics.length, 2, 'Should parse 2 diagnostics');

    // Check first diagnostic (warning)
    console.log(`🔍 Checking first diagnostic: ${diagnostics[0].message}`);
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
    console.log(`🔍 Checking second diagnostic: ${diagnostics[1].message}`);
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

    console.log('✅ Output parsing test completed');
  });

  test('Should handle empty slim-lint output', () => {
    console.log('🧪 Testing empty slim-lint output handling...');

    const mockOutput = '';
    console.log('📝 Empty slim-lint output provided');

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

    console.log('🔍 Parsing empty output...');
    const diagnostics = (
      linter as unknown as {
        parseOutput: (
          output: string,
          document: vscode.TextDocument
        ) => vscode.Diagnostic[];
      }
    ).parseOutput(mockOutput, mockDocument);

    console.log(
      `📊 Parsed ${diagnostics.length} diagnostics from empty output`
    );
    assert.strictEqual(
      diagnostics.length,
      0,
      'Should return empty array for empty output'
    );

    console.log('✅ Empty output handling test completed');
  });

  test('Should handle malformed slim-lint output', () => {
    console.log('🧪 Testing malformed slim-lint output handling...');

    const mockOutput = `Invalid output format
Another invalid line`;
    console.log(`📝 Malformed slim-lint output:\n${mockOutput}`);

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

    console.log('🔍 Parsing malformed output...');
    const diagnostics = (
      linter as unknown as {
        parseOutput: (
          output: string,
          document: vscode.TextDocument
        ) => vscode.Diagnostic[];
      }
    ).parseOutput(mockOutput, mockDocument);

    console.log(
      `📊 Parsed ${diagnostics.length} diagnostics from malformed output`
    );
    assert.strictEqual(
      diagnostics.length,
      0,
      'Should return empty array for malformed output'
    );

    console.log('✅ Malformed output handling test completed');
  });

  test('Should handle valid slim files without issues', async () => {
    console.log('🧪 Testing valid slim file handling...');

    // Use fixture file for valid test
    const validTestFile = path.join(
      process.cwd(),
      'src/test/fixtures/valid-test.slim'
    );
    console.log(`📁 Loading valid test fixture: ${validTestFile}`);
    const validTestDocument =
      await vscode.workspace.openTextDocument(validTestFile);

    // Run the linter on the valid test file
    console.log('⚡ Running linter on valid slim file...');
    linter.run(validTestDocument);

    // Wait for processing
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check diagnostics
    const diagnostics = linter['collection'].get(validTestDocument.uri) || [];

    console.log(
      `📊 Valid test file produced ${diagnostics.length} diagnostics`
    );

    // Should have no diagnostics for a valid file
    assert.strictEqual(
      diagnostics.length,
      0,
      'Valid file should have no diagnostics'
    );
    console.log('✅ Valid slim file test completed');
  });

  test('Should run linter and produce real diagnostics from slim-lint execution', async () => {
    console.log('🧪 Testing real slim-lint execution with complex file...');

    // Load the complex test fixture
    const complexTestFile = path.join(
      process.cwd(),
      'src/test/fixtures/complex-test.slim'
    );
    console.log(`📁 Loading complex test fixture: ${complexTestFile}`);
    const complexTestDocument =
      await vscode.workspace.openTextDocument(complexTestFile);

    // Clear any existing diagnostics first
    console.log('🗑️ Clearing existing diagnostics...');
    linter.clear(complexTestDocument);

    // Run the linter
    console.log('⚡ Running linter on complex test file...');
    linter.run(complexTestDocument);

    // Wait for processing (using longer timeout to ensure slim-lint completes)
    console.log('⏳ Waiting for slim-lint processing (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if diagnostics were created from real slim-lint execution
    const diagnostics = linter['collection'].get(complexTestDocument.uri) || [];

    console.log(
      `📊 Real slim-lint execution produced ${diagnostics.length} diagnostics`
    );

    // Verify the linter completed successfully
    console.log('🔍 Verifying linter completion...');
    assert.ok(Array.isArray(diagnostics), 'Diagnostics should be an array');
    assert.ok(linter['collection'], 'Diagnostic collection should exist');

    if (diagnostics.length > 0) {
      console.log('📋 Detailed diagnostics:');
      diagnostics.forEach((diagnostic, index) => {
        console.log(
          `  ${index + 1}. ${diagnostic.message} (${diagnostic.severity}) at line ${diagnostic.range.start.line}`
        );
      });

      // Verify diagnostics have proper structure
      console.log('🔍 Validating diagnostic structure...');
      diagnostics.forEach((diagnostic, index) => {
        assert.ok(
          diagnostic.message,
          `Diagnostic ${index} should have a message`
        );
        assert.ok(diagnostic.range, `Diagnostic ${index} should have a range`);
        assert.ok(
          typeof diagnostic.severity === 'number',
          `Diagnostic ${index} should have a severity`
        );
      });
    }

    // The test passes if we got exactly 7 diagnostics from slim-lint (our complex file should trigger specific issues)
    console.log('✅ Verifying exact diagnostic count...');
    assert.strictEqual(
      diagnostics.length,
      7,
      `Should have exactly 7 diagnostics from real slim-lint execution, got ${diagnostics.length}`
    );

    // Verify we have the expected rule types in our complex test file
    console.log('🔍 Checking rule types...');
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

    console.log('📊 Complex test file rule types found:', {
      lineLength: hasLineLengthRule,
      trailingWhitespace: hasTrailingWhitespaceRule,
      trailingBlankLines: hasTrailingBlankLinesRule,
    });

    // Our complex file should have specific rule types
    console.log('✅ Verifying rule type presence...');
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

    console.log('✅ Real slim-lint execution test completed');
  });

  test('Should handle various slim-lint rule types', async () => {
    console.log('🧪 Testing various slim-lint rule types...');

    // Use fixture file for tab test
    const tabTestFile = path.join(
      process.cwd(),
      'src/test/fixtures/tab-test.slim'
    );
    console.log(`📁 Loading tab test fixture: ${tabTestFile}`);
    const tabTestDocument =
      await vscode.workspace.openTextDocument(tabTestFile);

    // Run the linter on the tab test file
    console.log('⚡ Running linter on tab test file...');
    linter.run(tabTestDocument);

    // Wait for processing
    console.log('⏳ Waiting for processing (3 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check diagnostics
    const diagnostics = linter['collection'].get(tabTestDocument.uri) || [];

    console.log(`📊 Tab test file produced ${diagnostics.length} diagnostics`);

    // Verify the linter completed successfully
    console.log('🔍 Verifying linter completion...');
    assert.ok(Array.isArray(diagnostics), 'Diagnostics should be an array');
    assert.ok(linter['collection'], 'Diagnostic collection should exist');

    if (diagnostics.length > 0) {
      console.log('📋 Detailed diagnostics:');
      diagnostics.forEach((diagnostic, index) => {
        console.log(
          `  ${index + 1}. ${diagnostic.message} (${diagnostic.severity}) at line ${diagnostic.range.start.line}`
        );
      });

      // Verify diagnostics have proper structure
      console.log('🔍 Validating diagnostic structure...');
      diagnostics.forEach((diagnostic, index) => {
        assert.ok(
          diagnostic.message,
          `Diagnostic ${index} should have a message`
        );
        assert.ok(diagnostic.range, `Diagnostic ${index} should have a range`);
        assert.ok(
          typeof diagnostic.severity === 'number',
          `Diagnostic ${index} should have a severity`
        );
      });
    }

    // Should have exactly 10 diagnostics including Tab, LineLength, and TrailingWhitespace
    console.log('✅ Verifying exact diagnostic count...');
    assert.strictEqual(
      diagnostics.length,
      10,
      `Should have exactly 10 diagnostics from tab test file, got ${diagnostics.length}`
    );

    // Check for specific rule types
    console.log('🔍 Checking rule types...');
    const diagnosticMessages = diagnostics.map(d => d.message);
    const hasTabRule = diagnosticMessages.some(msg => msg.includes('Tab:'));
    const hasLineLengthRule = diagnosticMessages.some(msg =>
      msg.includes('LineLength:')
    );
    const hasTrailingWhitespaceRule = diagnosticMessages.some(msg =>
      msg.includes('TrailingWhitespace:')
    );

    console.log('📊 Rule types found:', {
      tab: hasTabRule,
      lineLength: hasLineLengthRule,
      trailingWhitespace: hasTrailingWhitespaceRule,
    });

    // Verify specific rule types are present
    console.log('✅ Verifying rule type presence...');
    assert.ok(hasTabRule, 'Tab test file should have Tab diagnostics');
    assert.ok(
      hasLineLengthRule,
      'Tab test file should have LineLength diagnostics'
    );
    assert.ok(
      hasTrailingWhitespaceRule,
      'Tab test file should have TrailingWhitespace diagnostics'
    );

    console.log('✅ Various rule types test completed');
  });
});
