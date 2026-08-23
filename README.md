# 个人修炼状态系统

这是一个本地 Web 项目，用游戏化数值系统管理个人学习、事件试炼和审美游历。

核心结构：

```text
门派 -> 功法 -> 知识点 -> 修炼记录 -> 数值成长 -> 境界突破
```

核心属性：

```text
法力：练习、解题、执行、技术熟练度
神识：笔记、思考、推导、体系化理解
神魂：阅读、电影、番剧、游戏剧情等审美体验后的总结积累
```

## 当前状态

项目当前已完成开发流程第 15 步“神魂游历系统”的基础接入。

当前已经实现：

```text
React + TypeScript + Vite 项目基础
门派、功法、知识点的数据模型与默认数据
React Router 页面导航
单知识点和多知识点修炼记录
知识点分配比例和功法独立默认规则
练习、笔记、思考、测试、复习的建议经验计算
建议经验手动调整和调整原因
修炼记录列表、软删除和恢复
有效记录过滤
个人、门派、功法、知识点的基础汇总统计
首页、修炼界面、功法界面和知识点修炼界面的统计展示
修炼记录和知识点关联分配的 localStorage 本地保存
刷新页面后恢复已有修炼记录和统计
清空本地修炼记录
知识点练习、笔记、思考和到期复习维度进度
知识点进度封顶和短板显示
AI 默认生成的功法 1-6 层经验门槛、覆盖要求和突破要求
功法层数、下一层缺口、覆盖率、核心覆盖率和待突破状态展示
个人 13 级境界规则表
按总修为、法力、神识和突破任务派生当前境界
第 7 级和第 13 级卡境识别
突破记录的 localStorage 本地保存
首页境界、下一境界缺口和突破条件展示
事件记录的创建、状态、截止日期和 localStorage 本地保存
成功事件生成对应修炼记录，失败事件只保留事件结果
事件总结和修炼总结可分别编辑，后续修改互不同步
首页近期事件按截止日期排序展示
游历记录的创建、类型、时长、完成度、总结和 localStorage 本地保存
按时长和本次完成度计算神魂收益
首页神魂合并修炼/事件神魂和游历神魂展示
游历页按涉猎门派统计神魂来源
```

当前边界：

```text
已实现跨记录基础汇总、知识点进度封顶、功法层数和个人境界基础判定
当前保存修炼记录、记录-知识点关联、突破记录、事件记录和游历记录，默认门派、功法、知识点和境界规则仍来自静态数据
功法层数规则和境界规则当前由默认草案静态提供，用户自定义规则配置留到第 16 步
事件和修炼记录当前只在成功结算时建立来源关联，后续总结编辑允许各自独立
游历关联门派/功法只用于神魂涉猎统计，不进入知识点熟练度或功法经验结算
直接刷新或重新打开动态 URL 后，会从 localStorage 恢复已有修炼记录
界面视觉优化暂缓，统一留到第 18 步处理
最近一次构建验证已通过
```

下一步：

```text
第 16 步：实现规则配置
让功法层数、境界门槛和相关数值规则从静态默认草案逐步变成可校准配置
```

## 第一版目标

第一版要做成一个本地运行的 Web App：

```text
浏览器前端 + 本地数据保存 + mock AI 草案导入
```

第一版支持：

```text
三大默认门派：数学、哲学、英语
默认功法目录
手动新增知识点
手动记录练习、笔记、思考、测试、巩固
按功法自定义复习间隔，并允许知识点单独覆盖
法力、神识、神魂计算
功法六层进度
个人 13 级境界显示
突破任务记录
事件记录
游历记录
localStorage 本地保存
mock AI 草案导入
基础规则配置
```

第一版暂不做：

```text
账号系统
云同步
手机 App
多人协作
完整后端数据库
复杂动画
真实 AI 自动写入正式数据
```

## 技术栈

第一阶段推荐技术路线：

```text
前端：React + TypeScript + Vite
样式：CSS 起步，后续可引入 Tailwind CSS
页面路由：React Router
数据保存：localStorage 起步，后续升级 IndexedDB 或 SQLite
测试：Vitest
AI：先 mock，再通过轻量后端接真实大模型 API
后端：第一版先不做，AI 接口阶段再加入 Node.js 后端
```

后续后端可选：

```text
Node.js + Express
SQLite 或 PostgreSQL
Prisma
OpenAI API 或其他大模型 API
```

## 前端需求

前端负责用户能看到、点击、输入和操作的所有内容。

页面：

```text
界面 1：首页 / 个人总览
  显示境界、法力、神识、神魂，并提供事件、游历、修炼入口
界面 2-1：事件界面
  显示事件信息记录，并提供安排新事件入口
界面 2-2：游历界面
  显示游历信息记录，并提供记录新游历入口
界面 2-3：修炼界面
  选择和创建门派
界面 3：功法界面
  显示当前门派的法力、神识等信息，选择该门派下的功法
界面 4：知识点修炼界面
  按章节像文件夹一样排列当前功法所属的知识点，支持查看知识点详情和记录修炼
AI 草案页：生成、编辑、确认知识点规划
设置页：数值规则和自定义配置
```

组件：

```text
ProfilePanel：角色状态卡片
StatBar：属性条
SectCard：门派卡片
TechniqueCard：功法卡片
KnowledgeTree：文件夹式知识点树
KnowledgePointPanel：知识点详情弹窗
KnowledgeProgress：知识点进度条
PracticeRecordForm：修炼记录表单
PracticeRecordsPage：修炼记录查看和管理页面
EventCard：事件卡片
JourneyForm：游历记录表单
BreakthroughStatus：突破状态提示
DraftEditor：AI 草案编辑器
RuleConfigForm：规则配置表单
```

