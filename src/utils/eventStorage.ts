import type { Event } from "../types/domain";

const EVENTS_STORAGE_KEY = "personal_status.events";

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

export function loadEvents(): Event[] {
  return loadJsonFromStorage<Event[]>(EVENTS_STORAGE_KEY, []);
}

export function saveEvents(events: Event[]) {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}
