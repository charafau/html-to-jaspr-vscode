import * as vscode from 'vscode';
import { Wasm } from '@vscode/wasm-wasi/v1';


export async function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "html-to-jaspr" is now active!');
	const wasm: Wasm = await Wasm.load();
	let dart2wasm_runtime;
	let moduleInstance;

	const disposable = vscode.commands.registerCommand('html-to-jaspr.convertToJaspr', async () => {

		const activeEditor = vscode.window.activeTextEditor; // Capture the active editor

		if (!activeEditor) {
			vscode.window.showErrorMessage('No active text editor found.');
			return;
		}

		// Show input box to collect text
		const input = await vscode.window.showInputBox({
			prompt: 'Enter html code',
			placeHolder: 'Type your html code here...',
			ignoreFocusOut: true,
		});

		if (input !== undefined) { // Check if the user didn't cancel
			await vscode.window.showTextDocument(activeEditor.document); // Refocus the active editor

			activeEditor.edit(editBuilder => {
				if (activeEditor.selection.isEmpty) {
					// Insert text at the cursor position
					globalThis.convertToJaspr(input, (dartCode: any) => {
						editBuilder.insert(activeEditor.selection.start, dartCode);
					});
				} else {
					// Replace selected text
					globalThis.convertToJaspr(input, (dartCode: any) => {
						editBuilder.replace(activeEditor.selection, dartCode);
					});
				}
			});

			vscode.window.showInformationMessage('Text inserted successfully!');
		}
	});

	(async function convert() {
		try {
			const dartModulePromise = await wasm.compile(vscode.Uri.joinPath(context.extensionUri, 'media/htmltojaspr.wasm'));

			const imports = {};
			dart2wasm_runtime = await import(vscode.Uri.joinPath(context.extensionUri, 'media/htmltojaspr.mjs').toString());
			moduleInstance = await dart2wasm_runtime.instantiate(dartModulePromise, imports);

		} catch (exception) {
			console.error(`Failed to fetch and instantiate wasm module: ${exception}`);
		}

		if (moduleInstance) {
			try {
				await dart2wasm_runtime.invoke(moduleInstance);

			} catch (exception) {
				console.error(`Exception while invoking test: ${exception}`);
			}
		}
	})();



	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
