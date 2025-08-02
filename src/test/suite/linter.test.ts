import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import Linter from '../../linter';

suite('Basic Linter Test Suite', () => {
  test('Should run linter.run with document', async () => {
    // Use fixture file from the test fixtures folder
    const fixturePath = path.resolve(__dirname, '../../../src/test/fixtures/test-with-issues.slim');
    console.log(`Testing basic linter.run with: ${fixturePath}`);

    // Open the document
    const document = await vscode.workspace.openTextDocument(fixturePath);
    console.log(`Document opened: ${document.fileName}`);
    console.log(`Document language: ${document.languageId}`);

    // Create a mock document with forced languageId since we removed language definition
    const mockDocument = {
      ...document,
      languageId: 'slim'
    } as vscode.TextDocument;
    
    console.log(`✅ Created mock document with languageId: ${mockDocument.languageId}`);

    // Create linter instance
    const linter = new Linter();
    console.log(`✅ Linter created`);

    // Run the linter directly
    console.log(`🔍 Running linter.run(mockDocument)...`);
    linter.run(mockDocument);

    // Wait for processing
    console.log(`⏳ Waiting for linter to complete...`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check diagnostics
    const allDiagnostics = vscode.languages.getDiagnostics();
    console.log(`📊 Total diagnostics in workspace: ${allDiagnostics.length}`);

    // Show all diagnostics
    allDiagnostics.forEach(([uri, diagnostics], index) => {
      console.log(`  ${index + 1}. ${uri.fsPath}: ${diagnostics.length} diagnostics`);
    });

    console.log(`🎉 Basic linter test completed!`);
  });
});
