const fs = require('fs');
const path = require('path');

function createDefaultWavBuffer() {
  const sampleRate = 22050;
  const duration = 0.35; // 350 ms duration
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2; // 16-bit mono = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // Audio format: 1 (PCM)
  buffer.writeUInt16LE(1, 22);  // Channels: 1 (Mono)
  buffer.writeUInt32LE(sampleRate, 24); // Sample rate
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate (sampleRate * channels * 2)
  buffer.writeUInt16LE(2, 32);  // Block align (channels * 2)
  buffer.writeUInt16LE(16, 34); // Bits per sample

  // 'data' sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Two-tone chime: D5 (587.33 Hz) transitioning to A5 (880.00 Hz)
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

const targetFile = path.join(__dirname, 'success.wav');

if (!fs.existsSync(targetFile)) {
  fs.writeFileSync(targetFile, createDefaultWavBuffer());
  console.log(`Generated default sound file at: ${targetFile}`);
} else {
  console.log(`Sound file already exists at: ${targetFile}`);
}

module.exports = { createDefaultWavBuffer };
