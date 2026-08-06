// Machine Learning laboratory rules (Phase 4 / Section 6). Presentation
// helpers that keep confidence, thresholds and balance warnings accessible
// and non-colour-only, plus the guardrail that blocks fully-automatic
// high-stakes actions in Guided/Explorer mode.
export const ML_LAB_TYPES = new Set([
  'classifier-trainer', 'threshold-explorer', 'data-balance',
  'forecast-trainer', 'prediction-comparator', 'warning-rule-builder'
]);

// Confidence is always shown as a number plus a non-colour shape/pattern cue.
export function confidenceIndicator(confidence) {
  if (confidence >= 0.75) return { band: 'high', shape: '▲', pattern: 'solid', text: `${Math.round(confidence * 100)}% confident` };
  if (confidence >= 0.5) return { band: 'medium', shape: '◆', pattern: 'striped', text: `${Math.round(confidence * 100)}% confident` };
  return { band: 'low', shape: '●', pattern: 'dotted', text: `${Math.round(confidence * 100)}% confident — uncertain` };
}

export function balanceWarning(seal, puffin, targetRatioMax) {
  const ratio = Math.max(seal, puffin) / Math.max(1, Math.min(seal, puffin));
  if (ratio <= targetRatioMax) {
    return `The training set is balanced (${seal} seal, ${puffin} puffin examples).`;
  }
  const short = seal > puffin ? 'puffin' : 'seal';
  return `The training set is unbalanced: it has far more examples of one animal than the other. Add more ${short} examples to even it out.`;
}

// Guided/Explorer must never allow a fully-automatic high-stakes action, e.g.
// an unconfirmed harbour warning. Creator mode may allow more freedom but
// still must not skip this.
export function highStakesActionAllowed(labType, mode, workingData, labConfig) {
  if (labType === 'warning-rule-builder') {
    const hasLockedBlock = workingData.chain.includes(labConfig.lockedBlock);
    // Even in Creator mode, an approved chain without the confirmation block
    // is never allowed to be treated as "complete."
    return hasLockedBlock;
  }
  return true;
}
