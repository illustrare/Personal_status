import type { RealmRule } from "../types/domain";

const REALM_RULES_STORAGE_KEY = "personal-status:realm-rules";

function readRealmRules(): RealmRule[] {
  const storedValue = localStorage.getItem(REALM_RULES_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? (parsedValue as RealmRule[]) : [];
  } catch {
    return [];
  }
}

export function loadRealmRuleOverrides(): RealmRule[] {
  return readRealmRules();
}

export function saveRealmRuleOverrides(rules: RealmRule[]) {
  localStorage.setItem(REALM_RULES_STORAGE_KEY, JSON.stringify(rules));
}
