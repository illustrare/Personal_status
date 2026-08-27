import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  mockAiGenerationClient,
  type AiGenerationRequest,
  type AiGenerationResponse,
} from "../src/utils/aiGenerationClient";
import { validateAiGenerationResponse } from "../src/utils/aiGenerationValidation";
import {
  createMockTechniqueStructureDraft,
} from "../src/utils/mockAiDraft";
import type {
  KnowledgeGranularity,
  TechniqueBaseDraft,
  TechniqueChapterDraft,
  TechniqueCreationDraft,
  TechniqueCreationKnowledgePointDraft,
  TechniqueUnitDraft,
} from "../src/types/domain";

const port = Number(process.env.AI_SERVER_PORT ?? 8787);
const configPath = join(
  dirname(fileURLToPath(import.meta.url)),
  ".ai-service-config.json",
);

type AiServiceMode = "mock" | "remote";
type AiServiceProvider = "deepseek";
type AiServiceConfig = {
  mode: AiServiceMode;
  provider: AiServiceProvider;
  model: string;
  apiKey?: string;
};

const defaultConfig: AiServiceConfig = {
  mode: "mock",
  provider: "deepseek",
  model: "deepseek-chat",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAiGenerationRequest(value: unknown): value is AiGenerationRequest {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.requestId === "string" &&
    value.schemaVersion === "1.0" &&
    (value.stage === "technique_structure" ||
      value.stage === "chapter_units" ||
      value.stage === "unit_knowledge_points")
  );
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += String(chunk);
      if (body.length > 1_000_000) {
        reject(new Error("请求内容超过 1MB 限制。"));
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("请求体不是有效 JSON。"));
      }
    });
    request.on("error", reject);
  });
}

async function loadConfig(): Promise<AiServiceConfig> {
  try {
    const value: unknown = JSON.parse(await readFile(configPath, "utf8"));
    if (!isRecord(value)) {
      return defaultConfig;
    }
    return {
      mode: value.mode === "remote" ? "remote" : "mock",
      provider: "deepseek",
      model: typeof value.model === "string" && value.model.trim()
        ? value.model.trim()
        : defaultConfig.model,
      apiKey: typeof value.apiKey === "string" && value.apiKey.trim()
        ? value.apiKey.trim()
        : undefined,
    };
  } catch {
    return defaultConfig;
  }
}

async function saveConfig(config: AiServiceConfig) {
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  await chmod(configPath, 0o600);
}

