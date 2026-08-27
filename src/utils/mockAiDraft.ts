import type {
  AiDraftRequest,
  ChapterUnitGenerationConfig,
  KnowledgeGranularity,
  KnowledgePointDraft,
  TechniqueChapterDraft,
  TechniqueCreationDraft,
  TechniqueCreationInput,
  TechniqueCreationKnowledgePointDraft,
  TechniqueLayerBreakthroughRequirementDraft,
  TechniqueLayerRequirementType,
  TechniqueLayerRuleDraft,
  TechniquePlanDraft,
  TechniquePracticeDefaultsDraft,
  TechniqueUnitDraft,
  UnitKnowledgeGenerationConfig,
} from "../types/domain";

const MOCK_SCHEMA_VERSION = "1.0";
const MOCK_STRUCTURE_PROMPT_VERSION = "mock-structure-v1";
const MOCK_UNIT_PROMPT_VERSION = "mock-units-v1";
const MOCK_KNOWLEDGE_PROMPT_VERSION = "mock-knowledge-v1";
const DEFAULT_REVIEW_INTERVALS_DAYS = [2, 7, 21, 60, 180, 365];
const LAYER_COVERAGE_REQUIREMENTS = [0.6, 0.7, 0.78, 0.84, 0.9, 0.95];
const LAYER_CORE_COVERAGE_REQUIREMENTS = [0.75, 0.82, 0.88, 0.92, 0.96, 1];
const LAYER_WEAK_POINT_LIMITS = [0.35, 0.28, 0.2, 0.15, 0.1, 0.05];
const MATH_ANALYSIS_LAYER_INCREMENTS = [60000, 54000, 63000, 72000, 81000, 30000];

type MockChapterTemplate = {
  name: string;
  description: string;
  learningObjectives: string[];
  recommendedUnitDetailLevel: KnowledgeGranularity;
  recommendedUnitCountRange: { min: number; max: number };
};

const GENERIC_CHAPTER_TEMPLATES: MockChapterTemplate[] = [
  {
    name: "整体框架与基础",
    description: "建立课程地图，明确学习对象、基础概念、章节边界和主要问题。",
    learningObjectives: ["说明课程研究对象", "建立章节之间的整体联系"],
    recommendedUnitDetailLevel: "normal",
    recommendedUnitCountRange: { min: 3, max: 5 },
  },
  {
    name: "核心概念与原理",
    description: "整理课程中的核心概念、基本原理及其相邻概念之间的区别。",
    learningObjectives: ["准确解释核心概念", "说明关键原理成立的条件"],
    recommendedUnitDetailLevel: "detailed",
    recommendedUnitCountRange: { min: 5, max: 8 },
  },
  {
    name: "方法训练与应用",
    description: "提炼典型方法、常见应用、操作步骤和容易出现的错误。",
    learningObjectives: ["选择并执行典型方法", "识别常见错误和适用边界"],
    recommendedUnitDetailLevel: "normal",
    recommendedUnitCountRange: { min: 4, max: 7 },
  },
  {
    name: "综合复盘与输出",
    description: "通过测试、总结或作品输出检查跨章节理解和稳定应用能力。",
    learningObjectives: ["完成综合任务", "形成可复习的结构化输出"],
    recommendedUnitDetailLevel: "rough",
    recommendedUnitCountRange: { min: 2, max: 4 },
  },
];

const UNIT_TEMPLATES = [
  "基本对象与定义",
  "核心原理",
  "典型方法",
  "例题与应用",
  "边界与反例",
  "综合训练",
  "章节复盘",
  "进阶联系",
];

const KNOWLEDGE_POINT_TEMPLATES = [
  {
    suffix: "学习对象与范围",
    typeTags: ["概念"],
    learningPerspectives: ["理解", "表达"],
  },
  {
    suffix: "核心概念",
    typeTags: ["概念"],
    learningPerspectives: ["理解", "比较"],
  },
  {
    suffix: "基本原理",
    typeTags: ["原理"],
    learningPerspectives: ["理解", "论证"],
  },
  {
    suffix: "典型方法",
    typeTags: ["方法"],
    learningPerspectives: ["应用", "计算"],
  },
  {
    suffix: "常见问题与边界",
    typeTags: ["问题"],
    learningPerspectives: ["辨析", "复盘"],
  },
  {
    suffix: "综合应用",
    typeTags: ["应用"],
    learningPerspectives: ["应用", "输出"],
  },
  {
    suffix: "进阶联系",
    typeTags: ["关系"],
    learningPerspectives: ["比较", "迁移"],
  },
  {
    suffix: "阶段检验",
    typeTags: ["测试"],
    learningPerspectives: ["检验", "复盘"],
  },
];

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function getSourceSummary(input: TechniqueCreationInput): string {
  const sourceText = input.sources
    .map((source) => source.content.trim())
    .filter(Boolean)
    .join("\n");

  return sourceText || "用户尚未填写材料说明";
}

