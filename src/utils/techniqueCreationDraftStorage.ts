import type {
  AiGenerationMetadata,
  ChapterUnitsRevision,
  DraftRevisionSource,
  TechniqueCreationDraft,
  TechniqueCreationDraftRepository,
  TechniqueCreationProject,
  TechniqueDraftVariant,
  TechniqueStructureRevision,
  UnitKnowledgePointsRevision,
} from "../types/domain";

export const TECHNIQUE_CREATION_DRAFT_REPOSITORY_STORAGE_KEY =
  "personal-status.technique-creation-draft-repository.v1";

const REPOSITORY_SCHEMA_VERSION = "1.0";

export interface TechniqueCreationRepositoryMutationResult {
  repository: TechniqueCreationDraftRepository;
  projectId: string;
  variantId: string;
}

type ChapterRevisionOptions = {
  source?: DraftRevisionSource;
  chapterDraftIds?: string[];
};

type UnitRevisionOptions = {
  source?: DraftRevisionSource;
  unitDraftIds?: string[];
};

function isRepository(value: unknown): value is TechniqueCreationDraftRepository {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<TechniqueCreationDraftRepository>;
  return (
    typeof candidate.schemaVersion === "string" &&
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.variants) &&
    Array.isArray(candidate.structureRevisions) &&
    Array.isArray(candidate.chapterUnitRevisions) &&
    Array.isArray(candidate.unitKnowledgeRevisions) &&
    typeof candidate.updatedAt === "string"
  );
}

function findLatestGenerationMetadata(
  draft: TechniqueCreationDraft,
  generationType: AiGenerationMetadata["generationType"],
): AiGenerationMetadata | undefined {
  for (let index = draft.generationMetadata.length - 1; index >= 0; index -= 1) {
    const metadata = draft.generationMetadata[index];
    if (metadata.generationType === generationType) {
      return structuredClone(metadata);
    }
  }

  return undefined;
}

function appendUniqueGenerationMetadata(
  collection: AiGenerationMetadata[],
  metadata: AiGenerationMetadata | undefined,
) {
  if (metadata && !collection.some((item) => item.id === metadata.id)) {
    collection.push(structuredClone(metadata));
  }
}

function getProject(
  repository: TechniqueCreationDraftRepository,
  projectId: string,
): TechniqueCreationProject {
  const project = repository.projects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error(`未找到功法创建项目：${projectId}`);
  }

  return project;
}

function getVariant(
  repository: TechniqueCreationDraftRepository,
  projectId: string,
  variantId: string,
): TechniqueDraftVariant {
  const variant = repository.variants.find(
    (item) => item.id === variantId && item.projectId === projectId,
  );
  if (!variant) {
    throw new Error(`未找到草案组合版本：${variantId}`);
  }

  return variant;
}

function updateActiveVariant(
  projects: TechniqueCreationProject[],
  projectId: string,
  variantId: string,
  updatedAt: string,
): TechniqueCreationProject[] {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          activeVariantId: variantId,
          updatedAt,
        }
      : project,
  );
}

export function createEmptyTechniqueCreationDraftRepository(
  now = new Date().toISOString(),
): TechniqueCreationDraftRepository {
  return {
    schemaVersion: REPOSITORY_SCHEMA_VERSION,
    projects: [],
    variants: [],
    structureRevisions: [],
    chapterUnitRevisions: [],
    unitKnowledgeRevisions: [],
    updatedAt: now,
  };
}

export function loadTechniqueCreationDraftRepository(): TechniqueCreationDraftRepository {
  if (typeof localStorage === "undefined") {
    return createEmptyTechniqueCreationDraftRepository();
  }

  const storedValue = localStorage.getItem(
    TECHNIQUE_CREATION_DRAFT_REPOSITORY_STORAGE_KEY,
  );
  if (!storedValue) {
    return createEmptyTechniqueCreationDraftRepository();
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    return isRepository(parsedValue)
      ? parsedValue
      : createEmptyTechniqueCreationDraftRepository();
  } catch {
    return createEmptyTechniqueCreationDraftRepository();
  }
}