function getPublicConfig(config: AiServiceConfig) {
  const hasApiKey = Boolean(process.env.AI_API_KEY || config.apiKey);
  return {
    mode: config.mode,
    provider: config.provider,
    model: config.model,
    apiKeyConfigured: hasApiKey,
    status:
      config.mode === "mock"
        ? "mock"
        : hasApiKey
          ? "configured"
          : "missing_api_key",
  } as const;
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

function isGranularity(value: unknown): value is KnowledgeGranularity {
  return value === "rough" || value === "normal" || value === "detailed";
}

function getTextArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
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

function getSuggestedCountRange(value: unknown): { min: number; max: number } | undefined {
  if (!isRecord(value) || !Number.isInteger(value.min) || !Number.isInteger(value.max)) {
    return undefined;
  }
  if (value.min < 1 || value.max < value.min || value.max > 100) {
    return undefined;
  }
  return { min: value.min, max: value.max };
}

class AiStructuredOutputError extends Error {}

function reportMalformedAiOutput(
  request: AiGenerationRequest,
  attempt: "initial" | "repair",
  content: string,
  error: unknown,
) {
  console.error(
    JSON.stringify({
      event: "malformed_ai_output",
      attempt,
      stage: request.stage,
      error: error instanceof Error ? error.message : "unknown parse error",
      content,
    }),
  );
}

function validateTechniqueStructureOutput(value: unknown): void {
  if (!isRecord(value) || !Array.isArray(value.chapters) || value.chapters.length === 0) {
    throw new AiStructuredOutputError("第一阶段响应缺少大章列表。");
  }
  if (value.chapters.length > 30) {
    throw new AiStructuredOutputError("第一阶段响应的大章数量超过 30 个。");
  }
  value.chapters.forEach((item, index) => {
    if (!isRecord(item)) {
      throw new AiStructuredOutputError(`第 ${index + 1} 个大章不是对象。`);
    }
    if (typeof item.name !== "string" || item.name.trim().length === 0) {
      throw new AiStructuredOutputError(`第 ${index + 1} 个大章缺少名称。`);
    }
    if (typeof item.description !== "string" || item.description.trim().length < 10) {
      throw new AiStructuredOutputError(`第 ${index + 1} 个大章说明不足。`);
    }
    if (!Array.isArray(item.learningObjectives) || item.learningObjectives.length === 0) {
      throw new AiStructuredOutputError(`第 ${index + 1} 个大章缺少学习目标。`);
    }
    if (!isGranularity(item.recommendedUnitDetailLevel)) {
      throw new AiStructuredOutputError(`第 ${index + 1} 个大章的单元精细度无效。`);
    }
    if (!getSuggestedCountRange(item.recommendedUnitCountRange)) {
      throw new AiStructuredOutputError(`第 ${index + 1} 个大章的建议单元数量无效。`);
    }
  });
}

function validateChapterUnitsOutput(
  value: unknown,
  requestedChapterIds: string[],
): void {
  if (!isRecord(value) || !Array.isArray(value.chapterUnits)) {
    throw new AiStructuredOutputError("第二阶段响应缺少 chapterUnits 列表。");
  }
  const returnedChapterIds = new Set<string>();
  value.chapterUnits.forEach((item, index) => {
    if (!isRecord(item) || typeof item.chapterDraftId !== "string") {
      throw new AiStructuredOutputError(`第 ${index + 1} 个大章单元结果缺少 chapterDraftId。`);
    }
    if (!requestedChapterIds.includes(item.chapterDraftId)) {
      throw new AiStructuredOutputError("第二阶段响应包含未请求的大章。" );
    }
    if (returnedChapterIds.has(item.chapterDraftId)) {
      throw new AiStructuredOutputError("第二阶段响应重复返回同一大章。" );
    }
    returnedChapterIds.add(item.chapterDraftId);
    if (!Array.isArray(item.units) || item.units.length === 0 || item.units.length > 40) {
      throw new AiStructuredOutputError(`大章 ${item.chapterDraftId} 的单元数量无效。`);
    }
    item.units.forEach((unit, unitIndex) => {
      if (!isRecord(unit)) {
        throw new AiStructuredOutputError(`大章 ${item.chapterDraftId} 的第 ${unitIndex + 1} 个单元不是对象。`);
      }
      if (typeof unit.name !== "string" || unit.name.trim().length === 0) {
        throw new AiStructuredOutputError(`大章 ${item.chapterDraftId} 的第 ${unitIndex + 1} 个单元缺少名称。`);
      }
      if (typeof unit.description !== "string" || unit.description.trim().length < 10) {
        throw new AiStructuredOutputError(`大章 ${item.chapterDraftId} 的第 ${unitIndex + 1} 个单元说明不足。`);
      }
      if (!Array.isArray(unit.learningObjectives) || unit.learningObjectives.length === 0) {
        throw new AiStructuredOutputError(`大章 ${item.chapterDraftId} 的第 ${unitIndex + 1} 个单元缺少学习目标。`);
      }
      if (!isGranularity(unit.recommendedDetailLevel)) {
        throw new AiStructuredOutputError(`大章 ${item.chapterDraftId} 的第 ${unitIndex + 1} 个单元精细度无效。`);
      }
      if (!getSuggestedCountRange(unit.recommendedKnowledgePointCountRange)) {
        throw new AiStructuredOutputError(`大章 ${item.chapterDraftId} 的第 ${unitIndex + 1} 个单元建议知识点数量无效。`);
      }
    });
  });
  if (returnedChapterIds.size !== requestedChapterIds.length) {
    throw new AiStructuredOutputError("第二阶段响应没有覆盖全部请求的大章。" );
  }
}

function validateUnitKnowledgePointsOutput(value: unknown, requestedUnitIds: string[]): void {
  if (!isRecord(value) || !Array.isArray(value.unitKnowledgePoints)) {
    throw new AiStructuredOutputError("第三阶段响应缺少 unitKnowledgePoints 列表。");
  }
  const returnedUnitIds = new Set<string>();
  value.unitKnowledgePoints.forEach((item, index) => {
    if (!isRecord(item) || typeof item.unitDraftId !== "string" || !requestedUnitIds.includes(item.unitDraftId)) {
      throw new AiStructuredOutputError(`第 ${index + 1} 个单元知识点结果无效。`);
    }
    if (returnedUnitIds.has(item.unitDraftId) || !Array.isArray(item.knowledgePoints) || item.knowledgePoints.length === 0 || item.knowledgePoints.length > 40) {
      throw new AiStructuredOutputError(`单元 ${item.unitDraftId} 的知识点列表无效。`);
    }
    returnedUnitIds.add(item.unitDraftId);
    item.knowledgePoints.forEach((knowledgePoint, knowledgePointIndex) => {
      if (!isRecord(knowledgePoint) || typeof knowledgePoint.name !== "string" || knowledgePoint.name.trim().length === 0 || typeof knowledgePoint.description !== "string" || knowledgePoint.description.trim().length < 10 || !Array.isArray(knowledgePoint.typeTags) || !Array.isArray(knowledgePoint.learningPerspectives) || typeof knowledgePoint.difficulty !== "number" || knowledgePoint.difficulty < 0.1 || knowledgePoint.difficulty > 5 || typeof knowledgePoint.importance !== "number" || knowledgePoint.importance < 0.1 || knowledgePoint.importance > 5 || !Number.isInteger(knowledgePoint.targetLayer)) {
        throw new AiStructuredOutputError(`单元 ${item.unitDraftId} 的第 ${knowledgePointIndex + 1} 个知识点字段无效。`);
      }
    });
  });
  if (returnedUnitIds.size !== requestedUnitIds.length) {
    throw new AiStructuredOutputError("第三阶段响应没有覆盖全部请求的单元。" );
  }
}

function createDeepSeekUserContent(request: AiGenerationRequest): string {
  if (request.stage === "unit_knowledge_points") {
    return JSON.stringify({
      techniqueName: request.draft.techniqueDraft?.name ?? request.draft.input.techniqueName,
      targetLayer: request.draft.techniqueDraft?.maxLayer ?? request.draft.input.targetLayer,
      units: request.draft.chapterDrafts.flatMap((chapter) =>
        chapter.unitDrafts
          .filter((unit) => request.unitDraftIds.includes(unit.draftId))
          .map((unit) => ({
            unitDraftId: unit.draftId,
            chapterName: chapter.name,
            name: unit.name,
            description: unit.description,
            learningObjectives: unit.learningObjectives,
            knowledgeGenerationConfig: unit.knowledgeGenerationConfig,
          })),
      ),
    });
  }
  if (request.stage === "chapter_units") {
    return JSON.stringify({
      techniqueName: request.draft.techniqueDraft?.name ?? request.draft.input.techniqueName,
      learningGoal: request.draft.input.learningGoal.slice(0, 1200),
      chapters: request.draft.chapterDrafts
        .filter((chapter) => request.chapterDraftIds.includes(chapter.draftId))
        .map((chapter) => ({
          chapterDraftId: chapter.draftId,
          name: chapter.name,
          description: chapter.description,
          learningObjectives: chapter.learningObjectives,
          recommendedUnitDetailLevel: chapter.recommendedUnitDetailLevel,
          recommendedUnitCountRange: chapter.recommendedUnitCountRange,
          unitGenerationConfig: chapter.unitGenerationConfig,
        })),
    });
  }
  if (request.stage !== "technique_structure") {
    return JSON.stringify(request);
  }

  const { input } = request;
  return JSON.stringify({
    techniqueName: input.techniqueName,
    sources: input.sources.map((source) => ({
      sourceType: source.sourceType,
      title: source.title,
      content: source.content,
    })),
    learningGoal: input.learningGoal,
    targetLayer: input.targetLayer,
    currentLevel: input.currentLevel,
    studyPeriodWeeks: input.studyPeriodWeeks,
    weeklyHours: input.weeklyHours,
    assessmentForm: input.assessmentForm,
    focusText: input.focusText,
    excludedContent: input.excludedContent,
    requirementText: input.requirementText,
  });
}

function normalizeUnitKnowledgePointsDraft(
  request: Extract<AiGenerationRequest, { stage: "unit_knowledge_points" }>,
  candidate: unknown,
  model: string,
): TechniqueCreationDraft {
  validateUnitKnowledgePointsOutput(candidate, request.unitDraftIds);
  const source = candidate as { unitKnowledgePoints: Array<Record<string, unknown>> };
  const knowledgePointsByUnitId = new Map(
    source.unitKnowledgePoints.map((item) => [item.unitDraftId as string, item.knowledgePoints as unknown[]]),
  );
  const maxLayer = request.draft.techniqueDraft?.maxLayer ?? request.draft.input.targetLayer;
  const defaults = request.draft.practiceDefaultsDraft;
  const manaWeight = request.draft.techniqueDraft?.manaWeight ?? 0.5;
  const insightWeight = request.draft.techniqueDraft?.insightWeight ?? 0.5;
  const now = new Date().toISOString();
  const chapterDrafts = request.draft.chapterDrafts.map((chapter) => ({
    ...structuredClone(chapter),
    unitDrafts: chapter.unitDrafts.map((unit) => {
      const rawKnowledgePoints = knowledgePointsByUnitId.get(unit.draftId);
      if (!rawKnowledgePoints) {
        return structuredClone(unit);
      }
      const knowledgePointDrafts: TechniqueCreationKnowledgePointDraft[] = rawKnowledgePoints.map((item) => {
        const knowledgePoint = item as Record<string, unknown>;
        const granularity = unit.knowledgeGenerationConfig.detailLevel === "custom"
          ? "normal"
          : unit.knowledgeGenerationConfig.detailLevel;
        const difficulty = knowledgePoint.difficulty as number;
        const importance = knowledgePoint.importance as number;
        return {
          draftId: crypto.randomUUID(),
          chapterDraftId: chapter.draftId,
          unitDraftId: unit.draftId,
          name: (knowledgePoint.name as string).trim(),
          description: (knowledgePoint.description as string).trim(),
          granularity,
          typeTags: getTextArray(knowledgePoint.typeTags),
          learningPerspectives: getTextArray(knowledgePoint.learningPerspectives),
          difficulty,
          importance,
          targetLayer: Math.min(Math.max(knowledgePoint.targetLayer as number, 1), maxLayer),
          maxTrainableLayer: maxLayer,
          requiredExerciseCount: defaults?.requiredExerciseCount ?? 0,
          requiredNoteCount: defaults?.requiredNoteCount ?? 0,
          requiredThinkingCount: defaults?.requiredThinkingCount ?? 0,
          manaWeight,
          insightWeight,
          prerequisiteDraftIds: [],
          recommendedBaseValue: calculateRecommendedBaseValue(
            granularity,
            difficulty,
            importance,
          ),
          generationRationale: typeof knowledgePoint.generationRationale === "string" && knowledgePoint.generationRationale.trim() ? knowledgePoint.generationRationale.trim() : "依据当前单元的范围和生成设置形成知识点草案。",
        };
      });
      return { ...structuredClone(unit), knowledgePointDrafts };
    }),
  }));
  const hasPendingChapter = chapterDrafts.some((chapter) => chapter.unitGenerationConfig.includeInGeneration && chapter.unitDrafts.length === 0);
  const hasPendingUnit = chapterDrafts.some((chapter) => chapter.unitDrafts.some((unit) => unit.knowledgeGenerationConfig.includeInGeneration && unit.knowledgePointDrafts.length === 0));
  return {
    ...structuredClone(request.draft),
    id: crypto.randomUUID(),
    requestId: request.requestId,
    parentDraftId: request.draft.id,
    stage: hasPendingChapter ? "units_pending" : hasPendingUnit ? "knowledge_pending" : "knowledge_ready",
    chapterDrafts,
    generationMetadata: [...request.draft.generationMetadata, { id: crypto.randomUUID(), generationType: "unit_knowledge_points", scope: { chapterDraftIds: [], unitDraftIds: [...request.unitDraftIds] }, isMock: false, provider: "deepseek", model, promptVersion: "remote-unit-knowledge-v2", schemaVersion: "1.0", generatedAt: now }],
    validationIssues: [],
    updatedAt: now,
  };
}

function normalizeChapterUnitsDraft(
  request: Extract<AiGenerationRequest, { stage: "chapter_units" }>,
  candidate: unknown,
  model: string,
): TechniqueCreationDraft {
  validateChapterUnitsOutput(candidate, request.chapterDraftIds);
  const source = candidate as { chapterUnits: Array<Record<string, unknown>> };
  const unitsByChapterId = new Map(
    source.chapterUnits.map((item) => [item.chapterDraftId as string, item.units as unknown[]]),
  );
  const now = new Date().toISOString();
  const chapterDrafts = request.draft.chapterDrafts.map((chapter) => {
    const rawUnits = unitsByChapterId.get(chapter.draftId);
    if (!rawUnits) {
      return structuredClone(chapter);
    }
    const unitDrafts: TechniqueUnitDraft[] = rawUnits.map((item, index) => {
      const unit = item as Record<string, unknown>;
      const recommendedDetailLevel = unit.recommendedDetailLevel as KnowledgeGranularity;
      return {
        draftId: crypto.randomUUID(),
        chapterDraftId: chapter.draftId,
        code: `${chapter.code}-u${String(index + 1).padStart(2, "0")}`,
        name: (unit.name as string).trim(),
        description: (unit.description as string).trim(),
        order: index + 1,
        learningObjectives: getTextArray(unit.learningObjectives),
        recommendedDetailLevel,
        recommendedKnowledgePointCountRange: getSuggestedCountRange(
          unit.recommendedKnowledgePointCountRange,
        ),
        knowledgeGenerationConfig: {
          includeInGeneration: true,
          detailLevel: recommendedDetailLevel,
        },
        knowledgePointDrafts: [],
      };
    });
    return { ...structuredClone(chapter), unitDrafts };
  });
  const hasPendingChapter = chapterDrafts.some(
    (chapter) => chapter.unitGenerationConfig.includeInGeneration && chapter.unitDrafts.length === 0,
  );

  return {
    ...structuredClone(request.draft),
    id: crypto.randomUUID(),
    requestId: request.requestId,
    parentDraftId: request.draft.id,
    stage: hasPendingChapter ? "units_pending" : "units_ready",
    chapterDrafts,
    generationMetadata: [
      ...request.draft.generationMetadata,
      {
        id: crypto.randomUUID(),
        generationType: "chapter_units",
        scope: { chapterDraftIds: [...request.chapterDraftIds], unitDraftIds: [] },
        isMock: false,
        provider: "deepseek",
        model,
        promptVersion: "remote-chapter-units-v2",
        schemaVersion: "1.0",
        generatedAt: now,
      },
    ],
    validationIssues: [],
    updatedAt: now,
  };
}

function normalizeTechniqueStructureDraft(
  request: Extract<AiGenerationRequest, { stage: "technique_structure" }>,
  candidate: unknown,
): TechniqueCreationDraft {
  const fallback = createMockTechniqueStructureDraft(request.input, request.requestId);
  const source = isRecord(candidate) ? candidate : {};
  const rawTechnique = isRecord(source.techniqueDraft)
    ? source.techniqueDraft
    : isRecord(source.technique)
      ? source.technique
      : {
          description: source.description,
          generationRationale: source.generationRationale,
        };
  const rawChapters = Array.isArray(source.chapterDrafts)
    ? source.chapterDrafts
    : Array.isArray(source.chapters)
      ? source.chapters
      : [];

  if (rawChapters.length === 0) {
    throw new Error("DeepSeek 未返回可用的大章列表。");
  }

  const techniqueDraft: TechniqueBaseDraft = {
    ...fallback.techniqueDraft!,
    name: typeof rawTechnique.name === "string" && rawTechnique.name.trim()
      ? rawTechnique.name.trim()
      : fallback.techniqueDraft!.name,
    description: typeof rawTechnique.description === "string" && rawTechnique.description.trim()
      ? rawTechnique.description.trim()
      : fallback.techniqueDraft!.description,
    courseValueCoefficientSuggestion:
      typeof rawTechnique.courseValueCoefficientSuggestion === "number"
        ? rawTechnique.courseValueCoefficientSuggestion
        : fallback.techniqueDraft!.courseValueCoefficientSuggestion,
    manaWeight: typeof rawTechnique.manaWeight === "number"
      ? rawTechnique.manaWeight
      : fallback.techniqueDraft!.manaWeight,
    insightWeight: typeof rawTechnique.insightWeight === "number"
      ? rawTechnique.insightWeight
      : fallback.techniqueDraft!.insightWeight,
    soulWeight: typeof rawTechnique.soulWeight === "number"
      ? rawTechnique.soulWeight
      : fallback.techniqueDraft!.soulWeight,
    maxLayer: Number.isInteger(rawTechnique.maxLayer)
      ? rawTechnique.maxLayer
      : fallback.techniqueDraft!.maxLayer,
    prerequisiteSuggestions: Array.isArray(rawTechnique.prerequisiteSuggestions)
      ? rawTechnique.prerequisiteSuggestions.filter(
          (item): item is TechniqueBaseDraft["prerequisiteSuggestions"][number] =>
            isRecord(item) && typeof item.name === "string" && typeof item.reason === "string",
        )
      : fallback.techniqueDraft!.prerequisiteSuggestions,
    generationRationale: typeof rawTechnique.generationRationale === "string" && rawTechnique.generationRationale.trim()
      ? rawTechnique.generationRationale.trim()
      : fallback.techniqueDraft!.generationRationale,
  };

  const chapterDrafts: TechniqueChapterDraft[] = rawChapters.map((item, index) => {
    const chapter = isRecord(item) ? item : {};
    const recommendedUnitCountRange = getSuggestedCountRange(chapter.recommendedUnitCountRange);
    const recommendedUnitDetailLevel = isGranularity(chapter.recommendedUnitDetailLevel)
      ? chapter.recommendedUnitDetailLevel
      : "normal";
    return {
      draftId: crypto.randomUUID(),
      code: typeof chapter.code === "string" && chapter.code.trim()
        ? chapter.code.trim()
        : `ch${String(index + 1).padStart(2, "0")}`,
      name: typeof chapter.name === "string" && chapter.name.trim()
        ? chapter.name.trim()
        : `第 ${index + 1} 章`,
      description: typeof chapter.description === "string" && chapter.description.trim()
        ? chapter.description.trim()
        : "请在确认大章时补充本章的学习范围。",
      order: index + 1,
      learningObjectives: getTextArray(chapter.learningObjectives),
      recommendedUnitDetailLevel,
      recommendedUnitCountRange,
      unitGenerationConfig: {
        includeInGeneration: true,
        detailLevel: recommendedUnitDetailLevel,
      },
      unitDrafts: [],
    };
  });

  return {
    ...fallback,
    techniqueDraft,
    chapterDrafts,
  };
}

function createDeepSeekInstructions(request: AiGenerationRequest): string {
  const stageInstruction =
    request.stage === "technique_structure"
      ? [
          "只生成大章结构。不要输出功法名、权重、层数规则、复习规则、id、状态、时间、单元或知识点。",
          "顶层 JSON 必须且只能是 {\"structure\":{\"description\":\"...\",\"generationRationale\":\"...\",\"chapters\":[...]}}。",
          "chapters 至少 1 个、至多 30 个。每项必须且只能含 name、description、learningObjectives、recommendedUnitDetailLevel、recommendedUnitCountRange。",
          "description 至少 10 个汉字；learningObjectives 为至少 1 条字符串组成的数组；recommendedUnitDetailLevel 只能为 rough、normal、detailed；recommendedUnitCountRange 必须是 {\"min\":正整数,\"max\":不小于 min 的正整数}。",
        ].join("\n")
      : request.stage === "chapter_units"
        ? [
            "只为用户消息中的 chapters 生成单元。不要输出任何完整草案、功法规则、原始材料、id、代码、顺序、状态或知识点。",
            "顶层 JSON 必须且只能是 {\"chapterUnits\":[...]}。chapterUnits 必须为每个输入章节各返回一项，且 chapterDraftId 必须原样保留。",
            "每项必须且只能含 chapterDraftId、units。units 至少 1 个、至多 40 个；每个 unit 必须且只能含 name、description、learningObjectives、recommendedDetailLevel、recommendedKnowledgePointCountRange。",
            "description 至少 10 个汉字；learningObjectives 至少 1 条；recommendedDetailLevel 只能为 rough、normal、detailed；recommendedKnowledgePointCountRange 必须是 {\"min\":正整数,\"max\":不小于 min 的正整数}。",
          ].join("\n")
        : [
            "只为用户消息中的 units 生成知识点。不要输出完整草案、原始材料、功法规则、id、归属、训练次数、权重、复习策略或前置依赖。",
            "顶层 JSON 必须且只能是 {\"unitKnowledgePoints\":[...]}，且必须为每个输入单元各返回一项并原样保留 unitDraftId。",
            "每项必须且只能含 unitDraftId、knowledgePoints。每个知识点必须且只能含 name、description、typeTags、learningPerspectives、difficulty、importance、targetLayer、generationRationale。",
            "description 至少 10 个汉字；difficulty 和 importance 在 0.1 到 5；targetLayer 是 1 到用户目标层数的整数。",
          ].join("\n");
  return [
    "你是个人学习系统的草案生成器。",
    stageInstruction,
    "只返回合法 JSON，不要 Markdown 或解释文字。",
    request.stage === "technique_structure"
      ? "返回格式必须严格遵守上面的 structure 对象。"
      : request.stage === "chapter_units"
        ? "返回格式必须严格遵守上面的 chapterUnits 对象。"
        : "返回格式必须严格遵守上面的 unitKnowledgePoints 对象。",
    "知识点 description 至少 10 字，difficulty/importance 在 0.1 到 5，层数为 1 到 6 的整数。",
  ].join("\n");
}

async function generateWithDeepSeek(
  config: AiServiceConfig,
  request: AiGenerationRequest,
): Promise<AiGenerationResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY || config.apiKey;
  if (!apiKey) {
    return {
      requestId: request.requestId,
      stage: request.stage,
      status: "failed",
      error: { code: "missing_api_key", message: "真实模式需要先配置 DeepSeek API Key。" },
    };
  }
  async function requestJsonContent(isRepairAttempt: boolean) {
    const providerResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: isRepairAttempt ? 0 : 0.3,
        max_tokens:
          request.stage === "technique_structure"
            ? 2_500
            : request.stage === "chapter_units"
              ? 3_500
              : 4_000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              createDeepSeekInstructions(request),
              isRepairAttempt
                ? "上一次输出不是有效 JSON。本次必须从第一个 { 开始，到最后一个 } 结束；字段之间必须使用逗号，不要输出任何额外文字。"
                : "",
            ].filter(Boolean).join("\n"),
          },
          { role: "user", content: createDeepSeekUserContent(request) },
        ],
      }),
    });
    const providerBody: unknown = await providerResponse.json();
    if (!providerResponse.ok) {
      const message = isRecord(providerBody) && isRecord(providerBody.error) && typeof providerBody.error.message === "string"
        ? providerBody.error.message
        : "DeepSeek 服务请求失败。";
      throw new Error(message);
    }
    const content = isRecord(providerBody) && Array.isArray(providerBody.choices) && isRecord(providerBody.choices[0]) && isRecord(providerBody.choices[0].message) && typeof providerBody.choices[0].message.content === "string"
      ? providerBody.choices[0].message.content
      : undefined;
    if (!content) {
      throw new Error("DeepSeek 响应缺少 JSON 内容。");
    }

    return { content, providerBody };
  }

  try {
    let result = await requestJsonContent(false);
    let parsed: unknown;
    const parseOutput = (content: string) => {
      const parsedOutput: unknown = JSON.parse(content);
      const output = isRecord(parsedOutput) && isRecord(parsedOutput.draft)
        ? parsedOutput.draft
        : isRecord(parsedOutput) && isRecord(parsedOutput.structure)
          ? parsedOutput.structure
          : parsedOutput;
      if (request.stage === "technique_structure") {
        validateTechniqueStructureOutput(output);
      }
      if (request.stage === "chapter_units") {
        validateChapterUnitsOutput(output, request.chapterDraftIds);
      }
      if (request.stage === "unit_knowledge_points") {
        validateUnitKnowledgePointsOutput(output, request.unitDraftIds);
      }
      return parsedOutput;
    };
    try {
      parsed = parseOutput(result.content);
    } catch (initialParseError) {
      reportMalformedAiOutput(request, "initial", result.content, initialParseError);
      if (!(initialParseError instanceof SyntaxError) && !(initialParseError instanceof AiStructuredOutputError)) {
        throw initialParseError;
      }
      try {
        result = await requestJsonContent(true);
        parsed = parseOutput(result.content);
      } catch (repairError) {
        reportMalformedAiOutput(request, "repair", result.content, repairError);
        if (repairError instanceof SyntaxError || repairError instanceof AiStructuredOutputError) {
          throw new Error("AI 返回的结构化内容格式错误，已自动重试一次仍无法解析。请稍后重新生成。");
        }
        throw repairError;
      }
    }
    const rawDraft = isRecord(parsed) && isRecord(parsed.draft)
      ? parsed.draft
      : isRecord(parsed) && isRecord(parsed.structure)
        ? parsed.structure
        : parsed;
    const draft = request.stage === "technique_structure"
      ? normalizeTechniqueStructureDraft(request, rawDraft)
      : request.stage === "chapter_units"
        ? normalizeChapterUnitsDraft(request, rawDraft, config.model)
        : normalizeUnitKnowledgePointsDraft(request, rawDraft, config.model);
    return {
      requestId: request.requestId,
      stage: request.stage,
      status: "success",
      provider: "remote",
      model: config.model,
      draft,
      usage: isRecord(result.providerBody.usage) && typeof result.providerBody.usage.prompt_tokens === "number" && typeof result.providerBody.usage.completion_tokens === "number"
        ? { inputTokens: result.providerBody.usage.prompt_tokens, outputTokens: result.providerBody.usage.completion_tokens }
        : undefined,
    };
  } catch (error) {
    return {
      requestId: request.requestId,
      stage: request.stage,
      status: "failed",
      error: { code: "deepseek_response_error", message: error instanceof Error ? error.message : "无法解析 DeepSeek 响应。" },
    };
  }
}

