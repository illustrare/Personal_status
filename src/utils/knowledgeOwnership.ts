import type {
  KnowledgePoint,
  Technique,
  TechniqueChapter,
  TechniqueUnit,
} from "../types/domain";

export interface KnowledgePointOwnership {
  unit: TechniqueUnit;
  chapter: TechniqueChapter;
  technique: Technique;
  sectId: string;
}

export interface KnowledgeOwnershipIndex {
  unitsById: Map<string, TechniqueUnit>;
  chaptersById: Map<string, TechniqueChapter>;
  techniquesById: Map<string, Technique>;
}

export function createKnowledgeOwnershipIndex(
  techniques: Technique[],
  chapters: TechniqueChapter[],
  units: TechniqueUnit[],
): KnowledgeOwnershipIndex {
  return {
    unitsById: new Map(units.map((unit) => [unit.id, unit])),
    chaptersById: new Map(chapters.map((chapter) => [chapter.id, chapter])),
    techniquesById: new Map(
      techniques.map((technique) => [technique.id, technique]),
    ),
  };
}

export function resolveKnowledgePointOwnership(
  knowledgePoint: KnowledgePoint,
  index: KnowledgeOwnershipIndex,
): KnowledgePointOwnership | undefined {
  const unit = index.unitsById.get(knowledgePoint.unitId);
  const chapter = unit ? index.chaptersById.get(unit.chapterId) : undefined;
  const technique = chapter
    ? index.techniquesById.get(chapter.techniqueId)
    : undefined;

  if (!unit || !chapter || !technique) {
    return undefined;
  }

  return {
    unit,
    chapter,
    technique,
    sectId: technique.sectId,
  };
}

export function getActiveKnowledgePoints(
  knowledgePoints: KnowledgePoint[],
): KnowledgePoint[] {
  return knowledgePoints.filter(
    (knowledgePoint) => knowledgePoint.archivedAt === undefined,
  );
}

export function getKnowledgePointsByTechnique(
  knowledgePoints: KnowledgePoint[],
  techniqueId: string,
  index: KnowledgeOwnershipIndex,
): KnowledgePoint[] {
  return getActiveKnowledgePoints(knowledgePoints).filter(
    (knowledgePoint) =>
      resolveKnowledgePointOwnership(knowledgePoint, index)?.technique.id ===
      techniqueId,
  );
}

export function getArchivedKnowledgePointsByTechnique(
  knowledgePoints: KnowledgePoint[],
  techniqueId: string,
  index: KnowledgeOwnershipIndex,
): KnowledgePoint[] {
  return knowledgePoints.filter(
    (knowledgePoint) =>
      knowledgePoint.archivedAt !== undefined &&
      resolveKnowledgePointOwnership(knowledgePoint, index)?.technique.id ===
        techniqueId,
  );
}
