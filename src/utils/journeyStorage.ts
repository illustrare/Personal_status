import type { Journey } from "../types/domain";

const JOURNEYS_STORAGE_KEY = "personal_status_journeys";

function loadJsonArray<TItem>(storageKey: string): TItem[] {
  const storedValue = localStorage.getItem(storageKey);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? (parsedValue as TItem[]) : [];
  } catch {
    return [];
  }
}

export function loadJourneys(): Journey[] {
  return loadJsonArray<Journey>(JOURNEYS_STORAGE_KEY);
}

export function saveJourneys(journeys: Journey[]): void {
  localStorage.setItem(JOURNEYS_STORAGE_KEY, JSON.stringify(journeys));
}
