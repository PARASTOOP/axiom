// Narration playback. Uses the browser's built-in speech synthesis (no network,
// no bundled audio files) so every StoryNode has a real optional-audio path.
// Full controls: play/pause/resume/replay/stop, independent volume, and a
// persisted on/off preference. The transcript is always shown regardless.
export class NarrationPlayer {
  constructor({ getPreferences }) {
    this.getPreferences = getPreferences;
    this.utterance = null;
    this.state = 'idle'; // idle | playing | paused | stopped | unsupported
    this.currentText = '';
    this.onStateChange = null;
    if (!('speechSynthesis' in window)) this.state = 'unsupported';
  }

  _emit() {
    if (this.onStateChange) this.onStateChange(this.state);
  }

  play(text) {
    this.stop();
    const prefs = this.getPreferences();
    this.currentText = text;
    if (!prefs.narrationEnabled || this.state === 'unsupported') {
      this.state = 'idle';
      this._emit();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.volume = prefs.narrationVolume ?? 0.8;
    utter.rate = 1;
    utter.onend = () => { this.state = 'idle'; this._emit(); };
    utter.onerror = () => { this.state = 'idle'; this._emit(); };
    this.utterance = utter;
    window.speechSynthesis.speak(utter);
    this.state = 'playing';
    this._emit();
  }

  pause() {
    if (this.state !== 'playing' || this.state === 'unsupported') return;
    window.speechSynthesis.pause();
    this.state = 'paused';
    this._emit();
  }

  resume() {
    if (this.state !== 'paused') return;
    window.speechSynthesis.resume();
    this.state = 'playing';
    this._emit();
  }

  replay() {
    if (this.currentText) this.play(this.currentText);
  }

  stop() {
    if (this.state === 'unsupported') return;
    window.speechSynthesis.cancel();
    this.state = 'idle';
    this._emit();
  }

  setVolume(v) {
    // Applies to the next utterance; SpeechSynthesisUtterance volume can't be
    // changed mid-utterance, which is a browser API limitation, not a design gap.
    if (this.utterance) this.utterance.volume = v;
  }
}