交互：

```text
查看角色法力、神识、神魂
查看当前境界和突破状态
查看三大门派修为
查看功法层数
新增、编辑、删除知识点
新增练习、笔记、思考、测试、巩固记录
查看知识点复习状态、下一次复习时间并调整复习间隔
查看、筛选、软删除和恢复修炼记录
创建事件
完成事件
创建游历记录
填写总结感想
选择门派并查看门派当前数值
选择功法并进入该功法所属知识点
在知识点树中查看当前功法的章节和知识点
从知识点详情记录单个知识点修炼
直接记录一次综合修炼，并选择涉及到的多个知识点
调整功法和知识点规则
确认 AI 生成草案
```

## 数据模型

第一版先用 TypeScript 定义核心类型。

需要定义：

```text
Profile：角色状态
Sect：门派
Technique：功法
KnowledgePoint：知识点
PracticeRecord：修炼记录
Event：事件
Journey：游历记录
Breakthrough：突破任务
RuleConfig：全局规则配置
TechniquePlanDraft：AI 生成草案
```

建议文件：

```text
src/types/domain.ts
```

## 计算引擎

计算引擎负责把记录转化为数值，不应该写散在页面里。

当前已实现：

```text
过滤软删除记录
汇总个人总经验、法力、神识、神魂
按门派汇总经验、法力、神识、神魂和记录数
按功法汇总经验、法力、神识、神魂和记录数
按知识点分配比例汇总经验、法力、神识、神魂和记录数
通过统一入口 calculatePracticeStats 接入页面
计算知识点完成度和维度封顶
计算功法层数、覆盖率、核心覆盖率、薄弱点比例和下一层缺口
```

需要实现：

```text
计算单次修炼收益
根据课程价值系数和功法倾向生成任务量草案
计算法力收益
计算神识收益
计算神魂收益
计算当前境界
判断第 7 级和第 13 级突破状态
计算知识点复习状态和下一次复习时间
计算退化状态
计算巩固恢复收益
```

建议文件：

```text
src/utils/rulesEngine.ts
src/utils/practiceDraft.ts
src/utils/realm.ts
src/utils/decay.ts
```

## 本地存储

第一版数据存在浏览器本地。

保存内容：

```text
门派和功法配置
知识点计划
修炼记录
事件记录
游历记录
突破记录
规则配置
AI 草案
```

第一版使用：

```text
localStorage
```

建议文件：

```text
src/utils/storage.ts
```

后续可以升级：

```text
IndexedDB
SQLite
本地文件导入导出
云数据库
```

## AI 草案导入

AI 只生成草案，不直接修改正式数据。

流程：

```text
用户输入课程、教材、考纲、目标层数、学习周期
前端发送规划请求
mock AI 或真实 AI 返回 JSON 草案
前端展示草案
用户编辑草案
用户确认导入
草案转为正式知识点计划
```

第一版先用 mock 数据跑通流程。真实 AI 接口后续通过后端实现，用后端隐藏 API Key。

## 推荐目录

前端目录：

```text
src/
  components/
    ProfilePanel.tsx
    SectCard.tsx
    TechniqueCard.tsx
    PracticeRecordForm.tsx
  pages/
    HomePage.tsx
    SectsPage.tsx
    TechniquePage.tsx
    EventsPage.tsx
    JourneyPage.tsx
    SettingsPage.tsx
    AiDraftPage.tsx
  data/
    defaultSects.ts
    defaultRules.ts
  types/
    domain.ts
  utils/
    rulesEngine.ts
    realm.ts
    decay.ts
    storage.ts
  styles/
    global.css
```

后端目录，后续需要时再加：

```text
server/
  index.ts
  routes/
    aiPlan.ts
  services/
    openaiClient.ts
  schemas/
    techniquePlanDraft.ts
```

## 开发顺序

先做本地前端版：

```text
1. React + TypeScript 项目
2. TypeScript 数据模型
3. 默认门派和功法目录
4. 静态页面
5. 修炼记录表单（已完成，本地内存版）
6. 计算引擎（已完成基础汇总和页面接入）
7. localStorage 保存（已完成基础接入）
8. 知识点和功法进度（已完成基础接入）
9. 境界和突破系统（已完成基础接入）
10. 事件系统（已完成基础接入）
11. 神魂游历系统（已完成基础接入）
12. 规则配置（下一步）
13. mock AI 草案导入
```

再做后端和真实 AI：

```text
14. Node.js 后端
15. AI 接口
16. JSON Schema 校验
17. 真实 AI 草案生成
```

最后做增强：

```text
17. 图表和可视化
18. 游戏化 UI
19. 数据导入导出
20. 数据库或云同步
```

## 学习路线

按开发需求反推学习顺序：

```text
HTML/CSS 基础 -> 看懂页面结构和样式
JavaScript 基础 -> 理解变量、函数、数组、对象
TypeScript -> 定义系统数据模型
React -> 做页面和组件
React Router -> 做页面切换
localStorage -> 保存本地数据
数组计算 -> 做数值引擎
表单处理 -> 新增记录和配置
日期处理 -> 事件和退化
测试 -> 验证规则正确
Node.js 后端 -> 接 AI
API 和 JSON -> 前后端通信
```

## 关键原则

```text
规则集中在计算引擎，不散落在页面里。
AI 只生成草案，人确认后才生效。
用户可以自由修炼，系统只提示不强制。
所有关键数值都支持手动调整。
本地数据必须能保存和恢复。
先做可用闭环，再做复杂美化。
```
