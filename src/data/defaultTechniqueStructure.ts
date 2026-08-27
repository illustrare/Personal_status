import type { TechniqueChapter, TechniqueUnit } from "../types/domain";

const DEFAULT_CREATED_AT = "2026-08-04T00:00:00.000Z";

export const defaultTechniqueChapters: TechniqueChapter[] = [
  {
    id: "chapter_math_analysis_ch01",
    techniqueId: "math_analysis",
    code: "ch01",
    name: "第一章 函数与极限",
    description: "函数、数列极限和函数极限的基本概念与方法。",
    order: 1,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "chapter_math_analysis_ch02",
    techniqueId: "math_analysis",
    code: "ch02",
    name: "第二章 连续与导数",
    description: "连续性、导数定义和基本微分方法。",
    order: 2,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "chapter_standalone_inbox",
    techniqueId: "standalone_knowledge",
    code: "inbox",
    name: "秘术",
    description: "承载不需要建立完整功法结构的零散知识点。",
    order: 1,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
];

export const defaultTechniqueUnits: TechniqueUnit[] = [
  {
    id: "unit_math_analysis_ch01_default",
    chapterId: "chapter_math_analysis_ch01",
    code: "ch01-u01",
    name: "函数与极限基础",
    description: "承载现有第一章默认知识点的基础单元。",
    order: 1,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "unit_math_analysis_ch02_default",
    chapterId: "chapter_math_analysis_ch02",
    code: "ch02-u01",
    name: "连续与导数基础",
    description: "承载现有第二章默认知识点的基础单元。",
    order: 1,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: "unit_standalone_inbox",
    chapterId: "chapter_standalone_inbox",
    code: "inbox",
    name: "秘术收集箱",
    description: "秘术知识点的默认直接归属单元。",
    order: 1,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
];
