import type {
  KnowledgePoint,
  KnowledgeReviewStatus,
  PracticeRecord,
  PracticeRecordKnowledgePoint,
  PracticeRecordType,
  ReviewRecallResult,
  TechniqueLayerBreakthroughRequirement,
  TechniqueLayerRule,
  TechniquePracticeDefaults,
} from "../types/domain";
import { getActivePracticeRecords } from "./practiceStats";
import {
  getActiveKnowledgePoints,
  resolveKnowledgePointOwnership,
  type KnowledgeOwnershipIndex,
} from "./knowledgeOwnership";

export type KnowledgeProgressDimensionName =
  | "exercise"
  | "note"
  | "thinking"
  | "review";

export interface KnowledgeProgressDimension {
  name: KnowledgeProgressDimensionName;
  accumulatedExperience: number;
  requiredExperience: number;
  cappedExperience: number;
  progressRatio: number;
  missingExperience: number;
  excessExperience: number;
  isActive: boolean;
}

export interface KnowledgePointProgress {
  knowledgePointId: string;
  totalProgressRatio: number;
  isCompleted: boolean;
  isWeak: boolean;
  reviewStatus: KnowledgeReviewStatus;
  reviewStage: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  dimensions: Record<KnowledgeProgressDimensionName, KnowledgeProgressDimension>;
}

export interface TechniqueLayerGap {
  requiredExperienceGap: number;
  requiredCoverageGap: number;
  requiredCoreCoverageGap: number;
  weakPointGap: number;
  pendingBreakthroughRequirements: TechniqueLayerBreakthroughRequirement[];
}

export interface TechniqueProgress {
  techniqueId: string;
  currentLayer: number;
  maxLayer: number;
  currentExperience: number;
  coverageRatio: number;
  coreCoverageRatio: number;
  weakPointRatio: number;
  nextLayerRule?: TechniqueLayerRule;
  nextLayerStatus: "maxed" | "training" | "blocked" | "breakthrough_ready";
  nextLayerGap?: TechniqueLayerGap;
}

export interface PracticeProgress {
  knowledgePointProgressById: Record<string, KnowledgePointProgress>;
  techniqueProgressById: Record<string, TechniqueProgress>;
}

const KNOWLEDGE_POINT_COMPLETION_RATIO = 0.8;
const DIMENSION_FLOOR_FOR_COMPLETION = 0.2;
const CORE_IMPORTANCE_THRESHOLD = 2;

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampRatio(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function addDays(dateValue: string, days: number): string {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);

  return date.toISOString();
}

function getRequiredExperience(
  knowledgePoint: KnowledgePoint,
  practiceDefaults: TechniquePracticeDefaults,
  recordType: Exclude<PracticeRecordType, "test">,
): number {
  const typeDefaults = practiceDefaults.recordTypeDefaults[recordType];

  return roundToTwo(knowledgePoint.baseValue * typeDefaults.requirementRatio);
}

function createDimension(
  name: KnowledgeProgressDimensionName,
  accumulatedExperience: number,
  requiredExperience: number,
  isActive: boolean,
): KnowledgeProgressDimension {
  const cappedExperience =
    isActive && requiredExperience > 0
      ? Math.min(accumulatedExperience, requiredExperience)
      : 0;

  return {
    name,
    accumulatedExperience: roundToTwo(accumulatedExperience),
    requiredExperience: roundToTwo(requiredExperience),
    cappedExperience: roundToTwo(cappedExperience),
    progressRatio:
      isActive && requiredExperience > 0
        ? clampRatio(cappedExperience / requiredExperience)
        : 0,
    missingExperience:
      isActive && requiredExperience > 0
        ? roundToTwo(Math.max(requiredExperience - accumulatedExperience, 0))
        : 0,
    excessExperience:
      isActive && requiredExperience > 0
        ? roundToTwo(Math.max(accumulatedExperience - requiredExperience, 0))
        : 0,
    isActive,
  };
}

