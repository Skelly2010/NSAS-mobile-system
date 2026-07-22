class AnnouncementSystem {
  constructor(audioBasePath = './audio/') {
    this.audioBasePath = audioBasePath;
    this.isRunning = false;
  }

  playSound(soundName) {
    return new Promise((resolve) => {
      // Build the direct file path without encoding brackets
      const audioPath = `${this.audioBasePath}${soundName}.wav`;
      const audio = new Audio(audioPath);
      
      audio.onended = () => resolve();

      audio.onerror = (err) => {
        console.warn(`[NSAS] Sound missing or failed to load: ${soundName} at path ${audioPath}`, err);
        resolve(); // Continue sequence even if missing
      };

      audio.play().catch(err => {
        console.warn(`[NSAS] Playback blocked or failed for: ${soundName}`, err);
        resolve();
      });
    });
  }

  async playSoundSequence(sounds, delayOffset = 100) {
    for (const sound of sounds) {
      await this.playSound(sound);
      await new Promise(res => setTimeout(res, delayOffset));
    }
  }

  async internalAnnounce(soundTable) {
    if (this.isRunning) return;
    this.isRunning = true;

    await this.playSoundSequence(soundTable);

    this.isRunning = false;
  }
}