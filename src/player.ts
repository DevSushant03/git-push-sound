import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec, execFile } from 'child_process';

/**
 * Generates a default 16-bit PCM mono WAV chime buffer.
 */
function createDefaultWavBuffer(): Buffer {
  const sampleRate = 22050;
  const duration = 0.35; // 350 ms
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  // 'data' chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Two-tone chime (587.33 Hz -> 880 Hz)
  const tone1Samples = Math.floor(numSamples * 0.35);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = i < tone1Samples ? 587.33 : 880.0;
    const envelope = Math.max(0, 1 - i / numSamples);
    const sampleVal = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

/**
 * Ensures the default sound file exists on disk, creating it if missing.
 */
export function ensureDefaultSound(targetPath: string): void {
  if (fs.existsSync(targetPath)) {
    return;
  }
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, createDefaultWavBuffer());
  } catch (err: any) {
    vscode.window.showWarningMessage(`Git Push Sound: Could not create default sound file: ${err?.message || err}`);
  }
}

/**
 * Plays the configured or default sound file using native OS commands.
 */
export function playSound(context: vscode.ExtensionContext): Promise<void> {
  return new Promise((resolve) => {
    const config = vscode.workspace.getConfiguration('gitPushSound');
    const customPath = config.get<string>('customSoundPath', '').trim();

    let soundPath: string;
    if (customPath) {
      soundPath = customPath;
      if (!fs.existsSync(soundPath)) {
        vscode.window.showWarningMessage(`Git Push Sound: Custom sound file not found at "${soundPath}".`);
        resolve();
        return;
      }
    } else {
      const omPhatSwahaPath = path.join(context.extensionPath, 'media', 'Om_Phat_Swaha.wav');
      if (fs.existsSync(omPhatSwahaPath)) {
        soundPath = omPhatSwahaPath;
      } else {
        soundPath = path.join(context.extensionPath, 'media', 'success.wav');
        ensureDefaultSound(soundPath);
      }
      if (!fs.existsSync(soundPath)) {
        vscode.window.showWarningMessage(`Git Push Sound: Default sound file not found at "${soundPath}".`);
        resolve();
        return;
      }
    }

    const platform = process.platform;
    if (platform === 'win32') {
      // Windows PowerShell Media.SoundPlayer
      const escapedPath = soundPath.replace(/'/g, "''");
      const command = `powershell -NoProfile -NonInteractive -Command "(New-Object Media.SoundPlayer '${escapedPath}').PlaySync()"`;
      exec(command, (error) => {
        if (error) {
          vscode.window.showWarningMessage(`Git Push Sound: Playback failed: ${error.message}`);
        }
        resolve();
      });
    } else if (platform === 'darwin') {
      // macOS afplay
      execFile('afplay', [soundPath], (error) => {
        if (error) {
          vscode.window.showWarningMessage(`Git Push Sound: Playback failed: ${error.message}`);
        }
        resolve();
      });
    } else if (platform === 'linux') {
      // Linux paplay with aplay fallback
      execFile('paplay', [soundPath], (err) => {
        if (err) {
          execFile('aplay', [soundPath], (fallbackErr) => {
            if (fallbackErr) {
              vscode.window.showWarningMessage(`Git Push Sound: Playback failed (paplay/aplay): ${fallbackErr.message}`);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    } else {
      vscode.window.showWarningMessage(`Git Push Sound: Unsupported platform "${platform}".`);
      resolve();
    }
  });
}
