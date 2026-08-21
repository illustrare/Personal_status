import type {
  KnowledgePoint,
  PracticeRecordKnowledgePointDraft,
  PracticeRecordType,
  TechniquePracticeDefaults,
} from '../types/domain';

export interface KnowledgePointExperienceResult {
  knowledgePointId: string;
  allocatedQuantity: number;
  suggestedExperience: number;
  progressExperience: number;
}

export interface PracticeExperienceCalculation {
  suggestedExperienceGain: number;
  knowledgePointResults: KnowledgePointExperienceResult[];
}

interface PracticeExperienceInput {
  recordType: PracticeRecordType;
  quantity: number;
  difficultyMultiplier: number;
  knowledgePoints: KnowledgePoint[];
  allocations: PracticeRecordKnowledgePointDraft[];
  practiceDefaults: TechniquePracticeDefaults;
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getRequiredQuantity(
  knowledgePoint: KnowledgePoint,
  recordType: Exclude<PracticeRecordType, 'test'>,
): number {
  switch (recordType) {
    case 'exercise':
      return knowledgePoint.requiredExerciseCount;
    case 'note':
      return knowledgePoint.requiredNoteCount;
    case 'thinking':
      return knowledgePoint.requiredThinkingCount;
    case 'review':
      return 1;
  }
}

export function calculateSuggestedExperience({
  recordType,
  quantity,
  difficultyMultiplier,
  knowledgePoints,
  allocations,
  practiceDefaults,
}: PracticeExperienceInput): PracticeExperienceCalculation {
  const knowledgePointById = new Map(
    knowledgePoints.map(
      (knowledgePoint): [string, KnowledgePoint] => [
        knowledgePoint.id,
        knowledgePoint,
      ],
    ),
  );
  const typeDefaults = practiceDefaults.recordTypeDefaults[recordType];

  if (recordType === 'test') {
    const suggestedExperienceGain = roundToTwo(
      quantity *
        (typeDefaults.baseExperiencePerUnit ?? 0) *
        difficultyMultiplier,
    );

    return {
      suggestedExperienceGain,
      knowledgePointResults: allocations.map((allocation) => ({
        knowledgePointId: allocation.knowledgePointId,
        allocatedQuantity: roundToTwo(
          quantity * allocation.allocationWeight,
        ),
        suggestedExperience: roundToTwo(
          suggestedExperienceGain * allocation.allocationWeight,
        ),
        progressExperience: 0,
      })),
    };
  }

  const knowledgePointResults = allocations.flatMap((allocation) => {
    const knowledgePoint = knowledgePointById.get(allocation.knowledgePointId);

    if (!knowledgePoint) {
      return [];
    }

    const requiredQuantity = getRequiredQuantity(knowledgePoint, recordType);
    const allocatedQuantity = quantity * allocation.allocationWeight;
    const experiencePerUnit =
      requiredQuantity > 0
        ? (knowledgePoint.baseValue * typeDefaults.requirementRatio) /
          requiredQuantity
        : 0;
    const suggestedExperience = allocatedQuantity * experiencePerUnit;
    const reviewProgressIsActive =
      recordType !== 'review' ||
      knowledgePoint.reviewStatus === 'due' ||
      knowledgePoint.reviewStatus === 'overdue';

    return [
      {
        knowledgePointId: knowledgePoint.id,
        allocatedQuantity: roundToTwo(allocatedQuantity),
        suggestedExperience: roundToTwo(suggestedExperience),
        progressExperience: reviewProgressIsActive
          ? roundToTwo(suggestedExperience)
          : 0,
      },
    ];
  });

  return {
    suggestedExperienceGain: roundToTwo(
      knowledgePointResults.reduce(
        (total, result) => total + result.suggestedExperience,
        0,
      ),
    ),
    knowledgePointResults,
  };
}
