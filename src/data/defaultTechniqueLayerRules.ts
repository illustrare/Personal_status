import type {
  Technique,
  TechniqueLayerBreakthroughRequirement,
  TechniqueLayerRequirementType,
  TechniqueLayerRule,
} from "../types/domain";
import { defaultTechniques } from "./defaultTechniques";

const DEFAULT_CREATED_AT = "2026-08-24T00:00:00.000Z";
const MATH_ANALYSIS_LAYER_VALUES = [60000, 54000, 63000, 72000, 81000, 30000];
const LAYER_COVERAGE_REQUIREMENTS = [0.6, 0.7, 0.78, 0.84, 0.9, 0.95];
const LAYER_CORE_COVERAGE_REQUIREMENTS = [0.75, 0.82, 0.88, 0.92, 0.96, 1];
const LAYER_WEAK_POINT_LIMITS = [0.35, 0.28, 0.2, 0.15, 0.1, 0.05];

function getRequirementText(
  technique: Technique,
  layer: number,
): Array<{
  title: string;
  description: string;
  requirementType: TechniqueLayerRequirementType;
}> {
  if (technique.sectId === "phil") {
    return [
      {
        title: `完成${technique.name}第 ${layer} 层阶段论述`,
        description: "围绕本层核心人物、文本或问题写出一份阶段性论述。",
        requirementType: "output",
      },
      {
        title: "整理概念和论证卡",
        description: "把本层关键概念、论证路径和相邻问题整理成可复习材料。",
        requirementType: "summary",
      },
      {
        title: "完成一次口头或书面自测",
        description: "用名词解释、简答题或论述题检查本层掌握情况。",
        requirementType: "test",
      },
    ];
  }

  if (technique.sectId === "eng") {
    return [
      {
        title: `完成${technique.name}第 ${layer} 层综合训练`,
        description: "完成一次能体现当前层级的限时训练或真实表达任务。",
        requirementType: "test",
      },
      {
        title: "提交阶段复盘",
        description: "记录正确率、速度、输出质量和主要薄弱点。",
        requirementType: "summary",
      },
      {
        title: "完成稳定性检查",
        description: "通过多次训练证明能力不是单次偶然发挥。",
        requirementType: "review",
      },
    ];
  }

  return [
    {
      title: `完成${technique.name}第 ${layer} 层综合测试`,
      description: "完成一组能覆盖本层核心概念和基本方法的综合题。",
      requirementType: "test",
    },
    {
      title: "整理本层知识结构",
      description: "写出核心概念、定理、方法和相邻知识点之间的关系。",
      requirementType: "summary",
    },
    {
      title: "完成薄弱点复盘",
      description: "检查仍未完成或明显薄弱的知识点，并记录补修计划。",
      requirementType: "review",
    },
  ];
}

function createBreakthroughRequirements(
  technique: Technique,
  layer: number,
): TechniqueLayerBreakthroughRequirement[] {
  return getRequirementText(technique, layer).map((requirement, index) => ({
    id: `${technique.id}_layer_${layer}_requirement_${index + 1}`,
    ...requirement,
    isRequired: true,
  }));
}

function getLayerRequiredExperience(
  technique: Technique,
  layer: number,
): number {
  const cumulativeBaseValue = MATH_ANALYSIS_LAYER_VALUES
    .slice(0, layer)
    .reduce((total, value) => total + value, 0);

  return Math.round(cumulativeBaseValue * technique.courseValueCoefficient);
}

function createTechniqueLayerRules(
  technique: Technique,
): TechniqueLayerRule[] {
  return Array.from({ length: technique.maxLayer }, (_, index) => {
    const layer = index + 1;

    return {
      id: `${technique.id}_layer_${layer}`,
      techniqueId: technique.id,
      layer,
      requiredExperience: getLayerRequiredExperience(technique, layer),
      requiredCoverageRatio: LAYER_COVERAGE_REQUIREMENTS[index] ?? 0.95,
      requiredCoreCoverageRatio:
        LAYER_CORE_COVERAGE_REQUIREMENTS[index] ?? 1,
      allowedWeakPointRatio: LAYER_WEAK_POINT_LIMITS[index] ?? 0.05,
      breakthroughRequirements: createBreakthroughRequirements(
        technique,
        layer,
      ),
      isAiGenerated: true,
      isUserCustomized: false,
      createdAt: DEFAULT_CREATED_AT,
      updatedAt: DEFAULT_CREATED_AT,
    };
  });
}

export const defaultTechniqueLayerRules: TechniqueLayerRule[] =
  defaultTechniques
    .filter((technique) => technique.kind === "structured")
    .flatMap(createTechniqueLayerRules);

export function getDefaultTechniqueLayerRules(
  techniqueId: string,
): TechniqueLayerRule[] {
  return defaultTechniqueLayerRules.filter(
    (rule) => rule.techniqueId === techniqueId,
  );
}
