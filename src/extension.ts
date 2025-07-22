import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	console.log('Hurler extension is now active!');

	const runHurlCommand = vscode.commands.registerCommand('hurler.runHurl', async () => {
		const activeEditor = vscode.window.activeTextEditor;

		if (!activeEditor) {
			vscode.window.showErrorMessage('No active editor found');
			return;
		}

		const document = activeEditor.document;

		if (!document.fileName.endsWith('.hurl')) {
			vscode.window.showErrorMessage('Active file is not a .hurl file');
			return;
		}

		await document.save();

		const config = vscode.workspace.getConfiguration('hurler');
		const environmentFile = config.get<string>('environmentFile', '');
		const additionalArgs = config.get<string>('additionalArgs', '');

		const outputFile = document.fileName + '.out';

		// Create empty output file
		try {
			fs.writeFileSync(outputFile, '');
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create output file: ${error}`);
			return;
		}

		let command = `hurl "${document.fileName}"`;

		if (environmentFile) {
			const envPath = path.isAbsolute(environmentFile)
				? environmentFile
				: path.join(vscode.workspace.rootPath || '', environmentFile);
			command += ` --variables-file "${envPath}"`;
		}

		if (additionalArgs) {
			command += ` ${additionalArgs}`;
		}

		command += ` > "${outputFile}" 2>&1`;

		const terminal = vscode.window.createTerminal({
			name: 'Hurl Runner',
			cwd: path.dirname(document.fileName)
		});

		terminal.show();
		terminal.sendText(command);

		// Open the output file immediately
		vscode.workspace.openTextDocument(outputFile).then(doc => {
			vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
		});
	});

	const codelensProvider = new HurlCodeLensProvider();
	const codeLensDisposable = vscode.languages.registerCodeLensProvider(
		{ language: 'hurl' },
		codelensProvider
	);

	const hoverProvider = new HurlHoverProvider();
	const hoverDisposable = vscode.languages.registerHoverProvider(
		{ language: 'hurl' },
		hoverProvider
	);

	context.subscriptions.push(runHurlCommand, codeLensDisposable, hoverDisposable);
}

class HurlCodeLensProvider implements vscode.CodeLensProvider {
	provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
		if (!document.fileName.endsWith('.hurl')) {
			return [];
		}

		const codeLenses: vscode.CodeLens[] = [];
		const lines = document.getText().split('\n');

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (line.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/i)) {
				const range = new vscode.Range(i, 0, i, line.length);
				const codeLens = new vscode.CodeLens(range, {
					title: '▶️ Run Hurl File',
					command: 'hurler.runHurl',
					arguments: []
				});
				codeLenses.push(codeLens);
			}
		}

		return codeLenses;
	}
}

class HurlHoverProvider implements vscode.HoverProvider {
	provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
		const wordRange = document.getWordRangeAtPosition(position, /\{\{[^}]+\}\}/);
		if (!wordRange) {
			return;
		}

		const word = document.getText(wordRange);
		const variableName = word.replace(/^\{\{|\}\}$/g, '');

		const config = vscode.workspace.getConfiguration('hurler');
		const environmentFile = config.get<string>('environmentFile', '');

		if (!environmentFile) {
			return new vscode.Hover([
				new vscode.MarkdownString(`**${variableName}**`),
				new vscode.MarkdownString('*No environment file configured*')
			]);
		}

		const envPath = path.isAbsolute(environmentFile)
			? environmentFile
			: path.join(vscode.workspace.rootPath || '', environmentFile);

		if (!fs.existsSync(envPath)) {
			return new vscode.Hover([
				new vscode.MarkdownString(`**${variableName}**`),
				new vscode.MarkdownString(`*Environment file not found: ${envPath}*`)
			]);
		}

		try {
			const envContent = fs.readFileSync(envPath, 'utf8');
			const lines = envContent.split('\n');

			for (const line of lines) {
				const trimmedLine = line.trim();
				if (trimmedLine.startsWith('#') || !trimmedLine) {
					continue;
				}

				const [key, ...valueParts] = trimmedLine.split('=');
				if (key && key.trim() === variableName) {
					const value = valueParts.join('=').trim();
					return new vscode.Hover([
						new vscode.MarkdownString(`**${variableName}**`),
						new vscode.MarkdownString(`\`${value}\``)
					]);
				}
			}

			return new vscode.Hover([
				new vscode.MarkdownString(`**${variableName}**`),
				new vscode.MarkdownString('*Variable not found in environment file*')
			]);
		} catch (error) {
			return new vscode.Hover([
				new vscode.MarkdownString(`**${variableName}**`),
				new vscode.MarkdownString(`*Error reading environment file: ${error}*`)
			]);
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
