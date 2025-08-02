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

const REGEX = /.+?:(\d+) \[(W|E)] (\w+): (.+)/g;

export default class Linter {
  private collection: DiagnosticCollection =
    languages.createDiagnosticCollection('slim-lint');
  private processes: WeakMap<TextDocument, any> = new WeakMap();

  /**
   * dispose
   */
  public dispose() {
    console.log('🔧 Linter.dispose() called');
    this.collection.dispose();
  }

  /**
   * run
   */
  public run(document: TextDocument) {
    console.log(`🔧 Linter.run() called with document: ${document.fileName}`);
    console.log(`🔧 Document language: ${document.languageId}`);
    console.log(`🔧 Document URI: ${document.uri.toString()}`);

    if (document.languageId !== 'slim') {
      console.log(`❌ Linter.run() - Document language is not 'slim', skipping. Language: ${document.languageId}`);
      return;
    }

    console.log(`✅ Linter.run() - Document language is 'slim', proceeding with linting`);
    this.lint(document);
  }

  /**
   * clear
   */
  public clear(document: TextDocument) {
    console.log(`🔧 Linter.clear() called with document: ${document.fileName}`);
    if (document.uri.scheme === 'file') {
      console.log(`🔧 Linter.clear() - Deleting diagnostics for: ${document.uri.toString()}`);
      this.collection.delete(document.uri);
    }
  }

  private async lint(document: TextDocument) {
    console.log(`🔧 Linter.lint() called with document: ${document.fileName}`);
    
    const text = document.getText();
    console.log(`🔧 Document text length: ${text.length} characters`);
    console.log(`🔧 Document line count: ${document.lineCount}`);

    const oldProcess = this.processes.get(document);
    if (oldProcess) {
      console.log(`🔧 Killing old process for document: ${document.fileName}`);
      oldProcess.kill();
    }

    const executablePath =
      workspace.getConfiguration('slimLint').executablePath;
    let configurationPath =
      workspace.getConfiguration('slimLint').configurationPath;
    
    console.log(`🔧 Executable path: ${executablePath}`);
    console.log(`🔧 Configuration path: ${configurationPath}`);

    const [command, ...args] = executablePath.split(/\s+/);
    console.log(`🔧 Command: ${command}`);
    console.log(`🔧 Args: ${JSON.stringify(args)}`);

    // Determine working directory and configuration path
    let cwd: string;
    if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
      cwd = workspace.workspaceFolders[0].uri.fsPath;
      if (configurationPath === '.slim-lint.yml') {
        configurationPath = path.join(cwd, configurationPath);
      }
    } else {
      // Use the document's directory as working directory
      cwd = path.dirname(document.uri.fsPath);
      if (configurationPath === '.slim-lint.yml') {
        configurationPath = path.join(cwd, configurationPath);
      }
    }
    
    console.log(`🔧 Working directory: ${cwd}`);
    console.log(`🔧 Configuration path: ${configurationPath}`);
    console.log(`🔧 Document URI fsPath: ${document.uri.fsPath}`);

    if (fs.existsSync(configurationPath)) {
      console.log(`✅ Configuration file exists: ${configurationPath}`);
      args.push('--config', configurationPath);
    } else {
      console.log(`❌ Configuration file does not exist: ${configurationPath}`);
      console.log(`🔧 Will use default slim-lint settings`);
    }

    console.log(`🔧 About to execute: ${command} ${[...args, document.uri.fsPath].join(' ')}`);

    try {
      const process = execa(command, [...args, document.uri.fsPath], {
        reject: false,
        cwd,
      });

      console.log(`🔧 Process created, waiting for completion...`);
      this.processes.set(document, process);
      
      const { stdout, stderr } = await process;
      console.log(`🔧 Process completed`);
      console.log(`🔧 stdout: ${stdout || '(empty)'}`);
      console.log(`🔧 stderr: ${stderr || '(empty)'}`);
      
      this.processes.delete(document);

      if (stderr) {
        console.error(`❌ Process stderr: ${stderr}`);
        window.showErrorMessage(stderr);
      }

      if (text !== document.getText()) {
        console.log(`❌ Document text changed during linting, aborting`);
        return;
      }

      console.log(`🔧 Clearing old diagnostics for: ${document.uri.toString()}`);
      this.collection.delete(document.uri);
      
      const diagnostics = this.parse(stdout, document);
      console.log(`🔧 Parsed ${diagnostics.length} diagnostics`);
      
      console.log(`🔧 Setting diagnostics for: ${document.uri.toString()}`);
      this.collection.set(document.uri, diagnostics);
      
      console.log(`✅ Linting completed successfully for: ${document.fileName}`);
      
    } catch (error) {
      console.error(`❌ Error during linting: ${error}`);
      console.error(`❌ Error details:`, error);
    }
  }

  private parse(output: string, document: TextDocument): Diagnostic[] {
    console.log(`🔧 Linter.parse() called with output length: ${output.length}`);
    console.log(`🔧 Raw output: ${output || '(empty)'}`);
    
    const diagnostics = [];

    let match = REGEX.exec(output);
    let matchCount = 0;
    
    while (match !== null) {
      matchCount++;
      console.log(`🔧 Match ${matchCount}: ${match[0]}`);
      
      const severity =
        match[2] === 'W'
          ? DiagnosticSeverity.Warning
          : DiagnosticSeverity.Error;
      const line = Math.max(Number.parseInt(match[1], 10) - 1, 0);
      const ruleName = match[3];
      const message = match[4];
      
      console.log(`🔧 Creating diagnostic: line=${line}, rule=${ruleName}, message=${message}, severity=${severity}`);
      
      const lineText = document.lineAt(line);
      const lineTextRange = lineText.range;
      const range = new Range(
        new Position(
          lineTextRange.start.line,
          lineText.firstNonWhitespaceCharacterIndex
        ),
        lineTextRange.end
      );

      const diagnostic = new Diagnostic(range, `${ruleName}: ${message}`, severity);
      diagnostics.push(diagnostic);
      
      console.log(`🔧 Diagnostic created: ${diagnostic.message} at line ${diagnostic.range.start.line}`);
      
      match = REGEX.exec(output);
    }

    console.log(`🔧 Parse completed: ${diagnostics.length} diagnostics created`);
    return diagnostics;
  }
}
