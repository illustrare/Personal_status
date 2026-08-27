import type {
  KnowledgePoint,
  OwnershipChangeRecord,
  OwnershipEntityType,
  OwnershipPathSnapshot,
  Sect,
  Technique,
  TechniqueChapter,
  TechniqueUnit,
} from "../types/domain";
import {
  createKnowledgeOwnershipIndex,
  resolveKnowledgePointOwnership,
} from "./knowledgeOwnership";

export interface OwnershipCatalog {
  sects: Sect[];
  techniques: Technique[];
  chapters: TechniqueChapter[];
  units: TechniqueUnit[];
}

export interface OwnershipMoveResult<TEntity> {
  entity: TEntity;
  change: OwnershipChangeRecord;
}

type MoveOptions = {
  reason?: string;
  changedAt?: string;
  changeId?: string;
};

function createChangeId(): string {
  return `ownership_change_${crypto.randomUUID()}`;
}

function requireEntity<TEntity>(
  entity: TEntity | undefined,
  message: string,
): TEntity {
  if (!entity) {
    throw new Error(message);
  }
  return entity;
}

function getTechniquePath(technique: Technique): OwnershipPathSnapshot {
  return {
    sectId: technique.sectId,
    techniqueId: technique.id,
  };
}

function getChapterPath(
  chapter: TechniqueChapter,
  catalog: OwnershipCatalog,
): OwnershipPathSnapshot {
  const technique = requireEntity(
    catalog.techniques.find((item) => item.id === chapter.techniqueId),
    `章节 ${chapter.id} 所属功法不存在。`,
  );
  return {
    ...getTechniquePath(technique),
    chapterId: chapter.id,
  };
}

function getUnitPath(
  unit: TechniqueUnit,
  catalog: OwnershipCatalog,
): OwnershipPathSnapshot {
  const chapter = requireEntity(
    catalog.chapters.find((item) => item.id === unit.chapterId),
    `单元 ${unit.id} 所属章节不存在。`,
  );
  return {
    ...getChapterPath(chapter, catalog),
    unitId: unit.id,
  };
}

function getKnowledgePointPath(
  knowledgePoint: KnowledgePoint,
  catalog: OwnershipCatalog,
): OwnershipPathSnapshot {
  const ownership = requireEntity(
    resolveKnowledgePointOwnership(
      knowledgePoint,
      createKnowledgeOwnershipIndex(
        catalog.techniques,
        catalog.chapters,
        catalog.units,
      ),
    ),
    `知识点 ${knowledgePoint.id} 的归属路径不完整。`,
  );
  return {
    sectId: ownership.sectId,
    techniqueId: ownership.technique.id,
    chapterId: ownership.chapter.id,
    unitId: ownership.unit.id,
  };
}

function createChange(
  entityType: OwnershipEntityType,
  entityId: string,
  fromParentId: string,
  toParentId: string,
  fromPath: OwnershipPathSnapshot,
  toPath: OwnershipPathSnapshot,
  options: MoveOptions,
): OwnershipChangeRecord {
  if (fromParentId === toParentId) {
    throw new Error("目标归属与当前归属相同，无需移动。");
  }

  return {
    id: options.changeId ?? createChangeId(),
    entityType,
    entityId,
    fromParentId,
    toParentId,
    fromPath,
    toPath,
    reason: options.reason?.trim() || undefined,
    changedAt: options.changedAt ?? new Date().toISOString(),
  };
}

export function moveTechniqueToSect(
  technique: Technique,
  toSectId: string,
  catalog: OwnershipCatalog,
  options: MoveOptions = {},
): OwnershipMoveResult<Technique> {
  const changedAt = options.changedAt ?? new Date().toISOString();
  requireEntity(
    catalog.sects.find((sect) => sect.id === toSectId),
    `目标门派 ${toSectId} 不存在。`,
  );
  const entity = {
    ...technique,
    sectId: toSectId,
    updatedAt: changedAt,
  };
  return {
    entity,
    change: createChange(
      "technique",
      technique.id,
      technique.sectId,
      toSectId,
      getTechniquePath(technique),
      getTechniquePath(entity),
      { ...options, changedAt },
    ),
  };
}

export function moveChapterToTechnique(
  chapter: TechniqueChapter,
  toTechniqueId: string,
  catalog: OwnershipCatalog,
  options: MoveOptions = {},
): OwnershipMoveResult<TechniqueChapter> {
  const changedAt = options.changedAt ?? new Date().toISOString();
  requireEntity(
    catalog.techniques.find((technique) => technique.id === toTechniqueId),
    `目标功法 ${toTechniqueId} 不存在。`,
  );
  const entity = {
    ...chapter,
    techniqueId: toTechniqueId,
    updatedAt: changedAt,
  };
  return {
    entity,
    change: createChange(
      "chapter",
      chapter.id,
      chapter.techniqueId,
      toTechniqueId,
      getChapterPath(chapter, catalog),
      getChapterPath(entity, catalog),
      { ...options, changedAt },
    ),
  };
}

export function moveUnitToChapter(
  unit: TechniqueUnit,
  toChapterId: string,
  catalog: OwnershipCatalog,
  options: MoveOptions = {},
): OwnershipMoveResult<TechniqueUnit> {
  const changedAt = options.changedAt ?? new Date().toISOString();
  requireEntity(
    catalog.chapters.find((chapter) => chapter.id === toChapterId),
    `目标章节 ${toChapterId} 不存在。`,
  );
  const entity = {
    ...unit,
    chapterId: toChapterId,
    updatedAt: changedAt,
  };
  return {
    entity,
    change: createChange(
      "unit",
      unit.id,
      unit.chapterId,
      toChapterId,
      getUnitPath(unit, catalog),
      getUnitPath(entity, catalog),
      { ...options, changedAt },
    ),
  };
}

export function moveKnowledgePointToUnit(
  knowledgePoint: KnowledgePoint,
  toUnitId: string,
  catalog: OwnershipCatalog,
  options: MoveOptions = {},
): OwnershipMoveResult<KnowledgePoint> {
  const changedAt = options.changedAt ?? new Date().toISOString();
  requireEntity(
    catalog.units.find((unit) => unit.id === toUnitId),
    `目标单元 ${toUnitId} 不存在。`,
  );
  const entity = {
    ...knowledgePoint,
    unitId: toUnitId,
    updatedAt: changedAt,
  };
  return {
    entity,
    change: createChange(
      "knowledge_point",
      knowledgePoint.id,
      knowledgePoint.unitId,
      toUnitId,
      getKnowledgePointPath(knowledgePoint, catalog),
      getKnowledgePointPath(entity, catalog),
      { ...options, changedAt },
    ),
  };
}