export function saveTechniqueCreationDraftRepository(
  repository: TechniqueCreationDraftRepository,
) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(
    TECHNIQUE_CREATION_DRAFT_REPOSITORY_STORAGE_KEY,
    JSON.stringify(repository),
  );
}

export function clearTechniqueCreationDraftRepository() {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.removeItem(TECHNIQUE_CREATION_DRAFT_REPOSITORY_STORAGE_KEY);
}

export function markTechniqueCreationProjectImported(
  repository: TechniqueCreationDraftRepository,
  projectId: string,
  importedAt = new Date().toISOString(),
): TechniqueCreationDraftRepository {
  getProject(repository, projectId);

  return {
    ...repository,
    projects: repository.projects.map((project) =>
      project.id === projectId
        ? { ...project, status: "imported", updatedAt: importedAt }
        : project,
    ),
    updatedAt: importedAt,
  };
}

export function addTechniqueStructureDraft(
  repository: TechniqueCreationDraftRepository,
  draft: TechniqueCreationDraft,
  source: DraftRevisionSource = "ai",
): TechniqueCreationRepositoryMutationResult {
  if (!draft.techniqueDraft || !draft.practiceDefaultsDraft) {
    throw new Error("功法结构草案不完整，无法创建草案项目。");
  }

  const now = new Date().toISOString();
  const projectId = draft.projectId ?? crypto.randomUUID();
  if (repository.projects.some((project) => project.id === projectId)) {
    throw new Error(`功法创建项目已存在：${projectId}`);
  }

  const variantId = crypto.randomUUID();
  const structureRevisionId = crypto.randomUUID();
  const generationMetadata = findLatestGenerationMetadata(
    draft,
    "technique_structure",
  );
  const project: TechniqueCreationProject = {
    id: projectId,
    requestId: draft.requestId,
    schemaVersion: draft.schemaVersion,
    status: draft.status,
    input: structuredClone(draft.input),
    activeVariantId: variantId,
    createdAt: draft.createdAt,
    updatedAt: now,
  };
  const structureRevision: TechniqueStructureRevision = {
    id: structureRevisionId,
    projectId,
    source,
    techniqueDraft: structuredClone(draft.techniqueDraft),
    practiceDefaultsDraft: structuredClone(draft.practiceDefaultsDraft),
    layerRuleDrafts: structuredClone(draft.layerRuleDrafts),
    chapterDrafts: draft.chapterDrafts.map((chapter) => ({
      ...structuredClone(chapter),
      unitDrafts: [],
    })),
    generationMetadata: source === "ai" ? generationMetadata : undefined,
    createdAt: now,
  };
  const variant: TechniqueDraftVariant = {
    id: variantId,
    projectId,
    stage: "structure_ready",
    structureRevisionId,
    chapterUnitRevisionIds: {},
    unitKnowledgeRevisionIds: {},
    validationIssues: structuredClone(draft.validationIssues),
    createdAt: now,
    updatedAt: now,
  };

  return {
    repository: {
      ...repository,
      projects: [...repository.projects, project],
      variants: [...repository.variants, variant],
      structureRevisions: [
        ...repository.structureRevisions,
        structureRevision,
      ],
      updatedAt: now,
    },
    projectId,
    variantId,
  };
}

