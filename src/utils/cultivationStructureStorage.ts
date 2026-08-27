import { defaultKnowledgePoints } from "../data/defaultKnowledgePoints";
import { defaultSects } from "../data/defaultSects";
import {
  defaultTechniqueChapters,
  defaultTechniqueUnits,
} from "../data/defaultTechniqueStructure";
import { defaultTechniques } from "../data/defaultTechniques";
import type {
  CultivationStructureRepository,
  KnowledgePoint,
  Sect,
  Technique,
  TechniqueChapter,
  TechniqueUnit,
} from "../types/domain";

const CULTIVATION_STRUCTURE_STORAGE_KEY =
  "personal-status:cultivation-structure";
const CULTIVATION_STRUCTURE_SCHEMA_VERSION = "1.0";

function cloneItems<TEntity>(items: TEntity[]): TEntity[] {
  return structuredClone(items);
}

function mergeById<TEntity extends { id: string }>(
  defaults: TEntity[],
  stored: TEntity[],
): TEntity[] {
  const storedById = new Map(stored.map((item) => [item.id, item]));
  const defaultIds = new Set(defaults.map((item) => item.id));

  return [
    ...defaults.map((item) => storedById.get(item.id) ?? item),
    ...stored.filter((item) => !defaultIds.has(item.id)),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readEntityArray<TEntity>(
  repository: Record<string, unknown>,
  key: string,
): TEntity[] {
  const value = repository[key];
  return Array.isArray(value) ? (value as TEntity[]) : [];
}

export function createDefaultCultivationStructureRepository(): CultivationStructureRepository {
  const now = new Date().toISOString();
  return {
    schemaVersion: CULTIVATION_STRUCTURE_SCHEMA_VERSION,
    sects: cloneItems(defaultSects),
    techniques: cloneItems(defaultTechniques),
    chapters: cloneItems(defaultTechniqueChapters),
    units: cloneItems(defaultTechniqueUnits),
    knowledgePoints: cloneItems(defaultKnowledgePoints),
    ownershipChanges: [],
    importMappings: [],
    updatedAt: now,
  };
}

export function loadCultivationStructureRepository(): CultivationStructureRepository {
  const storedValue = localStorage.getItem(CULTIVATION_STRUCTURE_STORAGE_KEY);

  if (!storedValue) {
    return createDefaultCultivationStructureRepository();
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!isRecord(parsedValue)) {
      return createDefaultCultivationStructureRepository();
    }

    return {
      schemaVersion: CULTIVATION_STRUCTURE_SCHEMA_VERSION,
      sects: mergeById(
        cloneItems(defaultSects),
        readEntityArray<Sect>(parsedValue, "sects"),
      ),
      techniques: mergeById(
        cloneItems(defaultTechniques),
        readEntityArray<Technique>(parsedValue, "techniques"),
      ),
      chapters: mergeById(
        cloneItems(defaultTechniqueChapters),
        readEntityArray<TechniqueChapter>(parsedValue, "chapters"),
      ),
      units: mergeById(
        cloneItems(defaultTechniqueUnits),
        readEntityArray<TechniqueUnit>(parsedValue, "units"),
      ),
      knowledgePoints: mergeById(
        cloneItems(defaultKnowledgePoints),
        readEntityArray<KnowledgePoint>(parsedValue, "knowledgePoints"),
      ),
      ownershipChanges: readEntityArray(parsedValue, "ownershipChanges"),
      importMappings: readEntityArray(parsedValue, "importMappings"),
      updatedAt:
        typeof parsedValue.updatedAt === "string"
          ? parsedValue.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return createDefaultCultivationStructureRepository();
  }
}

export function saveCultivationStructureRepository(
  repository: CultivationStructureRepository,
) {
  localStorage.setItem(
    CULTIVATION_STRUCTURE_STORAGE_KEY,
    JSON.stringify({
      ...repository,
      schemaVersion: CULTIVATION_STRUCTURE_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearCultivationStructureStorage() {
  localStorage.removeItem(CULTIVATION_STRUCTURE_STORAGE_KEY);
}
