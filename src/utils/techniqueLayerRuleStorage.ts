import type { TechniqueLayerRule } from "../types/domain";

const TECHNIQUE_LAYER_RULES_STORAGE_KEY =
  "personal-status:technique-layer-rules";

function readTechniqueLayerRules(): TechniqueLayerRule[] {
  const storedValue = localStorage.getItem(TECHNIQUE_LAYER_RULES_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? (parsedValue as TechniqueLayerRule[]) : [];
  } catch {
    return [];
  }
}

export function loadTechniqueLayerRuleOverrides(): TechniqueLayerRule[] {
  return readTechniqueLayerRules();
}

export function saveTechniqueLayerRuleOverrides(rules: TechniqueLayerRule[]) {
  localStorage.setItem(TECHNIQUE_LAYER_RULES_STORAGE_KEY, JSON.stringify(rules));
}
