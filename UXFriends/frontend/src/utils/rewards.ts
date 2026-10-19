export interface RewardProgressSnapshot {
  level: number;
  totalXP: number;
  currentXP: number;
  nextLevelXP: number;
}

export function calculateNextLevelXp(level: number) {
  return 1000 + Math.max(level - 1, 0) * 250;
}

export function buildRewardSnapshot(source?: {
  level?: number;
  totalXP?: number;
  currentXP?: number;
  nextLevelXP?: number;
} | null): RewardProgressSnapshot {
  return {
    level: Math.max(1, Number(source?.level ?? 1)),
    totalXP: Math.max(0, Number(source?.totalXP ?? 0)),
    currentXP: Math.max(0, Number(source?.currentXP ?? 0)),
    nextLevelXP: Math.max(1, Number(source?.nextLevelXP ?? 1000)),
  };
}

export function rewindRewardSnapshot(
  snapshot: RewardProgressSnapshot,
  xpAmount: number,
): RewardProgressSnapshot {
  let remaining = Math.max(0, xpAmount);
  let level = snapshot.level;
  let currentXP = snapshot.currentXP;
  let nextLevelXP = snapshot.nextLevelXP;
  const totalXP = Math.max(0, snapshot.totalXP - remaining);

  while (remaining > 0) {
    if (currentXP >= remaining) {
      currentXP -= remaining;
      remaining = 0;
      break;
    }

    remaining -= currentXP;
    level = Math.max(1, level - 1);
    nextLevelXP = calculateNextLevelXp(level);
    currentXP = nextLevelXP;
  }

  return {
    level,
    totalXP,
    currentXP,
    nextLevelXP,
  };
}
