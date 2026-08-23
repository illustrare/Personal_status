import type {
  PracticeRecord,
  PracticeRecordKnowledgePoint,
} from "../types/domain";

const PRACTICE_RECORDS_STORAGE_KEY = "personal-status:practice-records";
const PRACTICE_RECORD_KNOWLEDGE_POINTS_STORAGE_KEY =
  "personal-status:practice-record-knowledge-points";

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

export function loadPracticeRecords(): PracticeRecord[] {
  return readStorageArray<PracticeRecord>(PRACTICE_RECORDS_STORAGE_KEY);
}

export function savePracticeRecords(practiceRecords: PracticeRecord[]) {
  writeStorageArray(PRACTICE_RECORDS_STORAGE_KEY, practiceRecords);
}

export function loadPracticeRecordKnowledgePoints(): PracticeRecordKnowledgePoint[] {
  return readStorageArray<PracticeRecordKnowledgePoint>(
    PRACTICE_RECORD_KNOWLEDGE_POINTS_STORAGE_KEY,
  );
}

export function savePracticeRecordKnowledgePoints(
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[],
) {
  writeStorageArray(
    PRACTICE_RECORD_KNOWLEDGE_POINTS_STORAGE_KEY,
    practiceRecordKnowledgePoints,
  );
}

export function clearPracticeStorage() {
  localStorage.removeItem(PRACTICE_RECORDS_STORAGE_KEY);
  localStorage.removeItem(PRACTICE_RECORD_KNOWLEDGE_POINTS_STORAGE_KEY);
}