export function addTechniqueStructureDraftRevision(
  repository: TechniqueCreationDraftRepository,
  projectId: string,
  parentVariantId: string,
  draft: TechniqueCreationDraft,
  source: DraftRevisionSource = "manual",
): TechniqueCreationRepositoryMutationResult {
  if (!draft.techniqueDraft || !draft.practiceDefaultsDraft) {
    throw new Error("功法结构草案不完整，无法保存结构修订。");
  }

  getProject(repository, projectId);
  const parentVariant = getVariant(repository, projectId, parentVariantId);
  const now = new Date().toISOString();
  const structureRevisionId = crypto.randomUUID();
  const generationMetadata = findLatestGenerationMetadata(
    draft,
    "technique_structure",
  );
  const chapterDraftIds = new Set(
    draft.chapterDrafts.map((chapter) => chapter.draftId),
  );
  const nextChapterRevisionIds: Record<string, string> = {};
  const retainedUnitIds = new Set<string>();

  for (const [chapterDraftId, revisionId] of Object.entries(
    parentVariant.chapterUnitRevisionIds,
  )) {
    if (!chapterDraftIds.has(chapterDraftId)) {
      continue;
    }

    nextChapterRevisionIds[chapterDraftId] = revisionId;
    const chapterRevision = repository.chapterUnitRevisions.find(
      (revision) => revision.id === revisionId,
    );
    for (const unit of chapterRevision?.unitDrafts ?? []) {
      retainedUnitIds.add(unit.draftId);
    }
  }

  const nextUnitKnowledgeRevisionIds = Object.fromEntries(
    Object.entries(parentVariant.unitKnowledgeRevisionIds).filter(
      ([unitDraftId]) => retainedUnitIds.has(unitDraftId),
    ),
  );
  const structureRevision: TechniqueStructureRevision = {
    id: structureRevisionId,
    projectId,
    source,
    techniqueDraft: structuredClone(draft.techniqueDraft),
    practiceDefaultsDraft: structuredClone(draft.practiceDefaultsDraft),
    layerRuleDrafts: structuredClone(draft.layerRuleDrafts),
    chapterDrafts: draft.chapterDrafts.map((chapter) => ({
      ...structuredClone(chapter),
      unitDrafts: [],
    })),
    generationMetadata: source === "ai" ? generationMetadata : undefined,
    createdAt: now,
  };
  const variantId = crypto.randomUUID();
  const variant: TechniqueDraftVariant = {
    id: variantId,
    projectId,
    parentVariantId,
    stage: draft.stage,
    structureRevisionId,
    chapterUnitRevisionIds: nextChapterRevisionIds,
    unitKnowledgeRevisionIds: nextUnitKnowledgeRevisionIds,
    validationIssues: structuredClone(draft.validationIssues),
    createdAt: now,
    updatedAt: now,
  };

  return {
    repository: {
      ...repository,
      projects: repository.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              input: structuredClone(draft.input),
              activeVariantId: variantId,
              updatedAt: now,
            }
          : project,
      ),
      variants: [...repository.variants, variant],
      structureRevisions: [
        ...repository.structureRevisions,
        structureRevision,
      ],
      updatedAt: now,
    },
    projectId,
    variantId,
  };
}

