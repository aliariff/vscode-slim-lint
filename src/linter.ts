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
  failed?: boolean;
  code?: string;
}

export default class Linter implements vscode.Disposable {
  private collection: DiagnosticCollection;
  private outputChannel: vscode.OutputChannel;
  private disposed: boolean = false;
  private isTestMode: boolean = process.env.NODE_ENV === 'test';

  constructor(outputChannel: vscode.OutputChannel) {
    this.collection = languages.createDiagnosticCollection(
      DIAGNOSTIC_COLLECTION_NAME
    );
    this.outputChannel = outputChannel;
  }

  /**
   * Optimized logging method
   * @param message The message to log
   * @param level The log level (info, warn, error)
   * @param showInTest Whether to show in test mode (default: false)
   */
  private log(
    message: string,
    level: 'info' | 'warn' | 'error' = 'info',
    showInTest: boolean = false
  ): void {
    if (this.disposed) return;

    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    const logMessage = `${prefix} ${message}`;

    this.outputChannel.appendLine(logMessage);

    // Only log to console in test mode if explicitly requested
    if (this.isTestMode && showInTest) {
      console.log(logMessage);
    }
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
      this.outputChannel.appendLine(
        'Disposing linter and cleaning up resources'
      );
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
      return;
    }

    this.log(`Running on: ${document.fileName}`, 'info');
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
      this.log(`Clearing: ${document.fileName}`, 'info');
      this.collection.delete(document.uri);
    }
  }

  /**
   * Check if the document should be linted
   * @param document The text document to check
   * @returns True if the document should be linted
   */
  private shouldLintDocument(document: TextDocument): boolean {
    // Only lint slim files that are actual files (not output channels, etc.)
    return (
      document.languageId === SLIM_LANGUAGE_ID && this.isFileDocument(document)
    );
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

    // Enhanced configuration validation
    if (!executablePath || executablePath.trim() === '') {
      const errorMessage =
        'slim-lint executable path is not configured. Please set slimLint.executablePath in your settings.';
      this.outputChannel.appendLine(errorMessage);
      throw new Error(errorMessage);
    }

    if (!configurationPath || configurationPath.trim() === '') {
      const errorMessage =
        'slim-lint configuration path is not configured. Please set slimLint.configurationPath in your settings.';
      this.outputChannel.appendLine(errorMessage);
      throw new Error(errorMessage);
    }

    // Validate executable path format
    if (
      executablePath.includes(' ') &&
      !executablePath.startsWith('"') &&
      !executablePath.endsWith('"')
    ) {
      this.outputChannel.appendLine(
        `Warning: Executable path contains spaces: "${executablePath}". Consider wrapping in quotes if needed.`
      );
    }

    // Validate executable path structure
    const [command] = executablePath.split(/\s+/);
    if (!command || command.trim() === '') {
      const errorMessage =
        'slim-lint executable path is malformed. Please check your slimLint.executablePath setting.';
      this.outputChannel.appendLine(errorMessage);
      throw new Error(errorMessage);
    }

    // Check for common executable names
    const validExecutables = ['slim-lint', 'slim_lint', 'bundle', 'gem'];
    const isKnownExecutable = validExecutables.some(valid =>
      command.includes(valid)
    );
    if (!isKnownExecutable) {
      this.outputChannel.appendLine(
        `Warning: Executable '${command}' is not a known slim-lint executable. Expected: slim-lint, slim_lint, bundle exec slim-lint, or gem exec slim-lint`
      );
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
      // Get project root from workspace
      const projectRoot =
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
      return path.join(projectRoot, configPath);
    }
    // Ensure path is normalized for cross-platform compatibility
    return path.normalize(configPath);
  }

  /**
   * Build the slim-lint command arguments
   * @param config The slim-lint configuration
   * @param documentPath The path to the document to lint
   * @returns The command arguments
   */
  private buildCommandArgs(
    config: SlimLintConfig,
    documentPath: string
  ): string[] {
    const [command, ...baseArgs] = config.executablePath.split(/\s+/);
    const args = [command, ...baseArgs];

    const resolvedConfigPath = this.resolveConfigurationPath(
      config.configurationPath
    );

    // Enhanced configuration file validation
    if (fs.existsSync(resolvedConfigPath)) {
      try {
        // Check if file is readable
        fs.accessSync(resolvedConfigPath, fs.constants.R_OK);

        // Validate file size (prevent reading extremely large files)
        const stats = fs.statSync(resolvedConfigPath);
        const maxSize = 1024 * 1024; // 1MB
        if (stats.size > maxSize) {
          const warningMessage = `Configuration file ${resolvedConfigPath} is very large (${Math.round(stats.size / 1024)}KB). This may cause performance issues.`;
          this.outputChannel.appendLine(warningMessage);
        }

        // Validate file extension
        const validExtensions = ['.yml', '.yaml'];
        const fileExt = path.extname(resolvedConfigPath).toLowerCase();
        if (!validExtensions.includes(fileExt)) {
          const warningMessage = `Configuration file ${resolvedConfigPath} has unexpected extension '${fileExt}'. Expected: .yml or .yaml`;
          this.outputChannel.appendLine(warningMessage);
        }

        args.push('--config', resolvedConfigPath);
        this.outputChannel.appendLine(
          `Using configuration file: ${resolvedConfigPath}`
        );
      } catch (accessError) {
        const errorMessage = `Configuration file ${resolvedConfigPath} exists but is not readable. Check file permissions.`;
        this.outputChannel.appendLine(errorMessage);
        window.showErrorMessage(errorMessage);
      }
    } else {
      const warningMessage = `Configuration file ${resolvedConfigPath} does not exist! Using default slim-lint settings.`;
      this.outputChannel.appendLine(warningMessage);

      // Provide helpful guidance
      const guidanceMessage =
        'To use a custom configuration, create a .slim-lint.yml file in your project root or set slimLint.configurationPath in your settings.';
      this.outputChannel.appendLine(guidanceMessage);

      // Check if there are any .slim-lint.yml files in the project
      const projectRoot =
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
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
        this.outputChannel.appendLine(suggestionMessage);
      }
    }

    args.push(documentPath);
    return args;
  }

  /**
   * Execute slim-lint command
   * @param commandArgs The command arguments
   * @returns The slim-lint output
   */
  private async executeSlimLint(
    commandArgs: string[]
  ): Promise<SlimLintOutput> {
    const [command, ...args] = commandArgs;
    const cwd =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

    try {
      // Validate command exists and is not empty
      if (!command || command.trim() === '') {
        throw new Error('slim-lint command is empty or invalid');
      }

      // Enhanced executable validation
      let executableExists = false;
      let executablePath = '';

      try {
        // Check if command exists in PATH (cross-platform)
        const checkCommand = process.platform === 'win32' ? 'where' : 'which';
        const { stdout } = await execa(checkCommand, [command], {
          reject: false,
        });
        if (stdout && stdout.trim()) {
          executableExists = true;
          executablePath = stdout.trim();
          this.outputChannel.appendLine(`Found executable: ${executablePath}`);
        }
      } catch (whichError) {
        this.outputChannel.appendLine(`Command '${command}' not found in PATH`);
      }

      // Additional validation for common slim-lint scenarios
      if (!executableExists) {
        // Check if it's a bundle exec command
        if (command === 'bundle') {
          try {
            const { stdout } = await execa(
              'bundle',
              ['exec', 'slim-lint', '--version'],
              { reject: false }
            );
            if (stdout) {
              executableExists = true;
              this.outputChannel.appendLine('Found slim-lint via bundle exec');
            }
          } catch (bundleError) {
            this.outputChannel.appendLine(
              'bundle exec slim-lint not available'
            );
          }
        }

        // Check if it's a gem exec command
        if (command === 'gem') {
          try {
            const { stdout } = await execa(
              'gem',
              ['exec', 'slim-lint', '--version'],
              { reject: false }
            );
            if (stdout) {
              executableExists = true;
              this.outputChannel.appendLine('Found slim-lint via gem exec');
            }
          } catch (gemError) {
            this.outputChannel.appendLine('gem exec slim-lint not available');
          }
        }
      }

      if (!executableExists) {
        this.log(`Could not verify executable '${command}'`, 'warn');
      }

      const result = await execa(command, args, {
        reject: false,
        cwd,
        timeout: LINT_TIMEOUT,
      });

      const { stdout, stderr, failed, code } = result;

      // Check if command failed (only log if it's a real failure)
      if (failed && !stdout) {
        this.log(`Failed with code: ${code}`, 'error', true);
      }

      if (stderr) {
        this.log(`stderr: ${stderr}`, 'error', true);

        // Provide specific error messages based on stderr content
        if (
          stderr.includes('command not found') ||
          stderr.includes('not found') ||
          stderr.includes(
            'is not recognized as an internal or external command'
          )
        ) {
          const installMessage =
            process.platform === 'win32'
              ? 'slim-lint not found. Please install slim-lint: gem install slim_lint. On Windows, ensure Ruby and slim-lint are in your PATH.'
              : 'slim-lint not found. Please install slim-lint: gem install slim_lint';
          window.showErrorMessage(installMessage);
        } else if (stderr.includes('permission denied')) {
          const permissionMessage =
            'slim-lint permission denied. Please check file permissions.';
          window.showErrorMessage(permissionMessage);
        } else if (stderr.includes('timeout')) {
          const timeoutMessage =
            'slim-lint execution timed out. Please check your configuration.';
          window.showErrorMessage(timeoutMessage);
        } else if (stderr.includes('error') || stderr.includes('failed')) {
          window.showErrorMessage(`slim-lint error: ${stderr}`);
        }
      }

      return { stdout, stderr, failed, code };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(`Execution failed: ${errorMessage}`, 'error', true);

      // Provide helpful installation instructions based on error type
      let installMessage =
        process.platform === 'win32'
          ? 'slim-lint not found. Please install slim-lint: gem install slim_lint. On Windows, ensure Ruby and slim-lint are in your PATH.'
          : 'slim-lint not found. Please install slim-lint: gem install slim_lint';

      if (errorMessage.includes('timeout')) {
        installMessage =
          'slim-lint execution timed out. Please check your configuration or increase timeout.';
      } else if (errorMessage.includes('permission')) {
        installMessage =
          'slim-lint permission denied. Please check file permissions and try again.';
      } else if (errorMessage.includes('ENOENT')) {
        installMessage =
          process.platform === 'win32'
            ? 'slim-lint executable not found. Please install slim-lint: gem install slim_lint. On Windows, ensure Ruby and slim-lint are in your PATH.'
            : 'slim-lint executable not found. Please install slim-lint: gem install slim_lint';
      }

      window.showErrorMessage(installMessage);

      return {
        stdout: '',
        stderr: `slim-lint execution failed: ${errorMessage}`,
        failed: true,
        code: 'EXECUTION_ERROR',
      };
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
  private createDiagnostic(
    match: RegExpExecArray,
    document: TextDocument
  ): Diagnostic | null {
    try {
      const [, lineStr, severityChar, ruleName, message] = match;
      const line = Math.max(parseInt(lineStr, 10) - 1, 0);

      if (line >= document.lineCount) {
        return null;
      }

      const severity =
        severityChar === 'W'
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
  private updateDiagnostics(
    document: TextDocument,
    diagnostics: Diagnostic[]
  ): void {
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

    const startTime = Date.now();
    const originalText = document.getText();

    try {
      // Get configuration and build command
      const config = this.getConfiguration();
      const commandArgs = this.buildCommandArgs(config, document.uri.fsPath);

      this.log(`Executing: ${commandArgs.join(' ')}`, 'info', true);

      // Execute slim-lint
      const { stdout, stderr, failed, code } =
        await this.executeSlimLint(commandArgs);

      // Check disposal state again after async operation
      if (this.disposed) {
        return;
      }

      if (stdout) {
        this.log(
          `Found ${stdout.split('\n').filter(line => line.trim()).length} issues`,
          'info',
          true
        );
      }

      if (stderr) {
        this.log(`Error: ${stderr.trim()}`, 'error', true);
        window.showErrorMessage(`slim-lint error: ${stderr.trim()}`);
        return;
      }

      // Check if command failed (only if there's no stdout and there's stderr)
      // slim-lint returns non-zero exit code when it finds issues, which is normal
      if (failed && !stdout && stderr) {
        this.log(`Failed with code: ${code}`, 'error', true);
        window.showErrorMessage(`slim-lint failed: ${code}`);
        return;
      }

      // Check if document content changed during linting
      if (originalText !== document.getText()) {
        const duration = Date.now() - startTime;
        this.log(`Skipped (content changed) after ${duration}ms`, 'warn');
        return;
      }

      // Parse output and update diagnostics
      const diagnostics = this.parseOutput(stdout, document);
      this.updateDiagnostics(document, diagnostics);

      // Log performance timing
      const duration = Date.now() - startTime;
      this.log(
        `Completed in ${duration}ms (${diagnostics.length} diagnostics)`,
        'info',
        true
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const duration = Date.now() - startTime;

      this.log(`Failed after ${duration}ms: ${errorMessage}`, 'error');

      if (!this.disposed) {
        // Provide specific error messages based on error type
        let userMessage = `slim-lint execution failed: ${errorMessage}`;

        if (errorMessage.includes('executable path is not configured')) {
          userMessage =
            'slim-lint executable path is not configured. Please check your settings.';
        } else if (
          errorMessage.includes('configuration path is not configured')
        ) {
          userMessage =
            'slim-lint configuration path is not configured. Please check your settings.';
        } else if (errorMessage.includes('timeout')) {
          userMessage =
            'slim-lint execution timed out. Please check your configuration or increase timeout.';
        } else if (errorMessage.includes('permission')) {
          userMessage =
            'slim-lint permission denied. Please check file permissions.';
        } else if (errorMessage.includes('ENOENT')) {
          userMessage =
            process.platform === 'win32'
              ? 'slim-lint executable not found. Please install slim-lint: gem install slim_lint. On Windows, ensure Ruby and slim-lint are in your PATH.'
              : 'slim-lint executable not found. Please install slim-lint: gem install slim_lint';
        }

        window.showErrorMessage(userMessage);
      }
    }
  }
}
