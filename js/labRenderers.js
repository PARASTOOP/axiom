// Per-labType controls: markup + the interaction handler that mutates
// labState.workingData through labEngine.applyAction. Every control is a
// plain button/select/range input so the whole sandbox is keyboard-operable
// and carries no colour-only information (Section 11 / R5).
import { applyAction } from './labEngine.js';
import { confidenceIndicator } from './mlEngine.js';

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function renderLabControls(labState) {
  const { labType, labConfig, workingData } = labState;
  switch (labType) {
    case 'toggle-signal': {
      const { rows, cols } = labConfig;
      let grid = `<div class="pill-toggle-grid" style="grid-template-columns:repeat(${cols},34px)" role="group" aria-label="Signal lamp pattern">`;
      for (let i = 0; i < rows * cols; i++) {
        const on = workingData.pattern[i] === 1;
        grid += `<button class="lamp" aria-pressed="${on}" aria-label="Lamp ${i + 1}, ${on ? 'on' : 'off'}" data-action="lab-toggle-lamp" data-arg="${i}">${on ? '●' : '○'}</button>`;
      }
      grid += '</div>';
      return grid;
    }
    case 'sequence-route': {
      const dirButtons = ['up', 'down', 'left', 'right'].map(d =>
        `<button data-action="lab-add-move" data-arg="${d}">${d}</button>`).join('');
      const blocksList = workingData.blocks.map((b, i) =>
        `<li>${b.type === 'repeat' ? `repeat ${b.action} ×${b.times}` : b.type} <button data-action="lab-remove-block" data-arg="${i}" aria-label="Remove step ${i + 1}">✕</button></li>`).join('') || '<li><em>No steps yet.</em></li>';
      return `
        <div class="row">${dirButtons}
          <select id="repeat-action" aria-label="Repeat direction"><option value="up">up</option><option value="down">down</option><option value="left">left</option><option value="right">right</option></select>
          <input id="repeat-times" type="number" min="1" max="20" value="2" style="width:60px" aria-label="Repeat count" />
          <button data-action="lab-add-repeat">add repeat block</button>
        </div>
        <p>Blocks used: ${workingData.blocks.length} / ${labConfig.maxBlocks}</p>
        <ol>${blocksList}</ol>`;
    }
    case 'observation-pattern': {
      const cardButtons = labConfig.searchCards.map(c =>
        `<button data-action="lab-add-card" data-arg="${esc(c)}">${esc(c)}</button>`).join('');
      const ordered = workingData.orderedCards.map(c => `<li>${esc(c)}</li>`).join('');
      return `
        <div class="row">${cardButtons}</div>
        <p>Pattern so far:</p>
        <ol>${ordered}${workingData.humanDecisionAdded ? '<li><strong>Human Decision</strong></li>' : ''}</ol>
        <button data-action="lab-add-human-decision" ${workingData.humanDecisionAdded ? 'disabled' : ''}>add Human Decision (must be last)</button>`;
    }
    case 'classifier-trainer': {
      const trainRows = labConfig.trainingCards.map(c => {
        const used = workingData.trainedOn.includes(c.id);
        return `<li><label><input type="checkbox" data-action="lab-toggle-train" data-arg="${c.id}" ${used ? 'checked' : ''}/> ${esc(c.desc)} <span class="badge">${c.label}</span></label></li>`;
      }).join('');
      const testRows = labConfig.testCards.map(c => {
        const pred = workingData.predictions[c.id];
        const ci = pred ? confidenceIndicator(pred.confidence) : null;
        return `<li>${esc(c.desc)} (actually: ${c.label}) ${pred ? `→ guessed <strong>${pred.predictedLabel}</strong> <span class="confidence-chip">${ci.shape} ${ci.text}</span>` : ''}</li>`;
      }).join('');
      return `<p><strong>Training examples</strong> (check to include):</p><ul>${trainRows}</ul>
        <p><strong>Test photos</strong> (run to see guesses):</p><ul>${testRows}</ul>`;
    }
    case 'threshold-explorer': {
      const rows = labConfig.observations.map(o => {
        const decision = o.confidence >= workingData.threshold ? 'auto-accept' : 'send-to-human';
        const ci = confidenceIndicator(o.confidence);
        return `<li>${esc(o.label)} ${ci.shape} ${ci.text} → <strong>${decision}</strong></li>`;
      }).join('');
      return `
        <label for="threshold-range">Confidence threshold: ${Math.round(workingData.threshold * 100)}%</label>
        <input id="threshold-range" type="range" min="0" max="1" step="0.01" value="${workingData.threshold}" data-action="lab-set-threshold" aria-valuetext="${Math.round(workingData.threshold * 100)} percent" />
        <ul>${rows}</ul>`;
    }
    case 'data-balance': {
      const seal = labConfig.startingSet.seal + (workingData.added.seal || 0);
      const puffin = labConfig.startingSet.puffin + (workingData.added.puffin || 0);
      return `
        <p>Seal examples: ${seal} &nbsp; ${labConfig.availableToAdd.seal ? `<button data-action="lab-add-balance" data-arg="seal">+ add seal</button>` : ''}</p>
        <p>Puffin examples: ${puffin} &nbsp; ${(labConfig.availableToAdd.puffin || 0) > (workingData.added.puffin || 0) ? `<button data-action="lab-add-balance" data-arg="puffin">+ add puffin</button>` : ''}</p>`;
    }
    case 'forecast-trainer': {
      const outcomes = ['clear', 'rain', 'storm'];
      const rows = labConfig.conditionCards.map(c => `
        <li>wind: ${c.wind}, pressure: ${c.pressure} →
          <select data-action="lab-set-forecast" data-arg="${c.id}">
            <option value="">predict…</option>
            ${outcomes.map(o => `<option value="${o}" ${workingData.predictions[c.id] === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </li>`).join('');
      return `<ul>${rows}</ul>`;
    }
    case 'prediction-comparator': {
      const rows = labConfig.cases.map(c => `
        <li>Forecast: ${c.forecast} (${Math.round(c.forecastConfidence * 100)}%) — Sensor: ${c.sensorReading}
          ${c.conflict ? `<label><input type="checkbox" data-action="lab-toggle-override" data-arg="${c.id}" ${workingData.overrides[c.id] ? 'checked' : ''}/> confirm human override</label>` : '<span class="badge">agree — no override needed</span>'}
        </li>`).join('');
      return `<ul>${rows}</ul>`;
    }
    case 'warning-rule-builder': {
      const chain = workingData.chain.map((b, i) => `<li>${esc(b)}</li>`).join('') || '<li><em>Empty.</em></li>';
      const blockButtons = labConfig.availableBlocks.filter(b => b !== labConfig.lockedBlock).map(b =>
        `<button data-action="lab-add-rule-block" data-arg="${esc(b)}">${esc(b)}</button>`).join('');
      return `
        <div class="row">${blockButtons}</div>
        <p>Chain:</p><ol>${chain}</ol>
        <div class="row">
          <button data-action="lab-add-locked-block" ${workingData.chain.includes(labConfig.lockedBlock) ? 'disabled' : ''}>add Human Confirmation (locked, always last)</button>
          <button data-action="lab-remove-last-block">remove last</button>
        </div>`;
    }
    case 'autonomy-limit': {
      const rows = labConfig.limitTypes.map(l => {
        const cur = workingData.limits[l.id];
        return `<li>
          <label><input type="checkbox" data-action="lab-toggle-limit" data-arg="${l.id}" ${cur.enabled ? 'checked' : ''}/> ${l.label}</label>
          ${cur.enabled ? `<input type="range" min="${l.min}" max="${l.max}" value="${cur.value}" data-action="lab-set-limit-value" data-arg="${l.id}" aria-label="${l.label} value" /> ${cur.value}${l.unit}` : ''}
        </li>`;
      }).join('');
      return `<ul>${rows}</ul><p>Active limits: ${Object.values(workingData.limits).filter(l => l.enabled).length} / ${labConfig.limitTypes.length} (minimum ${labConfig.minimumRequiredLimits})</p>`;
    }
    case 'stop-escalate': {
      const rows = labConfig.conditions.map(c => `
        <li>${esc(c)} →
          <select data-action="lab-set-escalate" data-arg="${esc(c)}">
            <option value="">choose…</option>
            ${labConfig.actions.map(a => `<option value="${a}" ${workingData.mapping[c] === a ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
        </li>`).join('');
      return `<ul>${rows}</ul>`;
    }
    case 'accountability-trace': {
      const options = [...new Set(labConfig.events.map(e => e.decidedBy))].concat(['the system alone']);
      const rows = labConfig.events.map(e => `
        <li>${e.actor} — ${e.action} →
          <select data-action="lab-set-trace" data-arg="${e.id}">
            <option value="">choose…</option>
            ${options.map(o => `<option value="${esc(o)}" ${workingData.matches[e.id] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}
          </select>
        </li>`).join('');
      return `<ul>${rows}</ul>`;
    }
    case 'connection-explorer': {
      const rows = labConfig.candidateLinks.map((link, i) => {
        const key = link.join('~');
        const checked = workingData.activeLinks.some(l => l.join('~') === key);
        const atMax = workingData.activeLinks.length >= labConfig.maxSimultaneousLinks && !checked;
        return `<li><label><input type="checkbox" data-action="lab-toggle-link" data-arg="${i}" ${checked ? 'checked' : ''} ${atMax ? 'disabled' : ''}/> ${link[0]} ↔ ${link[1]}</label></li>`;
      }).join('');
      return `<ul>${rows}</ul><p>${workingData.activeLinks.length} / ${labConfig.maxSimultaneousLinks} connections active</p>`;
    }
    case 'rule-review': {
      const rows = labConfig.existingRules.map(r => {
        const d = workingData.decisions[r.id] || { decision: '', reason: '' };
        return `<li><strong>${esc(r.label)}</strong>
          <select data-action="lab-set-review-decision" data-arg="${r.id}">
            <option value="">choose…</option>
            <option value="kept" ${d.decision === 'kept' ? 'selected' : ''}>keep</option>
            <option value="tightened" ${d.decision === 'tightened' ? 'selected' : ''}>tighten</option>
            <option value="changed" ${d.decision === 'changed' ? 'selected' : ''}>change</option>
          </select>
          <input type="text" placeholder="why?" value="${esc(d.reason)}" data-action="lab-set-review-reason" data-arg="${r.id}" />
        </li>`;
      }).join('');
      return `<ul>${rows}</ul>`;
    }
    case 'standing-guidance': {
      const rows = labConfig.candidatePrinciples.map((p, i) => {
        const checked = workingData.selected.includes(p);
        const atMax = workingData.selected.length >= labConfig.maxSelected && !checked;
        return `<li><label><input type="checkbox" data-action="lab-toggle-principle" data-arg="${i}" ${checked ? 'checked' : ''} ${atMax ? 'disabled' : ''}/> ${esc(p)}</label></li>`;
      }).join('');
      return `<ul>${rows}</ul><p>${workingData.selected.length} / ${labConfig.maxSelected} selected</p>`;
    }
    default:
      return '<p><em>This lab type has no control set.</em></p>';
  }
}

export function handleLabInteraction(labState, action, arg, form) {
  const { labConfig } = labState;
  switch (action) {
    case 'lab-toggle-lamp':
      applyAction(labState, wd => { wd.pattern[Number(arg)] = wd.pattern[Number(arg)] ? 0 : 1; });
      return;
    case 'lab-add-move':
      if (labState.workingData.blocks.length >= labConfig.maxBlocks) return;
      applyAction(labState, wd => wd.blocks.push({ type: arg }));
      return;
    case 'lab-add-repeat': {
      const action_ = form.querySelector('#repeat-action').value;
      const times = Math.max(1, Math.min(20, Number(form.querySelector('#repeat-times').value) || 1));
      if (labState.workingData.blocks.length >= labConfig.maxBlocks) return;
      applyAction(labState, wd => wd.blocks.push({ type: 'repeat', action: action_, times }));
      return;
    }
    case 'lab-remove-block':
      applyAction(labState, wd => wd.blocks.splice(Number(arg), 1));
      return;
    case 'lab-add-card':
      applyAction(labState, wd => { if (!wd.humanDecisionAdded) wd.orderedCards.push(arg); });
      return;
    case 'lab-add-human-decision':
      applyAction(labState, wd => { wd.humanDecisionAdded = true; });
      return;
    case 'lab-toggle-train':
      applyAction(labState, wd => {
        const i = wd.trainedOn.indexOf(arg);
        if (i >= 0) wd.trainedOn.splice(i, 1); else wd.trainedOn.push(arg);
      });
      return;
    case 'lab-set-threshold':
      applyAction(labState, wd => { wd.threshold = Number(form.value); });
      return;
    case 'lab-add-balance':
      applyAction(labState, wd => {
        const max = labConfig.availableToAdd[arg] || 0;
        if ((wd.added[arg] || 0) < max) wd.added[arg] = (wd.added[arg] || 0) + 1;
      });
      return;
    case 'lab-set-forecast':
      applyAction(labState, wd => { wd.predictions[arg] = form.value; });
      return;
    case 'lab-toggle-override':
      applyAction(labState, wd => { wd.overrides[arg] = !wd.overrides[arg]; });
      return;
    case 'lab-add-rule-block':
      if (labState.workingData.chain.includes(labConfig.lockedBlock)) return; // locked block already closes the chain
      applyAction(labState, wd => wd.chain.push(arg));
      return;
    case 'lab-add-locked-block':
      applyAction(labState, wd => { if (!wd.chain.includes(labConfig.lockedBlock)) wd.chain.push(labConfig.lockedBlock); });
      return;
    case 'lab-remove-last-block':
      applyAction(labState, wd => {
        // The Human Confirmation block, once added, can never be removed —
        // in any mode — so a completed chain can never end up unconfirmed.
        if (wd.chain.length && wd.chain[wd.chain.length - 1] === labConfig.lockedBlock) return;
        wd.chain.pop();
      });
      return;
    case 'lab-toggle-limit':
      applyAction(labState, wd => {
        const enabledCount = Object.values(wd.limits).filter(l => l.enabled).length;
        if (wd.limits[arg].enabled && enabledCount <= labConfig.minimumRequiredLimits) return; // can't drop below minimum
        wd.limits[arg].enabled = !wd.limits[arg].enabled;
      });
      return;
    case 'lab-set-limit-value':
      applyAction(labState, wd => { wd.limits[arg].value = Number(form.value); });
      return;
    case 'lab-set-escalate':
      if (arg === 'high uncertainty' && form.value === 'Continue') {
        form.value = labState.workingData.mapping[arg] || '';
        alert('High uncertainty can never map to Continue — the sandbox blocks that combination.');
        return;
      }
      applyAction(labState, wd => { wd.mapping[arg] = form.value; });
      return;
    case 'lab-set-trace':
      applyAction(labState, wd => { wd.matches[arg] = form.value; });
      return;
    case 'lab-toggle-link': {
      const link = labConfig.candidateLinks[Number(arg)];
      applyAction(labState, wd => {
        const key = link.join('~');
        const idx = wd.activeLinks.findIndex(l => l.join('~') === key);
        if (idx >= 0) wd.activeLinks.splice(idx, 1);
        else if (wd.activeLinks.length < labConfig.maxSimultaneousLinks) wd.activeLinks.push(link);
      });
      return;
    }
    case 'lab-set-review-decision':
      applyAction(labState, wd => {
        wd.decisions[arg] = wd.decisions[arg] || { decision: '', reason: '' };
        wd.decisions[arg].decision = form.value;
      });
      return;
    case 'lab-set-review-reason':
      applyAction(labState, wd => {
        wd.decisions[arg] = wd.decisions[arg] || { decision: '', reason: '' };
        wd.decisions[arg].reason = form.value;
      });
      return;
    case 'lab-toggle-principle': {
      const p = labConfig.candidatePrinciples[Number(arg)];
      applyAction(labState, wd => {
        const idx = wd.selected.indexOf(p);
        if (idx >= 0) wd.selected.splice(idx, 1);
        else if (wd.selected.length < labConfig.maxSelected) wd.selected.push(p);
      });
      return;
    }
  }
}