function getNextReviewState(
  reviewRecords: PracticeRecord[],
  nonTestRecords: PracticeRecord[],
  practiceDefaults: TechniquePracticeDefaults,
): {
  reviewStatus: KnowledgeReviewStatus;
  reviewStage: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
} {
  if (nonTestRecords.length === 0) {
    return {
      reviewStatus: "not_scheduled",
      reviewStage: 0,
    };
  }

  const sortedNonTestRecords = [...nonTestRecords].sort(
    (first, second) =>
      new Date(first.practicedAt).getTime() -
      new Date(second.practicedAt).getTime(),
  );
  const sortedReviewRecords = [...reviewRecords].sort(
    (first, second) =>
      new Date(first.practicedAt).getTime() -
      new Date(second.practicedAt).getTime(),
  );
  const intervals = practiceDefaults.reviewSchedule.intervalsDays;
  let reviewStage = 0;
  let lastReviewedAt = sortedNonTestRecords[0].practicedAt;

  sortedReviewRecords.forEach((record) => {
    lastReviewedAt = record.practicedAt;

    switch (record.reviewResult) {
      case "forgotten":
        reviewStage = 0;
        break;
      case "effortful":
        break;
      case "recalled":
        reviewStage += 1;
        break;
      default:
        reviewStage += 1;
    }
  });

  const intervalIndex = Math.min(reviewStage, intervals.length - 1);
  const intervalDays = intervals[intervalIndex] ?? 1;
  const lastReviewResult =
    sortedReviewRecords[sortedReviewRecords.length - 1]?.reviewResult;
  const adjustedIntervalDays = getAdjustedReviewIntervalDays(
    intervalDays,
    lastReviewResult,
  );
  const nextReviewAt = addDays(lastReviewedAt, adjustedIntervalDays);
  const reviewStatus = getReviewStatus(
    nextReviewAt,
    adjustedIntervalDays,
    practiceDefaults.reviewSchedule.graceRatio,
  );

  return {
    reviewStatus,
    reviewStage,
    lastReviewedAt,
    nextReviewAt,
  };
}

function getAdjustedReviewIntervalDays(
  intervalDays: number,
  lastReviewResult?: ReviewRecallResult,
): number {
  if (lastReviewResult === "forgotten") {
    return 1;
  }

  if (lastReviewResult === "effortful") {
    return Math.max(1, Math.ceil(intervalDays / 2));
  }

  return intervalDays;
}

function getReviewStatus(
  nextReviewAt: string,
  intervalDays: number,
  graceRatio: number,
): KnowledgeReviewStatus {
  const nowTime = Date.now();
  const nextReviewTime = new Date(nextReviewAt).getTime();
  const graceDays = Math.max(1, Math.ceil(intervalDays * graceRatio));
  const dueWindowStart = new Date(nextReviewAt);
  dueWindowStart.setDate(dueWindowStart.getDate() - graceDays);
  const overdueTime = new Date(nextReviewAt);
  overdueTime.setDate(overdueTime.getDate() + graceDays);

  if (nowTime < dueWindowStart.getTime()) {
    return "not_due";
  }

  if (nowTime > overdueTime.getTime()) {
    return "overdue";
  }

  return nowTime >= nextReviewTime ? "due" : "not_due";
}

function getRecordExperienceByType(
  knowledgePoint: KnowledgePoint,
  records: PracticeRecord[],
  recordLinks: PracticeRecordKnowledgePoint[],
): Record<PracticeRecordType, number> {
  const recordById = new Map(records.map((record) => [record.id, record]));

  return recordLinks.reduce<Record<PracticeRecordType, number>>(
    (experienceByType, link) => {
      if (link.knowledgePointId !== knowledgePoint.id) {
        return experienceByType;
      }

      const record = recordById.get(link.recordId);

      if (!record) {
        return experienceByType;
      }

      return {
        ...experienceByType,
        [record.recordType]:
          experienceByType[record.recordType] +
          record.experienceGain * link.allocationWeight,
      };
    },
    {
      exercise: 0,
      note: 0,
      thinking: 0,
      test: 0,
      review: 0,
    },
  );
}

function getLinkedRecordsForKnowledgePoint(
  knowledgePointId: string,
  records: PracticeRecord[],
  recordLinks: PracticeRecordKnowledgePoint[],
): PracticeRecord[] {
  const recordById = new Map(records.map((record) => [record.id, record]));

  return recordLinks.flatMap((link) => {
    if (link.knowledgePointId !== knowledgePointId) {
      return [];
    }

    const record = recordById.get(link.recordId);

    return record ? [record] : [];
  });
}

