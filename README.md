# Git Push Sound (Tatya Vinchu Edition)

Play the iconic **"Om Phat Swaha"** (Tatya Vinchu) sound whenever your `git push` succeeds in the VS Code integrated terminal!

## Features

- **Automatic Detection:** Uses the modern VS Code Terminal Shell Integration API (`vscode.window.onDidEndTerminalShellExecution`) to detect when `git push` finishes with exit code `0`.
- **Zero Heavy Dependencies:** Lightweight sound playback via built-in OS utilities through Node `child_process`:
  - **Windows:** PowerShell `(New-Object Media.SoundPlayer 'path').PlaySync()`
  - **macOS:** `afplay`
  - **Linux:** `paplay` (with automatic fallback to `aplay`)
- **Bundled Sound:** Plays `media/Om_Phat_Swaha.wav` upon every successful git push.
- **Custom Sound Support:** Optionally configure any custom `.wav` sound file of your choice.
- **Commands:** Quickly toggle the sound on/off or test sound playback from the Command Palette.

> **Icon Note:** To add an extension icon, place a 128x128 PNG image (e.g. `images/icon.png`) in the project and add `"icon": "images/icon.png"` to `package.json`.

---

## Extension Settings

This extension contributes the following settings:

* `gitPushSound.enabled`: Enable or disable sound playback when `git push` succeeds (default: `true`).
* `gitPushSound.customSoundPath`: Absolute path to a custom sound file (`.wav` recommended). Leave empty to use the bundled "Om Phat Swaha" sound.

---

## Commands

Access these commands from the VS Code Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

* `Git Push Sound: Toggle Enabled/Disabled` (`gitPushSound.toggle`): Quickly enable or disable the extension.
* `Git Push Sound: Test Sound Playback` (`gitPushSound.test`): Play the active sound once for testing.

---

## Requirements

- VS Code version 1.93.0 or newer (with terminal shell integration enabled, which is enabled by default in modern VS Code versions).
- Compatible OS audio tools:
  - Windows: PowerShell (built into Windows)
  - macOS: `afplay` (built into macOS)
  - Linux: `paplay` (PulseAudio) or `aplay` (ALSA)
