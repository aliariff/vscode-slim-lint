import { execa } from 'execa';
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

  public dispose() {
    this.collection.dispose();
  }

  public run(document: TextDocument) {
    if (document.languageId !== 'slim') {
      return;
    }

    this.lint(document);
  }

  public clear(document: TextDocument) {
    if (document.uri.scheme === 'file') {
      this.collection.delete(document.uri);
    }
  }

  private async lint(document: TextDocument) {
    const text = document.getText();

    const oldProcess = this.processes.get(document);
    if (oldProcess) {
      oldProcess.kill();
    }

    const executablePath =
      workspace.getConfiguration('slimLint').executablePath;
    const configurationPath =
      workspace.getConfiguration('slimLint').configurationPath;

    const [command, ...args] = executablePath.split(/\s+/);

    if (configurationPath) {
      args.push('--config', configurationPath);
    }

    try {
      const process = execa(command, [...args, document.uri.fsPath], {
        reject: false,
      });

      this.processes.set(document, process);
      
      const { stdout, stderr } = await process;
      
      this.processes.delete(document);

      if (stderr) {
        window.showErrorMessage(stderr);
      }

      if (text !== document.getText()) {
        return;
      }

      this.collection.delete(document.uri);
      
      const diagnostics = this.parse(stdout, document);
      
      this.collection.set(document.uri, diagnostics);
      
    } catch (error) {
      console.error(`Error during linting: ${error}`);
    }
  }

  private parse(output: string, document: TextDocument): Diagnostic[] {
    const diagnostics = [];

    let match = REGEX.exec(output);
    
    while (match !== null) {
      const severity =
        match[2] === 'W'
          ? DiagnosticSeverity.Warning
          : DiagnosticSeverity.Error;
      const line = Math.max(Number.parseInt(match[1], 10) - 1, 0);
      const ruleName = match[3];
      const message = match[4];
      
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
      
      match = REGEX.exec(output);
    }

    return diagnostics;
  }
}
