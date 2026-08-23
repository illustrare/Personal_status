import type { Journey } from "../types/domain";

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

const JOURNEY_SOUL_PER_HOUR = 60;

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampCompletionRatio(completionRatio: number): number {
  return Math.min(Math.max(completionRatio, 0), 1);
}

export function calculateJourneySoulGain(
  durationMinutes: number,
  completionRatio: number,
): number {
  const safeDurationMinutes = Math.max(durationMinutes, 0);
  const safeCompletionRatio = clampCompletionRatio(completionRatio);

  return roundToTwo(
    (safeDurationMinutes / 60) * JOURNEY_SOUL_PER_HOUR * safeCompletionRatio,
  );
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
