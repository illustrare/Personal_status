import type { AiDraftRequest, TechniquePlanDraft } from "../types/domain";

const AI_DRAFT_REQUESTS_STORAGE_KEY = "personal-status:ai-draft-requests";
const TECHNIQUE_PLAN_DRAFTS_STORAGE_KEY =
  "personal-status:technique-plan-drafts";

function readStorageArray<T>(storageKey: string): T[] {
  const storedValue = localStorage.getItem(storageKey);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? (parsedValue as T[]) : [];
  } catch {
    return [];
  }
}

function writeStorageArray<T>(storageKey: string, value: T[]) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

export function loadAiDraftRequests(): AiDraftRequest[] {
  return readStorageArray<AiDraftRequest>(AI_DRAFT_REQUESTS_STORAGE_KEY);
}

export function saveAiDraftRequests(requests: AiDraftRequest[]) {
  writeStorageArray(AI_DRAFT_REQUESTS_STORAGE_KEY, requests);
}

export function loadTechniquePlanDrafts(): TechniquePlanDraft[] {
  return readStorageArray<TechniquePlanDraft>(TECHNIQUE_PLAN_DRAFTS_STORAGE_KEY);
}

export function saveTechniquePlanDrafts(drafts: TechniquePlanDraft[]) {
  writeStorageArray(TECHNIQUE_PLAN_DRAFTS_STORAGE_KEY, drafts);
}
