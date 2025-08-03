'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Linter from './linter';

let linter: Linter;
let outputChannel: vscode.OutputChannel;

/**
 * Validate slim-lint configuration on extension activation
 */
function validateConfiguration(): void {
  const config = vscode.workspace.getConfiguration('slimLint');
  const executablePath = config.get('executablePath') as string;
  const configurationPath = config.get('configurationPath') as string;

  // Basic configuration validation
  if (!executablePath || executablePath.trim() === '') {
    const errorMessage =
      'slim-lint executable path is not configured. Please set slimLint.executablePath in your settings.';
    outputChannel.appendLine(errorMessage);
    vscode.window.showWarningMessage(errorMessage);
    return;
  }

  if (!configurationPath || configurationPath.trim() === '') {
    const errorMessage =
      'slim-lint configuration path is not configured. Please set slimLint.configurationPath in your settings.';
    outputChannel.appendLine(errorMessage);
    vscode.window.showWarningMessage(errorMessage);
    return;
  }

  // Validate executable path structure
  const [command] = executablePath.split(/\s+/);
  if (!command || command.trim() === '') {
    const errorMessage =
      'slim-lint executable path is malformed. Please check your slimLint.executablePath setting.';
    outputChannel.appendLine(errorMessage);
    vscode.window.showWarningMessage(errorMessage);
    return;
  }

  // Check for common executable names
  const validExecutables = ['slim-lint', 'slim_lint', 'bundle', 'gem'];
  const isKnownExecutable = validExecutables.some(valid =>
    command.includes(valid)
  );
  if (!isKnownExecutable) {
    const warningMessage = `Executable '${command}' is not a known slim-lint executable. Expected: slim-lint, slim_lint, bundle exec slim-lint, or gem exec slim-lint`;
    outputChannel.appendLine(warningMessage);
    vscode.window.showWarningMessage(warningMessage);
  }

  // Validate configuration file if it exists
  const projectRoot = path.resolve(__dirname, '../../');
  const resolvedConfigPath =
    configurationPath === '.slim-lint.yml'
      ? path.join(projectRoot, configurationPath)
      : configurationPath;

  if (fs.existsSync(resolvedConfigPath)) {
    try {
      // Check if file is readable
      fs.accessSync(resolvedConfigPath, fs.constants.R_OK);

      // Validate file size
      const stats = fs.statSync(resolvedConfigPath);
      const maxSize = 1024 * 1024; // 1MB
      if (stats.size > maxSize) {
        const warningMessage = `Configuration file ${resolvedConfigPath} is very large (${Math.round(stats.size / 1024)}KB). This may cause performance issues.`;
        outputChannel.appendLine(warningMessage);
        vscode.window.showWarningMessage(warningMessage);
      }

      // Validate file extension
      const validExtensions = ['.yml', '.yaml'];
      const fileExt = path.extname(resolvedConfigPath).toLowerCase();
      if (!validExtensions.includes(fileExt)) {
        const warningMessage = `Configuration file ${resolvedConfigPath} has unexpected extension '${fileExt}'. Expected: .yml or .yaml`;
        outputChannel.appendLine(warningMessage);
        vscode.window.showWarningMessage(warningMessage);
      }

      outputChannel.appendLine(
        `Configuration validation passed. Using: ${resolvedConfigPath}`
      );
    } catch (accessError) {
      const errorMessage = `Configuration file ${resolvedConfigPath} exists but is not readable. Check file permissions.`;
      outputChannel.appendLine(errorMessage);
      vscode.window.showWarningMessage(errorMessage);
    }
  } else {
    const warningMessage = `Configuration file ${resolvedConfigPath} does not exist! Using default slim-lint settings.`;
    outputChannel.appendLine(warningMessage);

    // Check if there are any .slim-lint.yml files in the project
    const projectRoot = path.resolve(__dirname, '../../');
    const possibleConfigs = [
      '.slim-lint.yml',
      '.slim-lint.yaml',
      'slim-lint.yml',
      'slim-lint.yaml',
    ];
    const foundConfigs = possibleConfigs.filter(config =>
      fs.existsSync(path.join(projectRoot, config))
    );

    if (foundConfigs.length > 0) {
      const suggestionMessage = `Found potential configuration files: ${foundConfigs.join(', ')}. Consider updating slimLint.configurationPath setting.`;
      outputChannel.appendLine(suggestionMessage);
      vscode.window.showInformationMessage(suggestionMessage);
    }
  }
}

export function activate(context: vscode.ExtensionContext): void {
  // Create output channel for logging
  outputChannel = vscode.window.createOutputChannel('Slim Lint');
  outputChannel.appendLine('Slim Lint extension activated');

  // Validate configuration on activation
  validateConfiguration();

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

    const handleDocumentChange = (
      event: vscode.TextDocumentChangeEvent
    ): void => {
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
    vscode.window.showErrorMessage(
      `Slim Lint extension failed to initialize: ${error}`
    );
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
