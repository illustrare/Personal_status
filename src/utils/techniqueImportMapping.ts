import type {
  CultivationStructureRepository,
  TechniqueImportMappingRecord,
  TechniqueImportPlan,
} from "../types/domain";

export function createTechniqueImportMappingRecord(
  plan: TechniqueImportPlan,
  projectId: string,
  variantId?: string,
  options: {
    id?: string;
    importedAt?: string;
    confirmedActionIds?: string[];
    acceptedIssueIds?: string[];
  } = {},
): TechniqueImportMappingRecord {
  if (plan.status !== "applied") {
    throw new Error("只有已经原子写入正式数据的导入计划才能保存映射。");
  }
  if (!plan.targetTechniqueId) {
    throw new Error("导入计划缺少正式功法 id。");
  }

  return {
    id: options.id ?? `import_mapping_${crypto.randomUUID()}`,
    planId: plan.id,
    projectId,
    variantId,
    formalTechniqueId: plan.targetTechniqueId,
    entityMappings: plan.actions.flatMap((action) =>
      action.draftEntityId && action.formalEntityId
        ? [
            {
              entityType: action.entityType,
              draftEntityId: action.draftEntityId,
              formalEntityId: action.formalEntityId,
            },
          ]
        : [],
    ),
    confirmedActionIds: structuredClone(options.confirmedActionIds ?? []),
    acceptedIssueIds: structuredClone(options.acceptedIssueIds ?? []),
    actionSnapshot: structuredClone(plan.actions),
    importedAt: options.importedAt ?? new Date().toISOString(),
  };
}

export function addTechniqueImportMapping(
  repository: CultivationStructureRepository,
  mapping: TechniqueImportMappingRecord,
): CultivationStructureRepository {
  const duplicate = repository.importMappings.some(
    (item) => item.id === mapping.id,
  );

  if (duplicate) {
    throw new Error(`导入映射 ${mapping.id} 已存在。`);
  }

  return {
    ...repository,
    importMappings: [...repository.importMappings, mapping],
    updatedAt: mapping.importedAt,
  };
}
