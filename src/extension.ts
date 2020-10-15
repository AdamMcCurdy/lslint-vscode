"use strict";

import * as path from "path";
import * as vscode from "vscode";
import {spawn, ChildProcess} from "child_process";
import { pathToFileURL } from "url";
import { print } from "util";

// const OUTPUT_REGEXP = /([0-9]+): (.+) near.*[<'](.*)['>]/;

let diagnosticCollection: vscode.DiagnosticCollection;
let currentDiagnostic: vscode.Diagnostic;

function generateErrorMatches(payload: string){
    let allLines = payload.split(/\n/);
    let parsedLines = [];

    allLines.forEach(function(item, index, object) {
        if(item.includes("ERROR::")){
            //lineArray build as name 0, line 1, text 2, at 3
            let numbers = item.match(/\d+/g);
            let text = item.match(/'((?:''|[^'])*)'/)[0].split('\'').join("");                    
            parsedLines.push({name: "Error", line: parseInt(numbers[0]), text: text, at: parseInt(numbers[1])})
        }
    });    
    return parsedLines;
}

function parseDocumentDiagnostics(document: vscode.TextDocument, lslcOutput: string) {
    // const matches = OUTPUT_REGEXP.exec(lslcOutput);
    const errors = generateErrorMatches(lslcOutput); 
    errors.forEach(matches => {
        const message = {
            line: matches["line"],
            text: matches["text"],
            at: matches["at"]
        }

        if (!message.line) {
            return;
        }
    
        var errorLine = document.lineAt(message.line - 1).text;
        var rangeLine = message.line - 1;
        var rangeStart = new vscode.Position(rangeLine, 0);
        var rangeEnd = new vscode.Position(rangeLine, errorLine.length);

        if (message.at !== "eof") {
            var linePosition = errorLine.indexOf(message.at);
            if (linePosition >= 0) {
                rangeStart = new vscode.Position(rangeLine, linePosition);
                rangeEnd = new vscode.Position(rangeLine, linePosition + message.at.length);
            }
        }
        var range = new vscode.Range(rangeStart, rangeEnd);
        currentDiagnostic = new vscode.Diagnostic(range, message.text, vscode.DiagnosticSeverity.Error);
    });
}

function lintDocument(document: vscode.TextDocument, warnOnError: Boolean = true) {
    let lsllinterConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('lsllinter');
    if (!lsllinterConfig.get("enable")) {
        return;
    }

    if (document.languageId !== "lsl") {
        return;
    }
    currentDiagnostic = null;

    let filePath = vscode.window.activeTextEditor.document.uri.fsPath;
    // Determine the interpreter to use
    let interpreter = lsllinterConfig.get<string>("interpreter");    
    var lslProcess: ChildProcess = spawn(interpreter, [filePath]);
    
    lslProcess.stdout.setEncoding("utf8");

    lslProcess.stderr.on("data", (data: Buffer) => {
        if (data.length == 0) {
            return;
        }
        parseDocumentDiagnostics(document, data.toString());
    });
    
    lslProcess.stderr.on("error", error => {
        vscode.window.showErrorMessage(interpreter + " error: " + error);
    });

    lslProcess.on("exit", (code: number, signal: string) => {
        if (!currentDiagnostic) {
            diagnosticCollection.clear();
        } else {
            diagnosticCollection.set(document.uri, [currentDiagnostic]);

            // Optionally show warining message
            if (warnOnError && lsllinterConfig.get<boolean>("warnOnSave")) {
                vscode.window.showWarningMessage("Current file contains an error: '${currentDiagnostic.message}' at line ${currentDiagnostic.range.start.line}");
            }
        }
    });
}

export function activate(context: vscode.ExtensionContext) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('lsl');
    context.subscriptions.push(diagnosticCollection);

    vscode.workspace.onDidSaveTextDocument(document => lintDocument(document, true));
    vscode.workspace.onDidChangeTextDocument(event => lintDocument(event.document));
    vscode.workspace.onDidOpenTextDocument(document => lintDocument(document));
    vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor) => lintDocument(editor.document));
}