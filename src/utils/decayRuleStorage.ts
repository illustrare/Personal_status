import type { DecayRule } from "../types/domain";

const DECAY_RULE_STORAGE_KEY = "personal-status:decay-rule";

export function loadDecayRuleOverride(): DecayRule | undefined {
  const storedValue = localStorage.getItem(DECAY_RULE_STORAGE_KEY);

  if (!storedValue) {
    return undefined;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    return parsedValue && typeof parsedValue === "object"
      ? (parsedValue as DecayRule)
      : undefined;
  } catch {
    return undefined;
  }
}

export function saveDecayRuleOverride(rule: DecayRule | undefined) {
  if (!rule) {
    localStorage.removeItem(DECAY_RULE_STORAGE_KEY);
    return;
  }

  localStorage.setItem(DECAY_RULE_STORAGE_KEY, JSON.stringify(rule));
}
