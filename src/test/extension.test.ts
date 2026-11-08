import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Git Push Sound Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Commands are registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('gitPushSound.toggle'), 'gitPushSound.toggle should be registered');
    assert.ok(commands.includes('gitPushSound.test'), 'gitPushSound.test should be registered');
  });

  test('Configuration settings exist with defaults', () => {
    const config = vscode.workspace.getConfiguration('gitPushSound');
    assert.strictEqual(config.get('enabled'), true);
    assert.strictEqual(config.get('customSoundPath'), '');
  });
});