export function addChapterUnitsDraftRevision(
  repository: TechniqueCreationDraftRepository,
  projectId: string,
  parentVariantId: string,
  draft: TechniqueCreationDraft,
  options: ChapterRevisionOptions = {},
): TechniqueCreationRepositoryMutationResult {
  getProject(repository, projectId);
  const parentVariant = getVariant(repository, projectId, parentVariantId);
  const generationMetadata = findLatestGenerationMetadata(
    draft,
    "chapter_units",
  );
  const chapterDraftIds =
    options.chapterDraftIds ?? generationMetadata?.scope.chapterDraftIds ?? [];
  if (chapterDraftIds.length === 0) {
    throw new Error("没有指定需要保存单元修订的大章。");
  }

  const chapterDraftIdSet = new Set(chapterDraftIds);
  const targetChapters = draft.chapterDrafts.filter((chapter) =>
    chapterDraftIdSet.has(chapter.draftId),
  );
  if (targetChapters.length !== chapterDraftIdSet.size) {
    throw new Error("单元修订引用了草案中不存在的大章。");
  }

  const now = new Date().toISOString();
  const source =
    options.source ??
    (options.chapterDraftIds ? "manual" : generationMetadata ? "ai" : "manual");
  const revisions: ChapterUnitsRevision[] = targetChapters.map((chapter) => ({
    id: crypto.randomUUID(),
    projectId,
    chapterDraftId: chapter.draftId,
    source,
    unitDrafts: chapter.unitDrafts.map((unit) => ({
      ...structuredClone(unit),
      knowledgePointDrafts: [],
    })),
    generationMetadata,
    createdAt: now,
  }));
  const nextChapterRevisionIds = {
    ...parentVariant.chapterUnitRevisionIds,
  };
  const nextUnitKnowledgeRevisionIds = {
    ...parentVariant.unitKnowledgeRevisionIds,
  };

  for (const revision of revisions) {
    const previousRevisionId =
      parentVariant.chapterUnitRevisionIds[revision.chapterDraftId];
    const previousRevision = repository.chapterUnitRevisions.find(
      (item) => item.id === previousRevisionId,
    );
    const nextUnitIds = new Set(revision.unitDrafts.map((unit) => unit.draftId));

    for (const previousUnit of previousRevision?.unitDrafts ?? []) {
      if (!nextUnitIds.has(previousUnit.draftId)) {
        delete nextUnitKnowledgeRevisionIds[previousUnit.draftId];
      }
    }

    nextChapterRevisionIds[revision.chapterDraftId] = revision.id;
  }

  const variantId = crypto.randomUUID();
  const variant: TechniqueDraftVariant = {
    id: variantId,
    projectId,
    parentVariantId,
    stage: draft.stage,
    structureRevisionId: parentVariant.structureRevisionId,
    chapterUnitRevisionIds: nextChapterRevisionIds,
    unitKnowledgeRevisionIds: nextUnitKnowledgeRevisionIds,
    validationIssues: structuredClone(draft.validationIssues),
    createdAt: now,
    updatedAt: now,
  };

  return {
    repository: {
      ...repository,
      projects: updateActiveVariant(
        repository.projects,
        projectId,
        variantId,
        now,
      ),
      variants: [...repository.variants, variant],
      chapterUnitRevisions: [
        ...repository.chapterUnitRevisions,
        ...revisions,
      ],
      updatedAt: now,
    },
    projectId,
    variantId,
  };
}

export function addUnitKnowledgeDraftRevision(
  repository: TechniqueCreationDraftRepository,
  projectId: string,
  parentVariantId: string,
  draft: TechniqueCreationDraft,
  options: UnitRevisionOptions = {},
): TechniqueCreationRepositoryMutationResult {
  getProject(repository, projectId);
  const parentVariant = getVariant(repository, projectId, parentVariantId);
  const generationMetadata = findLatestGenerationMetadata(
    draft,
    "unit_knowledge_points",
  );
  const unitDraftIds =
    options.unitDraftIds ?? generationMetadata?.scope.unitDraftIds ?? [];
  if (unitDraftIds.length === 0) {
    throw new Error("没有指定需要保存知识点修订的单元。");
  }

  const unitDraftIdSet = new Set(unitDraftIds);
  const targetUnits = draft.chapterDrafts.flatMap((chapter) =>
    chapter.unitDrafts.filter((unit) => unitDraftIdSet.has(unit.draftId)),
  );
  if (targetUnits.length !== unitDraftIdSet.size) {
    throw new Error("知识点修订引用了草案中不存在的单元。");
  }

  const now = new Date().toISOString();
  const source =
    options.source ??
    (options.unitDraftIds ? "manual" : generationMetadata ? "ai" : "manual");
  const revisions: UnitKnowledgePointsRevision[] = targetUnits.map((unit) => ({
    id: crypto.randomUUID(),
    projectId,
    unitDraftId: unit.draftId,
    source,
    knowledgePointDrafts: structuredClone(unit.knowledgePointDrafts),
    generationMetadata,
    createdAt: now,
  }));
  const nextUnitKnowledgeRevisionIds = {
    ...parentVariant.unitKnowledgeRevisionIds,
  };
  for (const revision of revisions) {
    nextUnitKnowledgeRevisionIds[revision.unitDraftId] = revision.id;
  }

  const variantId = crypto.randomUUID();
  const variant: TechniqueDraftVariant = {
    id: variantId,
    projectId,
    parentVariantId,
    stage: draft.stage,
    structureRevisionId: parentVariant.structureRevisionId,
    chapterUnitRevisionIds: {
      ...parentVariant.chapterUnitRevisionIds,
    },
    unitKnowledgeRevisionIds: nextUnitKnowledgeRevisionIds,
    validationIssues: structuredClone(draft.validationIssues),
    createdAt: now,
    updatedAt: now,
  };

  return {
    repository: {
      ...repository,
      projects: updateActiveVariant(
        repository.projects,
        projectId,
        variantId,
        now,
      ),
      variants: [...repository.variants, variant],
      unitKnowledgeRevisions: [
        ...repository.unitKnowledgeRevisions,
        ...revisions,
      ],
      updatedAt: now,
    },
    projectId,
    variantId,
  };
}

