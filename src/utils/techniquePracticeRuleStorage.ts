import type { TechniquePracticeDefaults } from "../types/domain";

const TECHNIQUE_PRACTICE_RULES_STORAGE_KEY =
  "personal-status:technique-practice-rules";

function readTechniquePracticeRules(): TechniquePracticeDefaults[] {
  const storedValue = localStorage.getItem(
    TECHNIQUE_PRACTICE_RULES_STORAGE_KEY,
  );

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? (parsedValue as TechniquePracticeDefaults[])
      : [];
  } catch {
    return [];
  }
}

export function loadTechniquePracticeRuleOverrides(): TechniquePracticeDefaults[] {
  return readTechniquePracticeRules();
}

export function saveTechniquePracticeRuleOverrides(
  rules: TechniquePracticeDefaults[],
) {
  localStorage.setItem(
    TECHNIQUE_PRACTICE_RULES_STORAGE_KEY,
    JSON.stringify(rules),
  );
}
