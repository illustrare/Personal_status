import type {
  TechniqueChapterDraft,
  TechniqueCreationDraftStage,
  TechniqueCreationKnowledgePointDraft,
  TechniqueUnitDraft,
} from "../types/domain";

function isIntegerInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function resolveTechniqueKnowledgeStage(
  chapterDrafts: TechniqueChapterDraft[],
): TechniqueCreationDraftStage {
  const hasPendingChapter = chapterDrafts.some(
    (chapter) =>
      chapter.unitGenerationConfig.includeInGeneration &&
      chapter.unitDrafts.length === 0,
  );
  if (hasPendingChapter) {
    return "units_pending";
  }

  const includedUnits = chapterDrafts.flatMap((chapter) =>
    chapter.unitDrafts.filter(
      (unit) => unit.knowledgeGenerationConfig.includeInGeneration,
    ),
  );
  if (includedUnits.length === 0) {
    return "units_ready";
  }

  return includedUnits.some((unit) => unit.knowledgePointDrafts.length === 0)
    ? "knowledge_pending"
    : "knowledge_ready";
}

export function validateUnitKnowledgePointDrafts(
  unit: TechniqueUnitDraft,
  maxTechniqueLayer: number,
  allKnowledgePoints: TechniqueCreationKnowledgePointDraft[] =
    unit.knowledgePointDrafts,
): string[] {
  const errors: string[] = [];
  const unitKnowledgePointIds = new Set(
    unit.knowledgePointDrafts.map((knowledgePoint) => knowledgePoint.draftId),
  );
  const availableKnowledgePointIds = new Set(
    allKnowledgePoints.map((knowledgePoint) => knowledgePoint.draftId),
  );

  if (unitKnowledgePointIds.size !== unit.knowledgePointDrafts.length) {
    errors.push("当前单元存在重复的知识点草案 id。");
  }

  unit.knowledgePointDrafts.forEach((knowledgePoint, index) => {
    const label = `知识点 ${index + 1}`;

    if (
      knowledgePoint.chapterDraftId !== unit.chapterDraftId ||
      knowledgePoint.unitDraftId !== unit.draftId
    ) {
      errors.push(`${label}的章节或单元归属不正确。`);
    }
    if (
      knowledgePoint.name.trim().length === 0 ||
      knowledgePoint.name.trim().length > 80
    ) {
      errors.push(`${label}名称需要填写 1～80 字。`);
    }
    if (
      knowledgePoint.description.trim().length < 10 ||
      knowledgePoint.description.trim().length > 1500
    ) {
      errors.push(`${label}描述需要填写 10～1500 字。`);
    }
    if (
      !Number.isFinite(knowledgePoint.difficulty) ||
      knowledgePoint.difficulty < 0.1 ||
      knowledgePoint.difficulty > 5
    ) {
      errors.push(`${label}难度需要在 0.1～5 之间。`);
    }
    if (
      !Number.isFinite(knowledgePoint.importance) ||
      knowledgePoint.importance < 0.1 ||
      knowledgePoint.importance > 5
    ) {
      errors.push(`${label}重要度需要在 0.1～5 之间。`);
    }
    if (
      !isIntegerInRange(
        knowledgePoint.maxTrainableLayer,
        1,
        maxTechniqueLayer,
      )
    ) {
      errors.push(`${label}最高可修炼层数需要在 1～${maxTechniqueLayer} 之间。`);
    }
    if (
      !isIntegerInRange(
        knowledgePoint.targetLayer,
        1,
        knowledgePoint.maxTrainableLayer,
      )
    ) {
      errors.push(`${label}目标层数不能超过最高可修炼层数。`);
    }
    if (!isIntegerInRange(knowledgePoint.requiredExerciseCount, 0, 100)) {
      errors.push(`${label}练习要求需要是 0～100 的整数。`);
    }
    if (!isIntegerInRange(knowledgePoint.requiredNoteCount, 0, 20)) {
      errors.push(`${label}笔记要求需要是 0～20 的整数。`);
    }
    if (!isIntegerInRange(knowledgePoint.requiredThinkingCount, 0, 20)) {
      errors.push(`${label}思考要求需要是 0～20 的整数。`);
    }
    if (
      !Number.isFinite(knowledgePoint.manaWeight) ||
      knowledgePoint.manaWeight < 0 ||
      knowledgePoint.manaWeight > 1 ||
      !Number.isFinite(knowledgePoint.insightWeight) ||
      knowledgePoint.insightWeight < 0 ||
      knowledgePoint.insightWeight > 1
    ) {
      errors.push(`${label}法力和神识倾向都需要在 0～1 之间。`);
    }
    if (
      knowledgePoint.baseValueOverride !== undefined &&
      (!Number.isInteger(knowledgePoint.baseValueOverride) ||
        knowledgePoint.baseValueOverride < 1 ||
        knowledgePoint.baseValueOverride > 1_000_000)
    ) {
      errors.push(`${label}手动基础价值需要是 1～1000000 的整数。`);
    }
    if (
      knowledgePoint.baseValueAdjustment !== undefined &&
      (!Number.isInteger(knowledgePoint.baseValueAdjustment) ||
        knowledgePoint.baseValueAdjustment < -1_000_000 ||
        knowledgePoint.baseValueAdjustment > 1_000_000 ||
        (knowledgePoint.recommendedBaseValue !== undefined &&
          knowledgePoint.recommendedBaseValue + knowledgePoint.baseValueAdjustment < 1))
    ) {
      errors.push(`${label}基础价值调整需要是 -1000000～1000000 的整数，且生效值至少为 1。`);
    }

    const reviewIntervals = knowledgePoint.reviewIntervalsOverride;
    if (
      reviewIntervals &&
      reviewIntervals.some(
        (interval, intervalIndex) =>
          !Number.isInteger(interval) ||
          interval <= 0 ||
          (intervalIndex > 0 && interval <= reviewIntervals[intervalIndex - 1]),
      )
    ) {
      errors.push(`${label}自定义复习间隔需要是严格递增的正整数。`);
    }

    if (
      knowledgePoint.prerequisiteDraftIds.includes(knowledgePoint.draftId) ||
      knowledgePoint.prerequisiteDraftIds.some(
        (draftId) => !availableKnowledgePointIds.has(draftId),
      )
    ) {
      errors.push(`${label}包含无效的前置知识点引用。`);
    }
  });

  if (hasPrerequisiteCycle(allKnowledgePoints)) {
    errors.push("当前功法的前置知识点关系存在循环依赖。");
  }

  return errors;
}

function hasPrerequisiteCycle(
  knowledgePoints: TechniqueCreationKnowledgePointDraft[],
): boolean {
  const prerequisiteIdsById = new Map(
    knowledgePoints.map((knowledgePoint) => [
      knowledgePoint.draftId,
      knowledgePoint.prerequisiteDraftIds,
    ]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(draftId: string): boolean {
    if (visiting.has(draftId)) {
      return true;
    }
    if (visited.has(draftId)) {
      return false;
    }

    visiting.add(draftId);
    for (const prerequisiteId of prerequisiteIdsById.get(draftId) ?? []) {
      if (prerequisiteIdsById.has(prerequisiteId) && visit(prerequisiteId)) {
        return true;
      }
    }
    visiting.delete(draftId);
    visited.add(draftId);
    return false;
  }

  return knowledgePoints.some((knowledgePoint) => visit(knowledgePoint.draftId));
}
