import type { Breakthrough } from "../types/domain";

const BREAKTHROUGHS_STORAGE_KEY = "personal_status.breakthroughs";

function loadJsonFromStorage<TValue>(
  storageKey: string,
  fallbackValue: TValue,
): TValue {
  const storedValue = localStorage.getItem(storageKey);

  if (!storedValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(storedValue) as TValue;
  } catch {
    return fallbackValue;
  }
}

export function loadBreakthroughs(): Breakthrough[] {
  return loadJsonFromStorage<Breakthrough[]>(BREAKTHROUGHS_STORAGE_KEY, []);
}

export function saveBreakthroughs(breakthroughs: Breakthrough[]) {
  localStorage.setItem(BREAKTHROUGHS_STORAGE_KEY, JSON.stringify(breakthroughs));
}