function getTechniqueWeights(input: TechniqueCreationInput) {
  const sectId = input.target.sectId;
  const defaultWeights =
    sectId === "phil"
      ? { manaWeight: 0.25, insightWeight: 0.75, soulWeight: 0 }
      : sectId === "eng"
        ? { manaWeight: 0.45, insightWeight: 0.55, soulWeight: 0 }
        : { manaWeight: 0.55, insightWeight: 0.45, soulWeight: 0 };

  return {
    manaWeight: clamp(input.preferredManaWeight ?? defaultWeights.manaWeight, 0, 1),
    insightWeight: clamp(
      input.preferredInsightWeight ?? defaultWeights.insightWeight,
      0,
      1,
    ),
    soulWeight: clamp(input.preferredSoulWeight ?? defaultWeights.soulWeight, 0, 1),
  };
}

function createPracticeDefaultsDraft(
  input: TechniqueCreationInput,
): TechniquePracticeDefaultsDraft {
  const weights = getTechniqueWeights(input);

  return {
    recordTypeDefaults: {
      exercise: {
        requirementRatio: 0.7,
        manaWeight: weights.manaWeight,
        insightWeight: weights.insightWeight,
      },
      note: {
        requirementRatio: 0.2,
        manaWeight: 0.2,
        insightWeight: 0.8,
      },
      thinking: {
        requirementRatio: 0.2,
        manaWeight: 0.3,
        insightWeight: 0.7,
      },
      test: {
        requirementRatio: 0,
        baseExperiencePerUnit: 30,
        manaWeight: weights.manaWeight,
        insightWeight: weights.insightWeight,
      },
      review: {
        requirementRatio: 0.1,
        manaWeight: 0.5,
        insightWeight: 0.5,
      },
    },
    requiredExerciseCount: 10,
    requiredNoteCount: 2,
    requiredThinkingCount: 2,
    reviewSchedule: {
      intervalsDays: [...DEFAULT_REVIEW_INTERVALS_DAYS],
      graceRatio: 0.2,
    },
  };
}

function getBreakthroughRequirements(
  input: TechniqueCreationInput,
  layer: number,
): Array<{
  title: string;
  description: string;
  requirementType: TechniqueLayerRequirementType;
}> {
  const techniqueName = input.techniqueName.trim() || "新功法";

  if (input.target.sectId === "phil") {
    return [
      {
        title: `完成${techniqueName}第 ${layer} 层阶段论述`,
        description: "围绕本层核心人物、文本或问题写出阶段性论述。",
        requirementType: "output",
      },
      {
        title: "整理概念和论证卡",
        description: "整理关键概念、论证路径和相邻问题。",
        requirementType: "summary",
      },
    ];
  }

  if (input.target.sectId === "eng") {
    return [
      {
        title: `完成${techniqueName}第 ${layer} 层综合训练`,
        description: "完成一次能体现当前层级的限时训练或真实表达任务。",
        requirementType: "test",
      },
      {
        title: "提交阶段复盘",
        description: "记录正确率、速度、输出质量和主要薄弱点。",
        requirementType: "summary",
      },
    ];
  }

  return [
    {
      title: `完成${techniqueName}第 ${layer} 层综合测试`,
      description: "完成一组能覆盖本层核心概念和基本方法的综合任务。",
      requirementType: "test",
    },
    {
      title: "整理本层知识结构",
      description: "整理核心概念、原理、方法和相邻知识点之间的关系。",
      requirementType: "summary",
    },
  ];
}

