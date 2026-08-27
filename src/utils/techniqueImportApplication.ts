import type {
  CultivationStructureRepository,
  KnowledgePoint,
  Technique,
  TechniqueChapter,
  TechniqueImportAction,
  TechniqueImportPlan,
  TechniqueLayerRule,
  TechniquePracticeDefaults,
  TechniqueUnit,
} from "../types/domain";
import {
  addTechniqueImportMapping,
  createTechniqueImportMappingRecord,
} from "./techniqueImportMapping";

export type TechniqueImportApplicationResult = {
  cultivationStructureRepository: CultivationStructureRepository;
  practiceDefaults: TechniquePracticeDefaults[];
  layerRules: TechniqueLayerRule[];
};

export type TechniqueImportApplicationOptions = {
  projectId: string;
  variantId?: string;
  confirmedActionIds: string[];
  acceptedIssueIds: string[];
  appliedAt?: string;
};

function getNextValues(action: TechniqueImportAction): Record<string, unknown> {
  return action.changes.reduce<Record<string, unknown>>(
    (values, change) => ({ ...values, [change.field]: change.nextValue }),
    {},
  );
}

function upsertById<TEntity extends { id: string }>(
  items: TEntity[],
  entity: TEntity,
): TEntity[] {
  const index = items.findIndex((item) => item.id === entity.id);
  if (index < 0) {
    return [...items, entity];
  }
  return items.map((item) => (item.id === entity.id ? entity : item));
}

function requireFormalId(action: TechniqueImportAction): string {
  if (!action.formalEntityId) {
    throw new Error(`导入动作“${action.label}”缺少正式实体 id。`);
  }
  return action.formalEntityId;
}

function assertImportCanApply(
  plan: TechniqueImportPlan,
  options: TechniqueImportApplicationOptions,
) {
  const errors = plan.issues.filter((issue) => issue.severity === "error");
  if (errors.length > 0) {
    throw new Error("导入计划仍有错误，不能写入正式数据。");
  }

  const confirmationSet = new Set(options.confirmedActionIds);
  const missingActionConfirmation = plan.actions.find(
    (action) => action.requiresConfirmation && !confirmationSet.has(action.id),
  );
  if (missingActionConfirmation) {
    throw new Error(`请先确认动作：${missingActionConfirmation.label}`);
  }

  const warningSet = new Set(options.acceptedIssueIds);
  const missingWarning = plan.issues.find(
    (issue) =>
      issue.severity === "warning" &&
      !warningSet.has(issue.id),
  );
  if (missingWarning) {
    throw new Error(`请先确认警告：${missingWarning.message}`);
  }
}

function applyTechniqueAction(
  action: TechniqueImportAction,
  techniques: Technique[],
  appliedAt: string,
): Technique[] {
  if (action.entityType !== "technique" || !["create", "update"].includes(action.action)) {
    return techniques;
  }
  const id = requireFormalId(action);
  const values = getNextValues(action);
  const existing = techniques.find((item) => item.id === id);
  const entity: Technique = {
    id,
    sectId: values.sectId as string,
    kind: values.kind as Technique["kind"],
    isSystem: values.isSystem as boolean,
    name: values.name as string,
    description: values.description as string,
    courseValueCoefficient: values.courseValueCoefficient as number,
    manaWeight: values.manaWeight as number,
    insightWeight: values.insightWeight as number,
    soulWeight: values.soulWeight as number,
    currentLayer: existing?.currentLayer ?? 0,
    maxLayer: values.maxLayer as number,
    value: values.value as number,
    currentValue: existing?.currentValue ?? 0,
    nextLayerRequiredValue: existing?.nextLayerRequiredValue ?? 0,
    prerequisiteTechniqueIds: values.prerequisiteTechniqueIds as string[],
    isDefault: existing?.isDefault ?? false,
    order: existing?.order ?? techniques.length + 1,
    archivedAt: existing?.archivedAt,
    createdAt: existing?.createdAt ?? appliedAt,
    updatedAt: appliedAt,
  };
  return upsertById(techniques, entity);
}

