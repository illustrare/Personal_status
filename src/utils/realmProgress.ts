import type { Breakthrough, RealmRule } from "../types/domain";
import type { ProfilePracticeStats } from "./practiceStats";

export type RealmProgressStatus =
  | "training"
  | "breakthrough_blocked"
  | "maxed";

export interface RealmProgressGap {
  totalCultivationGap: number;
  manaGap: number;
  insightGap: number;
}

export interface RealmProgress {
  currentRealm: RealmRule;
  nextRealm?: RealmRule;
  status: RealmProgressStatus;
  totalCultivation: number;
  gap?: RealmProgressGap;
  blockingBreakthrough?: Breakthrough;
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getTotalCultivation(profileStats: ProfilePracticeStats): number {
  return profileStats.totalMana + profileStats.totalInsight;
}

function getRealmGap(
  profileStats: ProfilePracticeStats,
  realmRule: RealmRule,
): RealmProgressGap {
  const totalCultivation = getTotalCultivation(profileStats);

  return {
    totalCultivationGap: roundToTwo(
      Math.max(realmRule.requiredTotalCultivation - totalCultivation, 0),
    ),
    manaGap: roundToTwo(Math.max(realmRule.requiredMana - profileStats.totalMana, 0)),
    insightGap: roundToTwo(
      Math.max(realmRule.requiredInsight - profileStats.totalInsight, 0),
    ),
  };
}

function hasReachedRealmNumbers(
  profileStats: ProfilePracticeStats,
  realmRule: RealmRule,
): boolean {
  const gap = getRealmGap(profileStats, realmRule);

  return (
    gap.totalCultivationGap === 0 &&
    gap.manaGap === 0 &&
    gap.insightGap === 0
  );
}

function getCompletedBreakthrough(
  breakthroughs: Breakthrough[],
  targetRealmLevel: number,
): Breakthrough | undefined {
  return breakthroughs.find(
    (breakthrough) =>
      breakthrough.targetRealmLevel === targetRealmLevel &&
      breakthrough.status === "completed",
  );
}

function getLatestBreakthrough(
  breakthroughs: Breakthrough[],
  targetRealmLevel: number,
): Breakthrough | undefined {
  return breakthroughs
    .filter((breakthrough) => breakthrough.targetRealmLevel === targetRealmLevel)
    .sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
    )[0];
}

export function calculateRealmProgress(
  profileStats: ProfilePracticeStats,
  breakthroughs: Breakthrough[],
  realmRules: RealmRule[],
): RealmProgress {
  const sortedRealmRules = [...realmRules].sort(
    (first, second) => first.level - second.level,
  );
  let currentRealm = sortedRealmRules[0];

  for (const realmRule of sortedRealmRules) {
    if (!hasReachedRealmNumbers(profileStats, realmRule)) {
      break;
    }

    if (
      realmRule.breakthroughRequired &&
      !getCompletedBreakthrough(breakthroughs, realmRule.level)
    ) {
      break;
    }

    currentRealm = realmRule;
  }

  const nextRealm = sortedRealmRules.find(
    (realmRule) => realmRule.level === currentRealm.level + 1,
  );
  const totalCultivation = roundToTwo(getTotalCultivation(profileStats));

  if (!nextRealm) {
    return {
      currentRealm,
      status: "maxed",
      totalCultivation,
    };
  }

  const gap = getRealmGap(profileStats, nextRealm);
  const reachedNextRealmNumbers = hasReachedRealmNumbers(profileStats, nextRealm);
  const isBreakthroughBlocked =
    reachedNextRealmNumbers &&
    nextRealm.breakthroughRequired &&
    !getCompletedBreakthrough(breakthroughs, nextRealm.level);

  return {
    currentRealm,
    nextRealm,
    status: isBreakthroughBlocked ? "breakthrough_blocked" : "training",
    totalCultivation,
    gap,
    blockingBreakthrough: isBreakthroughBlocked
      ? getLatestBreakthrough(breakthroughs, nextRealm.level)
      : undefined,
  };
}
