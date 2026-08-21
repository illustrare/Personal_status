import type { Technique, TechniquePracticeDefaults } from '../types/domain';

export type PracticeQuantityDraft = Pick<
  TechniquePracticeDefaults,
  'requiredExerciseCount' | 'requiredNoteCount' | 'requiredThinkingCount'
>;

export interface PracticeQuantityBaseline {
  exerciseCount: number;
  noteCount: number;
  thinkingCount: number;
  manaWeight: number;
  insightWeight: number;
}

export const MATH_ANALYSIS_PRACTICE_BASELINE: PracticeQuantityBaseline = {
  exerciseCount: 5,
  noteCount: 1,
  thinkingCount: 2,
  manaWeight: 0.55,
  insightWeight: 0.45,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function createDraftCount(value: number, minimum: number, maximum: number): number {
  return clamp(Math.round(value), minimum, maximum);
}

export function generatePracticeQuantityDraft(
  technique: Pick<
    Technique,
    'courseValueCoefficient' | 'manaWeight' | 'insightWeight'
  >,
  baseline: PracticeQuantityBaseline,
): PracticeQuantityDraft {
  const difficultyScale = clamp(
    Math.sqrt(technique.courseValueCoefficient),
    0.8,
    1.25,
  );

  return {
    requiredExerciseCount: createDraftCount(
      baseline.exerciseCount *
        difficultyScale *
        (technique.manaWeight / baseline.manaWeight),
      2,
      10,
    ),
    requiredNoteCount: createDraftCount(
      baseline.noteCount *
        difficultyScale *
        (technique.insightWeight / baseline.insightWeight),
      1,
      3,
    ),
    requiredThinkingCount: createDraftCount(
      baseline.thinkingCount *
        difficultyScale *
        (technique.insightWeight / baseline.insightWeight),
      1,
      5,
    ),
  };
}