function applyStructureAction(
  action: TechniqueImportAction,
  repository: CultivationStructureRepository,
  appliedAt: string,
): CultivationStructureRepository {
  if (!["create", "update"].includes(action.action)) {
    return repository;
  }
  const values = getNextValues(action);
  const id = requireFormalId(action);
  if (action.entityType === "chapter") {
    const existing = repository.chapters.find((item) => item.id === id);
    const entity: TechniqueChapter = { id, ...(values as Omit<TechniqueChapter, "id" | "archivedAt" | "createdAt" | "updatedAt">), archivedAt: existing?.archivedAt, createdAt: existing?.createdAt ?? appliedAt, updatedAt: appliedAt };
    return { ...repository, chapters: upsertById(repository.chapters, entity) };
  }
  if (action.entityType === "unit") {
    const existing = repository.units.find((item) => item.id === id);
    const entity: TechniqueUnit = { id, ...(values as Omit<TechniqueUnit, "id" | "archivedAt" | "createdAt" | "updatedAt">), archivedAt: existing?.archivedAt, createdAt: existing?.createdAt ?? appliedAt, updatedAt: appliedAt };
    return { ...repository, units: upsertById(repository.units, entity) };
  }
  if (action.entityType === "knowledge_point") {
    const existing = repository.knowledgePoints.find((item) => item.id === id);
    const entity: KnowledgePoint = {
      id,
      ...(values as Omit<KnowledgePoint, "id" | "currentLayer" | "status" | "reviewStatus" | "reviewStage" | "isDecayed" | "archivedAt" | "createdAt" | "updatedAt">),
      currentLayer: existing?.currentLayer ?? 0,
      status: existing?.status ?? "not_started",
      reviewStatus: existing?.reviewStatus ?? "not_scheduled",
      reviewStage: existing?.reviewStage ?? 0,
      lastReviewedAt: existing?.lastReviewedAt,
      nextReviewAt: existing?.nextReviewAt,
      lastPracticedAt: existing?.lastPracticedAt,
      isDecayed: existing?.isDecayed ?? false,
      archivedAt: existing?.archivedAt,
      createdAt: existing?.createdAt ?? appliedAt,
      updatedAt: appliedAt,
    };
    return { ...repository, knowledgePoints: upsertById(repository.knowledgePoints, entity) };
  }
  return repository;
}

function applyRuleAction(
  action: TechniqueImportAction,
  practiceDefaults: TechniquePracticeDefaults[],
  layerRules: TechniqueLayerRule[],
  techniqueId: string,
  appliedAt: string,
): { practiceDefaults: TechniquePracticeDefaults[]; layerRules: TechniqueLayerRule[] } {
  if (!["create", "update"].includes(action.action)) {
    return { practiceDefaults, layerRules };
  }
  const values = getNextValues(action);
  if (action.entityType === "practice_defaults") {
    const existing = practiceDefaults.find((item) => item.techniqueId === techniqueId);
    const entity: TechniquePracticeDefaults = { techniqueId, ...(values as Omit<TechniquePracticeDefaults, "techniqueId" | "createdAt" | "updatedAt">), createdAt: existing?.createdAt ?? appliedAt, updatedAt: appliedAt };
    return { practiceDefaults: [...practiceDefaults.filter((item) => item.techniqueId !== techniqueId), entity], layerRules };
  }
  if (action.entityType === "layer_rule") {
    const id = requireFormalId(action);
    const existing = layerRules.find((item) => item.id === id);
    const entity: TechniqueLayerRule = { id, techniqueId, ...(values as Omit<TechniqueLayerRule, "id" | "techniqueId" | "isAiGenerated" | "isUserCustomized" | "createdAt" | "updatedAt">), isAiGenerated: true, isUserCustomized: existing?.isUserCustomized ?? false, createdAt: existing?.createdAt ?? appliedAt, updatedAt: appliedAt };
    return { practiceDefaults, layerRules: upsertById(layerRules, entity) };
  }
  return { practiceDefaults, layerRules };
}

export function applyTechniqueImportPlan(
  plan: TechniqueImportPlan,
  repository: CultivationStructureRepository,
  practiceDefaults: TechniquePracticeDefaults[],
  layerRules: TechniqueLayerRule[],
  options: TechniqueImportApplicationOptions,
): TechniqueImportApplicationResult {
  assertImportCanApply(plan, options);
  const techniqueId = plan.targetTechniqueId;
  if (!techniqueId) {
    throw new Error("导入计划缺少目标正式功法 id。");
  }
  const appliedAt = options.appliedAt ?? new Date().toISOString();
  let nextRepository = repository;
  let nextPracticeDefaults = practiceDefaults;
  let nextLayerRules = layerRules;

  for (const action of plan.actions) {
    nextRepository = {
      ...applyStructureAction(action, nextRepository, appliedAt),
      techniques: applyTechniqueAction(action, nextRepository.techniques, appliedAt),
    };
    const nextRules = applyRuleAction(action, nextPracticeDefaults, nextLayerRules, techniqueId, appliedAt);
    nextPracticeDefaults = nextRules.practiceDefaults;
    nextLayerRules = nextRules.layerRules;
  }

  const appliedPlan: TechniqueImportPlan = { ...plan, status: "applied", updatedAt: appliedAt };
  const mapping = createTechniqueImportMappingRecord(appliedPlan, options.projectId, options.variantId, {
    importedAt: appliedAt,
    confirmedActionIds: options.confirmedActionIds,
    acceptedIssueIds: options.acceptedIssueIds,
  });
  return {
    cultivationStructureRepository: addTechniqueImportMapping(
      { ...nextRepository, updatedAt: appliedAt },
      mapping,
    ),
    practiceDefaults: nextPracticeDefaults,
    layerRules: nextLayerRules,
  };
}
