import type { Technique, TechniquePracticeDefaults } from '../types/domain';
import {
  generatePracticeQuantityDraft,
  MATH_ANALYSIS_PRACTICE_BASELINE,
} from '../utils/practiceDraft';
import { defaultTechniques } from './defaultTechniques';

const DEFAULT_CREATED_AT = '2026-08-04T00:00:00.000Z';
const DEFAULT_TEST_BASE_EXPERIENCE = 30;
const DEFAULT_REVIEW_INTERVALS_DAYS = [2, 7, 21, 60, 180, 365];

function createMathTechniquePracticeDefaults(
  technique: Technique,
): TechniquePracticeDefaults {
  const quantityDraft = generatePracticeQuantityDraft(
    technique,
    MATH_ANALYSIS_PRACTICE_BASELINE,
  );

  return {
    techniqueId: technique.id,
    recordTypeDefaults: {
      exercise: {
        requirementRatio: 0.7,
        manaWeight: technique.manaWeight,
        insightWeight: technique.insightWeight,
      },
      note: {
        requirementRatio: 0.2,
        manaWeight: 0.2,
        insightWeight: 0.8,
      },
      thinking: {
        requirementRatio: 0.2,
        manaWeight: 0.3,
        insightWeight: 0.7,
      },
      test: {
        requirementRatio: 0,
        baseExperiencePerUnit:
          DEFAULT_TEST_BASE_EXPERIENCE * technique.courseValueCoefficient,
        manaWeight: technique.manaWeight,
        insightWeight: technique.insightWeight,
      },
      review: {
        requirementRatio: 0.1,
        manaWeight: 0.5,
        insightWeight: 0.5,
      },
    },
    ...quantityDraft,
    reviewSchedule: {
      intervalsDays: [...DEFAULT_REVIEW_INTERVALS_DAYS],
      graceRatio: 0.2,
    },
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  };
}

export const defaultTechniquePracticeDefaults: TechniquePracticeDefaults[] =
  defaultTechniques
    .filter((technique) => technique.sectId === 'math')
    .map(createMathTechniquePracticeDefaults);

export function findTechniquePracticeDefaults(
  techniqueId: string,
): TechniquePracticeDefaults | undefined {
  return defaultTechniquePracticeDefaults.find(
    (defaults) => defaults.techniqueId === techniqueId,
  );
}