function calculateKnowledgePointProgress(
  knowledgePoint: KnowledgePoint,
  records: PracticeRecord[],
  recordLinks: PracticeRecordKnowledgePoint[],
  practiceDefaults: TechniquePracticeDefaults,
): KnowledgePointProgress {
  const linkedRecords = getLinkedRecordsForKnowledgePoint(
    knowledgePoint.id,
    records,
    recordLinks,
  );
  const nonTestRecords = linkedRecords.filter(
    (record) => record.recordType !== "test",
  );
  const reviewRecords = linkedRecords.filter(
    (record) => record.recordType === "review",
  );
  const reviewState = getNextReviewState(
    reviewRecords,
    nonTestRecords,
    practiceDefaults,
  );
  const experienceByType = getRecordExperienceByType(
    knowledgePoint,
    records,
    recordLinks,
  );
  const reviewIsActive =
    reviewState.reviewStatus === "due" ||
    reviewState.reviewStatus === "overdue";
  const dimensions = {
    exercise: createDimension(
      "exercise",
      experienceByType.exercise,
      getRequiredExperience(knowledgePoint, practiceDefaults, "exercise"),
      true,
    ),
    note: createDimension(
      "note",
      experienceByType.note,
      getRequiredExperience(knowledgePoint, practiceDefaults, "note"),
      true,
    ),
    thinking: createDimension(
      "thinking",
      experienceByType.thinking,
      getRequiredExperience(knowledgePoint, practiceDefaults, "thinking"),
      true,
    ),
    review: createDimension(
      "review",
      experienceByType.review,
      getRequiredExperience(knowledgePoint, practiceDefaults, "review"),
      reviewIsActive,
    ),
  };
  const activeDimensions = Object.values(dimensions).filter(
    (dimension) => dimension.isActive && dimension.requiredExperience > 0,
  );
  const requiredExperience = activeDimensions.reduce(
    (total, dimension) => total + dimension.requiredExperience,
    0,
  );
  const cappedExperience = activeDimensions.reduce(
    (total, dimension) => total + dimension.cappedExperience,
    0,
  );
  const totalProgressRatio =
    requiredExperience > 0 ? clampRatio(cappedExperience / requiredExperience) : 0;
  const hasEmptyCoreDimension = activeDimensions.some(
    (dimension) => dimension.progressRatio < DIMENSION_FLOOR_FOR_COMPLETION,
  );
  const isCompleted =
    totalProgressRatio >= KNOWLEDGE_POINT_COMPLETION_RATIO &&
    !hasEmptyCoreDimension;

  return {
    knowledgePointId: knowledgePoint.id,
    totalProgressRatio,
    isCompleted,
    isWeak: totalProgressRatio < KNOWLEDGE_POINT_COMPLETION_RATIO,
    ...reviewState,
    dimensions,
  };
}

function getCoverageRatio(
  knowledgePoints: KnowledgePoint[],
  knowledgePointProgressById: Record<string, KnowledgePointProgress>,
): number {
  if (knowledgePoints.length === 0) {
    return 0;
  }

  const completedCount = knowledgePoints.filter(
    (knowledgePoint) =>
      knowledgePointProgressById[knowledgePoint.id]?.isCompleted,
  ).length;

  return completedCount / knowledgePoints.length;
}

function getWeakPointRatio(
  knowledgePoints: KnowledgePoint[],
  knowledgePointProgressById: Record<string, KnowledgePointProgress>,
): number {
  if (knowledgePoints.length === 0) {
    return 0;
  }

  const weakCount = knowledgePoints.filter(
    (knowledgePoint) => knowledgePointProgressById[knowledgePoint.id]?.isWeak,
  ).length;

  return weakCount / knowledgePoints.length;
}

function getTechniqueCurrentLayer(
  layerRules: TechniqueLayerRule[],
  currentExperience: number,
  coverageRatio: number,
  coreCoverageRatio: number,
  weakPointRatio: number,
): number {
  return layerRules.reduce((currentLayer, rule) => {
    const hasReachedLayer =
      currentExperience >= rule.requiredExperience &&
      coverageRatio >= rule.requiredCoverageRatio &&
      coreCoverageRatio >= rule.requiredCoreCoverageRatio &&
      weakPointRatio <= rule.allowedWeakPointRatio;

    return hasReachedLayer ? rule.layer : currentLayer;
  }, 0);
}

