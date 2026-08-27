import type { Journey, JourneySoulRule, JourneyType } from "../types/domain";

export interface JourneySectStats {
  sectId: string;
  totalSoul: number;
  journeyCount: number;
}

export interface JourneyStats {
  totalSoul: number;
  journeyCount: number;
  sectStatsById: Record<string, JourneySectStats>;
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampCompletionRatio(completionRatio: number): number {
  return Math.min(Math.max(completionRatio, 0), 1);
}

export function calculateJourneySoulGain(
  durationMinutes: number,
  completionRatio: number,
  journeyType: JourneyType,
  soulRule: JourneySoulRule,
): number {
  const safeDurationMinutes = Math.max(durationMinutes, 0);
  const safeCompletionRatio = clampCompletionRatio(completionRatio);
  const typeMultiplier = Math.max(
    soulRule.journeyTypeMultipliers[journeyType] ?? 1,
    0,
  );
  const completionMultiplier = soulRule.completionRatioEnabled
    ? safeCompletionRatio
    : 1;
  const rawSoulGain =
    (safeDurationMinutes / 60) *
    Math.max(soulRule.soulPerHour, 0) *
    typeMultiplier *
    completionMultiplier;
  const minimumSoulGain = Math.max(soulRule.minimumSoulGain, 0);
  const maximumSoulGain = soulRule.maximumSoulGain;
  const cappedSoulGain =
    maximumSoulGain === undefined
      ? rawSoulGain
      : Math.min(rawSoulGain, Math.max(maximumSoulGain, minimumSoulGain));

  return roundToTwo(Math.max(cappedSoulGain, minimumSoulGain));
}

export function calculateJourneyStats(journeys: Journey[]): JourneyStats {
  return journeys.reduce<JourneyStats>(
    (stats, journey) => {
      const totalSoul = roundToTwo(stats.totalSoul + journey.soulGain);
      const nextStats: JourneyStats = {
        totalSoul,
        journeyCount: stats.journeyCount + 1,
        sectStatsById: stats.sectStatsById,
      };

      if (!journey.sectId) {
        return nextStats;
      }

      const currentSectStats = stats.sectStatsById[journey.sectId] ?? {
        sectId: journey.sectId,
        totalSoul: 0,
        journeyCount: 0,
      };

      return {
        ...nextStats,
        sectStatsById: {
          ...stats.sectStatsById,
          [journey.sectId]: {
            sectId: journey.sectId,
            totalSoul: roundToTwo(currentSectStats.totalSoul + journey.soulGain),
            journeyCount: currentSectStats.journeyCount + 1,
          },
        },
      };
    },
    {
      totalSoul: 0,
      journeyCount: 0,
      sectStatsById: {},
    },
  );
}
