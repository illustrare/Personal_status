import type {
  CultivationStructureRepository,
  KnowledgePointMigrationPreview,
  PracticeRecord,
  PracticeRecordKnowledgePoint,
  TechniqueCreationProject,
  TechniqueLayerRule,
  TechniqueMigrationPreview,
  TechniquePracticeDefaults,
} from "../types/domain";
import {
  createKnowledgeOwnershipIndex,
  resolveKnowledgePointOwnership,
} from "./knowledgeOwnership";
import {
  moveKnowledgePointToUnit,
  moveTechniqueToSect,
} from "./ownershipMoves";

const SYSTEM_STANDALONE_SECT_ID = "system_standalone";

function isTechniqueDestinationAllowed(
  sect: CultivationStructureRepository["sects"][number] | undefined,
): boolean {
  return (
    sect !== undefined &&
    (!sect.isSystem || sect.id === SYSTEM_STANDALONE_SECT_ID)
  );
}

export interface MigrationReferenceData {
  practiceRecords: PracticeRecord[];
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[];
  practiceDefaults: TechniquePracticeDefaults[];
  layerRules: TechniqueLayerRule[];
  draftProjects: TechniqueCreationProject[];
}

function getRepositoryCatalog(repository: CultivationStructureRepository) {
  return {
    sects: repository.sects,
    techniques: repository.techniques,
    chapters: repository.chapters,
    units: repository.units,
  };
}

export function createTechniqueMigrationPreview(
  repository: CultivationStructureRepository,
  techniqueId: string,
  toSectId: string,
  references: MigrationReferenceData,
): TechniqueMigrationPreview {
  const technique = repository.techniques.find(
    (item) => item.id === techniqueId,
  );
  const targetSect = repository.sects.find((sect) => sect.id === toSectId);

  if (!technique) {
    throw new Error(`功法 ${techniqueId} 不存在。`);
  }
  if (technique.isSystem) {
    throw new Error("系统功法不能迁移到普通门派。");
  }
  if (!isTechniqueDestinationAllowed(targetSect)) {
    throw new Error("功法只能迁移到正式门派或独立知识。");
  }
  if (technique.sectId === toSectId) {
    throw new Error("目标门派与当前门派相同，无需迁移。");
  }

  const chapters = repository.chapters.filter(
    (chapter) => chapter.techniqueId === techniqueId,
  );
  const chapterIds = new Set(chapters.map((chapter) => chapter.id));
  const units = repository.units.filter((unit) =>
    chapterIds.has(unit.chapterId),
  );
  const unitIds = new Set(units.map((unit) => unit.id));
  const records = references.practiceRecords.filter(
    (record) => record.techniqueId === techniqueId,
  );

  return {
    techniqueId,
    fromSectId: technique.sectId,
    toSectId,
    chapterCount: chapters.length,
    unitCount: units.length,
    knowledgePointCount: repository.knowledgePoints.filter((knowledgePoint) =>
      unitIds.has(knowledgePoint.unitId),
    ).length,
    activePracticeRecordCount: records.filter(
      (record) => record.deletedAt === undefined,
    ).length,
    deletedPracticeRecordCount: records.filter(
      (record) => record.deletedAt !== undefined,
    ).length,
    practiceDefaultsCount: references.practiceDefaults.filter(
      (defaults) => defaults.techniqueId === techniqueId,
    ).length,
    layerRuleCount: references.layerRules.filter(
      (rule) => rule.techniqueId === techniqueId,
    ).length,
    activeDraftProjectCount: references.draftProjects.filter(
      (project) =>
        project.status === "active" &&
        project.input.target.mode === "merge_existing" &&
        project.input.target.targetTechniqueId === techniqueId,
    ).length,
  };
}

export function applyTechniqueMigration(
  repository: CultivationStructureRepository,
  techniqueId: string,
  toSectId: string,
  options: { reason?: string; changedAt?: string; changeId?: string } = {},
): CultivationStructureRepository {
  const technique = repository.techniques.find(
    (item) => item.id === techniqueId,
  );

  if (!technique) {
    throw new Error(`功法 ${techniqueId} 不存在。`);
  }
  if (technique.isSystem) {
    throw new Error("系统功法不能迁移到普通门派。");
  }
  const targetSect = repository.sects.find((sect) => sect.id === toSectId);
  if (!isTechniqueDestinationAllowed(targetSect)) {
    throw new Error("功法只能迁移到正式门派或独立知识。");
  }

  const result = moveTechniqueToSect(
    technique,
    toSectId,
    getRepositoryCatalog(repository),
    options,
  );

  return {
    ...repository,
    techniques: repository.techniques.map((item) =>
      item.id === techniqueId ? result.entity : item,
    ),
    ownershipChanges: [...repository.ownershipChanges, result.change],
    updatedAt: result.change.changedAt,
  };
}

