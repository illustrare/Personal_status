import type {
  DraftValidationIssue,
  KnowledgePoint,
  Sect,
  Technique,
  TechniqueChapter,
  TechniqueCreationDraft,
  TechniqueImportAction,
  TechniqueImportActionType,
  TechniqueImportEntityType,
  TechniqueImportFieldChange,
  TechniqueImportPlan,
  TechniqueLayerRule,
  TechniquePracticeDefaults,
  TechniqueUnit,
} from "../types/domain";
import { validateUnitKnowledgePointDrafts } from "./techniqueKnowledgeDraft";
import {
  createKnowledgeOwnershipIndex,
  resolveKnowledgePointOwnership,
} from "./knowledgeOwnership";

export type TechniqueImportCatalog = {
  sects: Sect[];
  techniques: Technique[];
  chapters: TechniqueChapter[];
  units: TechniqueUnit[];
  knowledgePoints: KnowledgePoint[];
  practiceDefaults: TechniquePracticeDefaults[];
  layerRules: TechniqueLayerRule[];
};

type FormalIdMaps = {
  techniqueId: string;
  chapterIds: Map<string, string>;
  unitIds: Map<string, string>;
  knowledgePointIds: Map<string, string>;
};

function stableHash(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

function normalizeIdPart(value: string, fallback: string): string {
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
  return normalized || fallback;
}

function createOpaqueFormalId(prefix: string, sourceId: string): string {
  return `${prefix}_${stableHash(sourceId)}${stableHash(`formal:${sourceId}`)}`;
}

function createFormalIdMaps(
  draft: TechniqueCreationDraft,
  catalog: TechniqueImportCatalog,
): FormalIdMaps {
  const techniqueId =
    draft.input.target.mode === "merge_existing"
      ? draft.input.target.targetTechniqueId
      : createOpaqueFormalId("tech", draft.projectId ?? draft.id);
  const chapterIds = new Map<string, string>();
  const unitIds = new Map<string, string>();
  const knowledgePointIds = new Map<string, string>();

  for (const chapter of draft.chapterDrafts) {
    const existingChapter =
      draft.input.target.mode === "merge_existing"
        ? catalog.chapters.find(
            (item) =>
              item.techniqueId === techniqueId && item.code === chapter.code,
          )
        : undefined;
    const chapterId =
      existingChapter?.id ?? createOpaqueFormalId("chapter", chapter.draftId);
    chapterIds.set(
      chapter.draftId,
      chapterId,
    );

    for (const unit of chapter.unitDrafts) {
      const existingUnit =
        draft.input.target.mode === "merge_existing"
          ? catalog.units.find(
              (item) =>
                item.chapterId === chapterId && item.code === unit.code,
            )
          : undefined;
      unitIds.set(
        unit.draftId,
        existingUnit?.id ?? createOpaqueFormalId("unit", unit.draftId),
      );

      for (const knowledgePoint of unit.knowledgePointDrafts) {
        knowledgePointIds.set(
          knowledgePoint.draftId,
          createOpaqueFormalId("kp", knowledgePoint.draftId),
        );
      }
    }
  }

  return {
    techniqueId,
    chapterIds,
    unitIds,
    knowledgePointIds,
  };
}

function valuesEqual(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function createFieldChanges(
  nextValues: Record<string, unknown>,
  previousValues?: Record<string, unknown>,
): TechniqueImportFieldChange[] {
  return Object.entries(nextValues).flatMap(([field, nextValue]) => {
    const previousValue = previousValues?.[field];
    return previousValues && valuesEqual(previousValue, nextValue)
      ? []
      : [{ field, previousValue, nextValue }];
  });
}

function createIssue(
  severity: DraftValidationIssue["severity"],
  code: string,
  message: string,
  path?: string,
): DraftValidationIssue {
  return {
    id: `issue_${code}_${stableHash(path ?? message)}`,
    severity,
    code,
    path,
    message,
  };
}

function isStrictlyIncreasingPositiveIntegers(values: number[]): boolean {
  return values.every(
    (value, index) =>
      Number.isInteger(value) &&
      value > 0 &&
      (index === 0 || value > values[index - 1]),
  );
}

function validateDraft(
  draft: TechniqueCreationDraft,
  catalog: TechniqueImportCatalog,
  idMaps: FormalIdMaps,
): DraftValidationIssue[] {
  const issues: DraftValidationIssue[] = [];
  const technique = draft.techniqueDraft;
  const practiceDefaults = draft.practiceDefaultsDraft;
  const targetSect = catalog.sects.find(
    (sect) => sect.id === draft.input.target.sectId,
  );

  if (!targetSect) {
    issues.push(
      createIssue(
        "error",
        "target_sect_missing",
        "目标门派不存在，无法生成正式数据映射。",
        "input.target.sectId",
      ),
    );
  }
  if (!technique) {
    issues.push(
      createIssue(
        "error",
        "technique_draft_missing",
        "功法基本信息尚未生成。",
        "techniqueDraft",
      ),
    );
    return issues;
  }
  if (technique.name.trim().length === 0 || technique.name.length > 80) {
    issues.push(
      createIssue(
        "error",
        "technique_name_invalid",
        "功法名称需要填写 1～80 字。",
        "techniqueDraft.name",
      ),
    );
  }
  if (technique.description.trim().length < 10) {
    issues.push(
      createIssue(
        "error",
        "technique_description_invalid",
        "功法说明至少需要 10 字。",
        "techniqueDraft.description",
      ),
    );
  }
  if (
    technique.courseValueCoefficientSuggestion < 0.5 ||
    technique.courseValueCoefficientSuggestion > 2
  ) {
    issues.push(
      createIssue(
        "error",
        "course_value_invalid",
        "课程体量系数需要在 0.50～2.00 之间。",
        "techniqueDraft.courseValueCoefficientSuggestion",
      ),
    );
  }

  if (draft.input.target.mode === "merge_existing") {
    const targetTechnique = catalog.techniques.find(
      (item) => item.id === draft.input.target.targetTechniqueId,
    );
    if (!targetTechnique) {
      issues.push(
        createIssue(
          "error",
          "target_technique_missing",
          "准备合并的正式功法不存在。",
          "input.target.targetTechniqueId",
        ),
      );
    } else if (targetTechnique.sectId !== draft.input.target.sectId) {
      issues.push(
        createIssue(
          "error",
          "target_technique_sect_mismatch",
          "准备合并的功法不属于目标门派。",
          "input.target.targetTechniqueId",
        ),
      );
    }
  } else {
    const duplicateName = catalog.techniques.find(
      (item) =>
        item.sectId === draft.input.target.sectId &&
        item.name.trim() === technique.name.trim(),
    );
    if (duplicateName) {
      issues.push(
        createIssue(
          "warning",
          "possible_duplicate_technique",
          `同一门派已有同名功法“${duplicateName.name}”，创建前需要确认不是重复内容。`,
          "techniqueDraft.name",
        ),
      );
    }
    const idCollision = catalog.techniques.find(
      (item) => item.id === idMaps.techniqueId,
    );
    if (idCollision) {
      issues.push(
        createIssue(
          "error",
          "technique_id_collision",
          `建议功法 id ${idMaps.techniqueId} 已被占用。`,
          "techniqueDraft.name",
        ),
      );
    }
  }

  if (!practiceDefaults) {
    issues.push(
      createIssue(
        "error",
        "practice_defaults_missing",
        "功法修炼默认规则尚未生成。",
        "practiceDefaultsDraft",
      ),
    );
  } else if (
    !isStrictlyIncreasingPositiveIntegers(
      practiceDefaults.reviewSchedule.intervalsDays,
    )
  ) {
    issues.push(
      createIssue(
        "error",
        "practice_review_intervals_invalid",
        "功法默认复习间隔需要是严格递增的正整数。",
        "practiceDefaultsDraft.reviewSchedule.intervalsDays",
      ),
    );
  }

  if (draft.layerRuleDrafts.length !== technique.maxLayer) {
    issues.push(
      createIssue(
        "error",
        "layer_rule_count_invalid",
        `需要为 1～${technique.maxLayer} 层各提供一条层数规则。`,
        "layerRuleDrafts",
      ),
    );
  }
  const orderedLayerRules = [...draft.layerRuleDrafts].sort(
    (first, second) => first.layer - second.layer,
  );
  orderedLayerRules.forEach((rule, index) => {
    const previousRule = orderedLayerRules[index - 1];
    if (rule.layer !== index + 1) {
      issues.push(
        createIssue(
          "error",
          "layer_rule_sequence_invalid",
          "层数规则需要从第 1 层开始连续排列。",
          `layerRuleDrafts.${index}.layer`,
        ),
      );
    }
    if (
      previousRule &&
      rule.requiredExperienceSuggestion <=
        previousRule.requiredExperienceSuggestion
    ) {
      issues.push(
        createIssue(
          "error",
          "layer_experience_not_increasing",
          "层数经验门槛必须随层数严格增加。",
          `layerRuleDrafts.${index}.requiredExperienceSuggestion`,
        ),
      );
    }
  });

  const includedChapters = draft.chapterDrafts.filter(
    (chapter) => chapter.unitGenerationConfig.includeInGeneration,
  );
  if (includedChapters.length === 0) {
    issues.push(
      createIssue(
        "error",
        "included_chapter_missing",
        "至少需要一个参与导入的大章。",
        "chapterDrafts",
      ),
    );
  }
  const chapterCodes = new Set<string>();
  const unitCodes = new Set<string>();
  const formalKnowledgePointIds = new Set<string>();
  includedChapters.forEach((chapter, chapterIndex) => {
    const chapterPath = `chapterDrafts.${chapterIndex}`;
    const chapterCode = normalizeIdPart(chapter.code, "");
    if (!chapterCode || chapterCodes.has(chapterCode)) {
      issues.push(
        createIssue(
          "error",
          "chapter_code_invalid",
          `大章“${chapter.name}”的代码为空或与其他大章重复。`,
          `${chapterPath}.code`,
        ),
      );
    }
    chapterCodes.add(chapterCode);
    if (chapter.name.trim().length === 0 || chapter.description.trim().length < 10) {
      issues.push(
        createIssue(
          "error",
          "chapter_content_invalid",
          `大章“${chapter.name || chapter.code}”需要有效名称和至少 10 字的说明。`,
          chapterPath,
        ),
      );
    }

    const includedUnits = chapter.unitDrafts.filter(
      (unit) => unit.knowledgeGenerationConfig.includeInGeneration,
    );
    if (includedUnits.length === 0) {
      issues.push(
        createIssue(
          "error",
          "included_unit_missing",
          `大章“${chapter.name}”至少需要一个参与导入的单元。`,
          `${chapterPath}.unitDrafts`,
        ),
      );
    }
    includedUnits.forEach((unit, unitIndex) => {
      const unitPath = `${chapterPath}.unitDrafts.${unitIndex}`;
      const unitCode = normalizeIdPart(unit.code, "");
      if (!unitCode || unitCodes.has(unitCode)) {
        issues.push(
          createIssue(
            "error",
            "unit_code_invalid",
            `单元“${unit.name}”的代码为空或与其他单元重复。`,
            `${unitPath}.code`,
          ),
        );
      }
      unitCodes.add(unitCode);
      if (unit.name.trim().length === 0 || unit.description.trim().length < 10) {
        issues.push(
          createIssue(
            "error",
            "unit_content_invalid",
            `单元“${unit.name || unit.code}”需要有效名称和至少 10 字的说明。`,
            unitPath,
          ),
        );
      }
      if (unit.knowledgePointDrafts.length === 0) {
        issues.push(
          createIssue(
            "error",
            "knowledge_points_missing",
            `单元“${unit.name}”尚未生成知识点。`,
            `${unitPath}.knowledgePointDrafts`,
          ),
        );
      }
      const allKnowledgePoints = draft.chapterDrafts.flatMap((item) =>
        item.unitDrafts.flatMap((draftUnit) => draftUnit.knowledgePointDrafts),
      );
      for (const error of validateUnitKnowledgePointDrafts(
        unit,
        technique.maxLayer,
        allKnowledgePoints,
      )) {
        issues.push(
          createIssue(
            "error",
            "knowledge_point_invalid",
            `${unit.name}：${error}`,
            `${unitPath}.knowledgePointDrafts`,
          ),
        );
      }
      unit.knowledgePointDrafts.forEach((knowledgePoint) => {
        const formalId = idMaps.knowledgePointIds.get(knowledgePoint.draftId);
        if (!formalId || formalKnowledgePointIds.has(formalId)) {
          issues.push(
            createIssue(
              "error",
              "knowledge_point_id_collision",
              `知识点“${knowledgePoint.name}”无法获得唯一正式 id。`,
              `${unitPath}.knowledgePointDrafts`,
            ),
          );
        }
        if (formalId) {
          formalKnowledgePointIds.add(formalId);
        }
        if (
          knowledgePoint.baseValueOverride === undefined &&
          knowledgePoint.recommendedBaseValue === undefined
        ) {
          issues.push(
            createIssue(
              "error",
              "knowledge_point_value_missing",
              `知识点“${knowledgePoint.name}”缺少推荐或手动基础价值。`,
              `${unitPath}.knowledgePointDrafts`,
            ),
          );
        }
      });
    });
  });

  return issues;
}

export function validateTechniqueCreationDraftForImport(
  draft: TechniqueCreationDraft,
  catalog: TechniqueImportCatalog,
): DraftValidationIssue[] {
  return validateDraft(draft, catalog, createFormalIdMaps(draft, catalog));
}

function getActionType(
  changes: TechniqueImportFieldChange[],
  hasFormalEntity: boolean,
): TechniqueImportActionType {
  if (!hasFormalEntity) {
    return "create";
  }
  return changes.length > 0 ? "update" : "keep";
}

export function createTechniqueImportPlan(
  draft: TechniqueCreationDraft,
  catalog: TechniqueImportCatalog,
): TechniqueImportPlan {
  const idMaps = createFormalIdMaps(draft, catalog);
  const issues = validateDraft(draft, catalog, idMaps);
  const actions: TechniqueImportAction[] = [];
  const ownershipIndex = createKnowledgeOwnershipIndex(
    catalog.techniques,
    catalog.chapters,
    catalog.units,
  );
  const techniqueDraft = draft.techniqueDraft;
  const targetTechnique = catalog.techniques.find(
    (technique) => technique.id === idMaps.techniqueId,
  );

  function addAction(
    entityType: TechniqueImportEntityType,
    action: TechniqueImportActionType,
    label: string,
    formalEntityId: string | undefined,
    changes: TechniqueImportFieldChange[],
    options: {
      draftEntityId?: string;
      reason?: string;
      requiresConfirmation?: boolean;
    } = {},
  ) {
    actions.push({
      id: `action_${entityType}_${stableHash(
        `${formalEntityId ?? options.draftEntityId ?? label}_${action}`,
      )}`,
      entityType,
      action,
      draftEntityId: options.draftEntityId,
      formalEntityId,
      label,
      changes,
      reason: options.reason,
      requiresConfirmation: options.requiresConfirmation ?? false,
    });
  }

  if (techniqueDraft) {
    const totalBaseValue = draft.chapterDrafts
      .filter((chapter) => chapter.unitGenerationConfig.includeInGeneration)
      .reduce(
      (chapterTotal, chapter) =>
        chapterTotal +
        chapter.unitDrafts
          .filter((unit) => unit.knowledgeGenerationConfig.includeInGeneration)
          .reduce(
          (unitTotal, unit) =>
            unitTotal +
            unit.knowledgePointDrafts.reduce(
              (knowledgeTotal, knowledgePoint) =>
                knowledgeTotal +
                (knowledgePoint.baseValueOverride ??
                  (knowledgePoint.recommendedBaseValue ?? 0) +
                    (knowledgePoint.baseValueAdjustment ?? 0)),
              0,
            ),
            0,
          ),
      0,
    );
    const nextTechniqueValues = {
      sectId: draft.input.target.sectId,
      kind: "structured",
      isSystem: false,
      name: techniqueDraft.name,
      description: techniqueDraft.description,
      courseValueCoefficient:
        techniqueDraft.courseValueCoefficientSuggestion,
      manaWeight: techniqueDraft.manaWeight,
      insightWeight: techniqueDraft.insightWeight,
      soulWeight: techniqueDraft.soulWeight,
      maxLayer: techniqueDraft.maxLayer,
      value: totalBaseValue,
      prerequisiteTechniqueIds: techniqueDraft.prerequisiteSuggestions.flatMap(
        (suggestion) =>
          suggestion.matchedTechniqueId ? [suggestion.matchedTechniqueId] : [],
      ),
    };
    const previousTechniqueValues = targetTechnique
      ? {
          sectId: targetTechnique.sectId,
          kind: targetTechnique.kind,
          isSystem: targetTechnique.isSystem,
          name: targetTechnique.name,
          description: targetTechnique.description,
          courseValueCoefficient: targetTechnique.courseValueCoefficient,
          manaWeight: targetTechnique.manaWeight,
          insightWeight: targetTechnique.insightWeight,
          soulWeight: targetTechnique.soulWeight,
          maxLayer: targetTechnique.maxLayer,
          value: targetTechnique.value,
          prerequisiteTechniqueIds: targetTechnique.prerequisiteTechniqueIds,
        }
      : undefined;
    const changes = createFieldChanges(
      nextTechniqueValues,
      previousTechniqueValues,
    );
    addAction(
      "technique",
      getActionType(changes, Boolean(targetTechnique)),
      techniqueDraft.name,
      idMaps.techniqueId,
      changes,
      {
        requiresConfirmation: Boolean(targetTechnique && changes.length > 0),
      },
    );
  }

  if (draft.practiceDefaultsDraft) {
    const formalDefaults = catalog.practiceDefaults.find(
      (defaults) => defaults.techniqueId === idMaps.techniqueId,
    );
    const nextValues = {
      recordTypeDefaults: draft.practiceDefaultsDraft.recordTypeDefaults,
      requiredExerciseCount:
        draft.practiceDefaultsDraft.requiredExerciseCount,
      requiredNoteCount: draft.practiceDefaultsDraft.requiredNoteCount,
      requiredThinkingCount:
        draft.practiceDefaultsDraft.requiredThinkingCount,
      reviewSchedule: draft.practiceDefaultsDraft.reviewSchedule,
    };
    const previousValues = formalDefaults
      ? {
          recordTypeDefaults: formalDefaults.recordTypeDefaults,
          requiredExerciseCount: formalDefaults.requiredExerciseCount,
          requiredNoteCount: formalDefaults.requiredNoteCount,
          requiredThinkingCount: formalDefaults.requiredThinkingCount,
          reviewSchedule: formalDefaults.reviewSchedule,
        }
      : undefined;
    const changes = createFieldChanges(nextValues, previousValues);
    addAction(
      "practice_defaults",
      getActionType(changes, Boolean(formalDefaults)),
      "功法修炼默认规则",
      `practice_defaults_${idMaps.techniqueId}`,
      changes,
      { requiresConfirmation: Boolean(formalDefaults && changes.length > 0) },
    );
  }

  for (const layerRule of draft.layerRuleDrafts) {
    const formalRule = catalog.layerRules.find(
      (rule) =>
        rule.techniqueId === idMaps.techniqueId &&
        rule.layer === layerRule.layer,
    );
    const formalId = formalRule?.id ?? `layer_${idMaps.techniqueId}_${layerRule.layer}`;
    const nextValues = {
      layer: layerRule.layer,
      requiredExperience: layerRule.requiredExperienceSuggestion,
      requiredCoverageRatio: layerRule.requiredCoverageRatio,
      requiredCoreCoverageRatio: layerRule.requiredCoreCoverageRatio,
      allowedWeakPointRatio: layerRule.allowedWeakPointRatio,
      breakthroughRequirements: layerRule.breakthroughRequirements,
    };
    const previousValues = formalRule
      ? {
          layer: formalRule.layer,
          requiredExperience: formalRule.requiredExperience,
          requiredCoverageRatio: formalRule.requiredCoverageRatio,
          requiredCoreCoverageRatio: formalRule.requiredCoreCoverageRatio,
          allowedWeakPointRatio: formalRule.allowedWeakPointRatio,
          breakthroughRequirements: formalRule.breakthroughRequirements,
        }
      : undefined;
    const changes = createFieldChanges(nextValues, previousValues);
    addAction(
      "layer_rule",
      getActionType(changes, Boolean(formalRule)),
      `第 ${layerRule.layer} 层规则`,
      formalId,
      changes,
      {
        draftEntityId: layerRule.draftId,
        requiresConfirmation: Boolean(formalRule && changes.length > 0),
      },
    );
  }

  const includedChapterIds = new Set<string>();
  const includedUnitIds = new Set<string>();
  const includedKnowledgePointIds = new Set<string>();
  for (const chapter of draft.chapterDrafts) {
    const chapterFormalId = idMaps.chapterIds.get(chapter.draftId);
    if (!chapter.unitGenerationConfig.includeInGeneration) {
      addAction("chapter", "skip", chapter.name, chapterFormalId, [], {
        draftEntityId: chapter.draftId,
        reason: "当前大章未纳入生成和导入范围。",
      });
      continue;
    }
    if (!chapterFormalId) {
      continue;
    }
    includedChapterIds.add(chapterFormalId);
    const formalChapter = catalog.chapters.find(
      (item) => item.id === chapterFormalId,
    );
    const chapterChanges = createFieldChanges(
      {
        techniqueId: idMaps.techniqueId,
        code: chapter.code,
        name: chapter.name,
        description: chapter.description,
        order: chapter.order,
      },
      formalChapter
        ? {
            techniqueId: formalChapter.techniqueId,
            code: formalChapter.code,
            name: formalChapter.name,
            description: formalChapter.description,
            order: formalChapter.order,
          }
        : undefined,
    );
    addAction(
      "chapter",
      getActionType(chapterChanges, Boolean(formalChapter)),
      chapter.name,
      chapterFormalId,
      chapterChanges,
      { draftEntityId: chapter.draftId },
    );

    for (const unit of chapter.unitDrafts) {
      const unitFormalId = idMaps.unitIds.get(unit.draftId);
      if (!unit.knowledgeGenerationConfig.includeInGeneration) {
        addAction("unit", "skip", unit.name, unitFormalId, [], {
          draftEntityId: unit.draftId,
          reason: "当前单元未纳入知识点生成和导入范围。",
        });
        continue;
      }
      if (!unitFormalId) {
        continue;
      }
      includedUnitIds.add(unitFormalId);
      const formalUnit = catalog.units.find((item) => item.id === unitFormalId);
      const unitChanges = createFieldChanges(
        {
          chapterId: chapterFormalId,
          code: unit.code,
          name: unit.name,
          description: unit.description,
          order: unit.order,
        },
        formalUnit
          ? {
              chapterId: formalUnit.chapterId,
              code: formalUnit.code,
              name: formalUnit.name,
              description: formalUnit.description,
              order: formalUnit.order,
            }
          : undefined,
      );
      addAction(
        "unit",
        getActionType(unitChanges, Boolean(formalUnit)),
        unit.name,
        unitFormalId,
        unitChanges,
        { draftEntityId: unit.draftId },
      );

      for (const knowledgePoint of unit.knowledgePointDrafts) {
        const formalId = idMaps.knowledgePointIds.get(knowledgePoint.draftId);
        if (!formalId) {
          continue;
        }
        includedKnowledgePointIds.add(formalId);
        const formalKnowledgePoint = catalog.knowledgePoints.find(
          (item) => item.id === formalId,
        );
        const possibleMatch = formalKnowledgePoint
          ? undefined
          : catalog.knowledgePoints.find(
              (item) =>
                resolveKnowledgePointOwnership(item, ownershipIndex)?.technique
                  .id === idMaps.techniqueId &&
                item.name.trim() === knowledgePoint.name.trim(),
            );
        if (possibleMatch) {
          issues.push(
            createIssue(
              "warning",
              "possible_knowledge_point_match",
              `草案知识点“${knowledgePoint.name}”可能对应已有知识点 ${possibleMatch.id}，当前仍按新建预览，需要用户确认映射。`,
              `knowledgePointDrafts.${knowledgePoint.draftId}`,
            ),
          );
        }
        const nextValues = {
          unitId: unitFormalId,
          displayCode: `${unit.code}-${String(
            unit.knowledgePointDrafts.indexOf(knowledgePoint) + 1,
          ).padStart(3, "0")}`,
          name: knowledgePoint.name,
          description: knowledgePoint.description,
          domainTags: [],
          topicTags: [],
          granularity: knowledgePoint.granularity,
          baseValue:
            knowledgePoint.baseValueOverride ??
            ((knowledgePoint.recommendedBaseValue ?? 0) +
              (knowledgePoint.baseValueAdjustment ?? 0)),
          difficulty: knowledgePoint.difficulty,
          importance: knowledgePoint.importance,
          targetLayer: knowledgePoint.targetLayer,
          maxTrainableLayer: knowledgePoint.maxTrainableLayer,
          requiredExerciseCount: knowledgePoint.requiredExerciseCount,
          requiredNoteCount: knowledgePoint.requiredNoteCount,
          requiredThinkingCount: knowledgePoint.requiredThinkingCount,
          reviewIntervalsOverride: knowledgePoint.reviewIntervalsOverride,
          manaWeight: knowledgePoint.manaWeight,
          insightWeight: knowledgePoint.insightWeight,
          prerequisiteKnowledgePointIds:
            knowledgePoint.prerequisiteDraftIds.flatMap((draftId) => {
              const prerequisiteId = idMaps.knowledgePointIds.get(draftId);
              return prerequisiteId ? [prerequisiteId] : [];
            }),
        };
        const previousValues = formalKnowledgePoint
          ? {
              unitId: formalKnowledgePoint.unitId,
              displayCode: formalKnowledgePoint.displayCode,
              name: formalKnowledgePoint.name,
              description: formalKnowledgePoint.description,
              domainTags: formalKnowledgePoint.domainTags,
              topicTags: formalKnowledgePoint.topicTags,
              granularity: formalKnowledgePoint.granularity,
              baseValue: formalKnowledgePoint.baseValue,
              difficulty: formalKnowledgePoint.difficulty,
              importance: formalKnowledgePoint.importance,
              targetLayer: formalKnowledgePoint.targetLayer,
              maxTrainableLayer: formalKnowledgePoint.maxTrainableLayer,
              requiredExerciseCount:
                formalKnowledgePoint.requiredExerciseCount,
              requiredNoteCount: formalKnowledgePoint.requiredNoteCount,
              requiredThinkingCount:
                formalKnowledgePoint.requiredThinkingCount,
              reviewIntervalsOverride:
                formalKnowledgePoint.reviewIntervalsOverride,
              manaWeight: formalKnowledgePoint.manaWeight,
              insightWeight: formalKnowledgePoint.insightWeight,
              prerequisiteKnowledgePointIds:
                formalKnowledgePoint.prerequisiteKnowledgePointIds,
            }
          : undefined;
        const changes = createFieldChanges(nextValues, previousValues);
        addAction(
          "knowledge_point",
          getActionType(changes, Boolean(formalKnowledgePoint)),
          knowledgePoint.name,
          formalId,
          changes,
          {
            draftEntityId: knowledgePoint.draftId,
            reason: possibleMatch
              ? `存在候选匹配 ${possibleMatch.id}，未确认前不自动合并。`
              : undefined,
            requiresConfirmation: Boolean(possibleMatch),
          },
        );
      }
    }
  }

  if (draft.input.target.mode === "merge_existing") {
    catalog.chapters
      .filter(
        (chapter) =>
          chapter.techniqueId === idMaps.techniqueId &&
          !includedChapterIds.has(chapter.id),
      )
      .forEach((chapter) =>
        addAction("chapter", "keep", chapter.name, chapter.id, [], {
          reason: "正式大章未出现在草案中，默认保留。",
        }),
      );
    catalog.units
      .filter(
        (unit) =>
          catalog.chapters.find((chapter) => chapter.id === unit.chapterId)
            ?.techniqueId === idMaps.techniqueId &&
          !includedUnitIds.has(unit.id),
      )
      .forEach((unit) =>
        addAction("unit", "keep", unit.name, unit.id, [], {
          reason: "正式单元未出现在草案中，默认保留。",
        }),
      );
    catalog.knowledgePoints
      .filter(
        (knowledgePoint) =>
          resolveKnowledgePointOwnership(knowledgePoint, ownershipIndex)
            ?.technique.id === idMaps.techniqueId &&
          !includedKnowledgePointIds.has(knowledgePoint.id),
      )
      .forEach((knowledgePoint) =>
        addAction(
          "knowledge_point",
          "keep",
          knowledgePoint.name,
          knowledgePoint.id,
          [],
          { reason: "正式知识点未出现在草案中，默认保留。" },
        ),
      );
  }

  const summary = actions.reduce(
    (currentSummary, action) => ({
      ...currentSummary,
      [`${action.action}Count`]:
        currentSummary[`${action.action}Count`] + 1,
    }),
    {
      createCount: 0,
      updateCount: 0,
      keepCount: 0,
      skipCount: 0,
      archiveCount: 0,
    },
  );
  const now = new Date().toISOString();

  return {
    id: `plan_${stableHash(draft.id)}`,
    draftId: draft.id,
    mode: draft.input.target.mode,
    targetSectId: draft.input.target.sectId,
    targetTechniqueId:
      draft.input.target.mode === "merge_existing"
        ? draft.input.target.targetTechniqueId
        : idMaps.techniqueId,
    actions,
    summary,
    issues,
    status: "preview",
    createdAt: now,
    updatedAt: now,
  };
}