function createLayerRuleDrafts(
  input: TechniqueCreationInput,
): TechniqueLayerRuleDraft[] {
  const maxLayer = clamp(Math.round(input.targetLayer), 1, 6);
  const referenceTotal = MATH_ANALYSIS_LAYER_INCREMENTS.slice(0, maxLayer).reduce((total, value) => total + value, 0);
  const targetTotal = input.experienceBudgetTotal ?? referenceTotal;
  const layerIncrements = MATH_ANALYSIS_LAYER_INCREMENTS.slice(0, maxLayer);
  let accumulatedExperience = 0;

  return Array.from({ length: maxLayer }, (_, index) => {
    const layer = index + 1;
    const breakthroughRequirements: TechniqueLayerBreakthroughRequirementDraft[] =
      getBreakthroughRequirements(input, layer).map((requirement) => ({
        draftId: crypto.randomUUID(),
        ...requirement,
        isRequired: true,
      }));

    return {
      draftId: crypto.randomUUID(),
      layer,
      requiredExperienceSuggestion: (accumulatedExperience += Math.round(
        targetTotal * (layerIncrements[index] / referenceTotal),
      )),
      requiredCoverageRatio: LAYER_COVERAGE_REQUIREMENTS[index] ?? 0.95,
      requiredCoreCoverageRatio:
        LAYER_CORE_COVERAGE_REQUIREMENTS[index] ?? 1,
      allowedWeakPointRatio: LAYER_WEAK_POINT_LIMITS[index] ?? 0.05,
      breakthroughRequirements,
    };
  });
}

function createChapterDrafts(): TechniqueChapterDraft[] {
  return GENERIC_CHAPTER_TEMPLATES.map((template, index) => ({
    draftId: crypto.randomUUID(),
    code: `ch${String(index + 1).padStart(2, "0")}`,
    name: template.name,
    description: template.description,
    order: index + 1,
    learningObjectives: [...template.learningObjectives],
    recommendedUnitDetailLevel: template.recommendedUnitDetailLevel,
    recommendedUnitCountRange: { ...template.recommendedUnitCountRange },
    unitGenerationConfig: {
      includeInGeneration: true,
      detailLevel: template.recommendedUnitDetailLevel,
    },
    unitDrafts: [],
  }));
}

function getUnitCount(chapter: TechniqueChapterDraft): number {
  const { detailLevel, targetCount } = chapter.unitGenerationConfig;
  if (targetCount !== undefined) {
    return clamp(Math.round(targetCount), 1, 40);
  }

  const range = chapter.recommendedUnitCountRange ?? { min: 3, max: 8 };
  if (detailLevel === "rough") {
    return range.min;
  }
  if (detailLevel === "detailed") {
    return range.max;
  }

  return Math.round((range.min + range.max) / 2);
}

function resolveUnitDetailLevel(
  config: ChapterUnitGenerationConfig,
  chapter: TechniqueChapterDraft,
): KnowledgeGranularity {
  if (config.detailLevel !== "custom") {
    return config.detailLevel;
  }

  const targetCount = config.targetCount;
  const range = chapter.recommendedUnitCountRange ?? { min: 3, max: 8 };
  if (targetCount <= range.min) {
    return "rough";
  }
  if (targetCount >= range.max) {
    return "detailed";
  }

  return "normal";
}

function getKnowledgePointCount(unit: TechniqueUnitDraft): number {
  const { detailLevel, targetCount } = unit.knowledgeGenerationConfig;
  if (targetCount !== undefined) {
    return clamp(Math.round(targetCount), 1, 30);
  }

  const range = unit.recommendedKnowledgePointCountRange ?? { min: 3, max: 6 };
  if (detailLevel === "rough") {
    return range.min;
  }
  if (detailLevel === "detailed") {
    return range.max;
  }

  return Math.round((range.min + range.max) / 2);
}

function resolveKnowledgeGranularity(
  config: UnitKnowledgeGenerationConfig,
  unit: TechniqueUnitDraft,
): KnowledgeGranularity {
  if (config.detailLevel !== "custom") {
    return config.detailLevel;
  }

  const targetCount = config.targetCount;
  const range = unit.recommendedKnowledgePointCountRange ?? { min: 3, max: 6 };
  if (targetCount <= range.min) {
    return "rough";
  }
  if (targetCount >= range.max) {
    return "detailed";
  }

  return "normal";
}

