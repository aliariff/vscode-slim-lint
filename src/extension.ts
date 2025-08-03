'use strict';

import * as vscode from 'vscode';
import Linter from './linter';

let linter: Linter;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  // Create output channel for logging
  outputChannel = vscode.window.createOutputChannel('Slim Lint');
  outputChannel.appendLine('Slim Lint extension activated');

  try {
    linter = new Linter(outputChannel);

    // Add linter to subscriptions for proper cleanup
    context.subscriptions.push(linter);

    const updateDiagnostics = (document: vscode.TextDocument): void => {
      if (linter && !linter['disposed']) {
        try {
          linter.run(document);
        } catch (error) {
          outputChannel.appendLine(`Error running linter: ${error}`);
        }
      }
    };

    const clearDiagnostics = (document: vscode.TextDocument): void => {
      if (linter && !linter['disposed']) {
        try {
          linter.clear(document);
        } catch (error) {
          outputChannel.appendLine(`Error clearing diagnostics: ${error}`);
        }
      }
    };

    const handleDocumentChange = (event: vscode.TextDocumentChangeEvent): void => {
      // We could potentially use event.contentChanges or event.reason here
      // For now, we just run the linter on the changed document
      updateDiagnostics(event.document);
    };

    // Listen for document save events
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(updateDiagnostics)
    );

    // Listen for document open events
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument(updateDiagnostics)
    );

    // Listen for document close events
    context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument(clearDiagnostics)
    );

    // Listen for document change events
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(handleDocumentChange)
    );

    // Lint all open documents
    vscode.workspace.textDocuments.forEach(updateDiagnostics);
    
  } catch (error) {
    outputChannel.appendLine(`Failed to initialize linter: ${error}`);
    vscode.window.showErrorMessage(`Slim Lint extension failed to initialize: ${error}`);
  }
}

export function deactivate(): void {
  if (linter) {
    try {
      linter.dispose();
    } catch (error) {
      if (outputChannel) {
        outputChannel.appendLine(`Error disposing linter: ${error}`);
      }
    }
  }
  
  if (outputChannel) {
    outputChannel.appendLine('Slim Lint extension deactivated');
    outputChannel.dispose();
  }
}
