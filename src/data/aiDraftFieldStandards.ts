export type AiDraftFieldStandard = {
  required: boolean;
  format: string;
  reference: string;
  effect: string;
};

export const aiDraftFieldStandards = {
  sectId: {
    required: true,
    format: "从已有门派中选择",
    reference: "默认使用进入页面时所在的门派。",
    effect: "决定领域生成策略、默认收益倾向和参考功法范围。",
  },
  techniqueName: {
    required: true,
    format: "1～80 字",
    reference: "建议使用课程、教材、考试或目标能力的正式名称。",
    effect: "作为功法名称初稿，并帮助 AI 判断内容主题。",
  },
  sourceType: {
    required: true,
    format: "教材、目录、大纲、考试范围、自定义或解析文本",
    reference: "选择最接近材料原始结构的类型。",
    effect: "决定 AI 如何理解材料层级和内容边界。",
  },
  sourceTitle: {
    required: false,
    format: "最多 120 字",
    reference: "例如教材版本、课程名称或考试名称。",
    effect: "用于区分同一功法的不同内容来源。",
  },
  sourceContent: {
    required: true,
    format: "至少一项有效内容",
    reference: "少于 50 字时仍可生成，但结果可能过于笼统。",
    effect: "限定大章、单元和知识点实际应覆盖的范围。",
  },
  learningGoalType: {
    required: true,
    format: "系统学习、考试准备、项目输出、能力训练或自定义",
    reference: "选择最终验收方式最接近的一项。",
    effect: "影响突破任务、练习类型和知识点组织方式。",
  },
  learningGoal: {
    required: true,
    format: "10～1000 字",
    reference: "说明最终需要掌握、完成或输出什么。",
    effect: "作为 AI 判断内容取舍和学习深度的主要依据。",
  },
  targetLayer: {
    required: true,
    format: "整数 1～6，默认 6 层",
    reference: "系统学习建议 4～6 层；考试准备建议 3～5 层。",
    effect: "决定最高规划深度、层数规则和知识点目标层数。",
  },
  currentLevel: {
    required: false,
    format: "基础等级或自然语言说明",
    reference: "可填写零基础、了解、学过、复习及具体薄弱点。",
    effect: "控制解释起点和前置内容数量。",
  },
  studyPeriodWeeks: {
    required: false,
    format: "1～260 周，整数",
    reference: "常规课程建议 4～52 周；留空表示不按时间压缩结构。",
    effect: "用于评估学习密度，不直接删减必要知识结构。",
  },
  weeklyHours: {
    required: false,
    format: "0.5～80 小时/周，步长 0.5",
    reference: "常规建议 2～20 小时/周。",
    effect: "用于调整训练量和阶段任务密度。",
  },
  assessmentForm: {
    required: false,
    format: "最多 200 字",
    reference: "例如闭卷考试、论文、项目、讲解或作品。",
    effect: "影响测试、输出和突破要求的形式。",
  },
  referenceTechniqueId: {
    required: false,
    format: "选择当前门派的一门正式功法",
    reference: "留空时使用系统基准。",
    effect: "用于校准课程体量、难度和总价值。",
  },
  tendencyWeight: {
    required: false,
    format: "0～1，步长 0.05",
    reference: "三项是独立倾向，不要求总和等于 1；留空由 AI 建议。",
    effect: "影响功法和知识点默认收益方向。",
  },
  scopeText: {
    required: false,
    format: "最多 1000 字",
    reference: "只填写需要特别强调、排除或无法结构化表达的内容。",
    effect: "对相应生成范围增加约束，但不修改正式历史数据。",
  },
  courseValueCoefficient: {
    required: true,
    format: "0.50～2.00，步长 0.01，基准 1.00",
    reference: "推荐范围 0.80～1.50，并与参考功法对比。",
    effect: "影响知识点推荐价值和层数经验门槛。",
  },
  structureCode: {
    required: true,
    format: "项目内唯一的短代码",
    reference: "大章建议 ch01，单元建议 ch01-u01。",
    effect: "用于稳定排序、引用和导入匹配，名称改变时不会自动改变。",
  },
  structureName: {
    required: true,
    format: "1～80 字",
    reference: "名称应直接说明这一层级实际覆盖的学习主题。",
    effect: "用于页面导航、知识点归属和导入预览。",
  },
  structureDescription: {
    required: true,
    format: "10～1500 字",
    reference: "说明覆盖范围、学习边界和不包含的内容。",
    effect: "作为下一阶段生成内容时最直接的范围约束。",
  },
  learningObjectives: {
    required: false,
    format: "建议 1～5 条，每行一条",
    reference: "使用可以检查是否完成的动词描述学习结果。",
    effect: "用于判断下一级结构是否完整覆盖当前目标。",
  },
  generationDetailLevel: {
    required: true,
    format: "粗略、普通、细分或自定义数量",
    reference: "普通优先采用建议区间中值；粗略取下限；细分取上限。",
    effect: "决定当前范围生成下一级内容的数量和拆分尺度。",
  },
  practiceRequirementRatio: {
    required: true,
    format: "0～2，步长 0.05",
    reference: "表示达到该类基础要求所需经验相对知识点价值的比例。",
    effect: "影响练习、笔记、思考和复习的建议结算量。",
  },
  practiceTypeWeight: {
    required: true,
    format: "0～1，步长 0.05",
    reference: "修炼类型内的法力与神识权重建议总和为 1。",
    effect: "决定该类修炼经验向法力和神识的分配。",
  },
  testBaseExperience: {
    required: true,
    format: "1～1000，正整数，默认 30",
    reference: "仅用于测试题目等可独立计数的单位。",
    effect: "决定每个测试单位的基础经验。",
  },
  requiredExerciseCount: {
    required: true,
    format: "0～100 次，整数，默认 10",
    reference: "0 表示不要求练习。",
    effect: "作为新知识点的默认练习完成要求。",
  },
  requiredNoteCount: {
    required: true,
    format: "0～20 篇，整数，默认 2",
    reference: "理论型课程可以适当提高。",
    effect: "作为新知识点的默认笔记完成要求。",
  },
  requiredThinkingCount: {
    required: true,
    format: "0～20 次，整数，默认 2",
    reference: "需要证明、比较或创作的课程可以适当提高。",
    effect: "作为新知识点的默认思考完成要求。",
  },
  reviewIntervals: {
    required: true,
    format: "严格递增的正整数天数",
    reference: "默认 2、7、21、60、180、365 天。",
    effect: "决定新知识点各复习阶段的计划日期。",
  },
  reviewGraceRatio: {
    required: true,
    format: "0～1，步长 0.05，默认 20%",
    reference: "界面显示百分比，模型保存 0～1 小数。",
    effect: "决定复习到期日前后的宽限窗口。",
  },
  layerExperience: {
    required: true,
    format: "正整数，并随层数严格递增",
    reference: "知识点生成完成后根据总价值重新校准。",
    effect: "决定功法达到对应层数所需的累计经验。",
  },
  layerCoverage: {
    required: true,
    format: "0～100%，步长 1%",
    reference: "覆盖率和核心覆盖率随层数不得降低。",
    effect: "决定只有多少知识点达到要求后才能升层。",
  },
  layerWeakPointRatio: {
    required: true,
    format: "0～100%，步长 1%",
    reference: "随层数不得升高。",
    effect: "限制仍处于薄弱状态的知识点比例。",
  },
  chapterTargetCount: {
    required: false,
    format: "1～40 个，整数",
    reference: "优先参考 AI 给出的当前大章建议范围。",
    effect: "覆盖建议数量，并决定该大章生成的单元规模。",
  },
  unitTargetCount: {
    required: false,
    format: "1～30 个，整数",
    reference: "优先参考 AI 给出的当前单元建议范围。",
    effect: "覆盖建议数量，并决定该单元生成的知识点规模。",
  },
  knowledgeName: {
    required: true,
    format: "1～80 字",
    reference: "名称应指向一个可以独立学习和检查的对象。",
    effect: "作为正式知识点名称和后续修炼记录的选择项。",
  },
  knowledgeDisplayCode: {
    required: false,
    format: "最多 80 字，建议在当前功法内保持唯一",
    reference: "例如 ch01-u01-kp01；留空不影响实体 id 和归属关系。",
    effect: "只作为目录展示和人工检索编号，修改后不会改变正式 id。",
  },
  formalKnowledgeGranularity: {
    required: true,
    format: "粗略、普通或细分",
    reference: "正式知识点只调整拆分尺度，不在这里设置生成数量。",
    effect: "记录当前知识点的内容粒度，并作为后续 AI 修订的参考。",
  },
  knowledgeDescription: {
    required: true,
    format: "10～1500 字",
    reference: "说明学习边界、主要内容以及不包含的相邻内容。",
    effect: "帮助后续生成任务，并避免相邻知识点范围重复不清。",
  },
  knowledgeTags: {
    required: false,
    format: "多个值使用中文或英文逗号分隔",
    reference: "类型可填概念、原理、方法、题型；视角可填理解、证明、应用。",
    effect: "用于筛选知识点，并指导任务类型和学习方式。",
  },
  knowledgeDifficulty: {
    required: true,
    format: "0.1～5，步长 0.01",
    reference: "1 表示基础，3 表示需要综合运用，5 表示高度复杂。",
    effect: "影响推荐基础价值和训练强度。",
  },
  knowledgeImportance: {
    required: true,
    format: "0.1～5，步长 0.01",
    reference: "1 表示补充内容，3 表示主干，5 表示核心必备。",
    effect: "影响推荐基础价值、覆盖判断和学习优先级。",
  },
  knowledgeLayer: {
    required: true,
    format: "整数，1～功法最高层",
    reference: "目标层数不得超过该知识点最高可修炼层数。",
    effect: "决定知识点需要规划到多深，以及参与哪些层级覆盖。",
  },
  knowledgeBaseValue: {
    required: false,
    format: "1～1000000 的整数",
    reference: "留空使用系统推荐值；仅在校准后需要覆盖时填写。",
    effect: "覆盖推荐基础价值，并影响完成要求对应的最低经验。",
  },
  formalKnowledgeBaseValue: {
    required: true,
    format: "1～1000000 的整数",
    reference: "默认沿用导入或创建时的生效值，校准时直接修改当前值。",
    effect: "影响当前知识点完成要求对应的最低经验。",
  },
  knowledgePrerequisites: {
    required: false,
    format: "选择当前单元内零个或多个知识点",
    reference: "只选择理解当前知识点前确实需要先掌握的内容。",
    effect: "用于导入后的学习顺序和依赖校验，不能形成循环。",
  },
  knowledgeReviewIntervals: {
    required: false,
    format: "严格递增的正整数天数",
    reference: "留空使用功法默认间隔；填写后只覆盖当前知识点。",
    effect: "决定当前知识点各复习阶段的计划日期。",
  },
  knowledgeTendencyWeight: {
    required: true,
    format: "0～1，步长 0.05",
    reference: "分别表示当前知识点对法力和神识收益的倾向。",
    effect: "导入后作为当前知识点收益方向的建议值。",
  },
} satisfies Record<string, AiDraftFieldStandard>;

export type AiDraftFieldStandardKey = keyof typeof aiDraftFieldStandards;