async function handleConfig(request: IncomingMessage, response: ServerResponse) {
  const currentConfig = await loadConfig();
  if (request.method === "GET") {
    sendJson(response, 200, getPublicConfig(currentConfig));
    return;
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "method_not_allowed" });
    return;
  }
  const body = await readJsonBody(request);
  if (!isRecord(body) || (body.mode !== "mock" && body.mode !== "remote")) {
    sendJson(response, 400, { error: "invalid_config" });
    return;
  }
  const model = typeof body.model === "string" ? body.model.trim() : "";
  if (!model || model.length > 120) {
    sendJson(response, 400, { error: "invalid_model" });
    return;
  }
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;
  const nextConfig: AiServiceConfig = {
    mode: body.mode,
    provider: "deepseek",
    model,
    apiKey: body.clearApiKey === true ? undefined : apiKey || currentConfig.apiKey,
  };
  await saveConfig(nextConfig);
  sendJson(response, 200, getPublicConfig(nextConfig));
}

async function handleGeneration(request: IncomingMessage, response: ServerResponse) {
  const body = await readJsonBody(request);
  if (!isAiGenerationRequest(body)) {
    sendJson(response, 400, {
      requestId: isRecord(body) && typeof body.requestId === "string" ? body.requestId : "unknown",
      stage: isRecord(body) && typeof body.stage === "string" ? body.stage : "technique_structure",
      status: "failed",
      error: { code: "invalid_request", message: "AI 请求不符合接口合同。" },
    });
    return;
  }
  const config = await loadConfig();
  if (config.mode === "remote") {
    const result = await generateWithDeepSeek(config, body);
    const validationErrors = validateAiGenerationResponse(body, result);
    if (validationErrors.length > 0) {
      sendJson(response, 422, {
        requestId: body.requestId,
        stage: body.stage,
        status: "failed",
        error: { code: "invalid_ai_response", message: validationErrors.join("；") },
      });
      return;
    }
    sendJson(response, result.status === "success" ? 200 : 422, result);
    return;
  }
  const result = await mockAiGenerationClient.generate(body);
  const validationErrors = validateAiGenerationResponse(body, result);
  if (validationErrors.length > 0) {
    sendJson(response, 422, {
      requestId: body.requestId,
      stage: body.stage,
      status: "failed",
      error: { code: "invalid_ai_response", message: validationErrors.join("；") },
    });
    return;
  }
  sendJson(response, result.status === "success" ? 200 : 422, result);
}