function createUnitDrafts(chapter: TechniqueChapterDraft): TechniqueUnitDraft[] {
  const count = getUnitCount(chapter);
  const detailLevel = resolveUnitDetailLevel(
    chapter.unitGenerationConfig,
    chapter,
  );
  const knowledgePointRange =
    detailLevel === "rough"
      ? { min: 2, max: 4 }
      : detailLevel === "detailed"
        ? { min: 5, max: 9 }
        : { min: 3, max: 6 };

  return Array.from({ length: count }, (_, index) => {
    const templateName = UNIT_TEMPLATES[index % UNIT_TEMPLATES.length];
    const suffix = count > UNIT_TEMPLATES.length ? ` ${index + 1}` : "";

    return {
      draftId: crypto.randomUUID(),
      chapterDraftId: chapter.draftId,
      code: `${chapter.code}-u${String(index + 1).padStart(2, "0")}`,
      name: `${templateName}${suffix}`,
      description: `围绕“${chapter.name}”中的${templateName}组织可继续细分的学习内容。`,
      order: index + 1,
      learningObjectives: [`掌握${templateName}的主要内容`],
      recommendedDetailLevel: detailLevel,
      recommendedKnowledgePointCountRange: knowledgePointRange,
      knowledgeGenerationConfig: {
        includeInGeneration: true,
        detailLevel,
      },
      knowledgePointDrafts: [],
    };
  });
}

function calculateRecommendedBaseValue(
  granularity: KnowledgeGranularity,
  difficulty: number,
  importance: number,
): number {
  const granularityMultiplier =
    granularity === "rough" ? 1.35 : granularity === "detailed" ? 0.8 : 1;

  return Math.round(
    1000 * ((difficulty + importance) / 2) * granularityMultiplier,
  );
}

function createKnowledgePointDrafts(
  draft: TechniqueCreationDraft,
  chapter: TechniqueChapterDraft,
  unit: TechniqueUnitDraft,
): TechniqueCreationKnowledgePointDraft[] {
  if (!draft.techniqueDraft || !draft.practiceDefaultsDraft) {
    throw new Error("功法结构尚未生成，不能生成单元知识点。");
  }

  const count = getKnowledgePointCount(unit);
  const granularity = resolveKnowledgeGranularity(
    unit.knowledgeGenerationConfig,
    unit,
  );
  const knowledgePoints: TechniqueCreationKnowledgePointDraft[] = [];

  for (let index = 0; index < count; index += 1) {
    const template = KNOWLEDGE_POINT_TEMPLATES[index % KNOWLEDGE_POINT_TEMPLATES.length];
    const difficulty = Number(Math.min(1 + index * 0.12, 2.5).toFixed(2));
    const importance = Number(Math.max(2.4 - index * 0.08, 1.4).toFixed(2));
    const previousKnowledgePoint = knowledgePoints[knowledgePoints.length - 1];

    knowledgePoints.push({
      draftId: crypto.randomUUID(),
      chapterDraftId: chapter.draftId,
      unitDraftId: unit.draftId,
      name: `${unit.name}：${template.suffix}${count > KNOWLEDGE_POINT_TEMPLATES.length ? ` ${index + 1}` : ""}`,
      description: `围绕“${chapter.name} / ${unit.name}”学习${template.suffix}，服务于目标“${draft.input.learningGoal}”。`,
      granularity,
      typeTags: [...template.typeTags],
      learningPerspectives: [...template.learningPerspectives],
      difficulty,
      importance,
      targetLayer: draft.techniqueDraft.maxLayer,
      maxTrainableLayer: draft.techniqueDraft.maxLayer,
      requiredExerciseCount: draft.practiceDefaultsDraft.requiredExerciseCount,
      requiredNoteCount: draft.practiceDefaultsDraft.requiredNoteCount,
      requiredThinkingCount: draft.practiceDefaultsDraft.requiredThinkingCount,
      manaWeight: draft.techniqueDraft.manaWeight,
      insightWeight: draft.techniqueDraft.insightWeight,
      prerequisiteDraftIds: previousKnowledgePoint
        ? [previousKnowledgePoint.draftId]
        : [],
      recommendedBaseValue: calculateRecommendedBaseValue(
        granularity,
        difficulty,
        importance,
      ),
      generationRationale: `依据本单元${unit.knowledgeGenerationConfig.detailLevel}精细度和目标数量 ${count} 生成。`,
    });
  }

  return knowledgePoints;
}

