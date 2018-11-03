import * as execa from "execa";
import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  languages,
  TextDocument,
  workspace,
  Range,
  Position
} from "vscode";

const REGEX = /.+?:(\d+) \[(W|E)] (\w+): (.+)/g;

export default class Linter {
  private collection: DiagnosticCollection = languages.createDiagnosticCollection(
    "slim-lint"
  );
  private processes: WeakMap<
    TextDocument,
    execa.ExecaChildProcess
  > = new WeakMap();

  /**
   * dispose
   */
  public dispose() {
    this.collection.dispose();
  }

  /**
   * run
   */
  public run(document: TextDocument) {
    if (document.languageId !== "slim") {
      return;
    }

    this.lint(document);
  }

  /**
   * clear
   */
  public clear(document: TextDocument) {
    if (document.uri.scheme === "file") {
      this.collection.delete(document.uri);
    }
  }

  private async lint(document: TextDocument) {
    const text = document.getText();
    const oldProcess = this.processes.get(document);
    if (oldProcess) {
      oldProcess.kill();
    }

    const executablePath = workspace.getConfiguration("slimLint")
      .executablePath;
    const [command, ...args] = executablePath.split(/\s+/);
    const process = execa(command, [...args, document.uri.fsPath], {
      reject: false
    });

    this.processes.set(document, process);
    const { code, stdout } = await process;
    this.processes.delete(document);

    if (text !== document.getText()) {
      return;
    }

    this.collection.delete(document.uri);
    if (code === 0) {
      return;
    }

    this.collection.set(document.uri, this.parse(stdout, document));
  }

  private parse(output: string, document: TextDocument): Diagnostic[] {
    const diagnostics = [];

    let match = REGEX.exec(output);
    while (match !== null) {
      const severity =
        match[2] === "W"
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

      diagnostics.push(
        new Diagnostic(range, `${ruleName}: ${message}`, severity)
      );
      match = REGEX.exec(output);
    }

    return diagnostics;
  }
}
