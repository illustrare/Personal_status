import type {
  TechniqueCreationDraft,
  TechniqueCreationKnowledgePointDraft,
} from "../types/domain";
import { validateUnitKnowledgePointDrafts } from "./techniqueKnowledgeDraft";
import type {
  AiGenerationRequest,
  AiGenerationResponse,
} from "./aiGenerationClient";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getAllKnowledgePoints(
  draft: TechniqueCreationDraft,
): TechniqueCreationKnowledgePointDraft[] {
  return draft.chapterDrafts.flatMap((chapter) =>
    chapter.unitDrafts.flatMap((unit) => unit.knowledgePointDrafts),
  );
}

export function validateAiGenerationResponse(
  request: AiGenerationRequest,
  response: AiGenerationResponse,
): string[] {
  if (response.status === "failed") {
    return [];
  }

  const errors: string[] = [];
  if (response.requestId !== request.requestId) {
    errors.push("响应 requestId 与请求不一致。");
  }
  if (response.stage !== request.stage) {
    errors.push("响应阶段与请求阶段不一致。");
  }
  const draft = response.draft;
  if (!isRecord(draft) || draft.schemaVersion !== "1.0") {
    errors.push("响应缺少可识别的草案版本。");
    return errors;
  }
  if (!Array.isArray(draft.chapterDrafts)) {
    errors.push("响应缺少大章草案列表。");
    return errors;
  }

  if (request.stage === "technique_structure") {
    if (!draft.techniqueDraft || !draft.practiceDefaultsDraft) {
      errors.push("第一阶段响应缺少功法规则草案。");
    }
    if (!hasText(draft.techniqueDraft?.name)) {
      errors.push("第一阶段响应缺少功法名称。");
    }
    if (
      !Number.isInteger(draft.techniqueDraft?.maxLayer) ||
      (draft.techniqueDraft?.maxLayer ?? 0) < 1 ||
      (draft.techniqueDraft?.maxLayer ?? 0) > 6
    ) {
      errors.push("第一阶段响应的最高层数无效。");
    }
    if (draft.chapterDrafts.length === 0) {
      errors.push("第一阶段响应至少需要一个大章。");
    }
    draft.chapterDrafts.forEach((chapter, index) => {
      if (!hasText(chapter.draftId) || !hasText(chapter.name)) {
        errors.push(`第 ${index + 1} 个大章缺少 id 或名称。`);
      }
    });
    return errors;
  }

  if (request.stage === "chapter_units") {
    request.chapterDraftIds.forEach((chapterId) => {
      const chapter = draft.chapterDrafts.find(
        (item) => item.draftId === chapterId,
      );
      if (!chapter) {
        errors.push(`响应缺少请求的大章 ${chapterId}。`);
        return;
      }
      if (chapter.unitDrafts.length === 0) {
        errors.push(`大章“${chapter.name}”没有生成单元。`);
      }
      chapter.unitDrafts.forEach((unit) => {
        if (unit.chapterDraftId !== chapterId || !hasText(unit.name)) {
          errors.push(`大章“${chapter.name}”包含归属或名称无效的单元。`);
        }
      });
    });
    return errors;
  }

  const allKnowledgePoints = getAllKnowledgePoints(draft);
  request.unitDraftIds.forEach((unitId) => {
    const unit = draft.chapterDrafts
      .flatMap((chapter) => chapter.unitDrafts)
      .find((item) => item.draftId === unitId);
    if (!unit) {
      errors.push(`响应缺少请求的单元 ${unitId}。`);
      return;
    }
    if (unit.knowledgePointDrafts.length === 0) {
      errors.push(`单元“${unit.name}”没有生成知识点。`);
      return;
    }
    errors.push(
      ...validateUnitKnowledgePointDrafts(
        unit,
        draft.techniqueDraft?.maxLayer ?? 6,
        allKnowledgePoints,
      ),
    );
  });
  return [...new Set(errors)];
}
