// Server-side mirror of the bits of src/lib/gameConfig.js the API needs.
// Keep the multipliers here and in src/lib/gameConfig.js in sync.

const DURATION_MULTIPLIERS = {
  1:  1.0,
  3:  1.3,
  7:  1.6,
  14: 2.0,
  30: 3.0,
};

const PROOF_MULTIPLIERS = {
  photo:    1.0,
  video:    1.35,
  steps_km: 1.5,
  any:      0.8,
};

export function calculateReward(stakeAmount, durationDays, proofType = 'any') {
  const durMult = DURATION_MULTIPLIERS[durationDays] ?? 1.0;
  const proofMult = PROOF_MULTIPLIERS[proofType] ?? 0.8;
  return Math.floor(Number(stakeAmount || 0) * durMult * proofMult);
}

export function getXpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
