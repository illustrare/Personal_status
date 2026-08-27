import type {
  TechniqueCreationDraft,
  TechniqueCreationInput,
} from "../types/domain";
import {
  createMockChapterUnits,
  createMockTechniqueStructureDraft,
  createMockUnitKnowledgePoints,
} from "./mockAiDraft";
import { validateAiGenerationResponse } from "./aiGenerationValidation";

export type AiGenerationRequest =
  | {
      requestId: string;
      schemaVersion: "1.0";
      stage: "technique_structure";
      input: TechniqueCreationInput;
    }
  | {
      requestId: string;
      schemaVersion: "1.0";
      stage: "chapter_units";
      draft: TechniqueCreationDraft;
      chapterDraftIds: string[];
    }
  | {
      requestId: string;
      schemaVersion: "1.0";
      stage: "unit_knowledge_points";
      draft: TechniqueCreationDraft;
      unitDraftIds: string[];
    };

export type AiGenerationResponse =
  | {
      requestId: string;
      stage: AiGenerationRequest["stage"];
      status: "success";
      provider: "mock" | "remote";
      model?: string;
      draft: TechniqueCreationDraft;
      usage?: { inputTokens: number; outputTokens: number };
    }
  | {
      requestId: string;
      stage: AiGenerationRequest["stage"];
      status: "failed";
      error: { code: string; message: string };
    };

export interface AiGenerationClient {
  generate(request: AiGenerationRequest): Promise<AiGenerationResponse>;
}

const AI_GENERATION_ENDPOINT = "/api/ai/technique-draft/generate";
const AI_GENERATION_TIMEOUT_MS = 90_000;

function isAiGenerationResponse(value: unknown): value is AiGenerationResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const response = value as Partial<AiGenerationResponse>;
  return (
    typeof response.requestId === "string" &&
    typeof response.stage === "string" &&
    (response.status === "success" || response.status === "failed")
  );
}

export const remoteAiGenerationClient: AiGenerationClient = {
  async generate(request) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      AI_GENERATION_TIMEOUT_MS,
    );

    try {
      const response = await fetch(AI_GENERATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      const body: unknown = await response.json();
      if (!isAiGenerationResponse(body)) {
        throw new Error("AI 服务返回的数据不符合接口合同。");
      }
      const validationErrors = validateAiGenerationResponse(request, body);
      if (validationErrors.length > 0) {
        return {
          requestId: request.requestId,
          stage: request.stage,
          status: "failed",
          error: {
            code: "invalid_ai_response",
            message: validationErrors.join("；"),
          },
        };
      }
      return body;
    } catch (error) {
      return {
        requestId: request.requestId,
        stage: request.stage,
        status: "failed",
        error: {
          code: error instanceof DOMException && error.name === "AbortError"
            ? "request_timeout"
            : "network_request_failed",
          message:
            error instanceof DOMException && error.name === "AbortError"
              ? "AI 服务响应超时，请稍后重试。"
              : error instanceof Error
                ? error.message
                : "AI 服务请求失败。",
        },
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  },
};

function createSuccessResponse(
  request: AiGenerationRequest,
  draft: TechniqueCreationDraft,
): AiGenerationResponse {
  return {
    requestId: request.requestId,
    stage: request.stage,
    status: "success",
    provider: "mock",
    draft: { ...draft, requestId: request.requestId },
  };
}

export const mockAiGenerationClient: AiGenerationClient = {
  async generate(request) {
    try {
      switch (request.stage) {
        case "technique_structure":
          return createSuccessResponse(
            request,
            createMockTechniqueStructureDraft(request.input, request.requestId),
          );
        case "chapter_units":
          return createSuccessResponse(
            request,
            createMockChapterUnits(request.draft, request.chapterDraftIds),
          );
        case "unit_knowledge_points":
          return createSuccessResponse(
            request,
            createMockUnitKnowledgePoints(request.draft, request.unitDraftIds),
          );
      }
    } catch (error) {
      return {
        requestId: request.requestId,
        stage: request.stage,
        status: "failed",
        error: {
          code: "mock_generation_failed",
          message: error instanceof Error ? error.message : "Mock 草案生成失败。",
        },
      };
    }
  },
};
