import type {
  CultivationStructureRepository,
  KnowledgePoint,
} from "../types/domain";
import {
  createKnowledgeOwnershipIndex,
  resolveKnowledgePointOwnership,
} from "./knowledgeOwnership";

export type KnowledgePointEditPatch = Partial<
  Pick<
    KnowledgePoint,
    | "displayCode"
    | "name"
    | "description"
    | "domainTags"
    | "topicTags"
    | "granularity"
    | "baseValue"
    | "difficulty"
    | "importance"
    | "targetLayer"
    | "maxTrainableLayer"
    | "requiredExerciseCount"
    | "requiredNoteCount"
    | "requiredThinkingCount"
    | "reviewIntervalsOverride"
    | "manaWeight"
    | "insightWeight"
    | "prerequisiteKnowledgePointIds"
  >
>;

export interface KnowledgePointMutationOptions {
  changedAt?: string;
}

function requireKnowledgePoint(
  repository: CultivationStructureRepository,
  knowledgePointId: string,
): KnowledgePoint {
  const knowledgePoint = repository.knowledgePoints.find(
    (item) => item.id === knowledgePointId,
  );

  if (!knowledgePoint) {
    throw new Error(`知识点 ${knowledgePointId} 不存在。`);
  }

  return knowledgePoint;
}

function isIntegerInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function normalizeTextList(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function normalizeKnowledgePointPatch(
  patch: KnowledgePointEditPatch,
): KnowledgePointEditPatch {
  const normalizedPatch = { ...patch };

  if (patch.displayCode !== undefined) {
    normalizedPatch.displayCode = patch.displayCode.trim() || undefined;
  }
  if (patch.name !== undefined) {
    normalizedPatch.name = patch.name.trim();
  }
  if (patch.description !== undefined) {
    normalizedPatch.description = patch.description.trim();
  }
  if (patch.domainTags !== undefined) {
    normalizedPatch.domainTags = normalizeTextList(patch.domainTags);
  }
  if (patch.topicTags !== undefined) {
    normalizedPatch.topicTags = normalizeTextList(patch.topicTags);
  }
  if (patch.reviewIntervalsOverride !== undefined) {
    normalizedPatch.reviewIntervalsOverride = [
      ...patch.reviewIntervalsOverride,
    ];
  }
  if (patch.prerequisiteKnowledgePointIds !== undefined) {
    normalizedPatch.prerequisiteKnowledgePointIds = Array.from(
      new Set(patch.prerequisiteKnowledgePointIds),
    );
  }

  return normalizedPatch;
}

function hasPrerequisiteCycle(knowledgePoints: KnowledgePoint[]): boolean {
  const activeKnowledgePointIds = new Set(
    knowledgePoints
      .filter((knowledgePoint) => knowledgePoint.archivedAt === undefined)
      .map((knowledgePoint) => knowledgePoint.id),
  );
  const prerequisiteIdsById = new Map(
    knowledgePoints
      .filter((knowledgePoint) => activeKnowledgePointIds.has(knowledgePoint.id))
      .map((knowledgePoint) => [
        knowledgePoint.id,
        knowledgePoint.prerequisiteKnowledgePointIds.filter((prerequisiteId) =>
          activeKnowledgePointIds.has(prerequisiteId),
        ),
      ]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(knowledgePointId: string): boolean {
    if (visiting.has(knowledgePointId)) {
      return true;
    }
    if (visited.has(knowledgePointId)) {
      return false;
    }

    visiting.add(knowledgePointId);
    for (const prerequisiteId of
      prerequisiteIdsById.get(knowledgePointId) ?? []) {
      if (visit(prerequisiteId)) {
        return true;
      }
    }
    visiting.delete(knowledgePointId);
    visited.add(knowledgePointId);
    return false;
  }

  return Array.from(prerequisiteIdsById.keys()).some((knowledgePointId) =>
    visit(knowledgePointId),
  );
}

function validateKnowledgePoint(
  repository: CultivationStructureRepository,
  knowledgePoint: KnowledgePoint,
): void {
  const ownership = resolveKnowledgePointOwnership(
    knowledgePoint,
    createKnowledgeOwnershipIndex(
      repository.techniques,
      repository.chapters,
      repository.units,
    ),
  );

  if (!ownership) {
    throw new Error("知识点归属路径不完整，暂时不能编辑。");
  }

  if (knowledgePoint.name.length < 1 || knowledgePoint.name.length > 80) {
    throw new Error("知识点名称需要填写 1～80 字。");
  }
  if ((knowledgePoint.displayCode?.length ?? 0) > 80) {
    throw new Error("知识点显示编号最多填写 80 字。");
  }
  if (
    knowledgePoint.description.length < 10 ||
    knowledgePoint.description.length > 1500
  ) {
    throw new Error("知识点描述需要填写 10～1500 字。");
  }
  if (
    !Number.isInteger(knowledgePoint.baseValue) ||
    knowledgePoint.baseValue < 1 ||
    knowledgePoint.baseValue > 1_000_000
  ) {
    throw new Error("知识点基础价值需要是 1～1000000 的整数。");
  }
  if (
    !Number.isFinite(knowledgePoint.difficulty) ||
    knowledgePoint.difficulty < 0.1 ||
    knowledgePoint.difficulty > 5
  ) {
    throw new Error("知识点难度需要在 0.1～5 之间。");
  }
  if (
    !Number.isFinite(knowledgePoint.importance) ||
    knowledgePoint.importance < 0.1 ||
    knowledgePoint.importance > 5
  ) {
    throw new Error("知识点重要度需要在 0.1～5 之间。");
  }

  const maxTechniqueLayer =
    ownership.technique.maxLayer > 0 ? ownership.technique.maxLayer : 6;
  if (
    !isIntegerInRange(
      knowledgePoint.maxTrainableLayer,
      1,
      maxTechniqueLayer,
    )
  ) {
    throw new Error(
      `知识点最高可修炼层数需要在 1～${maxTechniqueLayer} 之间。`,
    );
  }
  if (
    !isIntegerInRange(
      knowledgePoint.targetLayer,
      1,
      knowledgePoint.maxTrainableLayer,
    )
  ) {
    throw new Error("知识点目标层数不能超过最高可修炼层数。");
  }
  if (!isIntegerInRange(knowledgePoint.requiredExerciseCount, 0, 100)) {
    throw new Error("知识点练习要求需要是 0～100 的整数。");
  }
  if (!isIntegerInRange(knowledgePoint.requiredNoteCount, 0, 20)) {
    throw new Error("知识点笔记要求需要是 0～20 的整数。");
  }
  if (!isIntegerInRange(knowledgePoint.requiredThinkingCount, 0, 20)) {
    throw new Error("知识点思考要求需要是 0～20 的整数。");
  }
  if (
    !Number.isFinite(knowledgePoint.manaWeight) ||
    knowledgePoint.manaWeight < 0 ||
    knowledgePoint.manaWeight > 1 ||
    !Number.isFinite(knowledgePoint.insightWeight) ||
    knowledgePoint.insightWeight < 0 ||
    knowledgePoint.insightWeight > 1
  ) {
    throw new Error("知识点法力和神识倾向都需要在 0～1 之间。");
  }

  const reviewIntervals = knowledgePoint.reviewIntervalsOverride;
  if (
    reviewIntervals?.some(
      (interval, index) =>
        !Number.isInteger(interval) ||
        interval <= 0 ||
        (index > 0 && interval <= reviewIntervals[index - 1]),
    )
  ) {
    throw new Error("知识点自定义复习间隔需要是严格递增的正整数。");
  }

  const knowledgePointById = new Map(
    repository.knowledgePoints.map((item) => [item.id, item]),
  );
  if (
    knowledgePoint.prerequisiteKnowledgePointIds.some(
      (prerequisiteId) =>
        prerequisiteId === knowledgePoint.id ||
        knowledgePointById.get(prerequisiteId)?.archivedAt !== undefined ||
        !knowledgePointById.has(prerequisiteId),
    )
  ) {
    throw new Error("知识点包含不存在、已删除或指向自身的前置知识点。");
  }
}

export function updateKnowledgePoint(
  repository: CultivationStructureRepository,
  knowledgePointId: string,
  patch: KnowledgePointEditPatch,
  options: KnowledgePointMutationOptions = {},
): CultivationStructureRepository {
  const knowledgePoint = requireKnowledgePoint(repository, knowledgePointId);

  if (knowledgePoint.archivedAt !== undefined) {
    throw new Error("已删除的知识点需要先恢复后才能编辑。");
  }

  const changedAt = options.changedAt ?? new Date().toISOString();
  const updatedKnowledgePoint = {
    ...knowledgePoint,
    ...normalizeKnowledgePointPatch(patch),
    id: knowledgePoint.id,
    unitId: knowledgePoint.unitId,
    archivedAt: knowledgePoint.archivedAt,
    createdAt: knowledgePoint.createdAt,
    updatedAt: changedAt,
  };
  validateKnowledgePoint(repository, updatedKnowledgePoint);

  const nextKnowledgePoints = repository.knowledgePoints.map((item) =>
    item.id === knowledgePointId ? updatedKnowledgePoint : item,
  );
  if (hasPrerequisiteCycle(nextKnowledgePoints)) {
    throw new Error("知识点前置关系存在循环依赖。");
  }

  return {
    ...repository,
    knowledgePoints: nextKnowledgePoints,
    updatedAt: changedAt,
  };
}

export function archiveKnowledgePoint(
  repository: CultivationStructureRepository,
  knowledgePointId: string,
  options: KnowledgePointMutationOptions = {},
): CultivationStructureRepository {
  const knowledgePoint = requireKnowledgePoint(repository, knowledgePointId);

  if (knowledgePoint.archivedAt !== undefined) {
    throw new Error("知识点已经删除，无需重复删除。");
  }

  const changedAt = options.changedAt ?? new Date().toISOString();
  return {
    ...repository,
    knowledgePoints: repository.knowledgePoints.map((item) =>
      item.id === knowledgePointId
        ? { ...item, archivedAt: changedAt, updatedAt: changedAt }
        : item,
    ),
    updatedAt: changedAt,
  };
}

export function restoreKnowledgePoint(
  repository: CultivationStructureRepository,
  knowledgePointId: string,
  options: KnowledgePointMutationOptions = {},
): CultivationStructureRepository {
  const knowledgePoint = requireKnowledgePoint(repository, knowledgePointId);

  if (knowledgePoint.archivedAt === undefined) {
    throw new Error("知识点当前未删除，无需恢复。");
  }

  const changedAt = options.changedAt ?? new Date().toISOString();
  const { archivedAt: _archivedAt, ...restoredKnowledgePoint } = knowledgePoint;

  return {
    ...repository,
    knowledgePoints: repository.knowledgePoints.map((item) =>
      item.id === knowledgePointId
        ? { ...restoredKnowledgePoint, updatedAt: changedAt }
        : item,
    ),
    updatedAt: changedAt,
  };
}
