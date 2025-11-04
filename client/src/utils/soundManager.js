import { soundConfig, soundVolumes } from './soundConfig.js';

// Simple sound manager for game events
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.config = soundConfig;
    this.volumes = soundVolumes;
    this.audioInstances = new Map(); // Store audio instances for long sounds
    this.initAudio();
  }

  initAudio() {
    try {
      // Use Web Audio API for better control
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported, sounds disabled');
      this.enabled = false;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Generate simple tones using Web Audio API
  playTone(frequency, duration = 200, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (e) {
      console.warn('Could not play sound:', e);
    }
  }

  // Play audio file if provided
  async playSound(url, volume = 0.5, loop = false) {
    if (!this.enabled) return;

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Stop any existing instance of this sound if it's a looping sound
      if (loop && this.audioInstances.has(url)) {
        const existing = this.audioInstances.get(url);
        existing.pause();
        existing.currentTime = 0;
      }

      const audio = new Audio(url);
      audio.volume = volume;
      audio.loop = loop;
      
      // Preload and handle errors more explicitly
      audio.preload = 'auto';
      
      // Store for looping sounds
      if (loop) {
        this.audioInstances.set(url, audio);
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`Playing sound: ${url}${loop ? ' (looping)' : ''}`);
          })
          .catch(e => {
            console.error(`Could not play sound file ${url}:`, e.message);
            console.error('Full error:', e);
            // If autoplay fails, try to play on next user interaction
          });
      }
      
      // Clean up non-looping sounds
      if (!loop) {
        audio.addEventListener('ended', () => {
          audio.remove();
        }, { once: true });
      }
    } catch (e) {
      console.error('Could not create/play sound file:', e);
    }
  }

  // Play sound using config: checks for external file first, falls back to tone
  playSoundOrTone(soundKey, toneFn) {
    const url = this.config[soundKey];
    if (url) {
      // Use external sound file
      console.log(`Attempting to play ${soundKey} from: ${url}`);
      this.playSound(url, this.volumes[soundKey] || 0.5);
    } else {
      // Use default generated tone
      toneFn();
    }
  }

  // Predefined game sounds - uses external files if configured, otherwise tones
  playGameStart() {
    this.playSoundOrTone('gameStart', () => {
      this.playTone(440, 150, 'sine', 0.3);
      setTimeout(() => this.playTone(554, 150, 'sine', 0.3), 100);
      setTimeout(() => this.playTone(659, 250, 'sine', 0.3), 200);
    });
  }

  playRoleReveal() {
    this.playSoundOrTone('roleReveal', () => {
      this.playTone(523, 300, 'sine', 0.25);
    });
  }

  playVoteSubmit() {
    this.playSoundOrTone('voteSubmit', () => {
      this.playTone(800, 100, 'sine', 0.2);
    });
  }

  playVoteCount() {
    this.playSoundOrTone('voteCount', () => {
      this.playTone(600, 150, 'sine', 0.25);
    });
  }

  playRoundEnd() {
    this.playSoundOrTone('roundEnd', () => {
      this.playTone(659, 200, 'sine', 0.3);
      setTimeout(() => this.playTone(523, 300, 'sine', 0.3), 150);
    });
  }

  playError() {
    this.playSoundOrTone('error', () => {
      this.playTone(200, 300, 'sawtooth', 0.3);
    });
  }

  playButtonClick() {
    this.playSoundOrTone('buttonClick', () => {
      this.playTone(600, 50, 'sine', 0.15);
    });
  }

  playJoin() {
    this.playSoundOrTone('join', () => {
      this.playTone(523, 150, 'sine', 0.2);
    });
  }

  playLeave() {
    this.playSoundOrTone('leave', () => {
      this.playTone(400, 200, 'sine', 0.25);
    });
  }

  playMenu() {
    console.log('playMenu called, config menu:', this.config.menu);
    const url = this.config.menu;
    if (url) {
      // For menu music, play with loop enabled (background music)
      console.log(`Attempting to play menu music from: ${url}`);
      this.playSound(url, this.volumes.menu || 0.5, true); // Loop = true for background music
    } else {
      // Default: pleasant welcome tone
      console.log('Playing default menu tone (no custom file configured)');
      this.playTone(523, 200, 'sine', 0.3);
      setTimeout(() => this.playTone(659, 200, 'sine', 0.3), 150);
    }
  }
  
  stopMenu() {
    const url = this.config.menu;
    if (url && this.audioInstances.has(url)) {
      const audio = this.audioInstances.get(url);
      audio.pause();
      audio.currentTime = 0;
      console.log('Menu music stopped');
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

