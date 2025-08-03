import { execa } from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  languages,
  TextDocument,
  workspace,
  Range,
  Position,
  window,
} from 'vscode';

// Constants
const SLIM_LANGUAGE_ID = 'slim';
const DIAGNOSTIC_COLLECTION_NAME = 'slim-lint';
const DEFAULT_CONFIG_FILE = '.slim-lint.yml';
const SLIM_LINT_OUTPUT_REGEX = /.+?:(\d+) \[(W|E)] (\w+): (.+)/g;
const LINT_TIMEOUT = 30000; // 30 seconds

// Types
interface SlimLintConfig {
  executablePath: string;
  configurationPath: string;
}

interface SlimLintOutput {
  stdout: string;
  stderr: string;
}

export default class Linter implements vscode.Disposable {
  private collection: DiagnosticCollection;
  private outputChannel: vscode.OutputChannel;
  private disposed: boolean = false;

  constructor(outputChannel: vscode.OutputChannel) {
    this.collection = languages.createDiagnosticCollection(DIAGNOSTIC_COLLECTION_NAME);
    this.outputChannel = outputChannel;
  }

  /**
   * Dispose of the linter and clean up resources
   */
  public dispose(): void {
    if (this.disposed) {
      return;
    }
    
    this.disposed = true;
    
    if (this.outputChannel) {
      this.outputChannel.appendLine('Disposing linter and cleaning up resources');
    }
    
    if (this.collection) {
      this.collection.dispose();
    }
  }

  /**
   * Run the linter on a document
   * @param document The text document to lint
   */
  public run(document: TextDocument): void {
    if (this.disposed) {
      return;
    }
    
    if (!this.shouldLintDocument(document)) {
      this.outputChannel.appendLine(`Skipping lint for non-slim file: ${document.fileName}`);
      return;
    }

    this.outputChannel.appendLine(`Running linter on: ${document.fileName}`);
    this.lint(document);
  }

  /**
   * Clear diagnostics for a document
   * @param document The text document to clear diagnostics for
   */
  public clear(document: TextDocument): void {
    if (this.disposed) {
      return;
    }
    
    if (this.isFileDocument(document)) {
      this.outputChannel.appendLine(`Clearing diagnostics for: ${document.fileName}`);
      this.collection.delete(document.uri);
    }
  }

  /**
   * Check if the document should be linted
   * @param document The text document to check
   * @returns True if the document should be linted
   */
  private shouldLintDocument(document: TextDocument): boolean {
    return document.languageId === SLIM_LANGUAGE_ID;
  }

  /**
   * Check if the document is a file document
   * @param document The text document to check
   * @returns True if the document is a file document
   */
  private isFileDocument(document: TextDocument): boolean {
    return document.uri.scheme === 'file';
  }

  /**
   * Get the slim-lint configuration from workspace settings
   * @returns The slim-lint configuration
   */
  private getConfiguration(): SlimLintConfig {
    const config = workspace.getConfiguration('slimLint');
    const executablePath = config.get('executablePath') as string;
    const configurationPath = config.get('configurationPath') as string;
    
    // Validate configuration
    if (!executablePath || executablePath.trim() === '') {
      throw new Error('slim-lint executable path is not configured');
    }
    
    if (!configurationPath || configurationPath.trim() === '') {
      throw new Error('slim-lint configuration path is not configured');
    }
    
    return {
      executablePath,
      configurationPath,
    };
  }

  /**
   * Resolve the configuration file path
   * @param configPath The configuration path from settings
   * @returns The resolved configuration file path
   */
  private resolveConfigurationPath(configPath: string): string {
    if (configPath === DEFAULT_CONFIG_FILE) {
      return path.join(process.cwd(), configPath);
    }
    return configPath;
  }

  /**
   * Build the slim-lint command arguments
   * @param config The slim-lint configuration
   * @param documentPath The path to the document to lint
   * @returns The command arguments
   */
  private buildCommandArgs(config: SlimLintConfig, documentPath: string): string[] {
    const [command, ...baseArgs] = config.executablePath.split(/\s+/);
    const args = [command, ...baseArgs];

    const resolvedConfigPath = this.resolveConfigurationPath(config.configurationPath);
    
    if (fs.existsSync(resolvedConfigPath)) {
      args.push('--config', resolvedConfigPath);
    } else {
      this.outputChannel.appendLine(
        `Configuration file ${resolvedConfigPath} does not exist! Using default slim-lint settings.`
      );
    }

    args.push(documentPath);
    return args;
  }

