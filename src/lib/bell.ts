export class BellPlayer {
  private audioContext: AudioContext | null = null;
  private unlocked = false;
  private bellBuffer: AudioBuffer | null = null;

  async ensureContext(): Promise<AudioContext> {
    if (this.audioContext) return this.audioContext;
    if (typeof window === "undefined") {
      throw new Error("AudioContext is not available on the server");
    }
    const win = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctor = win.AudioContext ?? win.webkitAudioContext;
    if (!Ctor) {
      throw new Error("Web Audio API is not supported in this environment");
    }
    this.audioContext = new Ctor();
    return this.audioContext;
  }

  async unlock() {
    if (this.unlocked) return;
    const ctx = await this.ensureContext();
    // Create and immediately stop a silent buffer to unlock on iOS
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    source.stop(0);
    this.unlocked = true;
  }

  async loadBellSound(): Promise<AudioBuffer> {
    if (this.bellBuffer) return this.bellBuffer;
    
    const ctx = await this.ensureContext();
    try {
      const response = await fetch('/schoolbellsound.mp3');
      const arrayBuffer = await response.arrayBuffer();
      this.bellBuffer = await ctx.decodeAudioData(arrayBuffer);
      return this.bellBuffer;
    } catch (error) {
      console.error('Failed to load bell sound:', error);
      throw error;
    }
  }

  async playBellSound() {
    try {
      const ctx = await this.ensureContext();
      const buffer = await this.loadBellSound();
      
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = 0.7; // Adjust volume as needed
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Skip initial silence at the beginning of the file
      const TRIM_LEAD_SILENCE_SEC = 0.9;
      const offset = Math.min(TRIM_LEAD_SILENCE_SEC, Math.max(0, buffer.duration - 0.01));
      source.start(0, offset);
    } catch (error) {
      console.error('Failed to play bell sound:', error);
      // Fallback to generated sound
      this.playChime();
    }
  }

  async playChime(durationMs = 2000) {
    const ctx = await this.ensureContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    // Two-tone school-bell-like chime
    const freqs = [880, 660];
    const partDuration = durationMs / freqs.length / 1000;

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      // simple strike-decay envelope
      const start = now + i * partDuration;
      const end = start + partDuration;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(1.0, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(start);
      osc.stop(end + 0.01);
    });
  }

  // Traditional school bell sound - warm, clear, not harsh
  private scheduleBellTone(
    ctx: AudioContext,
    startTime: number,
    durationSec: number,
    output: GainNode
  ) {
    // Main bell tone - warm fundamental
    const fundamental = ctx.createOscillator();
    fundamental.type = "sine";
    fundamental.frequency.value = 440; // A4 - pleasant, not too high

    // Second harmonic for richness
    const harmonic2 = ctx.createOscillator();
    harmonic2.type = "sine";
    harmonic2.frequency.value = 880; // octave

    // Third harmonic for bell character
    const harmonic3 = ctx.createOscillator();
    harmonic3.type = "sine";
    harmonic3.frequency.value = 1320; // perfect fifth above octave

    // Gentle filtering to soften the sound
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2000;
    lowpass.Q.value = 0.7;

    // Individual gains for each harmonic
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();
    
    gain1.gain.value = 0.6; // fundamental strongest
    gain2.gain.value = 0.3; // second harmonic medium
    gain3.gain.value = 0.1; // third harmonic subtle

    // Natural bell envelope - quick attack, gentle decay
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(1.0, startTime + 0.02); // quick strike
    envelope.gain.exponentialRampToValueAtTime(0.3, startTime + 0.2); // quick initial decay
    envelope.gain.exponentialRampToValueAtTime(0.05, startTime + durationSec * 0.7); // slow fade
    envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    // Connect everything
    fundamental.connect(gain1);
    harmonic2.connect(gain2);
    harmonic3.connect(gain3);
    
    gain1.connect(lowpass);
    gain2.connect(lowpass);
    gain3.connect(lowpass);
    
    lowpass.connect(envelope);
    envelope.connect(output);

    // Start and stop all oscillators
    fundamental.start(startTime);
    harmonic2.start(startTime);
    harmonic3.start(startTime);
    
    fundamental.stop(startTime + durationSec + 0.02);
    harmonic2.stop(startTime + durationSec + 0.02);
    harmonic3.stop(startTime + durationSec + 0.02);
  }

  // Plays a 30s pattern: 5s ring, 5s silence, repeated
  async playBellPattern(totalMs = 30000, onMs = 5000, offMs = 5000): Promise<void> {
    const ctx = await this.ensureContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);

    const start = ctx.currentTime;
    let cursor = start;
    const totalSec = totalMs / 1000;
    const onSec = onMs / 1000;
    const offSec = offMs / 1000;

    while (cursor - start < totalSec - 1e-3) {
      const remaining = totalSec - (cursor - start);
      const segment = Math.min(onSec, remaining);
      this.scheduleBellTone(ctx, cursor, segment, masterGain);
      cursor += segment + offSec;
    }

    // Return when finished
    const finishAt = start + totalSec;
    await new Promise<void>((resolve) => {
      const id = setInterval(() => {
        if (ctx.currentTime >= finishAt) {
          clearInterval(id);
          resolve();
        }
      }, 100);
    });
  }
}

export const bellPlayer = new BellPlayer();


