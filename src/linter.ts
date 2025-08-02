import { execa } from 'execa';
import * as fs from 'fs';
import * as path from 'path';
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

// Types
interface SlimLintConfig {
  executablePath: string;
  configurationPath: string;
}

interface SlimLintOutput {
  stdout: string;
  stderr: string;
}

export default class Linter {
  private collection: DiagnosticCollection;
  private processes: WeakMap<TextDocument, any>;

  constructor() {
    this.collection = languages.createDiagnosticCollection(DIAGNOSTIC_COLLECTION_NAME);
    this.processes = new WeakMap();
  }

  /**
   * Dispose of the linter and clean up resources
   */
  public dispose(): void {
    this.collection.dispose();
  }

  /**
   * Run the linter on a document
   * @param document The text document to lint
   */
  public run(document: TextDocument): void {
    if (!this.shouldLintDocument(document)) {
      return;
    }

    this.lint(document);
  }

  /**
   * Clear diagnostics for a document
   * @param document The text document to clear diagnostics for
   */
  public clear(document: TextDocument): void {
    if (this.isFileDocument(document)) {
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
    return {
      executablePath: config.get('executablePath') as string,
      configurationPath: config.get('configurationPath') as string,
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
      console.warn(
        `Configuration file ${resolvedConfigPath} does not exist! Using default slim-lint settings.`
      );
    }

    args.push(documentPath);
    return args;
  }

  /**
   * Kill any existing process for the document
   * @param document The text document
   */
  private killExistingProcess(document: TextDocument): void {
    const existingProcess = this.processes.get(document);
    if (existingProcess) {
      existingProcess.kill();
      this.processes.delete(document);
    }
  }

  /**
   * Execute slim-lint command
   * @param commandArgs The command arguments
   * @returns The slim-lint output
   */
  private async executeSlimLint(commandArgs: string[]): Promise<SlimLintOutput> {
    const [command, ...args] = commandArgs;
    const cwd = process.cwd();

    const execaProcess = execa(command, args, {
      reject: false,
      cwd,
    });

    const { stdout, stderr } = await execaProcess;
    
    if (stderr) {
      console.error('slim-lint stderr:', stderr);
      window.showErrorMessage(`slim-lint error: ${stderr}`);
    }

    return { stdout, stderr };
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
      console.error('Error creating diagnostic:', error);
      return null;
    }
  }

  /**
   * Update diagnostics for a document
   * @param document The text document
   * @param diagnostics The diagnostics to set
   */
  private updateDiagnostics(document: TextDocument, diagnostics: Diagnostic[]): void {
    this.collection.delete(document.uri);
    this.collection.set(document.uri, diagnostics);
  }

  /**
   * Main linting method
   * @param document The text document to lint
   */
  private async lint(document: TextDocument): Promise<void> {
    const originalText = document.getText();
    
    // Kill any existing process for this document
    this.killExistingProcess(document);

    try {
      // Get configuration and build command
      const config = this.getConfiguration();
      const commandArgs = this.buildCommandArgs(config, document.uri.fsPath);

      // Execute slim-lint
      const { stdout } = await this.executeSlimLint(commandArgs);

      // Check if document content changed during linting
      if (originalText !== document.getText()) {
        return;
      }

      // Parse output and update diagnostics
      const diagnostics = this.parseOutput(stdout, document);
      this.updateDiagnostics(document, diagnostics);

    } catch (error) {
      console.error('Error during linting:', error);
      window.showErrorMessage(`slim-lint execution failed: ${error}`);
    }
  }
}