export function materializeTechniqueCreationDraft(
  repository: TechniqueCreationDraftRepository,
  projectId: string,
  variantId?: string,
): TechniqueCreationDraft | undefined {
  const project = repository.projects.find((item) => item.id === projectId);
  const resolvedVariantId = variantId ?? project?.activeVariantId;
  if (!project || !resolvedVariantId) {
    return undefined;
  }

  const variant = repository.variants.find(
    (item) => item.id === resolvedVariantId && item.projectId === projectId,
  );
  if (!variant) {
    return undefined;
  }

  const structureRevision = repository.structureRevisions.find(
    (revision) => revision.id === variant.structureRevisionId,
  );
  if (!structureRevision) {
    return undefined;
  }

  const generationMetadata: AiGenerationMetadata[] = [];
  appendUniqueGenerationMetadata(
    generationMetadata,
    structureRevision.generationMetadata,
  );

  const chapterDrafts = structureRevision.chapterDrafts.map((chapter) => {
    const chapterRevisionId =
      variant.chapterUnitRevisionIds[chapter.draftId];
    const chapterRevision = repository.chapterUnitRevisions.find(
      (revision) => revision.id === chapterRevisionId,
    );
    appendUniqueGenerationMetadata(
      generationMetadata,
      chapterRevision?.generationMetadata,
    );

    const unitDrafts = (chapterRevision?.unitDrafts ?? []).map((unit) => {
      const knowledgeRevisionId =
        variant.unitKnowledgeRevisionIds[unit.draftId];
      const knowledgeRevision = repository.unitKnowledgeRevisions.find(
        (revision) => revision.id === knowledgeRevisionId,
      );
      appendUniqueGenerationMetadata(
        generationMetadata,
        knowledgeRevision?.generationMetadata,
      );

      return {
        ...structuredClone(unit),
        knowledgePointDrafts: structuredClone(
          knowledgeRevision?.knowledgePointDrafts ?? [],
        ),
      };
    });

    return {
      ...structuredClone(chapter),
      unitDrafts,
    };
  });

  return {
    id: variant.id,
    projectId: project.id,
    variantId: variant.id,
    requestId: project.requestId,
    parentDraftId: variant.parentVariantId,
    schemaVersion: project.schemaVersion,
    stage: variant.stage,
    status: project.status,
    input: structuredClone(project.input),
    techniqueDraft: structuredClone(structureRevision.techniqueDraft),
    practiceDefaultsDraft: structuredClone(
      structureRevision.practiceDefaultsDraft,
    ),
    layerRuleDrafts: structuredClone(structureRevision.layerRuleDrafts),
    chapterDrafts,
    generationMetadata,
    validationIssues: structuredClone(variant.validationIssues),
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
  };
}

export function materializeActiveTechniqueCreationDrafts(
  repository: TechniqueCreationDraftRepository,
): TechniqueCreationDraft[] {
  return repository.projects.flatMap((project) => {
    const draft = materializeTechniqueCreationDraft(repository, project.id);
    return draft ? [draft] : [];
  });
}
