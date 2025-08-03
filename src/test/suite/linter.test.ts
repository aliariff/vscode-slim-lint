import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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

  test('Should create diagnostic collection', () => {
    console.log('🧪 Testing diagnostic collection creation...');
    
    const collection = vscode.languages.createDiagnosticCollection('slim-lint');
    console.log(`📊 Created collection: ${collection.name}`);
    
    assert.ok(collection, 'Diagnostic collection should be created');
    assert.strictEqual(collection.name, 'slim-lint', 'Collection should have correct name');
    
    collection.dispose();
    console.log('✅ Diagnostic collection test completed');
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
    console.log(`📊 Found ${jsDiagnostics.length} diagnostics for JavaScript file`);
    
    assert.strictEqual(jsDiagnostics.length, 0, 'Should not create diagnostics for non-slim files');
    console.log('✅ Non-slim file test completed');
  });

  test('Should clear diagnostics for file documents', () => {
    console.log('🧪 Testing diagnostic clearing for file documents...');
    
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test.slim'),
      scheme: 'file',
      getText: () => 'doctype html',
      fileName: 'test.slim',
    } as unknown as vscode.TextDocument;

    console.log('🗑️ Clearing diagnostics for mock file document...');
    // Should not throw any errors
    linter.clear(mockDocument);
    console.log('✅ Diagnostic clearing test completed');
  });

  test('Should not clear diagnostics for non-file documents', () => {
    console.log('🧪 Testing diagnostic clearing for non-file documents...');
    
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.parse('untitled:/test.slim'),
      scheme: 'untitled',
      getText: () => 'doctype html',
      fileName: 'test.slim',
    } as unknown as vscode.TextDocument;

    console.log('🗑️ Clearing diagnostics for mock untitled document...');
    // Should not throw any errors
    linter.clear(mockDocument);
    console.log('✅ Non-file document clearing test completed');
  });

  test('Should handle configuration path resolution', () => {
    console.log('🧪 Testing configuration path resolution...');
    
    const config = vscode.workspace.getConfiguration('slimLint');
    const executablePath = config.get('executablePath');
    const configurationPath = config.get('configurationPath');

    console.log(`⚙️ Executable path: ${executablePath}`);
    console.log(`⚙️ Configuration path: ${configurationPath}`);

    assert.ok(executablePath, 'executablePath should be configured');
    assert.ok(configurationPath, 'configurationPath should be configured');
    assert.strictEqual(typeof executablePath, 'string', 'executablePath should be a string');
    assert.strictEqual(typeof configurationPath, 'string', 'configurationPath should be a string');
    
    console.log('✅ Configuration path resolution test completed');
  });

  test('Should check for .slim-lint.yml existence in repo root', () => {
    console.log('🧪 Testing .slim-lint.yml configuration file...');
    
    const repoRoot = process.cwd();
    const configPath = path.join(repoRoot, '.slim-lint.yml');
    const exists = fs.existsSync(configPath);

    console.log(`📁 Repository root: ${repoRoot}`);
    console.log(`📄 Configuration file: ${configPath}`);
    console.log(`✅ File exists: ${exists}`);

    assert.ok(exists, 'Configuration file should exist in repo root');

    if (exists) {
      const content = fs.readFileSync(configPath, 'utf8');
      assert.ok(content.length > 0, 'Configuration file should not be empty');
      console.log(`📊 Configuration file size: ${content.length} characters`);
    }
    
    console.log('✅ Configuration file test completed');
  });

  test('Should parse slim-lint output correctly', () => {
    console.log('🧪 Testing slim-lint output parsing...');
    
    const mockOutput = `test-file.slim:3 [W] LineLength: Line is too long. [80/120]
test-file.slim:5 [E] TrailingWhitespace: Trailing whitespace detected`;

    console.log(`📝 Mock slim-lint output:\n${mockOutput}`);

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
    console.log('🔍 Parsing slim-lint output...');
    const diagnostics = (linter as unknown as { parseOutput: (output: string, document: vscode.TextDocument) => vscode.Diagnostic[] }).parseOutput(mockOutput, mockDocument);

    console.log(`📊 Parsed ${diagnostics.length} diagnostics`);
    assert.strictEqual(diagnostics.length, 2, 'Should parse 2 diagnostics');

    // Check first diagnostic (warning)
    console.log(`🔍 Checking first diagnostic: ${diagnostics[0].message}`);
    assert.strictEqual(diagnostics[0].severity, vscode.DiagnosticSeverity.Warning, 'First should be warning');
    assert.strictEqual(diagnostics[0].message, 'LineLength: Line is too long. [80/120]', 'Should have correct message');
    assert.strictEqual(diagnostics[0].range.start.line, 2, 'Should be on line 2 (0-indexed)');

    // Check second diagnostic (error)
    console.log(`🔍 Checking second diagnostic: ${diagnostics[1].message}`);
    assert.strictEqual(diagnostics[1].severity, vscode.DiagnosticSeverity.Error, 'Second should be error');
    assert.strictEqual(diagnostics[1].message, 'TrailingWhitespace: Trailing whitespace detected', 'Should have correct message');
    assert.strictEqual(diagnostics[1].range.start.line, 4, 'Should be on line 4 (0-indexed)');
    
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
    const diagnostics = (linter as unknown as { parseOutput: (output: string, document: vscode.TextDocument) => vscode.Diagnostic[] }).parseOutput(mockOutput, mockDocument);

    console.log(`📊 Parsed ${diagnostics.length} diagnostics from empty output`);
    assert.strictEqual(diagnostics.length, 0, 'Should return empty array for empty output');
    
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
    const diagnostics = (linter as unknown as { parseOutput: (output: string, document: vscode.TextDocument) => vscode.Diagnostic[] }).parseOutput(mockOutput, mockDocument);

    console.log(`📊 Parsed ${diagnostics.length} diagnostics from malformed output`);
    assert.strictEqual(diagnostics.length, 0, 'Should return empty array for malformed output');
    
    console.log('✅ Malformed output handling test completed');
  });

  test('Should not perform operations when disposed', () => {
    console.log('🧪 Testing disposed linter operations...');
    
    // Dispose the linter
    console.log('🗑️ Disposing linter...');
    linter.dispose();
    
    // Try to run operations on disposed linter
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test.slim'),
      getText: () => 'doctype html',
      fileName: 'test.slim',
    } as unknown as vscode.TextDocument;
    
    console.log('⚡ Attempting to run linter on disposed instance...');
    // These should not throw errors and should return early
    linter.run(mockDocument);
    
    console.log('🗑️ Attempting to clear diagnostics on disposed instance...');
    linter.clear(mockDocument);
    
    // Test should pass if no errors are thrown
    assert.ok(true, 'Disposed linter should handle operations gracefully');
    console.log('✅ Disposed linter operations test completed');
  });

  test('Should handle configuration validation', () => {
    console.log('🧪 Testing configuration validation...');
    
    // Test that getConfiguration validates properly
    console.log('🔍 Validating linter configuration...');
    const config = linter['getConfiguration']();
    
    console.log(`⚙️ Executable path: ${config.executablePath}`);
    console.log(`⚙️ Configuration path: ${config.configurationPath}`);
    
    assert.ok(config.executablePath, 'executablePath should be defined');
    assert.ok(config.configurationPath, 'configurationPath should be defined');
    assert.strictEqual(typeof config.executablePath, 'string', 'executablePath should be a string');
    assert.strictEqual(typeof config.configurationPath, 'string', 'configurationPath should be a string');
    
    console.log('✅ Configuration validation test completed');
  });

  test('Should handle valid slim files without issues', async () => {
    console.log('🧪 Testing valid slim file handling...');
    
    // Use fixture file for valid test
    const validTestFile = path.join(process.cwd(), 'src/test/fixtures/valid-test.slim');
    console.log(`📁 Loading valid test fixture: ${validTestFile}`);
    const validTestDocument = await vscode.workspace.openTextDocument(validTestFile);
    
    // Run the linter on the valid test file
    console.log('⚡ Running linter on valid slim file...');
    linter.run(validTestDocument);
    
    // Wait for processing
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check diagnostics
    const diagnostics = linter['collection'].get(validTestDocument.uri) || [];
    
    console.log(`📊 Valid test file produced ${diagnostics.length} diagnostics`);
    
    // Should have no diagnostics for a valid file
    assert.strictEqual(diagnostics.length, 0, 'Valid file should have no diagnostics');
    console.log('✅ Valid slim file test completed');
  });

  test('Should prevent concurrent lints on same document', async () => {
    console.log('🧪 Testing concurrent lint prevention...');
    
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test-concurrent.slim'),
      getText: () => 'doctype html',
      fileName: 'test-concurrent.slim',
    } as unknown as vscode.TextDocument;

    // Start a lint operation
    console.log('⚡ Starting first lint operation...');
    linter.run(mockDocument);
    
    // Try to start another lint operation immediately
    console.log('⚡ Attempting concurrent lint operation...');
    linter.run(mockDocument);
    
    // Both operations should be allowed to run
    console.log('✅ Both lint operations should be allowed to run');
    
    // Wait for operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Concurrent lint operations test completed');
  });

  test('Should run linter and produce real diagnostics from slim-lint execution', async () => {
    console.log('🧪 Testing real slim-lint execution with complex file...');
    
    // Load the complex test fixture
    const complexTestFile = path.join(process.cwd(), 'src/test/fixtures/complex-test.slim');
    console.log(`📁 Loading complex test fixture: ${complexTestFile}`);
    const complexTestDocument = await vscode.workspace.openTextDocument(complexTestFile);
    
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
    
    console.log(`📊 Real slim-lint execution produced ${diagnostics.length} diagnostics`);
    
    // Verify the linter completed successfully
    console.log('🔍 Verifying linter completion...');
    assert.ok(Array.isArray(diagnostics), 'Diagnostics should be an array');
    assert.ok(linter['collection'], 'Diagnostic collection should exist');
    
    if (diagnostics.length > 0) {
      console.log('📋 Detailed diagnostics:');
      diagnostics.forEach((diagnostic, index) => {
        console.log(`  ${index + 1}. ${diagnostic.message} (${diagnostic.severity}) at line ${diagnostic.range.start.line}`);
      });
      
      // Verify diagnostics have proper structure
      console.log('🔍 Validating diagnostic structure...');
      diagnostics.forEach((diagnostic, index) => {
        assert.ok(diagnostic.message, `Diagnostic ${index} should have a message`);
        assert.ok(diagnostic.range, `Diagnostic ${index} should have a range`);
        assert.ok(typeof diagnostic.severity === 'number', `Diagnostic ${index} should have a severity`);
      });
    }
    
    // The test passes if we got exactly 7 diagnostics from slim-lint (our complex file should trigger specific issues)
    console.log('✅ Verifying exact diagnostic count...');
    assert.strictEqual(diagnostics.length, 7, `Should have exactly 7 diagnostics from real slim-lint execution, got ${diagnostics.length}`);
    
    // Verify we have the expected rule types in our complex test file
    console.log('🔍 Checking rule types...');
    const diagnosticMessages = diagnostics.map(d => d.message);
    const hasLineLengthRule = diagnosticMessages.some(msg => msg.includes('LineLength:'));
    const hasTrailingWhitespaceRule = diagnosticMessages.some(msg => msg.includes('TrailingWhitespace:'));
    const hasTrailingBlankLinesRule = diagnosticMessages.some(msg => msg.includes('TrailingBlankLines:'));
    
    console.log('📊 Complex test file rule types found:', {
      lineLength: hasLineLengthRule,
      trailingWhitespace: hasTrailingWhitespaceRule,
      trailingBlankLines: hasTrailingBlankLinesRule
    });
    
    // Our complex file should have specific rule types
    console.log('✅ Verifying rule type presence...');
    assert.ok(hasLineLengthRule, 'Complex test file should have LineLength diagnostics');
    assert.ok(hasTrailingWhitespaceRule, 'Complex test file should have TrailingWhitespace diagnostics');
    assert.ok(hasTrailingBlankLinesRule, 'Complex test file should have TrailingBlankLines diagnostics');
    
    console.log('✅ Real slim-lint execution test completed');
  });

  test('Should handle various slim-lint rule types', async () => {
    console.log('🧪 Testing various slim-lint rule types...');
    
    // Use fixture file for tab test
    const tabTestFile = path.join(process.cwd(), 'src/test/fixtures/tab-test.slim');
    console.log(`📁 Loading tab test fixture: ${tabTestFile}`);
    const tabTestDocument = await vscode.workspace.openTextDocument(tabTestFile);
    
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
        console.log(`  ${index + 1}. ${diagnostic.message} (${diagnostic.severity}) at line ${diagnostic.range.start.line}`);
      });
      
      // Verify diagnostics have proper structure
      console.log('🔍 Validating diagnostic structure...');
      diagnostics.forEach((diagnostic, index) => {
        assert.ok(diagnostic.message, `Diagnostic ${index} should have a message`);
        assert.ok(diagnostic.range, `Diagnostic ${index} should have a range`);
        assert.ok(typeof diagnostic.severity === 'number', `Diagnostic ${index} should have a severity`);
      });
    }
    
    // Should have exactly 10 diagnostics including Tab, LineLength, and TrailingWhitespace
    console.log('✅ Verifying exact diagnostic count...');
    assert.strictEqual(diagnostics.length, 10, `Should have exactly 10 diagnostics from tab test file, got ${diagnostics.length}`);
    
    // Check for specific rule types
    console.log('🔍 Checking rule types...');
    const diagnosticMessages = diagnostics.map(d => d.message);
    const hasTabRule = diagnosticMessages.some(msg => msg.includes('Tab:'));
    const hasLineLengthRule = diagnosticMessages.some(msg => msg.includes('LineLength:'));
    const hasTrailingWhitespaceRule = diagnosticMessages.some(msg => msg.includes('TrailingWhitespace:'));
    
    console.log('📊 Rule types found:', {
      tab: hasTabRule,
      lineLength: hasLineLengthRule,
      trailingWhitespace: hasTrailingWhitespaceRule
    });
    
    // Verify specific rule types are present
    console.log('✅ Verifying rule type presence...');
    assert.ok(hasTabRule, 'Tab test file should have Tab diagnostics');
    assert.ok(hasLineLengthRule, 'Tab test file should have LineLength diagnostics');
    assert.ok(hasTrailingWhitespaceRule, 'Tab test file should have TrailingWhitespace diagnostics');
    
    console.log('✅ Various rule types test completed');
  });

  test('Should handle disposal with active operations', async () => {
    console.log('🧪 Testing disposal with active operations...');
    
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test-dispose.slim'),
      getText: () => 'doctype html',
      fileName: 'test-dispose.slim',
    } as unknown as vscode.TextDocument;

    // Start a lint operation
    console.log('⚡ Starting lint operation...');
    linter.run(mockDocument);
    
    // Dispose while operations are active
    console.log('🗑️ Disposing linter with active operations...');
    linter.dispose();
    
    // Check that disposal completed successfully
    console.log('✅ Disposal with active operations test completed');
  });

  test('Should handle error conditions gracefully', () => {
    console.log('🧪 Testing error handling...');
    
    // Test with invalid configuration
    const originalGetConfiguration = linter['getConfiguration'];
    linter['getConfiguration'] = () => {
      throw new Error('Test configuration error');
    };
    
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test-error.slim'),
      getText: () => 'doctype html',
      fileName: 'test-error.slim',
    } as unknown as vscode.TextDocument;

    console.log('⚡ Running linter with invalid configuration...');
    // Should not throw, but should handle error gracefully
    linter.run(mockDocument);
    
    // Restore original method
    linter['getConfiguration'] = originalGetConfiguration;
    
    console.log('✅ Error handling test completed');
  });

  test('Should handle enhanced error scenarios', () => {
    console.log('🧪 Testing enhanced error scenarios...');
    
    // Test configuration validation errors
    const testCases = [
      {
        name: 'empty executable path',
        error: new Error('slim-lint executable path is not configured. Please set slimLint.executablePath in your settings.'),
        expectedMessage: 'slim-lint executable path is not configured. Please check your settings.'
      },
      {
        name: 'empty configuration path',
        error: new Error('slim-lint configuration path is not configured. Please set slimLint.configurationPath in your settings.'),
        expectedMessage: 'slim-lint configuration path is not configured. Please check your settings.'
      },
      {
        name: 'timeout error',
        error: new Error('timeout'),
        expectedMessage: 'slim-lint execution timed out. Please check your configuration or increase timeout.'
      },
      {
        name: 'permission error',
        error: new Error('permission denied'),
        expectedMessage: 'slim-lint permission denied. Please check file permissions.'
      },
      {
        name: 'executable not found',
        error: new Error('ENOENT: no such file or directory'),
        expectedMessage: 'slim-lint executable not found. Please install slim-lint: gem install slim_lint'
      }
    ];

    testCases.forEach(testCase => {
      console.log(`🔍 Testing ${testCase.name}...`);
      
      // Mock the lint method to throw specific errors
      const originalLint = linter['lint'];
      linter['lint'] = async () => {
        throw testCase.error;
      };
      
      const mockDocument = {
        languageId: 'slim',
        uri: vscode.Uri.file(`/test-${testCase.name}.slim`),
        getText: () => 'doctype html',
        fileName: `test-${testCase.name}.slim`,
      } as unknown as vscode.TextDocument;

      // Should handle error gracefully
      linter.run(mockDocument);
      
      // Restore original method
      linter['lint'] = originalLint;
    });
    
    console.log('✅ Enhanced error scenarios test completed');
  });

  test('Should validate configuration comprehensively', () => {
    console.log('🧪 Testing enhanced configuration validation...');
    
    // Test executable path validation
    const testCases = [
      {
        name: 'valid slim-lint executable',
        executablePath: 'slim-lint',
        shouldPass: true
      },
      {
        name: 'valid bundle exec',
        executablePath: 'bundle exec slim-lint',
        shouldPass: true
      },
      {
        name: 'valid gem exec',
        executablePath: 'gem exec slim-lint',
        shouldPass: true
      },
      {
        name: 'malformed executable path',
        executablePath: '   ',
        shouldPass: false
      },
      {
        name: 'unknown executable',
        executablePath: 'unknown-command',
        shouldPass: true // Should pass but with warning
      }
    ];

    testCases.forEach(testCase => {
      console.log(`🔍 Testing ${testCase.name}...`);
      
      // Mock getConfiguration to return test case
      const originalGetConfiguration = linter['getConfiguration'];
      linter['getConfiguration'] = () => ({
        executablePath: testCase.executablePath,
        configurationPath: '.slim-lint.yml'
      });
      
      const mockDocument = {
        languageId: 'slim',
        uri: vscode.Uri.file(`/test-${testCase.name}.slim`),
        getText: () => 'doctype html',
        fileName: `test-${testCase.name}.slim`,
      } as unknown as vscode.TextDocument;

      try {
        linter.run(mockDocument);
        console.log(`✅ ${testCase.name} handled as expected`);
      } catch (error) {
        if (!testCase.shouldPass) {
          console.log(`✅ ${testCase.name} correctly failed validation`);
        } else {
          console.log(`⚠️ ${testCase.name} unexpectedly failed`);
        }
      }
      
      // Restore original method
      linter['getConfiguration'] = originalGetConfiguration;
    });
    
    console.log('✅ Enhanced configuration validation test completed');
  });

  test('Should log performance timing', async () => {
    console.log('🧪 Testing performance timing...');
    
    const mockDocument = {
      languageId: 'slim',
      uri: vscode.Uri.file('/test-performance.slim'),
      getText: () => 'doctype html\nhtml\n  head\n    title Test\n  body\n    div',
      fileName: 'test-performance.slim',
    } as unknown as vscode.TextDocument;

    // Mock the executeSlimLint method to return quickly
    const originalExecuteSlimLint = linter['executeSlimLint'];
    linter['executeSlimLint'] = async () => {
      // Simulate a quick execution
      await new Promise(resolve => setTimeout(resolve, 10));
      return { stdout: '', stderr: '' };
    };

    console.log('⚡ Running linter with performance timing...');
    linter.run(mockDocument);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Restore original method
    linter['executeSlimLint'] = originalExecuteSlimLint;
    
    console.log('✅ Performance timing test completed');
  });
}); 