export function createKnowledgePointMigrationPreview(
  repository: CultivationStructureRepository,
  knowledgePointId: string,
  toUnitId: string,
  practiceRecords: PracticeRecord[],
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[],
): KnowledgePointMigrationPreview {
  const knowledgePoint = repository.knowledgePoints.find(
    (item) => item.id === knowledgePointId,
  );

  if (!knowledgePoint) {
    throw new Error(`知识点 ${knowledgePointId} 不存在。`);
  }
  if (knowledgePoint.unitId === toUnitId) {
    throw new Error("目标单元与当前单元相同，无需迁移。");
  }

  const ownershipIndex = createKnowledgeOwnershipIndex(
    repository.techniques,
    repository.chapters,
    repository.units,
  );
  const fromOwnership = resolveKnowledgePointOwnership(
    knowledgePoint,
    ownershipIndex,
  );
  const toOwnership = resolveKnowledgePointOwnership(
    { ...knowledgePoint, unitId: toUnitId },
    ownershipIndex,
  );

  if (!fromOwnership || !toOwnership) {
    throw new Error("知识点迁移前后的归属路径必须完整。");
  }

  const linkedRecordIds = new Set(
    practiceRecordKnowledgePoints
      .filter((link) => link.knowledgePointId === knowledgePointId)
      .map((link) => link.recordId),
  );
  const linkedRecords = practiceRecords.filter((record) =>
    linkedRecordIds.has(record.id),
  );

  return {
    knowledgePointId,
    fromPath: {
      sectId: fromOwnership.sectId,
      techniqueId: fromOwnership.technique.id,
      chapterId: fromOwnership.chapter.id,
      unitId: fromOwnership.unit.id,
    },
    toPath: {
      sectId: toOwnership.sectId,
      techniqueId: toOwnership.technique.id,
      chapterId: toOwnership.chapter.id,
      unitId: toOwnership.unit.id,
    },
    isCrossTechnique:
      fromOwnership.technique.id !== toOwnership.technique.id,
    movesIntoStandalone:
      fromOwnership.technique.kind !== "standalone_container" &&
      toOwnership.technique.kind === "standalone_container",
    movesOutOfStandalone:
      fromOwnership.technique.kind === "standalone_container" &&
      toOwnership.technique.kind !== "standalone_container",
    activePracticeRecordCount: linkedRecords.filter(
      (record) => record.deletedAt === undefined,
    ).length,
    deletedPracticeRecordCount: linkedRecords.filter(
      (record) => record.deletedAt !== undefined,
    ).length,
    keepsCustomReviewIntervals:
      knowledgePoint.reviewIntervalsOverride !== undefined,
  };
}

export function applyKnowledgePointMigration(
  repository: CultivationStructureRepository,
  knowledgePointId: string,
  toUnitId: string,
  options: { reason?: string; changedAt?: string; changeId?: string } = {},
): CultivationStructureRepository {
  const knowledgePoint = repository.knowledgePoints.find(
    (item) => item.id === knowledgePointId,
  );

  if (!knowledgePoint) {
    throw new Error(`知识点 ${knowledgePointId} 不存在。`);
  }

  const result = moveKnowledgePointToUnit(
    knowledgePoint,
    toUnitId,
    getRepositoryCatalog(repository),
    options,
  );

  return {
    ...repository,
    knowledgePoints: repository.knowledgePoints.map((item) =>
      item.id === knowledgePointId ? result.entity : item,
    ),
    ownershipChanges: [...repository.ownershipChanges, result.change],
    updatedAt: result.change.changedAt,
  };
}

export function getCanonicalTechniquePath(
  repository: CultivationStructureRepository,
  techniqueId: string,
): string | undefined {
  const technique = repository.techniques.find(
    (item) => item.id === techniqueId && !item.isSystem,
  );
  return technique
    ? technique.sectId === SYSTEM_STANDALONE_SECT_ID
      ? `/cultivation/independent/techniques/${technique.id}`
      : `/cultivation/sects/${technique.sectId}/techniques/${technique.id}`
    : undefined;
}
