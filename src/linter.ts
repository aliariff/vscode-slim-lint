import * as execa from "execa";
import * as fs from "fs";
import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  languages,
  TextDocument,
  workspace,
  Range,
  Position,
  window
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
    let configurationPath = workspace.getConfiguration("slimLint")
      .configurationPath;
    const [command, ...args] = executablePath.split(/\s+/);

    if (configurationPath === ".slim-lint.yml" && workspace.workspaceFolders) {
      configurationPath =
        workspace.workspaceFolders[0].uri.fsPath + "/" + configurationPath;
    }
    if (fs.existsSync(configurationPath)) {
      args.push("--config", configurationPath);
    } else {
      console.warn(`${configurationPath} path does not exist! slim-lint extension using default settings`)
    }

    let cwd = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : "/";

    const process = execa(command, [...args, document.uri.fsPath], {
      reject: false,
      cwd
    });

    this.processes.set(document, process);
    const { stdout, stderr } = await process;
    if (stderr) {
      console.error(stderr);
      window.showErrorMessage(stderr)
    }
    this.processes.delete(document);

    if (text !== document.getText()) {
      return;
    }

    this.collection.delete(document.uri);
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