function calculateTechniqueProgress(
  techniqueId: string,
  techniqueKnowledgePoints: KnowledgePoint[],
  knowledgePointProgressById: Record<string, KnowledgePointProgress>,
  records: PracticeRecord[],
  layerRules: TechniqueLayerRule[],
): TechniqueProgress {
  const currentExperience = records
    .filter((record) => record.techniqueId === techniqueId)
    .reduce((total, record) => total + record.experienceGain, 0);
  const coreKnowledgePoints = techniqueKnowledgePoints.filter(
    (knowledgePoint) => knowledgePoint.importance >= CORE_IMPORTANCE_THRESHOLD,
  );
  const coverageRatio = getCoverageRatio(
    techniqueKnowledgePoints,
    knowledgePointProgressById,
  );
  const coreCoverageRatio = getCoverageRatio(
    coreKnowledgePoints.length > 0 ? coreKnowledgePoints : techniqueKnowledgePoints,
    knowledgePointProgressById,
  );
  const weakPointRatio = getWeakPointRatio(
    techniqueKnowledgePoints,
    knowledgePointProgressById,
  );
  const sortedLayerRules = [...layerRules].sort(
    (first, second) => first.layer - second.layer,
  );
  const currentLayer = getTechniqueCurrentLayer(
    sortedLayerRules,
    currentExperience,
    coverageRatio,
    coreCoverageRatio,
    weakPointRatio,
  );
  const nextLayerRule = sortedLayerRules.find(
    (rule) => rule.layer === currentLayer + 1,
  );

  if (!nextLayerRule) {
    return {
      techniqueId,
      currentLayer,
      maxLayer: sortedLayerRules[sortedLayerRules.length - 1]?.layer ?? 0,
      currentExperience: roundToTwo(currentExperience),
      coverageRatio,
      coreCoverageRatio,
      weakPointRatio,
      nextLayerStatus: "maxed",
    };
  }

  const nextLayerGap = {
    requiredExperienceGap: roundToTwo(
      Math.max(nextLayerRule.requiredExperience - currentExperience, 0),
    ),
    requiredCoverageGap: roundToTwo(
      Math.max(nextLayerRule.requiredCoverageRatio - coverageRatio, 0),
    ),
    requiredCoreCoverageGap: roundToTwo(
      Math.max(nextLayerRule.requiredCoreCoverageRatio - coreCoverageRatio, 0),
    ),
    weakPointGap: roundToTwo(
      Math.max(weakPointRatio - nextLayerRule.allowedWeakPointRatio, 0),
    ),
    pendingBreakthroughRequirements:
      nextLayerRule.breakthroughRequirements,
  };
  const hasReachedNumericRequirements =
    nextLayerGap.requiredExperienceGap === 0 &&
    nextLayerGap.requiredCoverageGap === 0 &&
    nextLayerGap.requiredCoreCoverageGap === 0 &&
    nextLayerGap.weakPointGap === 0;
  const hasReachedExperience =
    currentExperience >= nextLayerRule.requiredExperience;

  return {
    techniqueId,
    currentLayer,
    maxLayer: sortedLayerRules[sortedLayerRules.length - 1]?.layer ?? 0,
    currentExperience: roundToTwo(currentExperience),
    coverageRatio,
    coreCoverageRatio,
    weakPointRatio,
    nextLayerRule,
    nextLayerStatus: hasReachedNumericRequirements
      ? "breakthrough_ready"
      : hasReachedExperience
        ? "blocked"
        : "training",
    nextLayerGap,
  };
}

export function calculatePracticeProgress(
  knowledgePoints: KnowledgePoint[],
  ownershipIndex: KnowledgeOwnershipIndex,
  practiceRecords: PracticeRecord[],
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[],
  practiceDefaultsByTechniqueId: Record<string, TechniquePracticeDefaults>,
  layerRulesByTechniqueId: Record<string, TechniqueLayerRule[]>,
): PracticeProgress {
  const activeRecords = getActivePracticeRecords(practiceRecords);
  const activeKnowledgePoints = getActiveKnowledgePoints(knowledgePoints);
  const knowledgePointProgressById = activeKnowledgePoints.reduce<
    Record<string, KnowledgePointProgress>
  >((progressById, knowledgePoint) => {
    const techniqueId = resolveKnowledgePointOwnership(
      knowledgePoint,
      ownershipIndex,
    )?.technique.id;
    const practiceDefaults =
      techniqueId === undefined
        ? undefined
        : practiceDefaultsByTechniqueId[techniqueId];

    if (!practiceDefaults) {
      return progressById;
    }

    return {
      ...progressById,
      [knowledgePoint.id]: calculateKnowledgePointProgress(
        knowledgePoint,
        activeRecords,
        practiceRecordKnowledgePoints,
        practiceDefaults,
      ),
    };
  }, {});
  const techniqueIds = Array.from(
    new Set(
      activeKnowledgePoints.flatMap((knowledgePoint) => {
        const techniqueId = resolveKnowledgePointOwnership(
          knowledgePoint,
          ownershipIndex,
        )?.technique.id;
        return techniqueId ? [techniqueId] : [];
      }),
    ),
  );
  const techniqueProgressById = techniqueIds.reduce<
    Record<string, TechniqueProgress>
  >((progressById, techniqueId) => {
    const layerRules = layerRulesByTechniqueId[techniqueId] ?? [];

    if (layerRules.length === 0) {
      return progressById;
    }

    return {
      ...progressById,
      [techniqueId]: calculateTechniqueProgress(
        techniqueId,
        activeKnowledgePoints.filter(
          (knowledgePoint) =>
            resolveKnowledgePointOwnership(knowledgePoint, ownershipIndex)
              ?.technique.id === techniqueId,
        ),
        knowledgePointProgressById,
        activeRecords,
        layerRules,
      ),
    };
  }, {});

  return {
    knowledgePointProgressById,
    techniqueProgressById,
  };
}
