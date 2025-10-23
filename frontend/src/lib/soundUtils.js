// Sound utilities for notification sounds

class NotificationSound {
  constructor() {
    this.audio = null;
    this.enabled = true;
    this.loadSettings();
  }

  loadSettings() {
    const settings = localStorage.getItem('notificationSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.enabled = parsed.sound !== false;
    }
  }

  async play(type = 'message') {
    if (!this.enabled) return;

    try {
      // Create audio element with data URL for a simple notification sound
      // Using a simple beep sound encoded as base64
      const audio = new Audio();
      
      // Different frequencies for different notification types
      const frequency = type === 'group' ? 800 : 600;
      const duration = 0.1;
      
      // Create audio context for generating sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      // Cleanup
      setTimeout(() => {
        audioContext.close();
      }, duration * 1000 + 100);
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Singleton instance
const notificationSound = new NotificationSound();

export const playNotificationSound = (type = 'message') => {
  notificationSound.play(type);
};

export const setNotificationSoundEnabled = (enabled) => {
  notificationSound.setEnabled(enabled);
};

export const isNotificationSoundEnabled = () => {
  return notificationSound.isEnabled();
};

export const playMessageSound = () => {
  playNotificationSound('message');
};

export const playGroupMessageSound = () => {
  playNotificationSound('group');
};

export default notificationSound;
