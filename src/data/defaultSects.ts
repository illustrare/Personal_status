import type {Sect}  from '../types/domain';

const DEFAULT_CREATED_AT = '2026-08-04T00:00:00.000Z';

export const defaultSects: Sect[] = [
  {
    id: 'math',
    name: '数学门派',
    description: '专注于数学知识的门派，涵盖代数、几何等领域。',
    mana: 0,
    insight: 0 ,    
    soul: 0,
    sectValue: 0,
    isDefault: true,
    isSystem: false,
    order: 1,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: 'phil',
    name: '哲学门派',
    description: '专注于哲学知识的门派，涵盖伦理学、形而上学、逻辑学等领域。',
    mana: 0,
    insight: 0,
    soul: 0,
    sectValue: 0,
    isDefault: true,
    isSystem: false,
    order: 2,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: 'eng',
    name: '英语门派',
    description: '专注于英语知识的门派，涵盖听力阅读写作等领域。',
    mana: 0,
    insight: 0,
    soul: 0,
    sectValue: 0,
    isDefault: true,
    isSystem: false,
    order: 3,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
  {
    id: 'system_standalone',
    name: '独立知识系统容器',
    description: '用于承载独立功法和秘术合集，界面不作为普通门派展示。',
    mana: 0,
    insight: 0,
    soul: 0,
    sectValue: 0,
    isDefault: true,
    isSystem: true,
    order: 999,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  },
];

export const visibleDefaultSects = defaultSects.filter(
  (sect) => !sect.isSystem,
);
