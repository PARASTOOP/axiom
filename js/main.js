import { loadContent } from './contentLoader.js';
import { App } from './app.js';

try {
  loadContent(); // throws if any deck/mission/location fails validation
  App.init();
} catch (err) {
  console.error(err);
  document.getElementById('app').innerHTML = `
    <div class="panel">
      <h1>AXIOM-7 could not start</h1>
      <p>The local content failed validation, so nothing was loaded. This protects your saved progress from corrupted data.</p>
      <pre style="white-space:pre-wrap">${String(err.message || err).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</pre>
    </div>`;
}
