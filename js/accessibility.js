// Accessibility (Phase 6 / Section 11). Applies persisted preferences to the
// document so every screen respects narration-off, reduced-motion,
// high-contrast and text scaling without any screen needing to know how.
import { store } from './store.js';

export const Preferences = {
  get() {
    return store.get().preferences;
  },
  set(patch) {
    store.update(state => {
      Object.assign(state.preferences, patch);
    });
    applyToDocument(store.get().preferences);
  },
  init() {
    applyToDocument(store.get().preferences);
  }
};

function applyToDocument(prefs) {
  const root = document.documentElement;
  root.classList.toggle('reduced-motion', !!prefs.reducedMotion);
  root.classList.toggle('high-contrast', !!prefs.highContrast);
  root.classList.toggle('narration-off', !prefs.narrationEnabled);
  root.style.setProperty('--text-scale', `${prefs.textScale || 100}%`);
}

// Focus-order helper: call after rendering a screen so keyboard users land
// on the first meaningful control instead of the top of the page.
export function focusFirstControl(container) {
  if (!container) return;
  const target = container.querySelector('[data-autofocus]') || container.querySelector('button, [href], input, select, textarea, [tabindex]');
  if (target) target.focus();
}