  /**
   * Execute slim-lint command
   * @param commandArgs The command arguments
   * @returns The slim-lint output
   */
  private async executeSlimLint(commandArgs: string[]): Promise<SlimLintOutput> {
    const [command, ...args] = commandArgs;
    const cwd = process.cwd();

    try {
      const execaProcess = execa(command, args, {
        reject: false,
        cwd,
        timeout: LINT_TIMEOUT,
      });

      const { stdout, stderr } = await execaProcess;
      
      if (stderr) {
        this.outputChannel.appendLine(`slim-lint stderr: ${stderr}`);
        // Only show error message for actual errors, not warnings
        if (stderr.includes('error') || stderr.includes('not found')) {
          window.showErrorMessage(`slim-lint error: ${stderr}`);
        }
      }

      return { stdout, stderr };
    } catch (error) {
      this.outputChannel.appendLine(`Failed to execute slim-lint: ${error}`);
      window.showErrorMessage(`slim-lint not found. Please install slim-lint: gem install slim_lint`);
      return { stdout: '', stderr: `slim-lint not found: ${error}` };
    }
  }

  /**
   * Parse slim-lint output and create diagnostics
   * @param output The slim-lint output
   * @param document The text document
   * @returns Array of diagnostics
   */
  private parseOutput(output: string, document: TextDocument): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    let match = SLIM_LINT_OUTPUT_REGEX.exec(output);

    while (match !== null) {
      const diagnostic = this.createDiagnostic(match, document);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
      match = SLIM_LINT_OUTPUT_REGEX.exec(output);
    }

    return diagnostics;
  }

  /**
   * Create a diagnostic from a regex match
   * @param match The regex match from slim-lint output
   * @param document The text document
   * @returns The diagnostic or null if invalid
   */
  private createDiagnostic(match: RegExpExecArray, document: TextDocument): Diagnostic | null {
    try {
      const [, lineStr, severityChar, ruleName, message] = match;
      const line = Math.max(parseInt(lineStr, 10) - 1, 0);
      
      if (line >= document.lineCount) {
        return null;
      }

      const severity = severityChar === 'W' 
        ? DiagnosticSeverity.Warning 
        : DiagnosticSeverity.Error;

      const lineText = document.lineAt(line);
      const range = new Range(
        new Position(line, lineText.firstNonWhitespaceCharacterIndex),
        lineText.range.end
      );

      return new Diagnostic(range, `${ruleName}: ${message}`, severity);
    } catch (error) {
      this.outputChannel.appendLine(`Error creating diagnostic: ${error}`);
      return null;
    }
  }

  /**
   * Update diagnostics for a document
   * @param document The text document
   * @param diagnostics The diagnostics to set
   */
  private updateDiagnostics(document: TextDocument, diagnostics: Diagnostic[]): void {
    if (this.disposed) {
      return;
    }
    
    this.collection.delete(document.uri);
    this.collection.set(document.uri, diagnostics);
  }

  /**
   * Main linting method
   * @param document The text document to lint
   */
  private async lint(document: TextDocument): Promise<void> {
    if (this.disposed) {
      return;
    }

    const originalText = document.getText();

    try {
      // Get configuration and build command
      const config = this.getConfiguration();
      const commandArgs = this.buildCommandArgs(config, document.uri.fsPath);

      this.outputChannel.appendLine(`Executing slim-lint: ${commandArgs.join(' ')}`);

      // Execute slim-lint
      const { stdout, stderr } = await this.executeSlimLint(commandArgs);

      // Check disposal state again after async operation
      if (this.disposed) {
        return;
      }

      this.outputChannel.appendLine(`slim-lint stdout: ${stdout}`);
      if (stderr) {
        this.outputChannel.appendLine(`slim-lint stderr: ${stderr}`);
      }

      // Check if document content changed during linting
      if (originalText !== document.getText()) {
        this.outputChannel.appendLine('Document content changed during linting, skipping update');
        return;
      }

      // Parse output and update diagnostics
      const diagnostics = this.parseOutput(stdout, document);
      this.outputChannel.appendLine(`Parsed ${diagnostics.length} diagnostics`);
      this.updateDiagnostics(document, diagnostics);

    } catch (error) {
      this.outputChannel.appendLine(`Error during linting: ${error}`);
      if (!this.disposed) {
        window.showErrorMessage(`slim-lint execution failed: ${error}`);
      }
    }
  }
}