export function createMockTechniqueStructureDraft(
  input: TechniqueCreationInput,
  requestId?: string,
): TechniqueCreationDraft {
  const now = new Date().toISOString();
  const techniqueName = input.techniqueName.trim() || "新功法";
  const sourceSummary = getSourceSummary(input);
  const weights = getTechniqueWeights(input);
  const maxLayer = clamp(Math.round(input.targetLayer), 1, 6);

  return {
    id: crypto.randomUUID(),
    requestId,
    schemaVersion: MOCK_SCHEMA_VERSION,
    stage: "structure_ready",
    status: "active",
    input,
    techniqueDraft: {
      name: techniqueName,
      description: `围绕“${input.learningGoal}”建立的${techniqueName}修炼规划，主要依据“${sourceSummary.slice(0, 80)}”。`,
      courseValueCoefficientSuggestion: Number(
        clamp(0.8 + sourceSummary.length / 4000, 0.8, 1.5).toFixed(2),
      ),
      ...weights,
      maxLayer,
      prerequisiteSuggestions: [],
      generationRationale: "根据用户提供的内容依据、学习目标和目标层数生成第一版结构。",
    },
    practiceDefaultsDraft: createPracticeDefaultsDraft(input),
    layerRuleDrafts: createLayerRuleDrafts(input),
    chapterDrafts: createChapterDrafts(),
    generationMetadata: [
      {
        id: crypto.randomUUID(),
        generationType: "technique_structure",
        scope: {
          chapterDraftIds: [],
          unitDraftIds: [],
        },
        isMock: true,
        promptVersion: MOCK_STRUCTURE_PROMPT_VERSION,
        schemaVersion: MOCK_SCHEMA_VERSION,
        generatedAt: now,
      },
    ],
    validationIssues: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createMockChapterUnits(
  draft: TechniqueCreationDraft,
  chapterDraftIds?: string[],
): TechniqueCreationDraft {
  if (!draft.techniqueDraft || !draft.practiceDefaultsDraft) {
    throw new Error("功法结构尚未生成，不能生成章节单元。");
  }

  const nextDraft = structuredClone(draft);
  const requestedChapterIds = chapterDraftIds
    ? new Set(chapterDraftIds)
    : undefined;
  const selectedChapters = nextDraft.chapterDrafts.filter(
    (chapter) =>
      chapter.unitGenerationConfig.includeInGeneration &&
      (!requestedChapterIds || requestedChapterIds.has(chapter.draftId)),
  );

  if (selectedChapters.length === 0) {
    throw new Error("没有选中可生成单元的章节。");
  }

  const selectedChapterIds = new Set(
    selectedChapters.map((chapter) => chapter.draftId),
  );
  const now = new Date().toISOString();
  const chapterDrafts = nextDraft.chapterDrafts.map((chapter) =>
    selectedChapterIds.has(chapter.draftId)
      ? {
          ...chapter,
          unitDrafts: createUnitDrafts(chapter),
        }
      : chapter,
  );
  const hasPendingChapter = chapterDrafts.some(
    (chapter) =>
      chapter.unitGenerationConfig.includeInGeneration &&
      chapter.unitDrafts.length === 0,
  );

  return {
    ...nextDraft,
    id: crypto.randomUUID(),
    parentDraftId: draft.id,
    stage: hasPendingChapter ? "units_pending" : "units_ready",
    chapterDrafts,
    generationMetadata: [
      ...nextDraft.generationMetadata,
      {
        id: crypto.randomUUID(),
        generationType: "chapter_units",
        scope: {
          chapterDraftIds: [...selectedChapterIds],
          unitDraftIds: [],
        },
        isMock: true,
        promptVersion: MOCK_UNIT_PROMPT_VERSION,
        schemaVersion: MOCK_SCHEMA_VERSION,
        generatedAt: now,
      },
    ],
    validationIssues: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createMockUnitKnowledgePoints(
  draft: TechniqueCreationDraft,
  unitDraftIds?: string[],
): TechniqueCreationDraft {
  if (!draft.techniqueDraft || !draft.practiceDefaultsDraft) {
    throw new Error("功法结构尚未生成，不能生成单元知识点。");
  }

  const nextDraft = structuredClone(draft);
  const requestedUnitIds = unitDraftIds ? new Set(unitDraftIds) : undefined;
  const selectedUnits = nextDraft.chapterDrafts.flatMap((chapter) =>
    chapter.unitDrafts
      .filter(
        (unit) =>
          unit.knowledgeGenerationConfig.includeInGeneration &&
          (!requestedUnitIds || requestedUnitIds.has(unit.draftId)),
      )
      .map((unit) => ({ chapter, unit })),
  );

  if (selectedUnits.length === 0) {
    throw new Error("没有选中可生成知识点的单元。");
  }

  const selectedUnitIds = new Set(
    selectedUnits.map(({ unit }) => unit.draftId),
  );
  const selectedChapterIds = new Set(
    selectedUnits.map(({ chapter }) => chapter.draftId),
  );
  const now = new Date().toISOString();
  const chapterDrafts = nextDraft.chapterDrafts.map((chapter) => ({
    ...chapter,
    unitDrafts: chapter.unitDrafts.map((unit) =>
      selectedUnitIds.has(unit.draftId)
        ? {
            ...unit,
            knowledgePointDrafts: createKnowledgePointDrafts(
              nextDraft,
              chapter,
              unit,
            ),
          }
        : unit,
    ),
  }));
  const hasPendingUnit = chapterDrafts.some((chapter) =>
    chapter.unitDrafts.some(
      (unit) =>
        unit.knowledgeGenerationConfig.includeInGeneration &&
      unit.knowledgePointDrafts.length === 0,
    ),
  );
  const hasPendingChapter = chapterDrafts.some(
    (chapter) =>
      chapter.unitGenerationConfig.includeInGeneration &&
      chapter.unitDrafts.length === 0,
  );

  return {
    ...nextDraft,
    id: crypto.randomUUID(),
    parentDraftId: draft.id,
    stage: hasPendingChapter
      ? "units_pending"
      : hasPendingUnit
        ? "knowledge_pending"
        : "knowledge_ready",
    chapterDrafts,
    generationMetadata: [
      ...nextDraft.generationMetadata,
      {
        id: crypto.randomUUID(),
        generationType: "unit_knowledge_points",
        scope: {
          chapterDraftIds: [...selectedChapterIds],
          unitDraftIds: [...selectedUnitIds],
        },
        isMock: true,
        promptVersion: MOCK_KNOWLEDGE_PROMPT_VERSION,
        schemaVersion: MOCK_SCHEMA_VERSION,
        generatedAt: now,
      },
    ],
    validationIssues: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createMockChapterKnowledgePoints(
  draft: TechniqueCreationDraft,
  chapterDraftIds?: string[],
): TechniqueCreationDraft {
  const unitsDraft = createMockChapterUnits(draft, chapterDraftIds);
  const selectedChapterIds = chapterDraftIds
    ? new Set(chapterDraftIds)
    : undefined;
  const unitDraftIds = unitsDraft.chapterDrafts
    .filter(
      (chapter) =>
        !selectedChapterIds || selectedChapterIds.has(chapter.draftId),
    )
    .flatMap((chapter) => chapter.unitDrafts.map((unit) => unit.draftId));

  return createMockUnitKnowledgePoints(unitsDraft, unitDraftIds);
}

function convertLegacyRequestToCreationInput(
  request: AiDraftRequest,
): TechniqueCreationInput {
  return {
    target: {
      mode: "create_new",
      sectId: request.sectId,
    },
    techniqueName: request.techniqueName.trim() || "新功法",
    sources: [
      {
        id: crypto.randomUUID(),
        sourceType: "custom",
        title: "旧版草案输入",
        content: request.sourceText,
      },
    ],
    learningGoalType: "systematic_learning",
    learningGoal: request.learningGoal.trim() || "建立基础知识结构",
    targetLayer: 6,
    requirementText: request.requirementText,
  };
}

export function createMockTechniquePlanDraft(
  request: AiDraftRequest,
): TechniquePlanDraft {
  const structureDraft = createMockTechniqueStructureDraft(
    convertLegacyRequestToCreationInput(request),
    request.id,
  );
  const completeDraft = createMockChapterKnowledgePoints(structureDraft);
  const knowledgePointDrafts: KnowledgePointDraft[] =
    completeDraft.chapterDrafts
      .flatMap((chapter) =>
        chapter.unitDrafts.flatMap((unit) =>
          unit.knowledgePointDrafts.map((knowledgePoint) => ({
            name: knowledgePoint.name,
            chapterCode: unit.code,
            chapter: `${chapter.name} / ${unit.name}`,
            description: knowledgePoint.description,
            granularity: knowledgePoint.granularity,
            baseValue:
              knowledgePoint.baseValueOverride ??
              knowledgePoint.recommendedBaseValue ??
              0,
            difficulty: knowledgePoint.difficulty,
            importance: knowledgePoint.importance,
          })),
        ),
      )
      .slice(0, 24);

  return {
    id: completeDraft.id,
    requestId: request.id,
    sectId: request.sectId,
    techniqueName: completeDraft.techniqueDraft?.name ?? "新功法",
    sourceText: request.sourceText,
    status: "draft",
    knowledgePointDrafts,
    createdAt: completeDraft.createdAt,
    updatedAt: completeDraft.updatedAt,
  };
}
