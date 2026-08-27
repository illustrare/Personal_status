import type { JourneySoulRule } from "../types/domain";

const DEFAULT_UPDATED_AT = "2026-08-24T00:00:00.000Z";

export const defaultJourneySoulRule: JourneySoulRule = {
  soulPerHour: 60,
  completionRatioEnabled: true,
  minimumSoulGain: 0,
  maximumSoulGain: undefined,
  journeyTypeMultipliers: {
    reading: 1,
    movie: 1,
    anime: 1,
    game: 1,
    music: 1,
    exhibition: 1,
    theater: 1,
    custom: 1,
    other: 1,
  },
  updatedAt: DEFAULT_UPDATED_AT,
};
