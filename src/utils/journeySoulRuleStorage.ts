import type { JourneySoulRule } from "../types/domain";

const JOURNEY_SOUL_RULE_STORAGE_KEY = "personal-status:journey-soul-rule";

export function loadJourneySoulRuleOverride(): JourneySoulRule | undefined {
  const storedValue = localStorage.getItem(JOURNEY_SOUL_RULE_STORAGE_KEY);

  if (!storedValue) {
    return undefined;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    return parsedValue && typeof parsedValue === "object"
      ? (parsedValue as JourneySoulRule)
      : undefined;
  } catch {
    return undefined;
  }
}

export function saveJourneySoulRuleOverride(rule: JourneySoulRule | undefined) {
  if (!rule) {
    localStorage.removeItem(JOURNEY_SOUL_RULE_STORAGE_KEY);
    return;
  }

  localStorage.setItem(JOURNEY_SOUL_RULE_STORAGE_KEY, JSON.stringify(rule));
}