async function handleConnectionTest(response: ServerResponse) {
  const config = await loadConfig();
  const apiKey = process.env.DEEPSEEK_API_KEY || config.apiKey;
  if (config.mode !== "remote") {
    sendJson(response, 400, { message: "请先切换为真实 AI 服务模式。" });
    return;
  }
  if (!apiKey) {
    sendJson(response, 400, { message: "请先配置 DeepSeek API Key。" });
    return;
  }
  try {
    const providerResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: config.model, max_tokens: 8, messages: [{ role: "user", content: "Reply with OK." }] }),
    });
    if (!providerResponse.ok) {
      throw new Error(`DeepSeek 返回 HTTP ${providerResponse.status}。`);
    }
    sendJson(response, 200, { message: `DeepSeek 连接成功，当前模型：${config.model}。` });
  } catch (error) {
    sendJson(response, 502, { message: error instanceof Error ? error.message : "无法连接 DeepSeek。" });
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === "/api/ai/config") {
      await handleConfig(request, response);
      return;
    }
    if (request.url === "/api/ai/connection-test" && request.method === "POST") {
      await handleConnectionTest(response);
      return;
    }
    if (request.url === "/api/ai/technique-draft/generate" && request.method === "POST") {
      await handleGeneration(request, response);
      return;
    }
    sendJson(response, 404, { error: "not_found" });
  } catch (error) {
    sendJson(response, 500, {
      error: "server_error",
      message: error instanceof Error ? error.message : "本地 AI 服务失败。",
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI backend listening on http://127.0.0.1:${port}`);
});
