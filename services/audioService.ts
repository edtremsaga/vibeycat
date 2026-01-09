// Audio Service for Vibey Cat vs Eagley
// Uses Web Audio API for sound effects and HTML5 Audio for background music

class AudioService {
  private audioContext: AudioContext | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffectsEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;

  constructor() {
    // Initialize audio context on user interaction
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  // Ensure audio context is resumed (required for autoplay policies)
  private async ensureAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Generate sound effects using Web Audio API
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.soundEffectsEnabled || !this.audioContext) return;

    this.ensureAudioContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Sound Effects
  playPowerUpCollect() {
    // Upward sweep sound
    this.playTone(400, 0.2, 'sine', 0.4);
    setTimeout(() => this.playTone(600, 0.15, 'sine', 0.3), 50);
  }

  playLightning() {
    // Thunder-like sound
    this.playTone(100, 0.1, 'sawtooth', 0.6);
    setTimeout(() => this.playTone(150, 0.15, 'sawtooth', 0.5), 50);
    setTimeout(() => this.playTone(200, 0.2, 'sawtooth', 0.4), 100);
  }

  playCatch() {
    // Success sound - ascending notes
    this.playTone(523.25, 0.15, 'sine', 0.5); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.5), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.2, 'sine', 0.5), 200); // G5
  }

  playEagleCatch() {
    // Failure sound - descending notes
    this.playTone(440, 0.2, 'sine', 0.5); // A4
    setTimeout(() => this.playTone(349.23, 0.2, 'sine', 0.5), 150); // F4
    setTimeout(() => this.playTone(261.63, 0.3, 'sine', 0.5), 300); // C4
  }

  playExplosion() {
    // Low rumble
    this.playTone(80, 0.3, 'sawtooth', 0.6);
    setTimeout(() => this.playTone(60, 0.2, 'sawtooth', 0.5), 100);
  }

  playCombo(comboCount: number) {
    // Higher pitch for higher combos
    const baseFreq = 400 + (comboCount * 50);
    this.playTone(baseFreq, 0.2, 'sine', 0.6);
    setTimeout(() => this.playTone(baseFreq + 100, 0.15, 'sine', 0.5), 100);
  }

  playLevelUp() {
    // Fanfare
    this.playTone(523.25, 0.2, 'sine', 0.6); // C5
    setTimeout(() => this.playTone(659.25, 0.2, 'sine', 0.6), 150); // E5
    setTimeout(() => this.playTone(783.99, 0.2, 'sine', 0.6), 300); // G5
    setTimeout(() => this.playTone(1046.50, 0.3, 'sine', 0.7), 450); // C6
  }

  playVictory() {
    // Victory fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.7), i * 150);
    });
  }

  playDefeat() {
    // Sad descending notes
    this.playTone(440, 0.3, 'sine', 0.5);
    setTimeout(() => this.playTone(349.23, 0.3, 'sine', 0.5), 200);
    setTimeout(() => this.playTone(261.63, 0.4, 'sine', 0.5), 400);
  }

  playPlutoScared() {
    // Quick high-pitched sound
    this.playTone(800, 0.1, 'sine', 0.3);
  }

  playEagleBoost() {
    // Whoosh sound
    this.playTone(200, 0.15, 'sawtooth', 0.4);
    setTimeout(() => this.playTone(300, 0.1, 'sawtooth', 0.3), 50);
  }

  // Background Music (using simple tone generation for now)
  // In production, you'd load actual music files
  startBackgroundMusic(dayCycle: 'day' | 'dusk' | 'night') {
    if (!this.musicEnabled) return;

    // For now, we'll use a simple ambient tone
    // In production, replace with actual music files
    this.stopBackgroundMusic();

    // Create ambient background tone based on time of day
    if (this.audioContext) {
      this.ensureAudioContext();
      // This is a placeholder - in production, load actual music files
      // const musicFile = dayCycle === 'night' ? '/sounds/night-theme.mp3' : '/sounds/day-theme.mp3';
      // this.backgroundMusic = new Audio(musicFile);
      // this.backgroundMusic.loop = true;
      // this.backgroundMusic.volume = this.musicVolume;
      // this.backgroundMusic.play().catch(e => console.warn('Music autoplay prevented:', e));
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }
  }

  updateMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
  }

  updateSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startBackgroundMusic('day');
    } else {
      this.stopBackgroundMusic();
    }
  }

  toggleSFX() {
    this.soundEffectsEnabled = !this.soundEffectsEnabled;
  }

  getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  getSFXEnabled(): boolean {
    return this.soundEffectsEnabled;
  }
}

// Export singleton instance
export const audioService = new AudioService();

