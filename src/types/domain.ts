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
  isSystem: boolean; // 是否为仅承担内部归属关系、默认不展示的系统门派
  order: number; // 页面显示排序
  archivedAt?: string; // 归档时间；存在下级或历史关联时不硬删除
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface Technique { // 定义功法信息
  id: string; // 功法唯一 id
  sectId: string; // 所属门派 id
  kind: TechniqueKind; // 结构化功法或独立知识系统容器
  isSystem: boolean; // 是否为默认不展示、不参与普通功法管理的系统功法
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
  archivedAt?: string; // 归档时间；存在结构或历史关联时不硬删除
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface TechniqueChapter { // 定义正式功法下可独立管理的章节
  id: string; // 章节唯一 id
  techniqueId: string; // 所属功法 id
  code: string; // 章节代码，例如 ch01
  name: string; // 章节显示名称
  description: string; // 章节学习范围和说明
  order: number; // 在当前功法中的显示顺序
  archivedAt?: string; // 归档时间；有关联历史时使用归档代替硬删除
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface TechniqueUnit { // 定义正式章节下可独立管理的单元或小节
  id: string; // 单元唯一 id
  chapterId: string; // 所属正式章节 id
  code: string; // 单元代码，例如 ch01-u01
  name: string; // 单元显示名称
  description: string; // 单元学习范围和说明
  order: number; // 在当前章节中的显示顺序
  archivedAt?: string; // 归档时间；有关联历史时使用归档代替硬删除
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface KnowledgePoint { // 定义知识点信息
  id: string; // 知识点唯一 id，名称可重复但 id 不可重复
  unitId: string; // 当前直接所属单元 id；上层章节、功法和门派沿父级关系推导
  displayCode?: string; // 可修改的人类可读编号，不承担实体关联
  name: string; // 知识点显示名称，允许重复
  description: string; // 知识点在当前功法语境下的说明
  domainTags: string[]; // 学科领域标签，只用于检索和分类
  topicTags: string[]; // 主题标签，只用于检索和分类
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
  prerequisiteKnowledgePointIds: string[]; // 前置知识点正式 id，只用于学习顺序和依赖提示
  lastPracticedAt?: string; // 最后修炼时间，可选
  isDecayed: boolean; // 是否处于退化状态
  archivedAt?: string; // 归档时间；有关联历史时使用归档代替硬删除
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface OwnershipPathSnapshot { // 保存归属调整发生当时的完整路径快照
  sectId?: string;
  techniqueId?: string;
  chapterId?: string;
  unitId?: string;
}

export interface OwnershipChangeRecord { // 一次归属移动的审计记录，不代表当前归属关系
  id: string; // 本次移动操作的唯一 id
  entityType: OwnershipEntityType; // 被移动的实体类型
  entityId: string; // 被移动实体的稳定 id
  fromParentId?: string; // 调整前的直接父级 id；首次归属时可为空
  toParentId: string; // 调整后的直接父级 id
  fromPath: OwnershipPathSnapshot; // 调整前完整路径，避免父级后来移动导致历史失真
  toPath: OwnershipPathSnapshot; // 调整后完整路径
  reason?: string; // 用户填写的调整原因
  changedAt: string; // 调整发生时间，使用 ISO 字符串
}

export interface TechniqueMigrationPreview { // 功法迁移执行前的结构与历史影响摘要
  techniqueId: string;
  fromSectId: string;
  toSectId: string;
  chapterCount: number;
  unitCount: number;
  knowledgePointCount: number;
  activePracticeRecordCount: number;
  deletedPracticeRecordCount: number;
  practiceDefaultsCount: number;
  layerRuleCount: number;
  activeDraftProjectCount: number;
}

export interface KnowledgePointMigrationPreview { // 知识点迁移执行前的归属与历史影响摘要
  knowledgePointId: string;
  fromPath: OwnershipPathSnapshot;
  toPath: OwnershipPathSnapshot;
  isCrossTechnique: boolean;
  movesIntoStandalone: boolean;
  movesOutOfStandalone: boolean;
  activePracticeRecordCount: number;
  deletedPracticeRecordCount: number;
  keepsCustomReviewIntervals: boolean;
}

export interface DraftFormalEntityMapping { // 一项草案实体到正式实体的稳定映射
  entityType: TechniqueImportEntityType;
  draftEntityId: string;
  formalEntityId: string;
}

export interface TechniqueImportMappingRecord { // 一次正式导入建立的草案映射记录
  id: string;
  planId: string; // 导入时采用的计划 id，便于回看当时的差异
  projectId: string;
  variantId?: string;
  formalTechniqueId: string;
  entityMappings: DraftFormalEntityMapping[];
  confirmedActionIds: string[]; // 用户明确同意覆盖的动作 id
  acceptedIssueIds: string[]; // 用户明确接受的警告 id
  actionSnapshot: TechniqueImportAction[]; // 写入时的动作快照，不随草案后续修改变化
  importedAt: string;
}

export interface CultivationStructureRepository { // 正式修炼结构与关系历史的统一仓库
  schemaVersion: string;
  sects: Sect[];
  techniques: Technique[];
  chapters: TechniqueChapter[];
  units: TechniqueUnit[];
  knowledgePoints: KnowledgePoint[];
  ownershipChanges: OwnershipChangeRecord[];
  importMappings: TechniqueImportMappingRecord[];
  updatedAt: string;
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
  sourceEventId?: string; // 由成功事件结算生成时，记录来源事件 id
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
  knowledgePointIds: string[]; // 关联知识点 id 列表
  startAt?: string; // 开始时间，可选
  dueAt?: string; // 截止时间，可选
  completedAt?: string; // 完成时间，可选
  targetRequirement: string; // 事件目标要求
  difficulty: number; // 事件难度系数
  importance: number; // 事件重要度系数
  manaReward: number; // 完成后奖励法力
  insightReward: number; // 完成后奖励神识
  soulReward: number; // 完成后奖励神魂
  generatedPracticeRecordId?: string; // 成功事件对应生成的修炼记录 id，可选
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
  completionRatio: number; // 本次游历记录的完成度，0 到 1
  summary?: string; // 总结感想，可选
  keywords: string[]; // 标签或关键词
  soulGain: number; // 获得神魂
  sectId?: string; // 关联门派 id，可选
  techniqueId?: string; // 关联功法 id，可选
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface JourneySoulRule { // 定义全局神魂收益规则
  soulPerHour: number; // 每小时基础神魂收益
  completionRatioEnabled: boolean; // 是否让本次完成度参与计算
  minimumSoulGain: number; // 单次最低神魂收益
  maximumSoulGain?: number; // 单次最高神魂收益，可选
  journeyTypeMultipliers: Record<JourneyType, number>; // 不同游历类型的收益倍率
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface DecayRule { // 定义全局退化提醒规则
  enabled: boolean; // 是否启用退化提醒
  reminderLeadDays: number; // 提前多少天在首页提醒临近复习
  decayDaysAfterDue: number; // 逾期多少天后标记为已退化
  warningDaysAfterDue: number; // 逾期多少天后标记为警告
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

export type TechniqueCreationTarget = // 定义功法创建草案最终写入的位置
  | {
      mode: "create_new"; // 创建新的正式功法
      sectId: string; // 目标门派 id
      targetTechniqueId?: never; // 新建模式不能指向已有功法
    }
  | {
      mode: "merge_existing"; // 合并到已有正式功法
      sectId: string; // 目标门派 id
      targetTechniqueId: string; // 已有功法 id，合并模式必须存在
    };

export interface TechniqueCreationSource { // 定义用户提供的一项课程内容依据
  id: string; // 输入项唯一 id，由前端生成
  sourceType: TechniqueCreationSourceType; // 教材、目录、考纲等来源类型
  title?: string; // 来源名称，例如教材名或文件名
  content: string; // AI 实际读取的文本内容
}

export interface TechniqueCreationInput { // 定义第一阶段生成功法结构所需的完整输入
  target: TechniqueCreationTarget; // 草案的目标门派和导入模式
  techniqueName: string; // 用户填写的功法名称
  sources: TechniqueCreationSource[]; // 内容依据，业务校验要求至少有一项有效内容
  learningGoalType: TechniqueLearningGoalType; // 学习目标类型
  learningGoal: string; // 具体学习目标
  targetLayer: number; // 目标掌握层数
  experienceBudgetReferenceLayer?: number; // 选作参照的数学分析累计层数
  experienceBudgetTotal?: number; // 用户确认后的目标累计总经验
  currentLevel?: string; // 用户当前基础，可选
  studyPeriodWeeks?: number; // 计划学习周期，单位周，可选
  weeklyHours?: number; // 每周可投入时间，可选
  assessmentForm?: string; // 考试、论文、项目等成果形式，可选
  focusText?: string; // 希望重点覆盖的内容，可选
  excludedContent?: string; // 明确排除的内容，可选
  referenceTechniqueId?: string; // 用于数值校准的参考功法 id，可选
  preferredManaWeight?: number; // 用户希望的法力收益倾向，可选
  preferredInsightWeight?: number; // 用户希望的神识收益倾向，可选
  preferredSoulWeight?: number; // 用户希望的神魂收益倾向，可选
  requirementText?: string; // 无法结构化表达的补充要求，可选
  domainSpecificInputs?: Record<string, string | number | boolean | string[]>; // 门派专属补充输入
}

export interface TechniquePrerequisiteSuggestion { // 定义 AI 提出的前置功法建议
  name: string; // AI 识别出的前置功法名称
  reason: string; // 推荐理由
  matchedTechniqueId?: string; // 系统在正式功法中找到并经用户确认的匹配 id
}

export interface TechniqueBaseDraft { // 定义第一阶段生成的功法基本信息草案
  name: string; // 功法名称草案
  description: string; // 功法说明草案
  courseValueCoefficientSuggestion: number; // 课程体量与难度系数建议
  manaWeight: number; // 法力收益倾向建议
  insightWeight: number; // 神识收益倾向建议
  soulWeight: number; // 神魂收益倾向建议
  maxLayer: number; // 最高规划层数
  prerequisiteSuggestions: TechniquePrerequisiteSuggestion[]; // 推荐前置功法
  generationRationale: string; // AI 生成本结构的依据，只保存在草案中
}

export interface TechniquePracticeDefaultsDraft { // 定义尚未绑定正式功法 id 的修炼默认规则草案
  recordTypeDefaults: Record<PracticeRecordType, PracticeTypeDefaults>; // 五类修炼的默认结算建议
  requiredExerciseCount: number; // 新知识点默认练习要求
  requiredNoteCount: number; // 新知识点默认笔记要求
  requiredThinkingCount: number; // 新知识点默认思考要求
  reviewSchedule: ReviewScheduleRule; // 功法默认复习间隔建议
}

export interface TechniqueLayerBreakthroughRequirementDraft { // 定义草案阶段的层数突破要求
  draftId: string; // 草案内部引用 id，由系统生成
  title: string; // 要求标题
  description: string; // 要求说明
  requirementType: TechniqueLayerRequirementType; // 要求类型
  isRequired: boolean; // 是否为硬性要求
}

export interface TechniqueLayerRuleDraft { // 定义尚未绑定正式功法 id 的层数规则草案
  draftId: string; // 草案内部引用 id，由系统生成
  layer: number; // 目标层数
  requiredExperienceSuggestion: number; // AI 建议门槛，知识点生成后由系统重新校准
  requiredCoverageRatio: number; // 最低知识点覆盖比例
  requiredCoreCoverageRatio: number; // 最低核心知识点覆盖比例
  allowedWeakPointRatio: number; // 允许薄弱点比例
  breakthroughRequirements: TechniqueLayerBreakthroughRequirementDraft[]; // 突破要求草案
}

export interface ScopedGenerationOptions { // 定义章节或单元局部生成时共用的用户配置
  includeInGeneration: boolean; // 是否纳入本次生成
  focusText?: string; // 当前范围的重点，可选
  excludedContent?: string; // 当前范围的排除内容，可选
  organizationRequirement?: string; // 按概念、方法、题型等组织的要求，可选
  requirementText?: string; // 仅对当前范围生效的补充要求，可选
}

export type ScopedGenerationConfig = ScopedGenerationOptions & // 定义局部生成的精细度和数量约束
  (
    | {
        detailLevel: KnowledgeGranularity; // 粗略、普通或细分
        targetCount?: number; // 可以覆盖 AI 推荐数量
      }
    | {
        detailLevel: "custom"; // 自定义精细度
        targetCount: number; // 自定义模式必须明确目标知识点数量
      }
  );

export type ChapterUnitGenerationConfig = ScopedGenerationConfig; // 定义单个大章生成单元时的配置

export type UnitKnowledgeGenerationConfig = ScopedGenerationConfig; // 定义单个单元生成知识点时的配置

export interface TechniqueCreationKnowledgePointDraft { // 定义第三阶段按单元生成的知识点草案
  draftId: string; // 草案内部引用 id，由系统生成，不作为正式知识点 id
  chapterDraftId: string; // 所属章节草案 id
  unitDraftId: string; // 所属单元草案 id
  name: string; // 知识点名称
  description: string; // 当前功法语境下的学习边界
  granularity: KnowledgeGranularity; // 知识点划分精细度
  typeTags: string[]; // 概念、方法、题型、文本等类型标签
  learningPerspectives: string[]; // 理解、证明、应用、比较、表达等学习视角
  difficulty: number; // AI 建议难度
  importance: number; // AI 建议重要度
  targetLayer: number; // 计划达到的目标层数
  maxTrainableLayer: number; // 最高可修炼层数
  requiredExerciseCount: number; // 练习要求建议
  requiredNoteCount: number; // 笔记要求建议
  requiredThinkingCount: number; // 思考要求建议
  reviewIntervalsOverride?: number[]; // 确有需要时覆盖功法默认复习间隔
  manaWeight: number; // 法力收益倾向建议
  insightWeight: number; // 神识收益倾向建议
  prerequisiteDraftIds: string[]; // 前置知识点的草案引用 id
  recommendedBaseValue?: number; // 系统根据规则计算的推荐基础价值
  baseValueAdjustment?: number; // 用户相对推荐基础价值的手动增减
  baseValueAdjustmentIsManual?: boolean; // 调整值是否由用户手动设定，缺省的旧调整值视作手动调整
  baseValueOverride?: number; // 用户手动覆盖的基础价值，可选
  generationRationale: string; // AI 生成理由，只保存在草案中
}

export interface TechniqueUnitDraft { // 定义第二阶段生成并由用户确认的单元草案
  draftId: string; // 草案内部引用 id，由系统生成
  chapterDraftId: string; // 所属章节草案 id
  code: string; // 单元代码
  name: string; // 单元名称
  description: string; // 单元范围说明
  order: number; // 在当前大章中的顺序
  learningObjectives: string[]; // 本单元学习目标
  recommendedDetailLevel: KnowledgeGranularity; // AI 推荐知识点精细度
  recommendedKnowledgePointCountRange?: { min: number; max: number }; // AI 推荐知识点数量范围
  knowledgeGenerationConfig: UnitKnowledgeGenerationConfig; // 用户确认后的知识点生成设置
  knowledgePointDrafts: TechniqueCreationKnowledgePointDraft[]; // 第三阶段生成的知识点
}

export interface TechniqueChapterDraft { // 定义第一阶段生成并由用户确认的章节草案
  draftId: string; // 草案内部引用 id，由系统生成
  code: string; // 章节代码
  name: string; // 章节名称
  description: string; // 章节范围说明
  order: number; // 章节顺序
  learningObjectives: string[]; // 本章学习目标
  recommendedUnitDetailLevel: KnowledgeGranularity; // AI 推荐单元划分精细度
  recommendedUnitCountRange?: { min: number; max: number }; // AI 推荐单元数量范围
  unitGenerationConfig: ChapterUnitGenerationConfig; // 用户确认后的单元生成设置
  unitDrafts: TechniqueUnitDraft[]; // 第二阶段生成的单元草案
}

export interface AiGenerationScope { // 定义一次生成实际覆盖的局部范围
  chapterDraftIds: string[]; // 结构生成时为空，生成单元时记录目标大章
  unitDraftIds: string[]; // 生成知识点时记录目标单元
}

export interface AiGenerationMetadata { // 记录一次 mock 或真实 AI 生成的来源信息
  id: string; // 生成记录唯一 id
  generationType: AiGenerationType; // 功法结构、章节单元或单元知识点生成
  scope: AiGenerationScope; // 本次生成覆盖的章节和单元范围
  isMock: boolean; // 是否由本地 mock 生成
  provider?: string; // AI 服务商，可选
  model?: string; // 实际模型名称，可选
  promptVersion: string; // 提示词版本
  schemaVersion: string; // 输出结构版本
  generatedAt: string; // 生成时间
}

export interface DraftValidationIssue { // 定义草案校验产生的错误或警告
  id: string; // 问题唯一 id
  severity: DraftValidationSeverity; // 错误会阻止导入，警告需要用户确认
  code: string; // 稳定的问题代码
  path?: string; // 对应字段路径，可选
  message: string; // 给用户查看的问题说明
}

export interface TechniqueCreationDraft { // 定义完整的三阶段功法创建草案物化视图
  id: string; // 草案版本唯一 id
  projectId?: string; // 所属创建项目 id；迁移旧 mock 前可为空
  variantId?: string; // 对应局部修订组合版本 id；迁移旧 mock 前可为空
  requestId?: string; // 所属创建请求 id，可选
  parentDraftId?: string; // 重新生成时指向来源版本
  schemaVersion: string; // 草案数据结构版本
  stage: TechniqueCreationDraftStage; // 当前生成和确认阶段
  status: TechniqueCreationDraftStatus; // 草案是否仍然有效、已导入或已归档
  input: TechniqueCreationInput; // 用户输入和系统带入的创建条件
  techniqueDraft?: TechniqueBaseDraft; // 第一阶段生成后存在
  practiceDefaultsDraft?: TechniquePracticeDefaultsDraft; // 第一阶段生成后存在
  layerRuleDrafts: TechniqueLayerRuleDraft[]; // 第一阶段生成的层数规则
  chapterDrafts: TechniqueChapterDraft[]; // 章节及第二阶段知识点草案
  generationMetadata: AiGenerationMetadata[]; // 各次生成记录
  validationIssues: DraftValidationIssue[]; // 最近一次完整校验结果
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface TechniqueCreationProject { // 保存创建流程中稳定不随局部重新生成重复的内容
  id: string; // 创建项目唯一 id
  requestId?: string; // 来源请求 id，可选
  schemaVersion: string; // 项目数据结构版本
  status: TechniqueCreationDraftStatus; // 项目是否有效、已导入或已归档
  input: TechniqueCreationInput; // 用户输入和目标位置
  activeVariantId?: string; // 当前正在查看的组合版本 id
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface TechniqueDraftVariant { // 用修订 id 组合出一份完整草案版本
  id: string; // 组合版本唯一 id
  projectId: string; // 所属创建项目 id
  parentVariantId?: string; // 从哪个组合版本重新生成而来
  stage: TechniqueCreationDraftStage; // 当前三阶段进度
  structureRevisionId: string; // 当前采用的功法结构修订 id
  chapterUnitRevisionIds: Record<string, string>; // chapterDraftId 到单元修订 id 的映射
  unitKnowledgeRevisionIds: Record<string, string>; // unitDraftId 到知识点修订 id 的映射
  validationIssues: DraftValidationIssue[]; // 当前组合版本的校验结果
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface TechniqueStructureRevision { // 保存功法、规则和大章结构的一次生成结果
  id: string; // 结构修订唯一 id
  projectId: string; // 所属创建项目 id
  source: DraftRevisionSource; // AI 生成、用户编辑或旧数据迁移
  techniqueDraft: TechniqueBaseDraft; // 功法基本信息草案
  practiceDefaultsDraft: TechniquePracticeDefaultsDraft; // 修炼默认规则草案
  layerRuleDrafts: TechniqueLayerRuleDraft[]; // 层数规则草案
  chapterDrafts: TechniqueChapterDraft[]; // 大章草案，首次生成时单元数组为空
  generationMetadata?: AiGenerationMetadata; // AI 生成时记录来源，手动修订时可为空
  createdAt: string; // 创建时间，使用 ISO 字符串
}

export interface ChapterUnitsRevision { // 保存一个大章的单元结构修订
  id: string; // 单元修订唯一 id
  projectId: string; // 所属创建项目 id
  chapterDraftId: string; // 本次修订所属大章
  source: DraftRevisionSource; // AI 生成、用户编辑或旧数据迁移
  unitDrafts: TechniqueUnitDraft[]; // 本次生成或编辑后的单元列表
  generationMetadata?: AiGenerationMetadata; // AI 生成时记录来源，手动修订时可为空
  createdAt: string; // 创建时间，使用 ISO 字符串
}

export interface UnitKnowledgePointsRevision { // 保存一个单元的知识点结构修订
  id: string; // 知识点修订唯一 id
  projectId: string; // 所属创建项目 id
  unitDraftId: string; // 本次修订所属单元
  source: DraftRevisionSource; // AI 生成、用户编辑或旧数据迁移
  knowledgePointDrafts: TechniqueCreationKnowledgePointDraft[]; // 本次生成或编辑后的知识点
  generationMetadata?: AiGenerationMetadata; // AI 生成时记录来源，手动修订时可为空
  createdAt: string; // 创建时间，使用 ISO 字符串
}

export interface TechniqueCreationDraftRepository { // 定义 localStorage 中原子保存的草案仓库
  schemaVersion: string; // 仓库结构版本
  projects: TechniqueCreationProject[]; // 创建项目
  variants: TechniqueDraftVariant[]; // 各项目的组合版本
  structureRevisions: TechniqueStructureRevision[]; // 功法与大章结构修订
  chapterUnitRevisions: ChapterUnitsRevision[]; // 章节单元修订
  unitKnowledgeRevisions: UnitKnowledgePointsRevision[]; // 单元知识点修订
  updatedAt: string; // 仓库最后更新时间
}

export interface TechniqueImportFieldChange { // 定义导入预览中的单个字段变化
  field: string; // 字段路径
  previousValue?: unknown; // 正式数据中的原值，新建对象时为空
  nextValue?: unknown; // 草案准备写入的值
}

export interface TechniqueImportAction { // 定义导入计划中的一个实体操作
  id: string; // 操作唯一 id
  entityType: TechniqueImportEntityType; // 功法、章节、知识点或规则
  action: TechniqueImportActionType; // 创建、更新、保留、跳过或归档
  draftEntityId?: string; // 对应草案实体 id，可选
  formalEntityId?: string; // 对应正式实体 id，可选
  label: string; // 给用户查看的实体名称
  changes: TechniqueImportFieldChange[]; // 字段级差异
  reason?: string; // 系统提出该操作的原因
  requiresConfirmation: boolean; // 是否必须由用户明确确认
}

export interface TechniqueImportPlanSummary { // 汇总导入计划中的各类操作数量
  createCount: number;
  updateCount: number;
  keepCount: number;
  skipCount: number;
  archiveCount: number;
}

export interface TechniqueImportPlan { // 定义草案写入正式数据前的完整差异预览
  id: string; // 导入计划唯一 id
  draftId: string; // 来源草案版本 id
  mode: TechniqueCreationTargetMode; // 创建新功法或合并已有功法
  targetSectId: string; // 目标门派 id
  targetTechniqueId?: string; // 合并已有功法时存在
  actions: TechniqueImportAction[]; // 所有待执行实体操作
  summary: TechniqueImportPlanSummary; // 操作数量汇总
  issues: DraftValidationIssue[]; // 阻止导入的错误和需要确认的警告
  status: TechniqueImportPlanStatus; // 预览、已确认、已应用或失败
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface TechniquePlanDraft { // 定义功法 AI 草案信息，但未导入
  id: string; // 草案唯一 id
  requestId?: string; // 所属草案请求 id，可选；旧草案可为空
  sectId: string; // 目标门派 id
  techniqueName: string; // 草案对应的功法名称
  sourceText: string; // 用户输入的教材、考纲或目标文本
  status: DraftStatus; // 草案状态
  knowledgePointDrafts: KnowledgePointDraft[]; // 知识点草案列表
  createdAt: string; // 创建时间，使用 ISO 字符串
  updatedAt: string; // 更新时间，使用 ISO 字符串
}

export interface AiDraftRequest { // 定义 AI 草案生成请求
  id: string; // 请求唯一 id
  sectId: string; // 目标门派 id
  techniqueName: string; // 计划创建或规划的功法名称
  sourceText: string; // 教材、考纲、课程信息或目标文本
  learningGoal: string; // 用户希望 AI 服务的学习目标
  requirementText: string; // 用户补充的生成要求
  status: DraftRequestStatus; // 请求状态
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

export type KnowledgeGenerationDetailLevel = KnowledgeGranularity | "custom";

export type KnowledgeStatus = "not_started" | "in_progress" | "completed" | "decayed";

export type PracticeRecordType = "exercise" | "note" | "thinking" | "test" | "review";

export type PracticeValueSource = "technique_default" | "manual";

export type RuleUpdateScope = "all_records" | "default_records_only" | "future_records_only";

export type KnowledgeReviewStatus = "not_scheduled" | "not_due" | "due" | "overdue";

export type ReviewRecallResult = "forgotten" | "effortful" | "recalled";

export type TechniqueLayerRequirementType = "test" | "summary" | "output" | "review";

export type TechniqueKind = "structured" | "standalone_container";

export type OwnershipEntityType = "technique" | "chapter" | "unit" | "knowledge_point";

export type EventType =
  | "exam"
  | "course_project"
  | "course_paper"
  | "breakthrough_exam"
  | "mock_test"
  | "long_project"
  | "review_week"
  | "custom";

export type EventStatus = "not_started" | "in_progress" | "completed" | "failed";

export type JourneyType =
  | "reading"
  | "movie"
  | "anime"
  | "game"
  | "music"
  | "exhibition"
  | "theater"
  | "custom"
  | "other";

export type JourneyStatus = "planned" | "in_progress" | "completed" | "abandoned";

export type BreakthroughStatus = "not_started" | "in_progress" | "completed" | "failed";

export type DraftStatus = "draft" | "confirmed" | "imported" | "discarded";

export type DraftRequestStatus = "active" | "archived";

export type TechniqueCreationTargetMode = "create_new" | "merge_existing";

export type TechniqueCreationSourceType =
  | "textbook"
  | "table_of_contents"
  | "syllabus"
  | "exam_scope"
  | "custom"
  | "file_extract";

export type TechniqueLearningGoalType =
  | "systematic_learning"
  | "exam_preparation"
  | "project_output"
  | "skill_training"
  | "custom";

export type TechniqueCreationDraftStage =
  | "input_pending"
  | "structure_ready"
  | "units_pending"
  | "units_ready"
  | "knowledge_pending"
  | "knowledge_ready"
  | "ready_to_import";

export type TechniqueCreationDraftStatus = "active" | "imported" | "archived";

export type AiGenerationType =
  | "technique_structure"
  | "chapter_units"
  | "unit_knowledge_points";

export type DraftValidationSeverity = "error" | "warning";

export type DraftRevisionSource = "ai" | "manual" | "legacy_migration";

export type TechniqueImportEntityType =
  | "technique"
  | "chapter"
  | "unit"
  | "knowledge_point"
  | "practice_defaults"
  | "layer_rule";

export type TechniqueImportActionType = "create" | "update" | "keep" | "skip" | "archive";

export type TechniqueImportPlanStatus = "preview" | "confirmed" | "applied" | "failed";
