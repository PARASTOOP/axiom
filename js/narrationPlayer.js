// Narration playback. Uses the browser's built-in speech synthesis (no network,
// no bundled audio files) so every StoryNode has a real optional-audio path.
// Full controls: play/pause/resume/replay/stop, independent volume, and a
// persisted on/off preference. The transcript is always shown regardless.
export class NarrationPlayer {
  constructor({ getPreferences }) {
    this.getPreferences = getPreferences;
    this.utterance = null;
    // Capability is fixed at construction and never overwritten by playback
    // state — 'state' below only ever cycles through idle/playing/paused.
    this.supported = 'speechSynthesis' in window;
    this.state = 'idle'; // idle | playing | paused
    this.currentText = '';
    this.onStateChange = null;
  }

  _emit() {
    if (this.onStateChange) this.onStateChange(this.state);
  }

  play(text) {
    this.stop();
    const prefs = this.getPreferences();
    this.currentText = text;
    if (!this.supported || !prefs.narrationEnabled) {
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
    if (!this.supported || this.state !== 'playing') return;
    window.speechSynthesis.pause();
    this.state = 'paused';
    this._emit();
  }

  resume() {
    if (!this.supported || this.state !== 'paused') return;
    window.speechSynthesis.resume();
    this.state = 'playing';
    this._emit();
  }

  replay() {
    if (this.currentText) this.play(this.currentText);
  }

  stop() {
    if (!this.supported) {
      this.state = 'idle';
      return;
    }
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
