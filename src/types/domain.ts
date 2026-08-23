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
  courseValueCoefficient: number; // 相对基准功法的课程体量与难度系数，可手动调整
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
  reviewStatus: KnowledgeReviewStatus; // 当前复习状态，由时间和复习记录派生
  reviewStage: number; // 当前复习阶段，对应有效间隔数组下标
  reviewIntervalsOverride?: number[]; // 知识点自定义复习间隔天数；未设置时使用功法规则
  lastReviewedAt?: string; // 最近一次复习时间，可选
  nextReviewAt?: string; // 下一次计划复习时间，可选
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
  recordType: PracticeRecordType; // 修炼记录类型
  title: string; // 记录标题
  content?: string; // 备注、心得或复盘内容，可选
  durationMinutes: number; // 修炼耗时，单位分钟
  quantity: number; // 完成数量，例如题数、篇数、条数
  unit: string; // 数量单位，例如题、条、篇、次或分钟
  accuracy?: number; // 正确率，可选，只作为学习质量证据，不影响经验
  qualityScore?: number; // 质量评分，可选，建议用 0 到 100
  difficultyMultiplier?: number; // 本次任务难度倍率，可选，测试经验计算时使用
  reviewResult?: ReviewRecallResult; // 复习结果，可选，仅复习记录使用
  suggestedExperienceGain: number; // 系统按当前功法规则计算的建议经验值
  experienceGain: number; // 用户最终确认的功法经验值
  manaGain: number; // 本次获得法力
  insightGain: number; // 本次获得神识
  soulGain: number; // 本次获得神魂
  valueSource: PracticeValueSource; // 收益采用功法默认值还是手动调整值
  adjustmentReason?: string; // 手动调整收益时的原因，可选
  practicedAt: string; // 实际修炼时间
  deletedAt?: string; // 软删除时间；存在时不参与统计
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface PracticeRecordKnowledgePoint { // 修炼记录与知识点的多对多关联
  id: string; // 关联记录唯一 id
  recordId: string; // 修炼记录 id
  knowledgePointId: string; // 知识点 id
  allocationWeight: number; // 本次修炼分配给该知识点的比例，通常为 0 到 1
}

export interface PracticeRecordKnowledgePointDraft { // 表单提交前的知识点分配草案
  knowledgePointId: string; // 已选知识点 id
  allocationWeight: number; // 本次修炼分配给该知识点的比例，通常为 0 到 1
}

export interface TechniquePracticeDefaults { // 每门功法独立的修炼表单默认规则
  techniqueId: string; // 所属功法 id
  recordTypeDefaults: Record<PracticeRecordType, PracticeTypeDefaults>; // 各记录类型的最低要求比例和收益权重
  requiredExerciseCount: number; // 新知识点默认练习要求
  requiredNoteCount: number; // 新知识点默认笔记要求
  requiredThinkingCount: number; // 新知识点默认思考要求
  reviewSchedule: ReviewScheduleRule; // 当前功法的默认复习间隔规则
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface TechniqueLayerRule { // 功法层数规则，由 AI 默认生成，后续允许用户校准
  id: string; // 层数规则唯一 id
  techniqueId: string; // 所属功法 id
  layer: number; // 目标层数，第一版为 1 到 6
  requiredExperience: number; // 达到该层需要的累计功法经验
  requiredCoverageRatio: number; // 该层知识点最低覆盖比例，0 到 1
  requiredCoreCoverageRatio: number; // 核心知识点最低覆盖比例，0 到 1
  allowedWeakPointRatio: number; // 允许仍然薄弱的知识点比例，0 到 1
  breakthroughRequirements: TechniqueLayerBreakthroughRequirement[]; // 达到该层需要完成的突破要求
  isAiGenerated: boolean; // 是否由 AI 默认生成
  isUserCustomized: boolean; // 是否被用户手动校准过
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface TechniqueLayerBreakthroughRequirement { // 功法层数突破要求
  id: string; // 要求唯一 id
  title: string; // 要求标题
  description: string; // 要求说明
  requirementType: TechniqueLayerRequirementType; // 要求类型
  isRequired: boolean; // 是否为硬性要求
}

export interface ReviewScheduleRule { // 功法默认复习计划
  intervalsDays: number[]; // 各阶段间隔天数，例如 2、7、21、60、180、365
  graceRatio: number; // 到期宽限比例，例如 0.2 表示前后约 20%
}

export interface PracticeTypeDefaults { // 某门功法下某类修炼的默认值
  requirementRatio: number; // 达到该类基础要求所需经验相对知识点基础值的比例；测试为 0
  baseExperiencePerUnit?: number; // 独立的单位基础经验，可选；当前用于测试题目
  manaWeight: number; // 默认法力权重，通常为 0 到 1
  insightWeight: number; // 默认神识权重，通常为 0 到 1
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

export interface RealmRule { // 定义个人境界规则
  level: number; // 境界等级，第一版为 1 到 13
  name: string; // 境界显示名称
  requiredTotalCultivation: number; // 达到该境界需要的个人总修为
  requiredMana: number; // 达到该境界需要的最低法力
  requiredInsight: number; // 达到该境界需要的最低神识
  breakthroughRequired: boolean; // 是否需要突破任务
  breakthroughTitle?: string; // 突破任务标题，可选
  breakthroughDescription?: string; // 突破任务说明，可选
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

export type PracticeValueSource = "technique_default" | "manual";

export type RuleUpdateScope = "all_records" | "default_records_only" | "future_records_only";

export type KnowledgeReviewStatus = "not_scheduled" | "not_due" | "due" | "overdue";

export type ReviewRecallResult = "forgotten" | "effortful" | "recalled";

export type TechniqueLayerRequirementType = "test" | "summary" | "output" | "review";

export type EventType = "exam" | "course_project" | "breakthrough_exam" | "long_project" | "custom";

export type EventStatus = "not_started" | "in_progress" | "completed" | "failed";

export type JourneyType = "reading" | "movie" | "anime" | "game" | "exhibition" | "other";

export type JourneyStatus = "planned" | "in_progress" | "completed" | "abandoned";

export type BreakthroughStatus = "not_started" | "in_progress" | "completed" | "failed";

export type DraftStatus = "draft" | "confirmed" | "imported" | "discarded";
