import * as vscode from 'vscode';
import { playSound } from './player';



export function activate(context: vscode.ExtensionContext) {
  console.log('git-push-sound activated');
  vscode.window.showInformationMessage('Git Push Sound activated');

  // Create Output Channel
  const outputChannel = vscode.window.createOutputChannel('Git Push Sound');
  context.subscriptions.push(outputChannel);

  // Command: Toggle git push sound enabled/disabled
  const toggleCommand = vscode.commands.registerCommand('gitPushSound.toggle', async () => {
    try {
      const config = vscode.workspace.getConfiguration('gitPushSound');
      const currentlyEnabled = config.get<boolean>('enabled', true);
      await config.update('enabled', !currentlyEnabled, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Git Push Sound is now ${!currentlyEnabled ? 'enabled' : 'disabled'}.`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Git Push Sound error: ${err?.message || err}`);
    }
  });

  // Command: Play test sound
  const testCommand = vscode.commands.registerCommand('gitPushSound.test', async () => {
    try {
      await playSound(context);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Git Push Sound error: ${err?.message || err}`);
    }
  });

  // Register commands immediately so they are always available
  context.subscriptions.push(toggleCommand, testCommand);

  // Avoid double-play tracking
  let lastExecution: vscode.TerminalShellExecution | undefined;
  let lastTriggerTime = 0;

  // Terminal shell integration listener: safely guarded
  try {
    if (typeof vscode.window.onDidEndTerminalShellExecution === 'function') {
      const shellListener = vscode.window.onDidEndTerminalShellExecution(async (event) => {
        try {
          const commandLine = event.execution.commandLine?.value ?? '';
          const confidence = event.execution.commandLine?.confidence;
          const exitCode = event.exitCode;
          const timestamp = new Date().toISOString();

          // Before any early return, log one line: commandLine value, commandLine confidence, exitCode, and a timestamp
          outputChannel.appendLine(
            `[${timestamp}] commandLine: "${commandLine}", confidence: ${confidence}, exitCode: ${exitCode}`
          );

          // Match git push after a shell prompt or whitespace
          const gitPushRegex = /(^|[\s>$#])git\s+push(\s|$|[A-Z])/;
          let isGitPush = gitPushRegex.test(commandLine);

          // Only when commandLine.confidence is Low/0, ALSO check the first line only (split on newline)
          if (!isGitPush && confidence === vscode.TerminalShellExecutionCommandLineConfidence.Low) {
            const firstLine = commandLine.split(/\r?\n/)[0];
            isGitPush = gitPushRegex.test(firstLine);
          }

          if (!isGitPush) {
            return;
          }

          // Keep exitCode === 0 check, treating exitCode === undefined as success when command matches
          if (exitCode !== 0 && exitCode !== undefined) {
            return;
          }

          const config = vscode.workspace.getConfiguration('gitPushSound');
          if (!config.get<boolean>('enabled', true)) {
            return;
          }

          // Avoid double-play: ignore if the same execution already triggered within 2 seconds
          const now = Date.now();
          if (lastExecution === event.execution && now - lastTriggerTime < 2000) {
            outputChannel.appendLine(
              `[${new Date().toISOString()}] Ignored double-play: same execution triggered within 2s`
            );
            return;
          }

          lastExecution = event.execution;
          lastTriggerTime = now;

          await playSound(context);
        } catch (listenerErr) {
          console.error('Git Push Sound terminal listener execution error:', listenerErr);
          outputChannel.appendLine(`terminal listener execution error: ${listenerErr}`);
        }
      });
      context.subscriptions.push(shellListener);
      outputChannel.appendLine('shell listener registered');
      console.log('Git Push Sound: shell listener registered');
    } else {
      outputChannel.appendLine('onDidEndTerminalShellExecution is not available');
      console.warn('Git Push Sound: onDidEndTerminalShellExecution is not available in this VS Code environment.');
    }
  } catch (err) {
    console.error('Git Push Sound terminal listener setup error:', err);
    outputChannel.appendLine(`terminal listener setup error: ${err}`);
  }
}

export function deactivate() {}
