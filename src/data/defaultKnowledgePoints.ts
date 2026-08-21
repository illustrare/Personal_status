import type {
  KnowledgePoint,
  Technique,
  TechniquePracticeDefaults,
} from '../types/domain';
import { findTechniquePracticeDefaults } from './defaultTechniquePracticeDefaults';
import { defaultTechniques } from './defaultTechniques';

const DEFAULT_CREATED_AT = '2026-08-04T00:00:00.000Z';
const MATH_ANALYSIS_TECHNIQUE_ID = 'math_analysis';

function getMathAnalysisDefaults(): {
  technique: Technique;
  practiceDefaults: TechniquePracticeDefaults;
} {
  const technique = defaultTechniques.find(
    (item) => item.id === MATH_ANALYSIS_TECHNIQUE_ID,
  );
  const practiceDefaults = findTechniquePracticeDefaults(
    MATH_ANALYSIS_TECHNIQUE_ID,
  );

  if (!technique || !practiceDefaults) {
    throw new Error('数学分析默认功法或修炼规则缺失。');
  }

  return { technique, practiceDefaults };
}

const {
  technique: mathAnalysisTechnique,
  practiceDefaults: mathAnalysisPracticeDefaults,
} = getMathAnalysisDefaults();

type MathAnalysisKnowledgePointSeed = Pick<
  KnowledgePoint,
  'id' | 'chapterCode' | 'chapter' | 'name' | 'description'
>;

function createMathAnalysisKnowledgePoint(
  seed: MathAnalysisKnowledgePointSeed,
): KnowledgePoint {
  return {
    ...seed,
    sectId: mathAnalysisTechnique.sectId,
    techniqueId: mathAnalysisTechnique.id,
    granularity: 'normal',
    baseValue: 150,
    difficulty: 1,
    importance: 2,
    targetLayer: 1,
    maxTrainableLayer: 6,
    currentLayer: 0,
    status: 'not_started',
    requiredExerciseCount:
      mathAnalysisPracticeDefaults.requiredExerciseCount,
    requiredNoteCount: mathAnalysisPracticeDefaults.requiredNoteCount,
    requiredThinkingCount:
      mathAnalysisPracticeDefaults.requiredThinkingCount,
    reviewStatus: 'not_scheduled',
    reviewStage: 0,
    manaWeight: mathAnalysisTechnique.manaWeight,
    insightWeight: mathAnalysisTechnique.insightWeight,
    isDecayed: false,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  };
}

export const defaultKnowledgePoints: KnowledgePoint[] = [
  createMathAnalysisKnowledgePoint({
    id: 'math_analysis_ch01_function_concept',
    chapterCode: 'ch01',
    chapter: '第一章 函数与极限',
    name: '函数概念',
    description: '理解函数、定义域、值域及函数表示方法等基本概念。',
  }),
  createMathAnalysisKnowledgePoint({
    id: 'math_analysis_ch01_sequence_limit',
    chapterCode: 'ch01',
    chapter: '第一章 函数与极限',
    name: '数列极限',
    description: '理解数列极限的定义、性质和基本判定方法。',
  }),
  createMathAnalysisKnowledgePoint({
    id: 'math_analysis_ch01_function_limit',
    chapterCode: 'ch01',
    chapter: '第一章 函数与极限',
    name: '函数极限',
    description: '理解函数极限的定义、性质以及不同趋近方式。',
  }),
  createMathAnalysisKnowledgePoint({
    id: 'math_analysis_ch02_continuity',
    chapterCode: 'ch02',
    chapter: '第二章 连续与导数',
    name: '连续性',
    description: '理解函数连续的定义、间断点和连续函数的基本性质。',
  }),
  createMathAnalysisKnowledgePoint({
    id: 'math_analysis_ch02_derivative_definition',
    chapterCode: 'ch02',
    chapter: '第二章 连续与导数',
    name: '导数定义',
    description: '理解导数的极限定义、几何意义和可导条件。',
  }),
  createMathAnalysisKnowledgePoint({
    id: 'math_analysis_ch02_differentiation_rules',
    chapterCode: 'ch02',
    chapter: '第二章 连续与导数',
    name: '微分法则',
    description: '掌握基本求导法则、复合函数求导和微分运算。',
  }),
];

export function getDefaultKnowledgePointsByTechnique(
  techniqueId: string,
): KnowledgePoint[] {
  return defaultKnowledgePoints.filter(
    (knowledgePoint) => knowledgePoint.techniqueId === techniqueId,
  );
}
