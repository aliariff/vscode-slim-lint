'use strict';

import * as vscode from 'vscode';
import Linter from './linter';

let linter: Linter;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  // Create output channel for logging
  outputChannel = vscode.window.createOutputChannel('Slim Lint');
  outputChannel.appendLine('Slim Lint extension activated');

  linter = new Linter(outputChannel);

  // Add linter to subscriptions for proper cleanup
  context.subscriptions.push(linter);

  const updateDiagnostics = (document: vscode.TextDocument) => {
    linter.run(document);
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
    vscode.workspace.onDidCloseTextDocument(document => {
      linter.clear(document);
    })
  );

  // Lint all open documents
  vscode.workspace.textDocuments.forEach(updateDiagnostics);
}

export function deactivate() {
  if (linter) {
    linter.dispose();
  }
  
  if (outputChannel) {
    outputChannel.appendLine('Slim Lint extension deactivated');
    outputChannel.dispose();
  }
}
