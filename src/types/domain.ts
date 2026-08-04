export interface Profile { // 定义角色整体状态类型
  id: string; // 角色唯一 id
  name: string; // 角色显示名称
  totalMana: number; // 总法力，由修炼记录汇总
  totalInsight: number; // 总神识，由修炼记录汇总
  totalSoul: number; // 总神魂，由游历记录汇总
  realmLevel: number; // 当前境界等级
  isBreakingThrough: boolean; // 是否处于卡境或突破中状态
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface Sect { // 定义门派信息
  id: string; // 门派唯一 id，例如 math、phil、eng
  name: string; // 门派显示名称
  description: string; // 门派说明
  mana: number; // 门派累计法力，由所属功法或修炼记录汇总
  insight: number; // 门派累计神识，由所属功法或修炼记录汇总
  soul: number; // 门派累计神魂，默认可为 0
  sectValue: number; // 门派总数值，由法力、神识和必要的神魂规则汇总
  isDefault: boolean; // 是否为系统默认门派
  order: number; // 页面显示排序
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface Technique { // 定义功法信息
  id: string; // 功法唯一 id
  sectId: string; // 所属门派 id
  name: string; // 功法显示名称
  description: string; // 功法说明
  manaWeight: number; // 法力收益倾向，通常为 0 到 1
  insightWeight: number; // 神识收益倾向，通常为 0 到 1
  soulWeight: number; // 神魂收益倾向，通常为 0 到 1
  currentLayer: number; // 当前功法层数
  maxLayer: number; // 最高层数，第一版默认 6
  value: number; // 功法总数值，由所属知识点有效价值汇总
  currentValue: number; // 当前已积累数值，由修炼记录汇总
  nextLayerRequiredValue: number; // 下一层需要达到的数值
  prerequisiteTechniqueIds: string[]; // 推荐前置功法 id 列表，只提示不锁定
  isDefault: boolean; // 是否为系统默认功法
  order: number; // 页面显示排序
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface KnowledgePoint { // 定义知识点信息
  id: string; // 知识点唯一 id，名称可重复但 id 不可重复
  sectId: string; // 所属门派 id
  techniqueId: string; // 所属功法 id
  chapterCode: string; // 章节代码，无明确章节时使用 ch00
  chapter?: string; // 人看的章节名称，可选
  name: string; // 知识点显示名称，允许重复
  description: string; // 知识点在当前功法语境下的说明
  granularity: KnowledgeGranularity; // 知识点划分精细度
  baseValue: number; // 基础价值，由系统默认计算，用户可手动调整
  difficulty: number; // 难度系数，用于计算有效价值
  importance: number; // 重要度系数，用于计算有效价值
  targetLayer: number; // 该知识点服务的目标层数
  maxTrainableLayer: number; // 该知识点最高可修炼层数
  currentLayer: number; // 当前修炼层数
  status: KnowledgeStatus; // 当前习得状态
  requiredExerciseCount: number; // 达成当前目标所需练习数量
  requiredNoteCount: number; // 达成当前目标所需笔记数量
  requiredThinkingCount: number; // 达成当前目标所需思考数量
  requiredTestCount: number; // 达成当前目标所需测试数量
  manaWeight: number; // 法力收益分配权重，通常为 0 到 1
  insightWeight: number; // 神识收益分配权重，通常为 0 到 1
  lastPracticedAt?: string; // 最后修炼时间，可选
  isDecayed: boolean; // 是否处于退化状态
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface PracticeRecord { // 定义修炼记录信息
  id: string; // 修炼记录唯一 id
  sectId: string; // 关联门派 id
  techniqueId: string; // 关联功法 id
  knowledgePointId?: string; // 关联知识点 id，可选
  recordType: PracticeRecordType; // 修炼记录类型
  title: string; // 记录标题
  content?: string; // 备注、心得或复盘内容，可选
  durationMinutes: number; // 修炼耗时，单位分钟
  quantity: number; // 完成数量，例如题数、篇数、条数
  accuracy?: number; // 正确率，可选，建议用 0 到 1
  qualityScore?: number; // 质量评分，可选，建议用 0 到 100
  manaGain: number; // 本次获得法力
  insightGain: number; // 本次获得神识
  soulGain: number; // 本次获得神魂
  practicedAt: string; // 实际修炼时间
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface Event { // 定义事件信息
  id: string; // 事件唯一 id
  title: string; // 事件标题
  description: string; // 事件说明
  eventType: EventType; // 事件类型
  status: EventStatus; // 事件状态
  sectId?: string; // 关联门派 id，可选
  techniqueIds: string[]; // 关联功法 id 列表
  startAt?: string; // 开始时间，可选
  dueAt?: string; // 截止时间，可选
  completedAt?: string; // 完成时间，可选
  difficulty: number; // 事件难度系数
  importance: number; // 事件重要度系数
  manaReward: number; // 完成后奖励法力
  insightReward: number; // 完成后奖励神识
  soulReward: number; // 完成后奖励神魂
  summary?: string; // 完成总结，可选
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface Journey { // 定义游历信息
  id: string; // 游历记录唯一 id
  title: string; // 游历标题
  journeyType: JourneyType; // 游历类型
  workName: string; // 作品名称
  creator?: string; // 作者、导演或制作方，可选
  status: JourneyStatus; // 游历状态
  startedAt?: string; // 开始时间，可选
  completedAt?: string; // 完成时间，可选
  durationMinutes?: number; // 体验时长，单位分钟，可选
  summary?: string; // 总结感想，可选
  keywords: string[]; // 标签或关键词
  soulGain: number; // 获得神魂
  sectId?: string; // 关联门派 id，可选
  techniqueId?: string; // 关联功法 id，可选
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface Breakthrough { // 定义突破信息
  id: string; // 突破任务唯一 id
  targetRealmLevel: number; // 目标境界等级
  title: string; // 突破任务标题
  description: string; // 突破任务说明
  requirements: string[]; // 突破要求列表
  status: BreakthroughStatus; // 突破状态
  eventId?: string; // 关联事件 id，可选
  startedAt?: string; // 开始时间，可选
  completedAt?: string; // 完成时间，可选
  summary?: string; // 结果总结，可选
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface RuleConfig { // 定义数值计算规则配置信息
  id: string; // 规则配置唯一 id
  exerciseBaseGain: number; // 练习基础收益
  noteBaseGain: number; // 笔记基础收益
  thinkingBaseGain: number; // 思考基础收益
  testBaseGain: number; // 测试基础收益
  reviewBaseGain: number; // 巩固基础收益
  difficultyMultiplier: number; // 难度倍率
  importanceMultiplier: number; // 重要度倍率
  layerThresholds: number[]; // 功法层数阈值
  realmThresholds: number[]; // 境界等级阈值
  decayEnabled: boolean; // 是否启用退化规则
  decayDays: number; // 多少天未修炼后开始退化
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface TechniquePlanDraft { // 定义功法 AI 草案信息，但未导入
  id: string; // 草案唯一 id
  sectId: string; // 目标门派 id
  techniqueName: string; // 草案对应的功法名称
  sourceText: string; // 用户输入的教材、考纲或目标文本
  status: DraftStatus; // 草案状态
  knowledgePointDrafts: KnowledgePointDraft[]; // 知识点草案列表
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface KnowledgePointDraft { // 定义草案知识点
  name: string; // 草案知识点名称
  chapterCode: string; // 章节代码，无明确章节时使用 ch00
  chapter?: string; // 人看的章节名称，可选
  description: string; // 草案知识点说明
  granularity: KnowledgeGranularity; // 知识点划分精细度
  baseValue: number; // 基础价值，由系统默认计算，用户可手动调整
  difficulty: number; // 难度系数
  importance: number; // 重要度系数
}

export type KnowledgeGranularity = "rough" | "normal" | "detailed";

export type KnowledgeStatus = "not_started" | "in_progress" | "completed" | "decayed";

export type PracticeRecordType = "exercise" | "note" | "thinking" | "test" | "review";

export type EventType = "exam" | "course_project" | "breakthrough_exam" | "long_project" | "custom";

export type EventStatus = "not_started" | "in_progress" | "completed" | "failed";

export type JourneyType = "reading" | "movie" | "anime" | "game" | "exhibition" | "other";

export type JourneyStatus = "planned" | "in_progress" | "completed" | "abandoned";

export type BreakthroughStatus = "not_started" | "in_progress" | "completed" | "failed";

export type DraftStatus = "draft" | "confirmed" | "imported" | "discarded";
