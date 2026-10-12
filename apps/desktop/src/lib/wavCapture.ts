/** Capture microphone audio as 16 kHz mono PCM and encode WAV for Ollama STT. */

const TARGET_SAMPLE_RATE = 16000;

function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
): Float32Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) return buffer;
  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, buffer.length - 1);
    const frac = idx - i0;
    result[i] = buffer[i0] * (1 - frac) + buffer[i1] * frac;
  }
  return result;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function pcmRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    sum += s * s;
  }
  return Math.sqrt(sum / samples.length);
}

export interface WavCaptureHandle {
  /** Full recording as WAV (for saving on stop). */
  getFullWavBlob(): Blob;
  /** New audio since `fromSampleIndex` (for live Ollama chunks). */
  getWavBlobSince(fromSampleIndex: number): {
    blob: Blob;
    toSampleIndex: number;
    rms: number;
  };
  sampleCount(): number;
  stop(): void;
}

export async function createWavCapture(
  stream: MediaStream,
): Promise<WavCaptureHandle> {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const inputRate = audioContext.sampleRate;
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];

  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  const mergedSamples = (): Float32Array => {
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    return downsampleBuffer(merged, inputRate);
  };

  return {
    getFullWavBlob() {
      const samples = mergedSamples();
      return encodeWav(samples, TARGET_SAMPLE_RATE);
    },
    getWavBlobSince(fromSampleIndex: number) {
      const samples = mergedSamples();
      const start = Math.min(fromSampleIndex, samples.length);
      const slice = samples.subarray(start);
      return {
        blob: encodeWav(slice, TARGET_SAMPLE_RATE),
        toSampleIndex: samples.length,
        rms: pcmRms(slice),
      };
    },
    sampleCount() {
      return mergedSamples().length;
    },
    stop() {
      processor.disconnect();
      source.disconnect();
      void audioContext.close();
    },
  };
}

/** Minimum WAV payload size (~1s at 16 kHz mono) before sending to STT. */
export const MIN_LIVE_WAV_BYTES = 32_000;

/** Skip near-silent chunks so the model does not return "no audio" refusals. */
export const MIN_LIVE_RMS = 0.008;
