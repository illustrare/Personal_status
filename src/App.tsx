import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  PracticeRecordForm,
  practiceRecordTypeLabels,
  type PracticeRecordFormSubmission,
} from "./components/PracticeRecordForm";
import { PracticeRecordsList } from "./components/PracticeRecordsList";
import { FieldReference } from "./components/FieldReference";
import {
  defaultKnowledgePoints,
  getDefaultKnowledgePointsByTechnique,
} from "./data/defaultKnowledgePoints";
import { defaultSects, visibleDefaultSects } from "./data/defaultSects";
import {
  defaultTechniquePracticeDefaults,
} from "./data/defaultTechniquePracticeDefaults";
import { defaultTechniqueLayerRules } from "./data/defaultTechniqueLayerRules";
import { defaultRealmRules } from "./data/defaultRealmRules";
import { defaultJourneySoulRule } from "./data/defaultJourneySoulRule";
import { defaultDecayRule } from "./data/defaultDecayRule";
import {
  defaultTechniques,
  visibleDefaultTechniques,
} from "./data/defaultTechniques";
import {
  defaultTechniqueChapters,
  defaultTechniqueUnits,
} from "./data/defaultTechniqueStructure";
import type {
  Breakthrough,
  BreakthroughStatus,
  Event,
  EventStatus,
  EventType,
  Journey,
  JourneySoulRule,
  JourneyStatus,
  JourneyType,
  KnowledgePoint,
  KnowledgePointMigrationPreview,
  CultivationStructureRepository,
  DecayRule,
  PracticeRecord,
  PracticeRecordKnowledgePoint,
  PracticeRecordKnowledgePointDraft,
  PracticeRecordType,
  RealmRule,
  TechniqueLayerRule,
  TechniqueMigrationPreview,
  TechniqueLayerRuleDraft,
  TechniquePlanDraft,
  AiDraftRequest,
  KnowledgePointDraft,
  KnowledgeGranularity,
  TechniqueChapterDraft,
  TechniqueCreationDraft,
  TechniqueCreationDraftRepository,
  TechniqueCreationInput,
  TechniqueCreationKnowledgePointDraft,
  TechniqueCreationSourceType,
  TechniqueImportAction,
  TechniqueImportEntityType,
  TechniqueImportMappingRecord,
  TechniqueImportPlan,
  TechniqueUnitDraft,
  TechniquePracticeDefaults,
  TechniquePracticeDefaultsDraft,
  Sect,
  Technique,
} from "./types/domain";
import {
  calculateRealmProgress,
  type RealmProgress,
} from "./utils/realmProgress";
import {
  calculateCurrentOwnershipPracticeStats,
  type KnowledgePointPracticeStats,
  type ProfilePracticeStats,
  type SectPracticeStats,
  type TechniquePracticeStats,
} from "./utils/practiceStats";
import {
  calculatePracticeProgress,
  type KnowledgePointProgress,
  type TechniqueProgress,
} from "./utils/practiceProgress";
import {
  clearPracticeStorage,
  loadPracticeRecordKnowledgePoints,
  loadPracticeRecords,
  savePracticeRecordKnowledgePoints,
  savePracticeRecords,
} from "./utils/practiceStorage";
import {
  loadBreakthroughs,
  saveBreakthroughs,
} from "./utils/breakthroughStorage";
import { loadEvents, saveEvents } from "./utils/eventStorage";
import { loadJourneys, saveJourneys } from "./utils/journeyStorage";
import {
  loadJourneySoulRuleOverride,
  saveJourneySoulRuleOverride,
} from "./utils/journeySoulRuleStorage";
import {
  loadDecayRuleOverride,
  saveDecayRuleOverride,
} from "./utils/decayRuleStorage";
import {
  loadAiDraftRequests,
  loadTechniquePlanDrafts,
  saveAiDraftRequests,
  saveTechniquePlanDrafts,
} from "./utils/aiDraftStorage";
import {
  loadTechniquePracticeRuleOverrides,
  saveTechniquePracticeRuleOverrides,
} from "./utils/techniquePracticeRuleStorage";
import {
  loadTechniqueLayerRuleOverrides,
  saveTechniqueLayerRuleOverrides,
} from "./utils/techniqueLayerRuleStorage";
import {
  loadRealmRuleOverrides,
  saveRealmRuleOverrides,
} from "./utils/realmRuleStorage";
import {
  calculateJourneySoulGain,
  calculateJourneyStats,
  type JourneyStats,
} from "./utils/journeyStats";
import { calculateSuggestedExperience } from "./utils/practiceExperience";
import {
  getHomeReviewReminders,
  getReviewReminders,
  type ReviewReminder,
} from "./utils/reviewReminders";
import { createMockTechniquePlanDraft } from "./utils/mockAiDraft";
import { remoteAiGenerationClient } from "./utils/aiGenerationClient";
import {
  loadAiServiceConfig,
  saveAiServiceConfig,
  testAiServiceConnection,
  type AiServicePublicConfig,
} from "./utils/aiServiceConfig";
import {
  addChapterUnitsDraftRevision,
  addTechniqueStructureDraft,
  addTechniqueStructureDraftRevision,
  addUnitKnowledgeDraftRevision,
  loadTechniqueCreationDraftRepository,
  markTechniqueCreationProjectImported,
  materializeActiveTechniqueCreationDrafts,
  materializeTechniqueCreationDraft,
  saveTechniqueCreationDraftRepository,
} from "./utils/techniqueCreationDraftStorage";
import {
  resolveTechniqueKnowledgeStage,
  validateUnitKnowledgePointDrafts,
} from "./utils/techniqueKnowledgeDraft";
import {
  createTechniqueImportPlan,
  type TechniqueImportCatalog,
  validateTechniqueCreationDraftForImport,
} from "./utils/techniqueImportPlan";
import { applyTechniqueImportPlan } from "./utils/techniqueImportApplication";
import {
  createKnowledgeOwnershipIndex,
  getArchivedKnowledgePointsByTechnique,
  getKnowledgePointsByTechnique,
  type KnowledgeOwnershipIndex,
  resolveKnowledgePointOwnership,
} from "./utils/knowledgeOwnership";
import {
  loadCultivationStructureRepository,
  saveCultivationStructureRepository,
} from "./utils/cultivationStructureStorage";
import {
  applyKnowledgePointMigration,
  applyTechniqueMigration,
  createKnowledgePointMigrationPreview,
  createTechniqueMigrationPreview,
  type MigrationReferenceData,
} from "./utils/cultivationMigrations";
import {
  archiveKnowledgePoint,
  restoreKnowledgePoint,
  updateKnowledgePoint,
  type KnowledgePointEditPatch,
} from "./utils/knowledgePointManagement";

const STANDALONE_TECHNIQUE_ID = "standalone_knowledge";
const STANDALONE_UNIT_ID = "unit_standalone_inbox";
const SYSTEM_STANDALONE_SECT_ID = "system_standalone";
const MATH_ANALYSIS_CUMULATIVE_EXPERIENCE = [60000, 114000, 177000, 249000, 330000, 360000];

type KnowledgeChapter = {
  chapterCode: string;
  chapterName: string;
  knowledgePoints: KnowledgePoint[];
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getEffectiveKnowledgePointBaseValue(
  knowledgePoint: TechniqueCreationKnowledgePointDraft,
): number | undefined {
  if (knowledgePoint.baseValueOverride !== undefined) {
    return knowledgePoint.baseValueOverride;
  }

  return (
    getRecommendedKnowledgePointBaseValue(knowledgePoint) +
    (knowledgePoint.baseValueAdjustment ?? 0)
  );
}

function getRecommendedKnowledgePointBaseValue(
  knowledgePoint: TechniqueCreationKnowledgePointDraft,
): number {
  if (knowledgePoint.recommendedBaseValue !== undefined) {
    return knowledgePoint.recommendedBaseValue;
  }

  const granularityMultiplier =
    knowledgePoint.granularity === "rough"
      ? 1.35
      : knowledgePoint.granularity === "detailed"
        ? 0.8
        : 1;
  return Math.round(
    1000 *
      ((knowledgePoint.difficulty + knowledgePoint.importance) / 2) *
      granularityMultiplier,
  );
}

function hasManualKnowledgePointBaseValue(
  knowledgePoint: TechniqueCreationKnowledgePointDraft,
): boolean {
  return (
    knowledgePoint.baseValueOverride !== undefined ||
    knowledgePoint.baseValueAdjustmentIsManual === true ||
    (knowledgePoint.baseValueAdjustment !== undefined &&
      knowledgePoint.baseValueAdjustmentIsManual === undefined)
  );
}

function allocateKnowledgePointBaseValues(
  knowledgePoints: TechniqueCreationKnowledgePointDraft[],
  targetTotal: number,
): Map<string, number> {
  if (!Number.isInteger(targetTotal)) {
    throw new Error("重新分配后的可用总额必须是整数。请先修正手动调整值。");
  }
  if (targetTotal < knowledgePoints.length) {
    throw new Error(
      `可调整的 ${knowledgePoints.length} 个知识点至少各需要 1 点基础价值。`,
    );
  }

  const values = knowledgePoints.map((knowledgePoint) => {
    const value = getEffectiveKnowledgePointBaseValue(knowledgePoint);
    if (
      value === undefined ||
      !Number.isInteger(value) ||
      value < 1
    ) {
      throw new Error(`“${knowledgePoint.name}”缺少可用的基础价值，暂时无法参与重分配。`);
    }
    return value;
  });
  const totalWeight = values.reduce((total, value) => total + value, 0);
  const remainingValue = targetTotal - knowledgePoints.length;
  const allocations = values.map((value, index) => {
    const rawExtra = (remainingValue * value) / totalWeight;
    const extra = Math.floor(rawExtra);
    return {
      draftId: knowledgePoints[index].draftId,
      value: extra + 1,
      fraction: rawExtra - extra,
    };
  });
  let remainder = targetTotal - allocations.reduce(
    (total, allocation) => total + allocation.value,
    0,
  );
  const sortedByFraction = [...allocations].sort(
    (left, right) => right.fraction - left.fraction,
  );
  for (let index = 0; remainder > 0; index += 1, remainder -= 1) {
    sortedByFraction[index % sortedByFraction.length].value += 1;
  }

  return new Map(
    allocations.map((allocation) => [allocation.draftId, allocation.value]),
  );
}

function getIncludedDraftKnowledgePoints(
  draft: TechniqueCreationDraft,
): TechniqueCreationKnowledgePointDraft[] {
  return draft.chapterDrafts.flatMap((chapter) =>
    chapter.unitGenerationConfig.includeInGeneration
      ? chapter.unitDrafts.flatMap((unit) =>
          unit.knowledgeGenerationConfig.includeInGeneration
            ? unit.knowledgePointDrafts
            : [],
        )
      : [],
  );
}

function redistributeDraftKnowledgePointExperience(
  draft: TechniqueCreationDraft,
  includeManualAdjustments: boolean,
): { draft: TechniqueCreationDraft; unitDraftIds: string[] } {
  const targetTotal = draft.input.experienceBudgetTotal;
  if (targetTotal === undefined) {
    throw new Error("请先设置目标总经验。");
  }
  const includedKnowledgePoints = getIncludedDraftKnowledgePoints(draft);
  if (includedKnowledgePoints.length === 0) {
    throw new Error("请先生成至少一个参与导入的知识点。");
  }

  const protectedKnowledgePoints = includeManualAdjustments
    ? []
    : includedKnowledgePoints.filter(hasManualKnowledgePointBaseValue);
  const adjustableKnowledgePoints = includeManualAdjustments
    ? includedKnowledgePoints
    : includedKnowledgePoints.filter(
        (knowledgePoint) => !hasManualKnowledgePointBaseValue(knowledgePoint),
      );
  if (adjustableKnowledgePoints.length === 0) {
    throw new Error("当前所有知识点都已手动调整。请选择包含手动调整后再重新分配。");
  }
  const protectedTotal = protectedKnowledgePoints.reduce(
    (total, knowledgePoint) =>
      total + (getEffectiveKnowledgePointBaseValue(knowledgePoint) ?? 0),
    0,
  );
  const allocations = allocateKnowledgePointBaseValues(
    adjustableKnowledgePoints,
    targetTotal - protectedTotal,
  );

  return {
    draft: {
      ...draft,
      chapterDrafts: draft.chapterDrafts.map((chapter) => ({
        ...chapter,
        unitDrafts: chapter.unitDrafts.map((unit) => ({
          ...unit,
          knowledgePointDrafts: unit.knowledgePointDrafts.map(
            (knowledgePoint) => {
              const nextBaseValue = allocations.get(knowledgePoint.draftId);
              const recommendedBaseValue = getRecommendedKnowledgePointBaseValue(
                knowledgePoint,
              );
              if (nextBaseValue === undefined) {
                return {
                  ...knowledgePoint,
                  recommendedBaseValue,
                };
              }
              return {
                ...knowledgePoint,
                recommendedBaseValue,
                baseValueOverride: undefined,
                baseValueAdjustment:
                  nextBaseValue - recommendedBaseValue,
                baseValueAdjustmentIsManual: false,
              };
            },
          ),
        })),
      })),
      updatedAt: new Date().toISOString(),
    },
    unitDraftIds: [...new Set(includedKnowledgePoints.map(
      (knowledgePoint) => knowledgePoint.unitDraftId,
    ))],
  };
}

function getIndependentKnowledgeBaseValue(
  granularity: KnowledgeGranularity,
): number {
  switch (granularity) {
    case "rough":
      return 200;
    case "normal":
      return 150;
    case "detailed":
      return 100;
  }
}

function getTechniqueProgressStatusLabel(
  status: TechniqueProgress["nextLayerStatus"],
): string {
  switch (status) {
    case "maxed":
      return "已圆满";
    case "breakthrough_ready":
      return "待突破";
    case "blocked":
      return "补覆盖";
    case "training":
      return "修炼中";
  }
}

function getReviewStatusLabel(status: KnowledgePointProgress["reviewStatus"]) {
  switch (status) {
    case "not_scheduled":
      return "未安排";
    case "not_due":
      return "未到期";
    case "due":
      return "到期";
    case "overdue":
      return "逾期";
  }
}

function getReviewReminderStatusLabel(status: ReviewReminder["reminderStatus"]) {
  switch (status) {
    case "upcoming":
      return "临近";
    case "due":
      return "今日到期";
    case "overdue":
      return "已逾期";
    case "warning":
      return "遗忘警告";
    case "decayed":
      return "已退化";
  }
}

function getReviewReminderTimeLabel(daysUntilReview: number): string {
  if (daysUntilReview > 0) {
    return `${daysUntilReview} 天后`;
  }

  if (daysUntilReview === 0) {
    return "今天";
  }

  return `逾期 ${Math.abs(daysUntilReview)} 天`;
}

function getRealmProgressStatusLabel(status: RealmProgress["status"]): string {
  switch (status) {
    case "maxed":
      return "已圆满";
    case "breakthrough_blocked":
      return "卡境";
    case "training":
      return "修炼中";
  }
}

function getEventTypeLabel(eventType: EventType): string {
  switch (eventType) {
    case "exam":
      return "期末考试";
    case "course_project":
      return "课程结业设计";
    case "course_paper":
      return "课程论文";
    case "breakthrough_exam":
      return "突破考试";
    case "mock_test":
      return "模拟测试";
    case "long_project":
      return "长期项目";
    case "review_week":
      return "复习周";
    case "custom":
      return "自定义试炼";
  }
}

function getEventStatusLabel(status: EventStatus): string {
  switch (status) {
    case "not_started":
      return "未开始";
    case "in_progress":
      return "进行中";
    case "completed":
      return "成功";
    case "failed":
      return "失败";
  }
}

function getJourneyTypeLabel(journeyType: JourneyType): string {
  switch (journeyType) {
    case "reading":
      return "阅读";
    case "movie":
      return "电影";
    case "anime":
      return "番剧";
    case "game":
      return "游戏";
    case "music":
      return "音乐";
    case "exhibition":
      return "展览";
    case "theater":
      return "戏剧";
    case "custom":
    case "other":
      return "自定义";
  }
}

function getJourneyStatusLabel(status: JourneyStatus): string {
  switch (status) {
    case "planned":
      return "未开始";
    case "in_progress":
      return "进行中";
    case "completed":
      return "已完成";
    case "abandoned":
      return "搁置";
  }
}

function getDaysUntilLabel(dateValue?: string): string {
  if (!dateValue) {
    return "无截止日期";
  }

  const dueDate = new Date(dateValue);
  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const dayDifference = Math.ceil(
    (dueDate.getTime() - today.getTime()) / 86_400_000,
  );

  if (dayDifference > 0) {
    return `${dayDifference} 天后`;
  }

  if (dayDifference === 0) {
    return "今天截止";
  }

  return `已逾期 ${Math.abs(dayDifference)} 天`;
}

function sortEventsByDueDate(events: Event[]): Event[] {
  return [...events].sort((firstEvent, secondEvent) => {
    const firstTime = firstEvent.dueAt
      ? new Date(firstEvent.dueAt).getTime()
      : Number.POSITIVE_INFINITY;
    const secondTime = secondEvent.dueAt
      ? new Date(secondEvent.dueAt).getTime()
      : Number.POSITIVE_INFINITY;

    return firstTime - secondTime;
  });
}

function sortJourneysByUpdatedAt(journeys: Journey[]): Journey[] {
  return [...journeys].sort(
    (firstJourney, secondJourney) =>
      new Date(secondJourney.updatedAt).getTime() -
      new Date(firstJourney.updatedAt).getTime(),
  );
}

function groupById<TItem, TKey extends string>(
  items: TItem[],
  getKey: (item: TItem) => TKey,
): Record<TKey, TItem[]> {
  return items.reduce<Record<TKey, TItem[]>>((itemsById, item) => {
    const key = getKey(item);

    return {
      ...itemsById,
      [key]: [...(itemsById[key] ?? []), item],
    };
  }, {} as Record<TKey, TItem[]>);
}

const defaultPracticeDefaultsByTechniqueId = Object.fromEntries(
  defaultTechniquePracticeDefaults.map((practiceDefaults) => [
    practiceDefaults.techniqueId,
    practiceDefaults,
  ]),
);
const defaultLayerRulesByTechniqueId = groupById(
  defaultTechniqueLayerRules,
  (layerRule) => layerRule.techniqueId,
);
function groupKnowledgePointsByChapter(
  knowledgePoints: KnowledgePoint[],
  ownershipIndex: KnowledgeOwnershipIndex,
): KnowledgeChapter[] {
  const chapters = new Map<string, KnowledgeChapter>();

  knowledgePoints.forEach((knowledgePoint) => {
    const chapter = resolveKnowledgePointOwnership(
      knowledgePoint,
      ownershipIndex,
    )?.chapter;

    if (!chapter) {
      return;
    }

    const existingChapter = chapters.get(chapter.id);

    if (existingChapter) {
      existingChapter.knowledgePoints.push(knowledgePoint);
      return;
    }

    chapters.set(chapter.id, {
      chapterCode: chapter.code,
      chapterName: chapter.name,
      knowledgePoints: [knowledgePoint],
    });
  });

  return Array.from(chapters.values());
}

function mergePracticeDefaultsByTechniqueId(
  overrides: TechniquePracticeDefaults[],
): Record<string, TechniquePracticeDefaults> {
  return overrides.reduce<Record<string, TechniquePracticeDefaults>>(
    (defaultsByTechniqueId, override) => ({
      ...defaultsByTechniqueId,
      [override.techniqueId]: override,
    }),
    defaultPracticeDefaultsByTechniqueId,
  );
}

function mergeLayerRulesByTechniqueId(
  overrides: TechniqueLayerRule[],
): Record<string, TechniqueLayerRule[]> {
  const overridesByTechniqueId = groupById(
    overrides,
    (layerRule) => layerRule.techniqueId,
  );

  return {
    ...defaultLayerRulesByTechniqueId,
    ...overridesByTechniqueId,
  };
}

function getEffectiveRealmRules(overrides: RealmRule[]): RealmRule[] {
  return overrides.length > 0 ? overrides : defaultRealmRules;
}

function getEffectiveJourneySoulRule(
  override: JourneySoulRule | undefined,
): JourneySoulRule {
  return override ?? defaultJourneySoulRule;
}

function getEffectiveDecayRule(override: DecayRule | undefined): DecayRule {
  return override ?? defaultDecayRule;
}

function App() {
  const [practiceRecords, setPracticeRecords] =
    useState<PracticeRecord[]>(loadPracticeRecords);
  const [practiceRecordKnowledgePoints, setPracticeRecordKnowledgePoints] =
    useState<PracticeRecordKnowledgePoint[]>(
      loadPracticeRecordKnowledgePoints,
    );
  const [breakthroughs, setBreakthroughs] =
    useState<Breakthrough[]>(loadBreakthroughs);
  const [events, setEvents] = useState<Event[]>(loadEvents);
  const [journeys, setJourneys] = useState<Journey[]>(loadJourneys);
  const [techniquePracticeRuleOverrides, setTechniquePracticeRuleOverrides] =
    useState<TechniquePracticeDefaults[]>(loadTechniquePracticeRuleOverrides);
  const [techniqueLayerRuleOverrides, setTechniqueLayerRuleOverrides] =
    useState<TechniqueLayerRule[]>(loadTechniqueLayerRuleOverrides);
  const [realmRuleOverrides, setRealmRuleOverrides] =
    useState<RealmRule[]>(loadRealmRuleOverrides);
  const [journeySoulRuleOverride, setJourneySoulRuleOverride] =
    useState<JourneySoulRule | undefined>(loadJourneySoulRuleOverride);
  const [decayRuleOverride, setDecayRuleOverride] =
    useState<DecayRule | undefined>(loadDecayRuleOverride);
  const [aiDraftRequests, setAiDraftRequests] =
    useState<AiDraftRequest[]>(loadAiDraftRequests);
  const [techniquePlanDrafts, setTechniquePlanDrafts] =
    useState<TechniquePlanDraft[]>(loadTechniquePlanDrafts);
  const [techniqueCreationRepository, setTechniqueCreationRepository] =
    useState<TechniqueCreationDraftRepository>(
      loadTechniqueCreationDraftRepository,
    );
  const [cultivationStructureRepository, setCultivationStructureRepository] =
    useState<CultivationStructureRepository>(
      loadCultivationStructureRepository,
    );
  const knowledgeOwnershipIndex = useMemo(
    () =>
      createKnowledgeOwnershipIndex(
        cultivationStructureRepository.techniques,
        cultivationStructureRepository.chapters,
        cultivationStructureRepository.units,
      ),
    [cultivationStructureRepository],
  );
  const practiceDefaultsByTechniqueId = mergePracticeDefaultsByTechniqueId(
    techniquePracticeRuleOverrides,
  );
  const layerRulesByTechniqueId = mergeLayerRulesByTechniqueId(
    techniqueLayerRuleOverrides,
  );
  const techniqueImportCatalog: TechniqueImportCatalog = {
    sects: cultivationStructureRepository.sects,
    techniques: cultivationStructureRepository.techniques,
    chapters: cultivationStructureRepository.chapters,
    units: cultivationStructureRepository.units,
    knowledgePoints: cultivationStructureRepository.knowledgePoints,
    practiceDefaults: Object.values(practiceDefaultsByTechniqueId),
    layerRules: Object.values(layerRulesByTechniqueId).flat(),
  };
  const effectiveRealmRules = getEffectiveRealmRules(realmRuleOverrides);
  const effectiveJourneySoulRule =
    getEffectiveJourneySoulRule(journeySoulRuleOverride);
  const effectiveDecayRule = getEffectiveDecayRule(decayRuleOverride);
  const practiceStats = calculateCurrentOwnershipPracticeStats(
    practiceRecords,
    practiceRecordKnowledgePoints,
    cultivationStructureRepository.techniques,
  );
  const journeyStats = calculateJourneyStats(journeys);
  const profileStats = {
    ...practiceStats.profileStats,
    totalSoul: practiceStats.profileStats.totalSoul + journeyStats.totalSoul,
  };
  const realmProgress = calculateRealmProgress(
    profileStats,
    breakthroughs,
    effectiveRealmRules,
  );
  const practiceProgress = calculatePracticeProgress(
    cultivationStructureRepository.knowledgePoints,
    knowledgeOwnershipIndex,
    practiceRecords,
    practiceRecordKnowledgePoints,
    practiceDefaultsByTechniqueId,
    layerRulesByTechniqueId,
  );
  const reviewReminders = getReviewReminders(
    cultivationStructureRepository.knowledgePoints,
    knowledgeOwnershipIndex,
    practiceProgress.knowledgePointProgressById,
    effectiveDecayRule,
  );
  const homeReviewReminders = getHomeReviewReminders(
    reviewReminders,
    effectiveDecayRule,
  );
  const techniqueCreationDrafts = materializeActiveTechniqueCreationDrafts(
    techniqueCreationRepository,
  );
  const techniqueMigrationReferences: MigrationReferenceData = {
    practiceRecords,
    practiceRecordKnowledgePoints,
    practiceDefaults: Object.values(practiceDefaultsByTechniqueId),
    layerRules: Object.values(layerRulesByTechniqueId).flat(),
    draftProjects: techniqueCreationRepository.projects,
  };

  useEffect(() => {
    savePracticeRecords(practiceRecords);
  }, [practiceRecords]);

  useEffect(() => {
    savePracticeRecordKnowledgePoints(practiceRecordKnowledgePoints);
  }, [practiceRecordKnowledgePoints]);

  useEffect(() => {
    saveBreakthroughs(breakthroughs);
  }, [breakthroughs]);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    saveJourneys(journeys);
  }, [journeys]);

  useEffect(() => {
    saveTechniquePracticeRuleOverrides(techniquePracticeRuleOverrides);
  }, [techniquePracticeRuleOverrides]);

  useEffect(() => {
    saveTechniqueLayerRuleOverrides(techniqueLayerRuleOverrides);
  }, [techniqueLayerRuleOverrides]);

  useEffect(() => {
    saveRealmRuleOverrides(realmRuleOverrides);
  }, [realmRuleOverrides]);

  useEffect(() => {
    saveJourneySoulRuleOverride(journeySoulRuleOverride);
  }, [journeySoulRuleOverride]);

  useEffect(() => {
    saveDecayRuleOverride(decayRuleOverride);
  }, [decayRuleOverride]);

  useEffect(() => {
    saveAiDraftRequests(aiDraftRequests);
  }, [aiDraftRequests]);

  useEffect(() => {
    saveTechniquePlanDrafts(techniquePlanDrafts);
  }, [techniquePlanDrafts]);

  useEffect(() => {
    saveTechniqueCreationDraftRepository(techniqueCreationRepository);
  }, [techniqueCreationRepository]);

  useEffect(() => {
    saveCultivationStructureRepository(cultivationStructureRepository);
  }, [cultivationStructureRepository]);

  function addPracticeRecord(
    record: PracticeRecord,
    recordKnowledgePoints: PracticeRecordKnowledgePoint[],
  ) {
    setPracticeRecords((currentRecords) => [record, ...currentRecords]);
    setPracticeRecordKnowledgePoints((currentLinks) => [
      ...recordKnowledgePoints,
      ...currentLinks,
    ]);
  }

  function softDeletePracticeRecord(recordId: string) {
    const deletedAt = new Date().toISOString();

    setPracticeRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === recordId
          ? { ...record, deletedAt, updatedAt: deletedAt }
          : record,
      ),
    );
  }

  function restorePracticeRecord(recordId: string) {
    const updatedAt = new Date().toISOString();

    setPracticeRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === recordId
          ? { ...record, deletedAt: undefined, updatedAt }
          : record,
      ),
    );
  }

  function updatePracticeRecordContent(recordId: string, content: string) {
    const updatedAt = new Date().toISOString();

    setPracticeRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === recordId
          ? { ...record, content: content.trim() || undefined, updatedAt }
          : record,
      ),
    );
  }

  function clearLocalPracticeData() {
    clearPracticeStorage();
    setPracticeRecords([]);
    setPracticeRecordKnowledgePoints([]);
  }

  function addBreakthrough(breakthrough: Breakthrough) {
    setBreakthroughs((currentBreakthroughs) => [
      breakthrough,
      ...currentBreakthroughs,
    ]);
  }

  function createPracticeRecordFromCompletedEvent(event: Event): {
    record: PracticeRecord;
    recordKnowledgePoints: PracticeRecordKnowledgePoint[];
  } | undefined {
    const techniqueId = event.techniqueIds[0];

    if (
      event.status !== "completed" ||
      event.generatedPracticeRecordId ||
      !event.sectId ||
      !techniqueId
    ) {
      return undefined;
    }

    const now = new Date().toISOString();
    const recordId = crypto.randomUUID();
    const allocationWeight =
      event.knowledgePointIds.length > 0 ? 1 / event.knowledgePointIds.length : 0;
    const record: PracticeRecord = {
      id: recordId,
      sectId: event.sectId,
      techniqueId,
      recordType: event.eventType === "review_week" ? "review" : "test",
      title: `完成事件：${event.title}`,
      content: event.summary || event.targetRequirement,
      durationMinutes: 0,
      quantity: 1,
      unit: "次",
      difficultyMultiplier: event.difficulty,
      suggestedExperienceGain: event.manaReward + event.insightReward,
      experienceGain: event.manaReward + event.insightReward,
      manaGain: event.manaReward,
      insightGain: event.insightReward,
      soulGain: event.soulReward,
      valueSource: "manual",
      adjustmentReason: "由成功事件结算生成。",
      sourceEventId: event.id,
      practicedAt: event.completedAt ?? now,
      createdAt: now,
      updatedAt: now,
    };
    const recordKnowledgePoints = event.knowledgePointIds.map(
      (knowledgePointId) => ({
        id: crypto.randomUUID(),
        recordId,
        knowledgePointId,
        allocationWeight,
      }),
    );

    return { record, recordKnowledgePoints };
  }

  function saveEventWithOptionalPracticeRecord(event: Event) {
    const eventPracticeRecord = createPracticeRecordFromCompletedEvent(event);
    const eventToSave = eventPracticeRecord
      ? {
          ...event,
          generatedPracticeRecordId: eventPracticeRecord.record.id,
          updatedAt: eventPracticeRecord.record.updatedAt,
        }
      : event;

    setEvents((currentEvents) => [eventToSave, ...currentEvents]);

    if (eventPracticeRecord) {
      addPracticeRecord(
        eventPracticeRecord.record,
        eventPracticeRecord.recordKnowledgePoints,
      );
    }
  }

  function completeEvent(eventId: string) {
    const currentEvent = events.find((event) => event.id === eventId);

    if (!currentEvent || currentEvent.generatedPracticeRecordId) {
      return;
    }

    const now = new Date().toISOString();
    const completedEvent: Event = {
      ...currentEvent,
      status: "completed",
      completedAt: now,
      updatedAt: now,
    };
    const eventPracticeRecord =
      createPracticeRecordFromCompletedEvent(completedEvent);

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === eventId
          ? {
              ...completedEvent,
              generatedPracticeRecordId:
                eventPracticeRecord?.record.id ??
                completedEvent.generatedPracticeRecordId,
            }
          : event,
      ),
    );

    if (eventPracticeRecord) {
      addPracticeRecord(
        eventPracticeRecord.record,
        eventPracticeRecord.recordKnowledgePoints,
      );
    }
  }

  function failEvent(eventId: string) {
    const now = new Date().toISOString();

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === eventId
          ? { ...event, status: "failed", completedAt: now, updatedAt: now }
          : event,
      ),
    );
  }

  function updateEventSummary(eventId: string, summary: string) {
    const updatedAt = new Date().toISOString();

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === eventId
          ? { ...event, summary: summary.trim() || undefined, updatedAt }
          : event,
      ),
    );
  }

  function addJourney(journey: Journey) {
    setJourneys((currentJourneys) => [journey, ...currentJourneys]);
  }

  function createIndependentKnowledgePoint(
    input: IndependentKnowledgePointInput,
  ): KnowledgePoint {
    const standaloneTechnique = cultivationStructureRepository.techniques.find(
      (technique) => technique.id === STANDALONE_TECHNIQUE_ID,
    );
    const standaloneUnit = cultivationStructureRepository.units.find(
      (unit) => unit.id === STANDALONE_UNIT_ID,
    );
    const practiceDefaults =
      practiceDefaultsByTechniqueId[STANDALONE_TECHNIQUE_ID];

    if (!standaloneTechnique || !standaloneUnit || !practiceDefaults) {
      throw new Error("秘术合集的默认结构或修炼规则缺失。");
    }

    const name = input.name.trim();
    const description = input.description.trim();

    if (name.length < 1 || name.length > 80) {
      throw new Error("知识点名称需要填写 1 到 80 个字。");
    }
    if (description.length < 10 || description.length > 1500) {
      throw new Error("学习边界说明需要填写 10 到 1500 个字。");
    }
    if (
      input.difficulty < 0.1 ||
      input.difficulty > 5 ||
      input.importance < 0.1 ||
      input.importance > 5
    ) {
      throw new Error("难度和重要度需要填写 0.1 到 5 之间的数值。");
    }

    const now = new Date().toISOString();
    const knowledgePoint: KnowledgePoint = {
      id: `kp_${crypto.randomUUID()}`,
      unitId: standaloneUnit.id,
      name,
      description,
      domainTags: input.domainTags,
      topicTags: input.topicTags,
      granularity: input.granularity,
      baseValue: getIndependentKnowledgeBaseValue(input.granularity),
      difficulty: input.difficulty,
      importance: input.importance,
      targetLayer: 1,
      maxTrainableLayer: 6,
      currentLayer: 0,
      status: "not_started",
      requiredExerciseCount: practiceDefaults.requiredExerciseCount,
      requiredNoteCount: practiceDefaults.requiredNoteCount,
      requiredThinkingCount: practiceDefaults.requiredThinkingCount,
      reviewStatus: "not_scheduled",
      reviewStage: 0,
      manaWeight: standaloneTechnique.manaWeight,
      insightWeight: standaloneTechnique.insightWeight,
      prerequisiteKnowledgePointIds: [],
      isDecayed: false,
      createdAt: now,
      updatedAt: now,
    };

    setCultivationStructureRepository((currentRepository) => ({
      ...currentRepository,
      knowledgePoints: [
        ...currentRepository.knowledgePoints,
        knowledgePoint,
      ],
      updatedAt: now,
    }));

    return knowledgePoint;
  }

  function editFormalKnowledgePoint(
    knowledgePointId: string,
    patch: KnowledgePointEditPatch,
  ) {
    const nextRepository = updateKnowledgePoint(
      cultivationStructureRepository,
      knowledgePointId,
      patch,
    );
    setCultivationStructureRepository(nextRepository);
  }

  function deleteFormalKnowledgePoint(knowledgePointId: string) {
    const nextRepository = archiveKnowledgePoint(
      cultivationStructureRepository,
      knowledgePointId,
    );
    setCultivationStructureRepository(nextRepository);
  }

  function restoreFormalKnowledgePoint(knowledgePointId: string) {
    const nextRepository = restoreKnowledgePoint(
      cultivationStructureRepository,
      knowledgePointId,
    );
    setCultivationStructureRepository(nextRepository);
  }

  function migrateKnowledgePoint(
    knowledgePointId: string,
    toUnitId: string,
    reason?: string,
  ) {
    setCultivationStructureRepository((currentRepository) =>
      applyKnowledgePointMigration(
        currentRepository,
        knowledgePointId,
        toUnitId,
        { reason: reason?.trim() || undefined },
      ),
    );
  }

  function migrateTechnique(
    techniqueId: string,
    toSectId: string,
    reason?: string,
  ) {
    setCultivationStructureRepository((currentRepository) =>
      applyTechniqueMigration(currentRepository, techniqueId, toSectId, {
        reason: reason?.trim() || undefined,
      }),
    );
  }

  function recalculatePracticeRecordsForTechnique(
    practiceDefaults: TechniquePracticeDefaults,
    includeManualRecords: boolean,
  ) {
    setPracticeRecords((currentRecords) =>
      currentRecords.map((record) => {
        const shouldRecalculate =
          record.techniqueId === practiceDefaults.techniqueId &&
          (record.valueSource === "technique_default" || includeManualRecords);

        if (!shouldRecalculate) {
          return record;
        }

        const recordKnowledgePointLinks =
          practiceRecordKnowledgePoints.filter(
            (link) => link.recordId === record.id,
          );
        const linkedKnowledgePoints =
          cultivationStructureRepository.knowledgePoints.filter(
          (knowledgePoint) =>
            recordKnowledgePointLinks.some(
              (link) => link.knowledgePointId === knowledgePoint.id,
            ),
          );

        if (
          recordKnowledgePointLinks.length === 0 ||
          linkedKnowledgePoints.length === 0
        ) {
          return record;
        }

        const experienceCalculation = calculateSuggestedExperience({
          recordType: record.recordType,
          quantity: record.quantity,
          difficultyMultiplier: record.difficultyMultiplier ?? 1,
          knowledgePoints: linkedKnowledgePoints,
          allocations: recordKnowledgePointLinks.map((link) => ({
            knowledgePointId: link.knowledgePointId,
            allocationWeight: link.allocationWeight,
          })),
          practiceDefaults,
        });
        const typeDefaults =
          practiceDefaults.recordTypeDefaults[record.recordType];
        const updatedExperienceGain =
          experienceCalculation.suggestedExperienceGain;

        return {
          ...record,
          suggestedExperienceGain: experienceCalculation.suggestedExperienceGain,
          experienceGain: updatedExperienceGain,
          manaGain: roundToTwo(updatedExperienceGain * typeDefaults.manaWeight),
          insightGain: roundToTwo(
            updatedExperienceGain * typeDefaults.insightWeight,
          ),
          valueSource: "technique_default",
          adjustmentReason:
            record.valueSource === "manual" && includeManualRecords
              ? "规则更新时选择按新规则重算。"
              : undefined,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function updateTechniquePracticeRules(
    practiceDefaults: TechniquePracticeDefaults,
    includeManualRecords: boolean,
  ) {
    setTechniquePracticeRuleOverrides((currentOverrides) => {
      const existingOverride = currentOverrides.find(
        (override) => override.techniqueId === practiceDefaults.techniqueId,
      );

      if (existingOverride) {
        return currentOverrides.map((override) =>
          override.techniqueId === practiceDefaults.techniqueId
            ? practiceDefaults
            : override,
        );
      }

      return [practiceDefaults, ...currentOverrides];
    });
    recalculatePracticeRecordsForTechnique(
      practiceDefaults,
      includeManualRecords,
    );
  }

  function resetTechniquePracticeRules(techniqueId: string) {
    setTechniquePracticeRuleOverrides((currentOverrides) =>
      currentOverrides.filter((override) => override.techniqueId !== techniqueId),
    );
  }

  function updateTechniqueLayerRules(layerRules: TechniqueLayerRule[]) {
    const techniqueId = layerRules[0]?.techniqueId;

    if (!techniqueId) {
      return;
    }

    setTechniqueLayerRuleOverrides((currentOverrides) => [
      ...layerRules,
      ...currentOverrides.filter(
        (override) => override.techniqueId !== techniqueId,
      ),
    ]);
  }

  function resetTechniqueLayerRules(techniqueId: string) {
    setTechniqueLayerRuleOverrides((currentOverrides) =>
      currentOverrides.filter((override) => override.techniqueId !== techniqueId),
    );
  }

  function updateRealmRules(realmRules: RealmRule[]) {
    setRealmRuleOverrides(realmRules);
  }

  function resetRealmRules() {
    setRealmRuleOverrides([]);
  }

  function updateJourneySoulRule(journeySoulRule: JourneySoulRule) {
    setJourneySoulRuleOverride(journeySoulRule);
  }

  function resetJourneySoulRule() {
    setJourneySoulRuleOverride(undefined);
  }

  function updateDecayRule(decayRule: DecayRule) {
    setDecayRuleOverride(decayRule);
  }

  function resetDecayRule() {
    setDecayRuleOverride(undefined);
  }

  function saveAiDraftRequest(request: AiDraftRequest) {
    setAiDraftRequests((currentRequests) => {
      const existingRequest = currentRequests.find(
        (currentRequest) => currentRequest.id === request.id,
      );

      if (existingRequest) {
        return currentRequests.map((currentRequest) =>
          currentRequest.id === request.id ? request : currentRequest,
        );
      }

      return [request, ...currentRequests];
    });
  }

  function generateTechniquePlanDraft(request: AiDraftRequest) {
    saveAiDraftRequest(request);
    const draft = createMockTechniquePlanDraft(request);
    setTechniquePlanDrafts((currentDrafts) => [draft, ...currentDrafts]);
  }

  function updateTechniquePlanDraft(draft: TechniquePlanDraft) {
    const updatedAt = new Date().toISOString();

    setTechniquePlanDrafts((currentDrafts) =>
      currentDrafts.map((currentDraft) =>
        currentDraft.id === draft.id
          ? { ...draft, updatedAt }
          : currentDraft,
      ),
    );
  }

  function deleteTechniquePlanDraft(draftId: string) {
    setTechniquePlanDrafts((currentDrafts) =>
      currentDrafts.filter((draft) => draft.id !== draftId),
    );
  }

  async function createTechniqueCreationProject(
    input: TechniqueCreationInput,
    onProgress?: (phase: "waiting" | "validating" | "saving") => void,
  ) {
    onProgress?.("waiting");
    const response = await remoteAiGenerationClient.generate({
      requestId: crypto.randomUUID(),
      schemaVersion: "1.0",
      stage: "technique_structure",
      input,
    });
    onProgress?.("validating");
    if (response.status === "failed") {
      throw new Error(response.error.message);
    }
    const structureDraft = response.draft;
    onProgress?.("saving");
    const mutation = addTechniqueStructureDraft(
      techniqueCreationRepository,
      structureDraft,
    );
    setTechniqueCreationRepository(mutation.repository);

    return mutation;
  }

  function saveTechniqueCreationStructure(draft: TechniqueCreationDraft) {
    if (!draft.projectId || !draft.variantId) {
      throw new Error("草案缺少项目或组合版本 id，无法保存大章结构。");
    }

    const mutation = addTechniqueStructureDraftRevision(
      techniqueCreationRepository,
      draft.projectId,
      draft.variantId,
      draft,
    );
    setTechniqueCreationRepository(mutation.repository);

    return mutation;
  }

  async function generateTechniqueCreationUnits(
    draft: TechniqueCreationDraft,
    chapterDraftIds: string[],
    onProgress?: (phase: "waiting" | "validating" | "saving") => void,
  ) {
    if (!draft.projectId || !draft.variantId) {
      throw new Error("草案缺少项目或组合版本 id，无法生成章节单元。");
    }

    onProgress?.("waiting");
    const response = await remoteAiGenerationClient.generate({
      requestId: crypto.randomUUID(),
      schemaVersion: "1.0",
      stage: "chapter_units",
      draft,
      chapterDraftIds,
    });
    onProgress?.("validating");
    if (response.status === "failed") {
      throw new Error(response.error.message);
    }
    const generatedDraft = response.draft;
    onProgress?.("saving");
    const mutation = addChapterUnitsDraftRevision(
      techniqueCreationRepository,
      draft.projectId,
      draft.variantId,
      generatedDraft,
    );
    setTechniqueCreationRepository(mutation.repository);

    return mutation;
  }

  function saveTechniqueCreationUnits(
    draft: TechniqueCreationDraft,
    chapterDraftIds: string[],
  ) {
    if (!draft.projectId || !draft.variantId) {
      throw new Error("草案缺少项目或组合版本 id，无法保存章节单元。");
    }

    const mutation = addChapterUnitsDraftRevision(
      techniqueCreationRepository,
      draft.projectId,
      draft.variantId,
      draft,
      {
        chapterDraftIds,
        source: "manual",
      },
    );
    setTechniqueCreationRepository(mutation.repository);

    return mutation;
  }

  async function generateTechniqueCreationKnowledgePoints(
    draft: TechniqueCreationDraft,
    unitDraftIds: string[],
    onProgress?: (phase: "waiting" | "validating" | "saving") => void,
  ) {
    if (!draft.projectId || !draft.variantId) {
      throw new Error("草案缺少项目或组合版本 id，无法生成单元知识点。");
    }

    onProgress?.("waiting");
    const response = await remoteAiGenerationClient.generate({
      requestId: crypto.randomUUID(),
      schemaVersion: "1.0",
      stage: "unit_knowledge_points",
      draft,
      unitDraftIds,
    });
    onProgress?.("validating");
    if (response.status === "failed") {
      throw new Error(response.error.message);
    }
    const generatedDraft = response.draft;
    onProgress?.("saving");
    const mutation = addUnitKnowledgeDraftRevision(
      techniqueCreationRepository,
      draft.projectId,
      draft.variantId,
      generatedDraft,
    );
    setTechniqueCreationRepository(mutation.repository);

    return mutation;
  }

  function saveTechniqueCreationKnowledgePoints(
    draft: TechniqueCreationDraft,
    unitDraftIds: string[],
  ) {
    if (!draft.projectId || !draft.variantId) {
      throw new Error("草案缺少项目或组合版本 id，无法保存知识点修订。");
    }

    const mutation = addUnitKnowledgeDraftRevision(
      techniqueCreationRepository,
      draft.projectId,
      draft.variantId,
      draft,
      {
        unitDraftIds,
        source: "manual",
      },
    );
    setTechniqueCreationRepository(mutation.repository);

    return mutation;
  }

  function saveTechniqueCreationExperienceRedistribution(
    draft: TechniqueCreationDraft,
    includeManualAdjustments: boolean,
  ) {
    if (!draft.projectId || !draft.variantId) {
      throw new Error("草案缺少项目或组合版本 id，无法重新分配知识点经验。");
    }

    const structureMutation = addTechniqueStructureDraftRevision(
      techniqueCreationRepository,
      draft.projectId,
      draft.variantId,
      draft,
      "manual",
    );
    const structureDraft = materializeTechniqueCreationDraft(
      structureMutation.repository,
      draft.projectId,
    );
    if (!structureDraft) {
      throw new Error("保存目标总经验后无法读取草案版本。");
    }
    const redistribution = redistributeDraftKnowledgePointExperience(
      structureDraft,
      includeManualAdjustments,
    );
    const knowledgeMutation = addUnitKnowledgeDraftRevision(
      structureMutation.repository,
      draft.projectId,
      structureMutation.variantId,
      redistribution.draft,
      {
        unitDraftIds: redistribution.unitDraftIds,
        source: "manual",
      },
    );
    setTechniqueCreationRepository(knowledgeMutation.repository);

    return knowledgeMutation;
  }

  function applyTechniqueCreationImport(
    draft: TechniqueCreationDraft,
    plan: TechniqueImportPlan,
    confirmedActionIds: string[],
    acceptedIssueIds: string[],
  ) {
    if (!draft.projectId) {
      throw new Error("草案缺少创建项目 id，无法写入正式数据。");
    }

    const appliedAt = new Date().toISOString();
    const result = applyTechniqueImportPlan(
      plan,
      cultivationStructureRepository,
      techniquePracticeRuleOverrides,
      techniqueLayerRuleOverrides,
      {
        projectId: draft.projectId,
        variantId: draft.variantId,
        confirmedActionIds,
        acceptedIssueIds,
        appliedAt,
      },
    );

    setCultivationStructureRepository(result.cultivationStructureRepository);
    setTechniquePracticeRuleOverrides(result.practiceDefaults);
    setTechniqueLayerRuleOverrides(result.layerRules);
    setTechniqueCreationRepository((currentRepository) =>
      markTechniqueCreationProjectImported(
        currentRepository,
        draft.projectId as string,
        appliedAt,
      ),
    );
  }

  return (
    <main className="app-shell">
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              profileStats={profileStats}
              realmProgress={realmProgress}
              breakthroughs={breakthroughs}
              events={events}
              journeys={journeys}
              journeyStats={journeyStats}
              reviewReminders={homeReviewReminders}
              decayRule={effectiveDecayRule}
              onAddBreakthrough={addBreakthrough}
            />
          }
        />
        <Route
          path="/events"
          element={
            <EventsPage
              events={events}
              onAddEvent={saveEventWithOptionalPracticeRecord}
              onCompleteEvent={completeEvent}
              onFailEvent={failEvent}
              onUpdateEventSummary={updateEventSummary}
            />
          }
        />
        <Route
          path="/journeys"
          element={
            <JourneysPage
              journeys={journeys}
              journeyStats={journeyStats}
              journeySoulRule={effectiveJourneySoulRule}
              onAddJourney={addJourney}
            />
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/ai-service" element={<AiServiceSettingsPage />} />
        <Route
          path="/settings/realm-rules"
          element={
            <RealmRulesSettingsPage
              realmRules={effectiveRealmRules}
              onSave={updateRealmRules}
              onReset={resetRealmRules}
            />
          }
        />
        <Route
          path="/settings/journey-soul-rule"
          element={
            <JourneySoulRuleSettingsPage
              journeySoulRule={effectiveJourneySoulRule}
              onSave={updateJourneySoulRule}
              onReset={resetJourneySoulRule}
            />
          }
        />
        <Route
          path="/settings/decay-rule"
          element={
            <DecayRuleSettingsPage
              decayRule={effectiveDecayRule}
              onSave={updateDecayRule}
              onReset={resetDecayRule}
            />
          }
        />
        <Route
          path="/ai-drafts"
          element={
            <AiDraftsOverviewPage
              requests={aiDraftRequests}
              drafts={techniquePlanDrafts}
              creationDrafts={techniqueCreationDrafts}
              importMappings={cultivationStructureRepository.importMappings}
              onDeleteDraft={deleteTechniquePlanDraft}
            />
          }
        />
        <Route
          path="/ai-drafts/import-records"
          element={
            <TechniqueImportRecordsPage
              repository={cultivationStructureRepository}
            />
          }
        />
        <Route
          path="/ai-drafts/new"
          element={
            <TechniqueCreationInputPage
              onCreateProject={createTechniqueCreationProject}
            />
          }
        />
        <Route
          path="/cultivation/sects/:sectId/ai-drafts/new"
          element={
            <TechniqueCreationInputPage
              onCreateProject={createTechniqueCreationProject}
            />
          }
        />
        <Route
          path="/ai-drafts/projects/:projectId/chapters"
          element={
            <TechniqueStructureConfirmationRoute
              repository={techniqueCreationRepository}
              onSaveStructure={saveTechniqueCreationStructure}
            />
          }
        />
        <Route
          path="/ai-drafts/projects/:projectId/rules"
          element={
            <TechniqueRulesRoute
              repository={techniqueCreationRepository}
              onSaveStructure={saveTechniqueCreationStructure}
              onRedistributeKnowledgePointExperience={
                saveTechniqueCreationExperienceRedistribution
              }
            />
          }
        />
        <Route
          path="/ai-drafts/projects/:projectId/units"
          element={
            <TechniqueUnitsRoute
              repository={techniqueCreationRepository}
              onGenerateUnits={generateTechniqueCreationUnits}
              onSaveUnits={saveTechniqueCreationUnits}
            />
          }
        />
        <Route
          path="/ai-drafts/projects/:projectId/knowledge"
          element={
            <TechniqueKnowledgeRoute
              repository={techniqueCreationRepository}
              catalog={techniqueImportCatalog}
              onGenerateKnowledgePoints={
                generateTechniqueCreationKnowledgePoints
              }
              onSaveKnowledgePoints={saveTechniqueCreationKnowledgePoints}
            />
          }
        />
        <Route
          path="/ai-drafts/projects/:projectId/import-preview"
          element={
            <TechniqueImportPreviewRoute
              repository={techniqueCreationRepository}
              catalog={techniqueImportCatalog}
              onApplyImport={applyTechniqueCreationImport}
            />
          }
        />
        <Route
          path="/ai-drafts/:draftId"
          element={
            <AiDraftDetailRoute
              drafts={techniquePlanDrafts}
              onUpdateDraft={updateTechniquePlanDraft}
              onDeleteDraft={deleteTechniquePlanDraft}
            />
          }
        />
        <Route
          path="/review-reminders"
          element={
            <ReviewRemindersPage
              reviewReminders={reviewReminders}
              decayRule={effectiveDecayRule}
            />
          }
        />
        <Route
          path="/cultivation"
          element={
            <CultivationPage
              repository={cultivationStructureRepository}
              ownershipIndex={knowledgeOwnershipIndex}
              sectStatsById={practiceStats.sectStatsById}
              techniqueStatsById={practiceStats.techniqueStatsById}
            />
          }
        />
        <Route
          path="/cultivation/independent"
          element={
            <IndependentTechniquesRoute
              repository={cultivationStructureRepository}
              migrationReferences={techniqueMigrationReferences}
              sectStatsById={practiceStats.sectStatsById}
              techniqueStatsById={practiceStats.techniqueStatsById}
              techniqueProgressById={practiceProgress.techniqueProgressById}
              onMigrateTechnique={migrateTechnique}
            />
          }
        />
        <Route
          path="/cultivation/secret-arts"
          element={
            <KnowledgeRoute
              mode="secretArts"
              repository={cultivationStructureRepository}
              ownershipIndex={knowledgeOwnershipIndex}
              knowledgePointStatsById={practiceStats.knowledgePointStatsById}
              knowledgePointProgressById={
                practiceProgress.knowledgePointProgressById
              }
              techniqueProgressById={practiceProgress.techniqueProgressById}
              practiceDefaultsByTechniqueId={practiceDefaultsByTechniqueId}
              layerRulesByTechniqueId={layerRulesByTechniqueId}
              practiceRecords={practiceRecords}
              practiceRecordKnowledgePoints={practiceRecordKnowledgePoints}
              onAddPracticeRecord={addPracticeRecord}
              onDeletePracticeRecord={softDeletePracticeRecord}
              onRestorePracticeRecord={restorePracticeRecord}
              onUpdatePracticeRecordContent={updatePracticeRecordContent}
              onClearLocalPracticeData={clearLocalPracticeData}
              onUpdateTechniquePracticeRules={updateTechniquePracticeRules}
              onResetTechniquePracticeRules={resetTechniquePracticeRules}
              onUpdateTechniqueLayerRules={updateTechniqueLayerRules}
              onResetTechniqueLayerRules={resetTechniqueLayerRules}
              onCreateIndependentKnowledgePoint={
                createIndependentKnowledgePoint
              }
              onMigrateKnowledgePoint={migrateKnowledgePoint}
              onEditKnowledgePoint={editFormalKnowledgePoint}
              onDeleteKnowledgePoint={deleteFormalKnowledgePoint}
              onRestoreKnowledgePoint={restoreFormalKnowledgePoint}
            />
          }
        />
        <Route
          path="/cultivation/independent/techniques/:techniqueId"
          element={
            <KnowledgeRoute
              mode="independent"
              repository={cultivationStructureRepository}
              ownershipIndex={knowledgeOwnershipIndex}
              knowledgePointStatsById={practiceStats.knowledgePointStatsById}
              knowledgePointProgressById={
                practiceProgress.knowledgePointProgressById
              }
              techniqueProgressById={practiceProgress.techniqueProgressById}
              practiceDefaultsByTechniqueId={practiceDefaultsByTechniqueId}
              layerRulesByTechniqueId={layerRulesByTechniqueId}
              practiceRecords={practiceRecords}
              practiceRecordKnowledgePoints={practiceRecordKnowledgePoints}
              onAddPracticeRecord={addPracticeRecord}
              onDeletePracticeRecord={softDeletePracticeRecord}
              onRestorePracticeRecord={restorePracticeRecord}
              onUpdatePracticeRecordContent={updatePracticeRecordContent}
              onClearLocalPracticeData={clearLocalPracticeData}
              onUpdateTechniquePracticeRules={updateTechniquePracticeRules}
              onResetTechniquePracticeRules={resetTechniquePracticeRules}
              onUpdateTechniqueLayerRules={updateTechniqueLayerRules}
              onResetTechniqueLayerRules={resetTechniqueLayerRules}
              onMigrateKnowledgePoint={migrateKnowledgePoint}
              onEditKnowledgePoint={editFormalKnowledgePoint}
              onDeleteKnowledgePoint={deleteFormalKnowledgePoint}
              onRestoreKnowledgePoint={restoreFormalKnowledgePoint}
            />
          }
        />
        <Route
          path="/cultivation/sects/:sectId"
          element={
            <SectTechniquesRoute
              repository={cultivationStructureRepository}
              migrationReferences={techniqueMigrationReferences}
              sectStatsById={practiceStats.sectStatsById}
              techniqueStatsById={practiceStats.techniqueStatsById}
              techniqueProgressById={practiceProgress.techniqueProgressById}
              onMigrateTechnique={migrateTechnique}
            />
          }
        />
        <Route
          path="/cultivation/sects/:sectId/techniques/:techniqueId"
          element={
            <KnowledgeRoute
              repository={cultivationStructureRepository}
              ownershipIndex={knowledgeOwnershipIndex}
              knowledgePointStatsById={practiceStats.knowledgePointStatsById}
              knowledgePointProgressById={
                practiceProgress.knowledgePointProgressById
              }
              techniqueProgressById={practiceProgress.techniqueProgressById}
              practiceDefaultsByTechniqueId={practiceDefaultsByTechniqueId}
              layerRulesByTechniqueId={layerRulesByTechniqueId}
              practiceRecords={practiceRecords}
              practiceRecordKnowledgePoints={practiceRecordKnowledgePoints}
              onAddPracticeRecord={addPracticeRecord}
              onDeletePracticeRecord={softDeletePracticeRecord}
              onRestorePracticeRecord={restorePracticeRecord}
              onUpdatePracticeRecordContent={updatePracticeRecordContent}
              onClearLocalPracticeData={clearLocalPracticeData}
              onUpdateTechniquePracticeRules={updateTechniquePracticeRules}
              onResetTechniquePracticeRules={resetTechniquePracticeRules}
              onUpdateTechniqueLayerRules={updateTechniqueLayerRules}
              onResetTechniqueLayerRules={resetTechniqueLayerRules}
              onMigrateKnowledgePoint={migrateKnowledgePoint}
              onEditKnowledgePoint={editFormalKnowledgePoint}
              onDeleteKnowledgePoint={deleteFormalKnowledgePoint}
              onRestoreKnowledgePoint={restoreFormalKnowledgePoint}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

type SectTechniquesRouteProps = {
  repository: CultivationStructureRepository;
  migrationReferences: MigrationReferenceData;
  sectStatsById: Record<string, SectPracticeStats>;
  techniqueStatsById: Record<string, TechniquePracticeStats>;
  techniqueProgressById: Record<string, TechniqueProgress>;
  onMigrateTechnique: (
    techniqueId: string,
    toSectId: string,
    reason?: string,
  ) => void;
};

function SectTechniquesRoute({
  repository,
  migrationReferences,
  sectStatsById,
  techniqueStatsById,
  techniqueProgressById,
  onMigrateTechnique,
}: SectTechniquesRouteProps) {
  const { sectId } = useParams();
  const sect = repository.sects.find(
    (item) => !item.isSystem && !item.archivedAt && item.id === sectId,
  );

  if (!sect) {
    return <Navigate to="/cultivation" replace />;
  }

  return (
    <TechniquesPage
      repository={repository}
      sect={sect}
      techniques={repository.techniques.filter(
        (technique) => !technique.isSystem && !technique.archivedAt,
      )}
      sectStatsById={sectStatsById}
      techniqueStatsById={techniqueStatsById}
      techniqueProgressById={techniqueProgressById}
      migrationReferences={migrationReferences}
      onMigrateTechnique={onMigrateTechnique}
    />
  );
}

function IndependentTechniquesRoute({
  repository,
  migrationReferences,
  sectStatsById,
  techniqueStatsById,
  techniqueProgressById,
  onMigrateTechnique,
}: SectTechniquesRouteProps) {
  const systemSect = repository.sects.find(
    (sect) => sect.id === SYSTEM_STANDALONE_SECT_ID,
  );

  if (!systemSect) {
    return <Navigate to="/cultivation" replace />;
  }

  return (
    <TechniquesPage
      mode="independent"
      repository={repository}
      sect={systemSect}
      techniques={repository.techniques.filter(
        (technique) => !technique.isSystem && !technique.archivedAt,
      )}
      sectStatsById={sectStatsById}
      techniqueStatsById={techniqueStatsById}
      techniqueProgressById={techniqueProgressById}
      migrationReferences={migrationReferences}
      onMigrateTechnique={onMigrateTechnique}
    />
  );
}

type KnowledgeRouteProps = {
  mode?: "standard" | "independent" | "secretArts";
  repository: CultivationStructureRepository;
  ownershipIndex: KnowledgeOwnershipIndex;
  knowledgePointStatsById: Record<string, KnowledgePointPracticeStats>;
  knowledgePointProgressById: Record<string, KnowledgePointProgress>;
  techniqueProgressById: Record<string, TechniqueProgress>;
  practiceDefaultsByTechniqueId: Record<string, TechniquePracticeDefaults>;
  layerRulesByTechniqueId: Record<string, TechniqueLayerRule[]>;
  practiceRecords: PracticeRecord[];
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[];
  onAddPracticeRecord: (
    record: PracticeRecord,
    recordKnowledgePoints: PracticeRecordKnowledgePoint[],
  ) => void;
  onDeletePracticeRecord: (recordId: string) => void;
  onRestorePracticeRecord: (recordId: string) => void;
  onUpdatePracticeRecordContent: (recordId: string, content: string) => void;
  onClearLocalPracticeData: () => void;
  onUpdateTechniquePracticeRules: (
    practiceDefaults: TechniquePracticeDefaults,
    includeManualRecords: boolean,
  ) => void;
  onResetTechniquePracticeRules: (techniqueId: string) => void;
  onUpdateTechniqueLayerRules: (layerRules: TechniqueLayerRule[]) => void;
  onResetTechniqueLayerRules: (techniqueId: string) => void;
  onCreateIndependentKnowledgePoint?: (
    input: IndependentKnowledgePointInput,
  ) => KnowledgePoint;
  onMigrateKnowledgePoint: (
    knowledgePointId: string,
    toUnitId: string,
    reason?: string,
  ) => void;
  onEditKnowledgePoint: (
    knowledgePointId: string,
    patch: KnowledgePointEditPatch,
  ) => void;
  onDeleteKnowledgePoint: (knowledgePointId: string) => void;
  onRestoreKnowledgePoint: (knowledgePointId: string) => void;
};

function KnowledgeRoute({
  mode = "standard",
  repository,
  ownershipIndex,
  knowledgePointStatsById,
  knowledgePointProgressById,
  techniqueProgressById,
  practiceDefaultsByTechniqueId,
  layerRulesByTechniqueId,
  practiceRecords,
  practiceRecordKnowledgePoints,
  onAddPracticeRecord,
  onDeletePracticeRecord,
  onRestorePracticeRecord,
  onUpdatePracticeRecordContent,
  onClearLocalPracticeData,
  onUpdateTechniquePracticeRules,
  onResetTechniquePracticeRules,
  onUpdateTechniqueLayerRules,
  onResetTechniqueLayerRules,
  onCreateIndependentKnowledgePoint,
  onMigrateKnowledgePoint,
  onEditKnowledgePoint,
  onDeleteKnowledgePoint,
  onRestoreKnowledgePoint,
}: KnowledgeRouteProps) {
  const { sectId, techniqueId } = useParams();
  const isSecretArts = mode === "secretArts";
  const isIndependent = mode === "independent";
  const technique = isSecretArts
    ? repository.techniques.find(
        (item) => item.id === STANDALONE_TECHNIQUE_ID,
      )
    : repository.techniques.find(
        (item) =>
          !item.isSystem && !item.archivedAt && item.id === techniqueId,
      );

  if (!technique) {
    return <Navigate to="/cultivation" replace />;
  }
  if (isIndependent && technique.sectId !== SYSTEM_STANDALONE_SECT_ID) {
    return (
      <Navigate
        to={`/cultivation/sects/${technique.sectId}/techniques/${technique.id}`}
        replace
      />
    );
  }
  if (mode === "standard" && technique.sectId !== sectId) {
    const canonicalPath =
      technique.sectId === SYSTEM_STANDALONE_SECT_ID
        ? `/cultivation/independent/techniques/${technique.id}`
        : `/cultivation/sects/${technique.sectId}/techniques/${technique.id}`;
    return (
      <Navigate to={canonicalPath} replace />
    );
  }

  const sect = repository.sects.find(
    (item) =>
      item.id === technique.sectId &&
      (mode !== "standard" || (!item.isSystem && !item.archivedAt)),
  );

  if (!sect) {
    return <Navigate to="/cultivation" replace />;
  }

  const techniqueRecords = practiceRecords.filter(
    (record) => record.techniqueId === technique.id,
  );
  const techniqueRecordIds = new Set(
    techniqueRecords.map((record) => record.id),
  );
  const techniqueRecordKnowledgePoints = practiceRecordKnowledgePoints.filter(
    (link) => techniqueRecordIds.has(link.recordId),
  );

  return (
    <KnowledgePage
      key={technique.id}
      repository={repository}
      sectId={sect.id}
      sectName={
        isSecretArts ? "秘术合集" : isIndependent ? "独立知识" : sect.name
      }
      techniqueName={isSecretArts ? "秘术知识点" : technique.name}
      techniqueId={technique.id}
      backTo={
        isSecretArts
          ? "/cultivation"
          : isIndependent
            ? "/cultivation/independent"
            : `/cultivation/sects/${sect.id}`
      }
      isSecretArts={isSecretArts}
      practiceDefaults={practiceDefaultsByTechniqueId[technique.id]}
      knowledgePoints={getKnowledgePointsByTechnique(
        repository.knowledgePoints,
        technique.id,
        ownershipIndex,
      )}
      archivedKnowledgePoints={getArchivedKnowledgePointsByTechnique(
        repository.knowledgePoints,
        technique.id,
        ownershipIndex,
      )}
      ownershipIndex={ownershipIndex}
      layerRules={layerRulesByTechniqueId[technique.id] ?? []}
      knowledgePointStatsById={knowledgePointStatsById}
      knowledgePointProgressById={knowledgePointProgressById}
      techniqueProgress={techniqueProgressById[technique.id]}
      practiceRecords={techniqueRecords}
      practiceRecordKnowledgePoints={techniqueRecordKnowledgePoints}
      allPracticeRecords={practiceRecords}
      allPracticeRecordKnowledgePoints={practiceRecordKnowledgePoints}
      onAddPracticeRecord={onAddPracticeRecord}
      onDeletePracticeRecord={onDeletePracticeRecord}
      onRestorePracticeRecord={onRestorePracticeRecord}
      onUpdatePracticeRecordContent={onUpdatePracticeRecordContent}
      onClearLocalPracticeData={onClearLocalPracticeData}
      onUpdateTechniquePracticeRules={onUpdateTechniquePracticeRules}
      onResetTechniquePracticeRules={onResetTechniquePracticeRules}
      onUpdateTechniqueLayerRules={onUpdateTechniqueLayerRules}
      onResetTechniqueLayerRules={onResetTechniqueLayerRules}
      onCreateIndependentKnowledgePoint={
        isSecretArts ? onCreateIndependentKnowledgePoint : undefined
      }
      onMigrateKnowledgePoint={onMigrateKnowledgePoint}
      onEditKnowledgePoint={onEditKnowledgePoint}
      onDeleteKnowledgePoint={onDeleteKnowledgePoint}
      onRestoreKnowledgePoint={onRestoreKnowledgePoint}
    />
  );
}

type HomePageProps = {
  profileStats: ProfilePracticeStats;
  realmProgress: RealmProgress;
  breakthroughs: Breakthrough[];
  events: Event[];
  journeys: Journey[];
  journeyStats: JourneyStats;
  reviewReminders: ReviewReminder[];
  decayRule: DecayRule;
  onAddBreakthrough: (breakthrough: Breakthrough) => void;
};

function HomePage({
  profileStats,
  realmProgress,
  breakthroughs,
  events,
  journeys,
  journeyStats,
  reviewReminders,
  decayRule,
  onAddBreakthrough,
}: HomePageProps) {
  const nextBreakthroughRealm = realmProgress.nextRealm?.breakthroughRequired
    ? realmProgress.nextRealm
    : undefined;
  const nextBreakthroughRecords = nextBreakthroughRealm
    ? breakthroughs.filter(
        (breakthrough) =>
          breakthrough.targetRealmLevel === nextBreakthroughRealm.level,
      )
    : [];
  const [breakthroughTitle, setBreakthroughTitle] = useState(
    nextBreakthroughRealm?.breakthroughTitle ?? "",
  );
  const [breakthroughStatus, setBreakthroughStatus] =
    useState<BreakthroughStatus>("completed");
  const [breakthroughSummary, setBreakthroughSummary] = useState("");
  const displayedProfileStats = [
    { label: "境界", value: realmProgress.currentRealm.name },
    { label: "总修为", value: realmProgress.totalCultivation.toString() },
    { label: "法力", value: profileStats.totalMana.toString() },
    { label: "神识", value: profileStats.totalInsight.toString() },
  ];
  const upcomingEventItems = sortEventsByDueDate(
    events.filter((event) => event.status !== "completed" && event.status !== "failed"),
  )
    .slice(0, 3)
    .map((event) => ({
      title: event.title,
      meta: `${getEventTypeLabel(event.eventType)} · ${getDaysUntilLabel(
        event.dueAt,
      )}`,
      description: event.targetRequirement || event.description,
    }));
  const recentJourneyItems = sortJourneysByUpdatedAt(journeys)
    .slice(0, 3)
    .map((journey) => ({
      title: journey.title,
      meta: `${getJourneyTypeLabel(journey.journeyType)} · 神魂 +${journey.soulGain}`,
      description: journey.summary || `${journey.durationMinutes ?? 0} 分钟体验记录`,
    }));
  const reviewReminderItems = reviewReminders.slice(0, 3).map((reminder) => ({
    title: reminder.knowledgePointName,
    meta: `${getReviewReminderStatusLabel(
      reminder.reminderStatus,
    )} · ${getReviewReminderTimeLabel(reminder.daysUntilReview)}`,
    description: `${reminder.chapterName} · 进度 ${formatPercent(
      reminder.progressRatio,
    )}`,
  }));

  function submitBreakthrough(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nextBreakthroughRealm) {
      return;
    }

    const now = new Date().toISOString();
    const title =
      breakthroughTitle.trim() ||
      nextBreakthroughRealm.breakthroughTitle ||
      `${nextBreakthroughRealm.name}突破记录`;

    onAddBreakthrough({
      id: crypto.randomUUID(),
      targetRealmLevel: nextBreakthroughRealm.level,
      title,
      description:
        nextBreakthroughRealm.breakthroughDescription ??
        "个人境界突破任务记录。",
      requirements: [
        `总修为达到 ${nextBreakthroughRealm.requiredTotalCultivation}`,
        `法力达到 ${nextBreakthroughRealm.requiredMana}`,
        `神识达到 ${nextBreakthroughRealm.requiredInsight}`,
      ],
      status: breakthroughStatus,
      completedAt: breakthroughStatus === "completed" ? now : undefined,
      summary: breakthroughSummary.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
    setBreakthroughSummary("");
  }

  return (
    <section className="page-panel">
      <p className="eyebrow">Personal Cultivation Dashboard</p>
      <div className="page-heading">
        <div>
          <h1>个人修炼状态系统</h1>
          <p className="intro">
            从个人总览进入事件、游历和修炼三条主线。
          </p>
        </div>
      </div>

      <div className="status-grid" aria-label="个人属性面板">
        {displayedProfileStats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      <section className="realm-section" aria-label="境界突破状态">
        <div className="realm-summary">
          <div>
            <span>当前状态</span>
            <strong>{getRealmProgressStatusLabel(realmProgress.status)}</strong>
          </div>
          <div>
            <span>下一境界</span>
            <strong>{realmProgress.nextRealm?.name ?? "已达最高境界"}</strong>
          </div>
          <div>
            <span>神魂</span>
            <strong>{profileStats.totalSoul}</strong>
          </div>
        </div>

        {realmProgress.nextRealm && realmProgress.gap && (
          <div className="realm-detail">
            <h2>下一境界要求</h2>
            <dl>
              <div>
                <dt>总修为</dt>
                <dd>
                  {realmProgress.nextRealm.requiredTotalCultivation}，还差{" "}
                  {realmProgress.gap.totalCultivationGap}
                </dd>
              </div>
              <div>
                <dt>法力</dt>
                <dd>
                  {realmProgress.nextRealm.requiredMana}，还差{" "}
                  {realmProgress.gap.manaGap}
                </dd>
              </div>
              <div>
                <dt>神识</dt>
                <dd>
                  {realmProgress.nextRealm.requiredInsight}，还差{" "}
                  {realmProgress.gap.insightGap}
                </dd>
              </div>
            </dl>
            {realmProgress.status === "breakthrough_blocked" &&
              realmProgress.nextRealm.breakthroughTitle && (
                <p className="realm-alert">
                  已达到数值门槛，等待完成：
                  {realmProgress.nextRealm.breakthroughTitle}
                </p>
              )}
          </div>
        )}

        {nextBreakthroughRealm && (
          <div className="realm-breakthrough-panel">
            <section>
              <h2>{nextBreakthroughRealm.breakthroughTitle}</h2>
              <p>
                {nextBreakthroughRealm.breakthroughDescription}
              </p>
              {nextBreakthroughRecords.length > 0 ? (
                <ul className="breakthrough-list">
                  {nextBreakthroughRecords.map((breakthrough) => (
                    <li key={breakthrough.id}>
                      <strong>{breakthrough.title}</strong>
                      <span>{getBreakthroughStatusLabel(breakthrough.status)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="progress-muted">当前还没有突破记录。</p>
              )}
            </section>

            <form className="placeholder-form" onSubmit={submitBreakthrough}>
              <label>
                突破标题
                <input
                  value={breakthroughTitle}
                  onChange={(event) => setBreakthroughTitle(event.target.value)}
                />
              </label>
              <label>
                突破状态
                <select
                  value={breakthroughStatus}
                  onChange={(event) =>
                    setBreakthroughStatus(
                      event.target.value as BreakthroughStatus,
                    )
                  }
                >
                  <option value="completed">已完成</option>
                  <option value="in_progress">进行中</option>
                  <option value="failed">未通过</option>
                  <option value="not_started">未开始</option>
                </select>
              </label>
              <label>
                结果总结
                <textarea
                  value={breakthroughSummary}
                  onChange={(event) =>
                    setBreakthroughSummary(event.target.value)
                  }
                />
              </label>
              <button type="submit">保存突破记录</button>
            </form>
          </div>
        )}
      </section>

      <div className="action-grid" aria-label="核心系统入口">
        <Link className="button-link" to="/cultivation">
          <span>修炼</span>
          <strong>门派、功法和知识点</strong>
        </Link>
        <Link className="button-link" to="/events">
          <span>事件</span>
          <strong>试炼与截止日期</strong>
        </Link>
        <Link className="button-link" to="/journeys">
          <span>游历</span>
          <strong>阅读、电影和体验</strong>
        </Link>
        <Link className="button-link" to="/settings">
          <span>设置</span>
          <strong>全局规则与系统配置</strong>
        </Link>
        <Link className="button-link" to="/ai-drafts">
          <span>AI 草案</span>
          <strong>生成和管理功法规划</strong>
        </Link>
      </div>

      <div className="preview-grid">
        <PreviewSection title="近期事件" items={upcomingEventItems} />
        <PreviewSection
          title={`最近游历 · ${journeyStats.journeyCount} 条`}
          items={recentJourneyItems}
        />
        <section className="content-section">
          <div className="section-title-row">
            <h2>退化提醒</h2>
            <Link className="text-link" to="/review-reminders">
              查看全部
            </Link>
          </div>
          <p className="progress-muted">
            首页显示临近 {decayRule.reminderLeadDays} 天、到期、逾期和已退化的复习。
          </p>
          <div className="record-list">
            {reviewReminderItems.length > 0 ? (
              reviewReminderItems.map((item) => (
                <RecordCard key={item.title} item={item} />
              ))
            ) : (
              <p className="progress-muted">当前没有临近复习提醒。</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

type SettingsCategory = {
  title: string;
  meta: string;
  description: string;
  policy: string;
  to: string;
};

type SettingsCategoryGroup = {
  title: string;
  description: string;
  categories: SettingsCategory[];
};

const settingsCategoryGroups: SettingsCategoryGroup[] = [
  {
    title: "服务连接类",
    description: "管理本机后端的 AI 服务模式与连接信息，不改写学习数据。",
    categories: [
      {
        title: "AI 服务",
        meta: "本机后端",
        description: "查看当前 Mock 或真实服务模式，配置模型和 API Key。",
        policy: "Key 只提交给本机后端，页面不保存也不回显完整内容。",
        to: "/settings/ai-service",
      },
    ],
  },
  {
    title: "自动重算类",
    description: "规则保存时会主动改写符合条件的历史记录数值。",
    categories: [
      {
        title: "功法修炼规则",
        meta: "功法页面",
        description: "配置完成要求、任务收益、复习节奏和历史重算范围。",
        policy:
          "未手动调整的当前功法记录会自动重算；手动调整记录可选择是否一并重算。",
        to: "/cultivation",
      },
    ],
  },
  {
    title: "即时派生类",
    description: "历史记录不变，但页面会用新规则重新判断当前状态。",
    categories: [
      {
        title: "功法层数规则",
        meta: "功法页面",
        description: "配置每层经验门槛、覆盖要求、薄弱点上限和突破要求。",
        policy:
          "不改写修炼记录，只重新计算层数、下一层缺口和突破状态。",
        to: "/cultivation",
      },
      {
        title: "境界规则",
        meta: "全局配置",
        description: "配置 13 级境界名称、修为门槛和突破要求。",
        policy:
          "不改写修炼记录或突破记录，只重新判断首页境界和卡境状态。",
        to: "/settings/realm-rules",
      },
    ],
  },
  {
    title: "仅影响未来类",
    description: "规则改动只影响以后新增的数据，已有记录保持原值。",
    categories: [
      {
        title: "神魂收益规则",
        meta: "全局配置",
        description: "配置游历时长、完成度、类型倍率和神魂收益换算。",
        policy:
          "只影响以后新增游历记录的预计神魂和保存神魂，已有游历不自动重算。",
        to: "/settings/journey-soul-rule",
      },
    ],
  },
  {
    title: "提醒派生类",
    description: "只生成提醒和状态，不扣经验，不改写记录。",
    categories: [
      {
        title: "退化提醒规则",
        meta: "全局配置",
        description: "配置首页复习提醒窗口、逾期警告和退化提醒。",
        policy:
          "根据下一次复习时间生成提醒和退化状态，不减少进度或经验。",
        to: "/settings/decay-rule",
      },
    ],
  },
];

function AiServiceSettingsPage() {
  const [config, setConfig] = useState<AiServicePublicConfig>();
  const [mode, setMode] = useState<AiServicePublicConfig["mode"]>("mock");
  const [model, setModel] = useState("deepseek-chat");
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string }>();

  useEffect(() => {
    loadAiServiceConfig().then((nextConfig) => {
      setConfig(nextConfig);
      setMode(nextConfig.mode);
      setModel(nextConfig.model);
    }).catch((error) => setMessage({
      kind: "error",
      text: error instanceof Error ? error.message : "无法连接本机 AI 服务。",
    }));
  }, []);

  async function submitConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextConfig = await saveAiServiceConfig({
        mode,
        model: model.trim(),
        apiKey: apiKey.trim() || undefined,
      });
      setConfig(nextConfig);
      setApiKey("");
      setMessage({ kind: "success", text: "AI 服务设置已保存到本机后端。" });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "保存失败。" });
    }
  }

  async function clearApiKey() {
    try {
      const nextConfig = await saveAiServiceConfig({ mode, model: model.trim(), clearApiKey: true });
      setConfig(nextConfig);
      setApiKey("");
      setMessage({ kind: "success", text: "本机后端保存的 API Key 已清除。" });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "清除失败。" });
    }
  }

  async function testConnection() {
    try {
      setMessage({ kind: "success", text: await testAiServiceConnection() });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "连接测试失败。" });
    }
  }

  return (
    <section className="page-panel">
      <PageToolbar title="AI 服务设置" backTo="/settings" />
      <div className="page-heading"><p className="intro">当前模式：{config?.status === "mock" ? "本地 Mock" : config?.status === "configured" ? "真实服务已配置" : config ? "缺少 API Key" : "正在读取"}</p></div>
      <form className="placeholder-form" onSubmit={submitConfig}>
        <label>服务模式<select value={mode} onChange={(event) => setMode(event.target.value as AiServicePublicConfig["mode"])}><option value="mock">本地 Mock</option><option value="remote">真实 AI 服务</option></select></label>
        <label>供应商<input value="DeepSeek" disabled /></label>
        <label className="full-width-field">模型名称<input value={model} maxLength={120} onChange={(event) => setModel(event.target.value)} /></label>
        <label className="full-width-field">API Key<input type="password" value={apiKey} autoComplete="off" placeholder={config?.apiKeyConfigured ? "已在本机后端配置；留空保持不变" : "仅提交给本机后端"} onChange={(event) => setApiKey(event.target.value)} /></label>
      <p className="progress-muted">Key 状态：{config?.apiKeyConfigured ? "已配置" : "未配置"}。仅在保存真实模式且已配置 Key 后才能测试；测试会发送一次极小的 DeepSeek 请求。</p>
        {message && <p className={message.kind === "success" ? "form-success" : "form-error"}>{message.text}</p>}
        <div className="inline-actions"><button type="submit">保存 AI 服务设置</button><button type="button" className="secondary-button" onClick={testConnection} disabled={config?.status !== "configured"}>测试连接</button>{config?.apiKeyConfigured && <button type="button" className="danger-button" onClick={clearApiKey}>清除 API Key</button>}</div>
      </form>
    </section>
  );
}

function SettingsPage() {
  return (
    <section className="page-panel">
      <PageToolbar title="设置页" backTo="/" />

      <div className="page-heading">
        <div>
          <p className="intro">
            全局配置放在这里；门派、功法和知识点自己的规则仍然放在对应对象页面。
          </p>
        </div>
      </div>

      <div className="settings-group-list">
        {settingsCategoryGroups.map((group) => (
          <section className="content-section" key={group.title}>
            <h2>{group.title}</h2>
            <p className="progress-muted">{group.description}</p>
            <div className="settings-grid">
              {group.categories.map((category) => (
                <article className="settings-card" key={category.title}>
                  <div>
                    <span>{category.meta}</span>
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                    <p>{category.policy}</p>
                  </div>
                  <Link className="button-link" to={category.to}>
                    进入设置
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

type RealmRulesSettingsPageProps = {
  realmRules: RealmRule[];
  onSave: (realmRules: RealmRule[]) => void;
  onReset: () => void;
};

function RealmRulesSettingsPage({
  realmRules,
  onSave,
  onReset,
}: RealmRulesSettingsPageProps) {
  const sortedRealmRules = [...realmRules].sort(
    (firstRule, secondRule) => firstRule.level - secondRule.level,
  );
  const [draftRules, setDraftRules] = useState(sortedRealmRules);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setDraftRules(sortedRealmRules);
    setFormError("");
  }, [realmRules]);

  function updateRealmRule(
    level: number,
    patch: Partial<RealmRule>,
  ) {
    setDraftRules((currentRules) =>
      currentRules.map((rule) =>
        rule.level === level
          ? {
              ...rule,
              ...patch,
            }
          : rule,
      ),
    );
  }

  function submitRealmRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hasInvalidRule = draftRules.some(
      (rule) =>
        rule.name.trim().length === 0 ||
        rule.requiredTotalCultivation < 0 ||
        rule.requiredMana < 0 ||
        rule.requiredInsight < 0 ||
        (rule.breakthroughRequired &&
          (rule.breakthroughTitle?.trim().length ?? 0) === 0),
    );

    if (hasInvalidRule) {
      setFormError("境界名称、数值门槛和必需突破标题需要有效。");
      return;
    }

    onSave(
      draftRules.map((rule) => ({
        ...rule,
        name: rule.name.trim(),
        breakthroughTitle: rule.breakthroughRequired
          ? rule.breakthroughTitle?.trim()
          : undefined,
        breakthroughDescription: rule.breakthroughRequired
          ? rule.breakthroughDescription?.trim() || undefined
          : undefined,
      })),
    );
    setFormError("");
  }

  return (
    <section className="page-panel">
      <PageToolbar title="境界规则设置" backTo="/settings" />

      <div className="page-heading">
        <div>
          <p className="intro">
            境界规则属于全局配置，会立刻影响首页境界、下一境界缺口和卡境状态。
          </p>
        </div>
      </div>

      <form className="rule-config-form" onSubmit={submitRealmRules}>
        <div className="realm-rule-grid">
          {draftRules.map((rule) => (
            <fieldset key={rule.level}>
              <legend>第 {rule.level} 级</legend>
              <label>
                境界名称
                <input
                  value={rule.name}
                  onChange={(event) =>
                    updateRealmRule(rule.level, { name: event.target.value })
                  }
                />
              </label>
              <label>
                总修为门槛
                <input
                  type="number"
                  min="0"
                  value={rule.requiredTotalCultivation}
                  onChange={(event) =>
                    updateRealmRule(rule.level, {
                      requiredTotalCultivation: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                法力门槛
                <input
                  type="number"
                  min="0"
                  value={rule.requiredMana}
                  onChange={(event) =>
                    updateRealmRule(rule.level, {
                      requiredMana: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                神识门槛
                <input
                  type="number"
                  min="0"
                  value={rule.requiredInsight}
                  onChange={(event) =>
                    updateRealmRule(rule.level, {
                      requiredInsight: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="inline-checkbox">
                <input
                  type="checkbox"
                  checked={rule.breakthroughRequired}
                  onChange={(event) =>
                    updateRealmRule(rule.level, {
                      breakthroughRequired: event.target.checked,
                      breakthroughTitle: event.target.checked
                        ? rule.breakthroughTitle ?? `${rule.name}突破`
                        : undefined,
                      breakthroughDescription: event.target.checked
                        ? rule.breakthroughDescription
                        : undefined,
                    })
                  }
                />
                需要突破任务
              </label>
              {rule.breakthroughRequired && (
                <>
                  <label>
                    突破标题
                    <input
                      value={rule.breakthroughTitle ?? ""}
                      onChange={(event) =>
                        updateRealmRule(rule.level, {
                          breakthroughTitle: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    突破说明
                    <textarea
                      value={rule.breakthroughDescription ?? ""}
                      onChange={(event) =>
                        updateRealmRule(rule.level, {
                          breakthroughDescription: event.target.value,
                        })
                      }
                    />
                  </label>
                </>
              )}
            </fieldset>
          ))}
        </div>

        <p className="progress-muted">
          保存后会按新境界规则重新判断首页境界；修炼记录和突破记录本身不会被改写。
        </p>
        {formError && <p className="form-error">{formError}</p>}
        <div className="inline-actions">
          <button type="submit">保存境界规则</button>
          <button className="secondary-button" type="button" onClick={onReset}>
            重置默认
          </button>
        </div>
      </form>
    </section>
  );
}

type JourneySoulRuleSettingsPageProps = {
  journeySoulRule: JourneySoulRule;
  onSave: (journeySoulRule: JourneySoulRule) => void;
  onReset: () => void;
};

function JourneySoulRuleSettingsPage({
  journeySoulRule,
  onSave,
  onReset,
}: JourneySoulRuleSettingsPageProps) {
  const [draftRule, setDraftRule] = useState(journeySoulRule);
  const [maximumSoulGainText, setMaximumSoulGainText] = useState(
    journeySoulRule.maximumSoulGain?.toString() ?? "",
  );
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setDraftRule(journeySoulRule);
    setMaximumSoulGainText(journeySoulRule.maximumSoulGain?.toString() ?? "");
    setFormError("");
  }, [journeySoulRule]);

  function updateJourneyTypeMultiplier(
    journeyType: JourneyType,
    multiplier: number,
  ) {
    setDraftRule((currentRule) => ({
      ...currentRule,
      journeyTypeMultipliers: {
        ...currentRule.journeyTypeMultipliers,
        [journeyType]: multiplier,
      },
    }));
  }

  function submitJourneySoulRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const maximumSoulGain =
      maximumSoulGainText.trim().length === 0
        ? undefined
        : Number(maximumSoulGainText);
    const multipliers = Object.values(draftRule.journeyTypeMultipliers);
    const hasInvalidRule =
      draftRule.soulPerHour < 0 ||
      draftRule.minimumSoulGain < 0 ||
      (maximumSoulGain !== undefined && maximumSoulGain < 0) ||
      multipliers.some((multiplier) => multiplier < 0);

    if (hasInvalidRule) {
      setFormError("神魂规则数值不能小于 0。");
      return;
    }

    if (
      maximumSoulGain !== undefined &&
      maximumSoulGain < draftRule.minimumSoulGain
    ) {
      setFormError("单次最高神魂不能低于单次最低神魂。");
      return;
    }

    onSave({
      ...draftRule,
      maximumSoulGain,
      updatedAt: new Date().toISOString(),
    });
    setFormError("");
  }

  return (
    <section className="page-panel">
      <PageToolbar title="神魂收益规则设置" backTo="/settings" />

      <div className="page-heading">
        <div>
          <p className="intro">
            神魂收益规则属于全局配置，会影响之后新增游历记录的预计神魂和保存神魂。
          </p>
        </div>
      </div>

      <form className="rule-config-form" onSubmit={submitJourneySoulRule}>
        <fieldset>
          <legend>基础换算</legend>
          <label>
            每小时基础神魂
            <input
              type="number"
              min="0"
              step="0.01"
              value={draftRule.soulPerHour}
              onChange={(event) =>
                setDraftRule((currentRule) => ({
                  ...currentRule,
                  soulPerHour: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="inline-checkbox">
            <input
              type="checkbox"
              checked={draftRule.completionRatioEnabled}
              onChange={(event) =>
                setDraftRule((currentRule) => ({
                  ...currentRule,
                  completionRatioEnabled: event.target.checked,
                }))
              }
            />
            本次完成度参与计算
          </label>
          <label>
            单次最低神魂
            <input
              type="number"
              min="0"
              step="0.01"
              value={draftRule.minimumSoulGain}
              onChange={(event) =>
                setDraftRule((currentRule) => ({
                  ...currentRule,
                  minimumSoulGain: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            单次最高神魂
            <input
              type="number"
              min="0"
              step="0.01"
              value={maximumSoulGainText}
              onChange={(event) => setMaximumSoulGainText(event.target.value)}
              placeholder="不填写表示不限制"
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>游历类型倍率</legend>
          <div className="journey-type-rule-grid">
            {journeyTypeOptions.map((journeyType) => (
              <label key={journeyType}>
                {getJourneyTypeLabel(journeyType)}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draftRule.journeyTypeMultipliers[journeyType] ?? 1}
                  onChange={(event) =>
                    updateJourneyTypeMultiplier(
                      journeyType,
                      Number(event.target.value),
                    )
                  }
                />
              </label>
            ))}
          </div>
        </fieldset>

        <p className="progress-muted">
          当前版本只影响未来新增游历记录；已有游历记录的神魂值暂不重算。
        </p>
        {formError && <p className="form-error">{formError}</p>}
        <div className="inline-actions">
          <button type="submit">保存神魂规则</button>
          <button className="secondary-button" type="button" onClick={onReset}>
            重置默认
          </button>
        </div>
      </form>
    </section>
  );
}

type DecayRuleSettingsPageProps = {
  decayRule: DecayRule;
  onSave: (decayRule: DecayRule) => void;
  onReset: () => void;
};

function DecayRuleSettingsPage({
  decayRule,
  onSave,
  onReset,
}: DecayRuleSettingsPageProps) {
  const [draftRule, setDraftRule] = useState(decayRule);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setDraftRule(decayRule);
    setFormError("");
  }, [decayRule]);

  function submitDecayRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      draftRule.reminderLeadDays < 0 ||
      draftRule.warningDaysAfterDue < 0 ||
      draftRule.decayDaysAfterDue < 0
    ) {
      setFormError("退化提醒规则数值不能小于 0。");
      return;
    }

    if (draftRule.decayDaysAfterDue < draftRule.warningDaysAfterDue) {
      setFormError("已退化天数不能早于遗忘警告天数。");
      return;
    }

    onSave({
      ...draftRule,
      updatedAt: new Date().toISOString(),
    });
    setFormError("");
  }

  return (
    <section className="page-panel">
      <PageToolbar title="退化规则设置" backTo="/settings" />

      <div className="page-heading">
        <div>
          <p className="intro">
            当前退化规则只生成复习提醒和退化状态，不扣经验，也不改写历史记录。
          </p>
        </div>
      </div>

      <form className="rule-config-form" onSubmit={submitDecayRule}>
        <fieldset>
          <legend>提醒规则</legend>
          <label className="inline-checkbox">
            <input
              type="checkbox"
              checked={draftRule.enabled}
              onChange={(event) =>
                setDraftRule((currentRule) => ({
                  ...currentRule,
                  enabled: event.target.checked,
                }))
              }
            />
            启用退化提醒
          </label>
          <label>
            首页提前提醒天数
            <input
              type="number"
              min="0"
              step="1"
              value={draftRule.reminderLeadDays}
              onChange={(event) =>
                setDraftRule((currentRule) => ({
                  ...currentRule,
                  reminderLeadDays: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            逾期警告天数
            <input
              type="number"
              min="0"
              step="1"
              value={draftRule.warningDaysAfterDue}
              onChange={(event) =>
                setDraftRule((currentRule) => ({
                  ...currentRule,
                  warningDaysAfterDue: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            已退化天数
            <input
              type="number"
              min="0"
              step="1"
              value={draftRule.decayDaysAfterDue}
              onChange={(event) =>
                setDraftRule((currentRule) => ({
                  ...currentRule,
                  decayDaysAfterDue: Number(event.target.value),
                }))
              }
            />
          </label>
        </fieldset>

        <p className="progress-muted">
          复习记录、练习记录或其它非测试修炼记录会重新派生下一次复习时间；本设置只决定何时提醒和何时标记退化。
        </p>
        {formError && <p className="form-error">{formError}</p>}
        <div className="inline-actions">
          <button type="submit">保存退化规则</button>
          <button className="secondary-button" type="button" onClick={onReset}>
            重置默认
          </button>
        </div>
      </form>
    </section>
  );
}

type ReviewRemindersPageProps = {
  reviewReminders: ReviewReminder[];
  decayRule: DecayRule;
};

function ReviewRemindersPage({
  reviewReminders,
  decayRule,
}: ReviewRemindersPageProps) {
  return (
    <section className="page-panel">
      <PageToolbar title="待复习列表" backTo="/" />

      <div className="page-heading">
        <div>
          <p className="intro">
            这里展示所有已经生成下一次复习时间的知识点。首页只取临近{" "}
            {decayRule.reminderLeadDays} 天和已逾期的项目。
          </p>
        </div>
        <Link className="button-link" to="/settings/decay-rule">
          调整退化规则
        </Link>
      </div>

      <div className="record-list">
        {reviewReminders.length > 0 ? (
          reviewReminders.map((reminder) => {
            const sect = defaultSects.find((item) => item.id === reminder.sectId);
            const technique = defaultTechniques.find(
              (item) => item.id === reminder.techniqueId,
            );

            return (
              <article className="record-card" key={reminder.knowledgePointId}>
                <span>
                  {getReviewReminderStatusLabel(reminder.reminderStatus)} ·{" "}
                  {getReviewReminderTimeLabel(reminder.daysUntilReview)}
                </span>
                <h3>{reminder.knowledgePointName}</h3>
                <p>
                  {sect?.name ?? reminder.sectId} /{" "}
                  {technique?.name ?? reminder.techniqueId} /{" "}
                  {reminder.chapterName}
                </p>
                <dl>
                  <div>
                    <dt>进度</dt>
                    <dd>{formatPercent(reminder.progressRatio)}</dd>
                  </div>
                  <div>
                    <dt>复习状态</dt>
                    <dd>{getReviewStatusLabel(reminder.reviewStatus)}</dd>
                  </div>
                  <div>
                    <dt>下次复习</dt>
                    <dd>{new Date(reminder.nextReviewAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </article>
            );
          })
        ) : (
          <p className="progress-muted">当前还没有待复习知识点。</p>
        )}
      </div>
    </section>
  );
}

function getDraftStatusLabel(status: TechniquePlanDraft["status"]): string {
  switch (status) {
    case "draft":
      return "草案";
    case "confirmed":
      return "已确认";
    case "imported":
      return "已导入";
    case "discarded":
      return "已放弃";
  }
}

function getTechniqueCreationStageLabel(
  stage: TechniqueCreationDraft["stage"],
): string {
  switch (stage) {
    case "input_pending":
      return "待填写";
    case "structure_ready":
      return "待确认大章";
    case "units_pending":
      return "待生成单元";
    case "units_ready":
      return "待确认单元";
    case "knowledge_pending":
      return "待生成知识点";
    case "knowledge_ready":
      return "待确认知识点";
    case "ready_to_import":
      return "可以导入";
  }
}

function getTechniqueCreationEditPath(
  draft: TechniqueCreationDraft,
): string {
  const projectId = draft.projectId ?? "";

  if (draft.stage === "input_pending" || draft.stage === "structure_ready") {
    return `/ai-drafts/projects/${projectId}/chapters`;
  }
  if (draft.stage === "units_pending" || draft.stage === "units_ready") {
    return `/ai-drafts/projects/${projectId}/units`;
  }

  return `/ai-drafts/projects/${projectId}/knowledge`;
}

type DraftCompletionItem = {
  id: string;
  label: string;
  completed: boolean;
  pendingText: string;
};

function getTechniqueDraftCompletionItems(
  draft: TechniqueCreationDraft,
): DraftCompletionItem[] {
  const includedChapters = draft.chapterDrafts.filter(
    (chapter) => chapter.unitGenerationConfig.includeInGeneration,
  );
  const includedUnits = includedChapters.flatMap((chapter) =>
    chapter.unitDrafts.filter(
      (unit) => unit.knowledgeGenerationConfig.includeInGeneration,
    ),
  );
  const techniqueDraft = draft.techniqueDraft;
  const basicInformationCompleted = Boolean(
    techniqueDraft?.name.trim() &&
      techniqueDraft.description.trim() &&
      techniqueDraft.courseValueCoefficientSuggestion >= 0.5 &&
      techniqueDraft.courseValueCoefficientSuggestion <= 2,
  );
  const rulesCompleted = Boolean(
    draft.practiceDefaultsDraft &&
      techniqueDraft &&
      draft.layerRuleDrafts.length === techniqueDraft.maxLayer,
  );
  const chaptersCompleted =
    draft.chapterDrafts.length > 0 &&
    draft.chapterDrafts.every(
      (chapter) => chapter.code.trim() && chapter.name.trim(),
    );
  const unitsCompleted =
    includedChapters.length > 0 &&
    includedChapters.every((chapter) => chapter.unitDrafts.length > 0);
  const knowledgeCompleted =
    unitsCompleted &&
    includedUnits.length > 0 &&
    includedUnits.every((unit) => unit.knowledgePointDrafts.length > 0);
  const validationCompleted = !draft.validationIssues.some(
    (issue) => issue.severity === "error",
  );

  return [
    {
      id: "basic",
      label: "基本信息",
      completed: basicInformationCompleted,
      pendingText: "补全功法名称、说明或课程体量系数",
    },
    {
      id: "rules",
      label: "功法规则",
      completed: rulesCompleted,
      pendingText: "补全修炼默认规则和全部层数规则",
    },
    {
      id: "chapters",
      label: "大章结构",
      completed: chaptersCompleted,
      pendingText: "补全大章名称和唯一代码",
    },
    {
      id: "units",
      label: "单元结构",
      completed: unitsCompleted,
      pendingText: "为所有参与生成的大章确认单元",
    },
    {
      id: "knowledge",
      label: "知识点",
      completed: knowledgeCompleted,
      pendingText: "为所有参与生成的单元确认知识点",
    },
    {
      id: "validation",
      label: "完整校验",
      completed: validationCompleted,
      pendingText: "处理阻断导入的校验错误",
    },
  ];
}

function DraftCompletionPanel({ draft }: { draft: TechniqueCreationDraft }) {
  const items = getTechniqueDraftCompletionItems(draft);
  const completedCount = items.filter((item) => item.completed).length;
  const pendingItems = items.filter((item) => !item.completed);

  return (
    <section className="draft-completion" aria-label="草案完成度">
      <div className="draft-completion-heading">
        <strong>草案完成度</strong>
        <span>
          {completedCount} / {items.length}
        </span>
      </div>
      <progress value={completedCount} max={items.length} />
      <div className="draft-completion-items">
        {items.map((item) => (
          <span
            className={item.completed ? "is-completed" : "is-pending"}
            key={item.id}
          >
            {item.completed ? "已完成" : "待完成"} · {item.label}
          </span>
        ))}
      </div>
      {pendingItems.length > 0 && (
        <p>{pendingItems.map((item) => item.pendingText).join("；")}。</p>
      )}
    </section>
  );
}

type AiDraftsOverviewPageProps = {
  requests: AiDraftRequest[];
  drafts: TechniquePlanDraft[];
  creationDrafts: TechniqueCreationDraft[];
  importMappings: TechniqueImportMappingRecord[];
  onDeleteDraft: (draftId: string) => void;
};

function AiDraftsOverviewPage({
  requests,
  drafts,
  creationDrafts,
  importMappings,
  onDeleteDraft,
}: AiDraftsOverviewPageProps) {
  const requestById = new Map(requests.map((request) => [request.id, request]));

  return (
    <section className="page-panel">
      <PageToolbar title="AI 草案总览" backTo="/" />

      <div className="page-heading">
        <div>
          <p className="intro">
            AI 草案先作为可编辑版本保存，确认前不会写入正式功法或知识点。
          </p>
        </div>
        <div className="inline-actions">
          <Link className="button-link secondary-link" to="/ai-drafts/import-records">
            导入记录{importMappings.length > 0 ? `（${importMappings.length}）` : ""}
          </Link>
          <Link className="button-link" to="/ai-drafts/new">
            新建 AI 草案
          </Link>
        </div>
      </div>

      <div className="draft-card-grid">
        {creationDrafts.map((draft) => {
          const sect = defaultSects.find(
            (item) => item.id === draft.input.target.sectId,
          );
          const unitCount = draft.chapterDrafts.reduce(
            (total, chapter) => total + chapter.unitDrafts.length,
            0,
          );

          return (
            <article className="settings-card" key={`project-${draft.id}`}>
              <div>
                <span>
                  {getTechniqueCreationStageLabel(draft.stage)} ·{" "}
                  {sect?.name ?? draft.input.target.sectId}
                </span>
                <h2>{draft.techniqueDraft?.name ?? draft.input.techniqueName}</h2>
                <p>{draft.input.learningGoal}</p>
                <p>
                  {draft.chapterDrafts.length} 个大章 · {unitCount} 个单元
                </p>
                <DraftCompletionPanel draft={draft} />
              </div>
              <div className="inline-actions">
                <Link
                  className="button-link"
                  to={getTechniqueCreationEditPath(draft)}
                >
                  继续编辑
                </Link>
                <Link
                  className="button-link secondary-link"
                  to={`/ai-drafts/projects/${draft.projectId}/rules`}
                >
                  功法规则
                </Link>
              </div>
            </article>
          );
        })}

        {drafts.map((draft) => {
            const request = draft.requestId
              ? requestById.get(draft.requestId)
              : undefined;
            const sect = defaultSects.find((item) => item.id === draft.sectId);

            return (
              <article className="settings-card" key={`legacy-${draft.id}`}>
                <div>
                  <span>
                    {getDraftStatusLabel(draft.status)} ·{" "}
                    {sect?.name ?? draft.sectId}
                  </span>
                  <h2>{draft.techniqueName}</h2>
                  <p>{request?.learningGoal || draft.sourceText}</p>
                  <p>{draft.knowledgePointDrafts.length} 个知识点草案</p>
                </div>
                <div className="inline-actions">
                  <Link className="button-link" to={`/ai-drafts/${draft.id}`}>
                    编辑草案
                  </Link>
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => onDeleteDraft(draft.id)}
                  >
                    删除
                  </button>
                </div>
              </article>
            );
          })}

        {creationDrafts.length === 0 && drafts.length === 0 && (
          <p className="progress-muted">当前还没有 AI 草案。</p>
        )}
      </div>
    </section>
  );
}

function TechniqueImportRecordsPage({
  repository,
}: {
  repository: CultivationStructureRepository;
}) {
  const records = [...repository.importMappings].sort((first, second) =>
    second.importedAt.localeCompare(first.importedAt),
  );

  return (
    <section className="page-panel">
      <PageToolbar title="AI 导入记录" backTo="/ai-drafts" />
      <div className="page-heading">
        <div>
          <p className="intro">记录每次已完成导入采用的草案版本、确认内容与正式实体映射。</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="empty-stage">
          <p>当前还没有完成的 AI 导入记录。</p>
        </div>
      ) : (
        <div className="import-action-list">
          {records.map((record) => {
            const technique = repository.techniques.find(
              (item) => item.id === record.formalTechniqueId,
            );
            const actionCounts = record.actionSnapshot.reduce(
              (counts, action) => ({
                ...counts,
                [action.action]: (counts[action.action] ?? 0) + 1,
              }),
              {} as Partial<Record<TechniqueImportAction["action"], number>>,
            );

            return (
              <details className="import-action-item" key={record.id}>
                <summary>
                  <span className="import-action-badge is-create">已导入</span>
                  <strong>{technique?.name ?? record.formalTechniqueId}</strong>
                  <span className="progress-muted">
                    {new Date(record.importedAt).toLocaleString("zh-CN")}
                  </span>
                </summary>
                <div className="import-action-detail">
                  <p>草案项目：<code>{record.projectId}</code></p>
                  {record.variantId && <p>草案版本：<code>{record.variantId}</code></p>}
                  <p>
                    已确认 {record.confirmedActionIds.length} 项覆盖动作 · 已接受 {record.acceptedIssueIds.length} 项警告
                  </p>
                  <p>
                    {Object.entries(actionCounts)
                      .map(([action, count]) => `${getImportActionLabel(action as TechniqueImportAction["action"])} ${count}`)
                      .join(" · ")}
                  </p>
                  <details>
                    <summary>查看草案与正式实体映射（{record.entityMappings.length}）</summary>
                    <ul className="detail-list">
                      {record.entityMappings.map((mapping) => (
                        <li key={`${mapping.entityType}-${mapping.draftEntityId}`}>
                          {getImportEntityLabel(mapping.entityType)}：<code>{mapping.draftEntityId}</code> → <code>{mapping.formalEntityId}</code>
                        </li>
                      ))}
                    </ul>
                  </details>
                  <details>
                    <summary>查看导入动作快照（{record.actionSnapshot.length}）</summary>
                    <ul className="detail-list">
                      {record.actionSnapshot.map((action) => (
                        <li key={action.id}>
                          {getImportActionLabel(action.action)} · {getImportEntityLabel(action.entityType)} · {action.label}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}

type TechniqueCreationInputPageProps = {
  onCreateProject: (
    input: TechniqueCreationInput,
    onProgress?: (phase: "waiting" | "validating" | "saving") => void,
  ) => Promise<{
    projectId: string;
    variantId: string;
  }>;
};

function TechniqueCreationInputPage({
  onCreateProject,
}: TechniqueCreationInputPageProps) {
  const { sectId } = useParams();
  const navigate = useNavigate();
  const creationSectOptions = defaultSects.filter(
    (sect) => !sect.isSystem || sect.id === SYSTEM_STANDALONE_SECT_ID,
  );
  const initialSectId = creationSectOptions.some(
    (sect) => sect.id === sectId,
  )
    ? sectId ?? creationSectOptions[0]?.id ?? ""
    : creationSectOptions[0]?.id ?? "";
  const [selectedSectId, setSelectedSectId] = useState(initialSectId);
  const [techniqueName, setTechniqueName] = useState("");
  const [sourceType, setSourceType] =
    useState<TechniqueCreationSourceType>("table_of_contents");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceContent, setSourceContent] = useState("");
  const [learningGoalType, setLearningGoalType] =
    useState<TechniqueCreationInput["learningGoalType"]>(
      "systematic_learning",
    );
  const [learningGoal, setLearningGoal] = useState("");
  const [targetLayer, setTargetLayer] = useState(6);
  const [experienceBudgetReferenceLayer, setExperienceBudgetReferenceLayer] = useState(6);
  const [experienceBudgetTotal, setExperienceBudgetTotal] = useState("360000");
  const [currentLevel, setCurrentLevel] = useState("");
  const [studyPeriodWeeks, setStudyPeriodWeeks] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [assessmentForm, setAssessmentForm] = useState("");
  const [focusText, setFocusText] = useState("");
  const [excludedContent, setExcludedContent] = useState("");
  const [referenceTechniqueId, setReferenceTechniqueId] = useState("");
  const [preferredManaWeight, setPreferredManaWeight] = useState("");
  const [preferredInsightWeight, setPreferredInsightWeight] = useState("");
  const [preferredSoulWeight, setPreferredSoulWeight] = useState("");
  const [requirementText, setRequirementText] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<UnitGenerationProgress>();
  const [createdProjectId, setCreatedProjectId] = useState<string>();

  function parseOptionalNumber(value: string): number | undefined {
    return value.trim() === "" ? undefined : Number(value);
  }

  async function submitCreationInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (techniqueName.trim() === "") {
      setFormError("请填写功法名称。");
      return;
    }
    if (techniqueName.trim().length > 80) {
      setFormError("功法名称不能超过 80 个字。");
      return;
    }
    if (sourceContent.trim() === "") {
      setFormError("请至少填写一项教材、目录、考纲或课程范围。");
      return;
    }
    if (learningGoal.trim() === "") {
      setFormError("请填写具体学习目标。");
      return;
    }
    if (learningGoal.trim().length < 10) {
      setFormError("具体学习目标至少需要 10 个字，以便限定生成方向。");
      return;
    }

    const parsedStudyPeriodWeeks = parseOptionalNumber(studyPeriodWeeks);
    const parsedWeeklyHours = parseOptionalNumber(weeklyHours);
    const parsedExperienceBudgetTotal = parseOptionalNumber(experienceBudgetTotal);
    if (
      parsedStudyPeriodWeeks !== undefined &&
      (parsedStudyPeriodWeeks < 1 || parsedStudyPeriodWeeks > 260)
    ) {
      setFormError("学习周期需要填写 1 到 260 之间的周数。");
      return;
    }
    if (
      parsedWeeklyHours !== undefined &&
      (parsedWeeklyHours < 0.5 || parsedWeeklyHours > 80)
    ) {
      setFormError("每周投入需要填写 0.5 到 80 之间的小时数。");
      return;
    }

    const optionalWeights = [
      preferredManaWeight,
      preferredInsightWeight,
      preferredSoulWeight,
    ]
      .map(parseOptionalNumber)
      .filter((value): value is number => value !== undefined);
    if (optionalWeights.some((value) => value < 0 || value > 1)) {
      setFormError("法力、神识和神魂倾向需要填写 0 到 1 之间的数值。");
      return;
    }
    if (!parsedExperienceBudgetTotal || !Number.isInteger(parsedExperienceBudgetTotal) || parsedExperienceBudgetTotal < 1 || parsedExperienceBudgetTotal > 10_000_000) {
      setFormError("目标总经验需要填写 1 到 10000000 之间的整数。");
      return;
    }

    const input: TechniqueCreationInput = {
      target: {
        mode: "create_new",
        sectId: selectedSectId,
      },
      techniqueName: techniqueName.trim(),
      sources: [
        {
          id: crypto.randomUUID(),
          sourceType,
          title: sourceTitle.trim() || undefined,
          content: sourceContent.trim(),
        },
      ],
      learningGoalType,
      learningGoal: learningGoal.trim(),
      targetLayer,
      experienceBudgetReferenceLayer,
      experienceBudgetTotal: parsedExperienceBudgetTotal,
      currentLevel: currentLevel.trim() || undefined,
      studyPeriodWeeks: parsedStudyPeriodWeeks,
      weeklyHours: parsedWeeklyHours,
      assessmentForm: assessmentForm.trim() || undefined,
      focusText: focusText.trim() || undefined,
      excludedContent: excludedContent.trim() || undefined,
      referenceTechniqueId: referenceTechniqueId || undefined,
      preferredManaWeight: parseOptionalNumber(preferredManaWeight),
      preferredInsightWeight: parseOptionalNumber(preferredInsightWeight),
      preferredSoulWeight: parseOptionalNumber(preferredSoulWeight),
      requirementText: requirementText.trim() || undefined,
    };
    let completedStepCount = 0;
    try {
      setIsCreating(true);
      setGenerationProgress({ phase: "preparing", detail: "正在整理功法信息和材料内容。" });
      const mutation = await onCreateProject(input, (phase) => {
        completedStepCount = unitGenerationSteps.findIndex(
          (step) => step.phase === phase,
        );
        setGenerationProgress({
          phase,
          completedStepCount,
          detail:
            phase === "waiting"
              ? "AI 正在生成基本规则和大章，请耐心等待。"
              : phase === "validating"
                ? "AI 已返回，正在检查大章结构是否可用。"
                : "大章结构校验通过，正在保存草案项目。",
        });
      });
      setFormError("");
      setGenerationProgress({
        phase: "success",
        completedStepCount: unitGenerationSteps.length,
        detail: "基本规则和大章已生成。确认后进入大章确认页面。",
      });
      setCreatedProjectId(mutation.projectId);
    } catch (error) {
      setGenerationProgress({
        phase: "error",
        completedStepCount,
        detail: error instanceof Error ? error.message : "生成草案失败。",
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="page-panel">
      {generationProgress && (
        <UnitGenerationProgressDialog
          progress={generationProgress}
          onConfirm={() => {
            const projectId = createdProjectId;
            setGenerationProgress(undefined);
            setCreatedProjectId(undefined);
            if (projectId) {
              navigate(`/ai-drafts/projects/${projectId}/chapters`);
            }
          }}
        />
      )}
      <PageToolbar title="创建功法草案" backTo="/ai-drafts" />

      <div className="page-heading">
        <p className="intro">
          第一阶段只生成基本规则和大章结构，确认大章后再继续生成单元。
        </p>
      </div>

      <form className="rule-config-form" onSubmit={submitCreationInput}>
        <fieldset>
          <legend>必要信息</legend>
          <div className="creation-form-grid">
            <label>
              目标归属
              <select
                name="sectId"
                value={selectedSectId}
                onChange={(event) => setSelectedSectId(event.target.value)}
              >
                {creationSectOptions.map((sect) => (
                  <option key={sect.id} value={sect.id}>
                    {sect.id === SYSTEM_STANDALONE_SECT_ID
                      ? "独立知识（无门派归属）"
                      : sect.name}
                  </option>
                ))}
              </select>
              <FieldReference standardKey="sectId" />
            </label>
            <label>
              功法名称
              <input
                name="techniqueName"
                value={techniqueName}
                onChange={(event) => setTechniqueName(event.target.value)}
                placeholder="例如：梅家强数学分析"
                maxLength={80}
              />
              <FieldReference standardKey="techniqueName" />
            </label>
            <label>
              内容依据类型
              <select
                name="sourceType"
                value={sourceType}
                onChange={(event) =>
                  setSourceType(
                    event.target.value as TechniqueCreationSourceType,
                  )
                }
              >
                <option value="table_of_contents">教材目录</option>
                <option value="textbook">教材说明</option>
                <option value="syllabus">教学大纲</option>
                <option value="exam_scope">考试范围</option>
                <option value="custom">自定义范围</option>
                <option value="file_extract">文件解析文本</option>
              </select>
              <FieldReference standardKey="sourceType" />
            </label>
            <label>
              材料名称
              <input
                name="sourceTitle"
                value={sourceTitle}
                onChange={(event) => setSourceTitle(event.target.value)}
                placeholder="例如：数学分析第一册目录"
                maxLength={120}
              />
              <FieldReference standardKey="sourceTitle" />
            </label>
            <label className="full-width-field">
              教材、目录、考纲或课程范围
              <textarea
                name="sourceContent"
                value={sourceContent}
                onChange={(event) => setSourceContent(event.target.value)}
              />
              <FieldReference
                standardKey="sourceContent"
                preview={
                  sourceContent.trim().length > 0 &&
                  sourceContent.trim().length < 50
                    ? "当前内容较短，生成结果可能偏笼统。"
                    : undefined
                }
              />
            </label>
            <label>
              学习目标类型
              <select
                name="learningGoalType"
                value={learningGoalType}
                onChange={(event) =>
                  setLearningGoalType(
                    event.target
                      .value as TechniqueCreationInput["learningGoalType"],
                  )
                }
              >
                <option value="systematic_learning">系统学习</option>
                <option value="exam_preparation">考试准备</option>
                <option value="project_output">项目输出</option>
                <option value="skill_training">能力训练</option>
                <option value="custom">自定义目标</option>
              </select>
              <FieldReference standardKey="learningGoalType" />
            </label>
            <label>
              目标层数
              <select
                name="targetLayer"
                value={targetLayer}
                onChange={(event) => setTargetLayer(Number(event.target.value))}
              >
                {Array.from({ length: 6 }, (_, index) => index + 1).map(
                  (layer) => (
                    <option key={layer} value={layer}>
                      第 {layer} 层
                    </option>
                  ),
                )}
              </select>
              <FieldReference standardKey="targetLayer" />
            </label>
            <label>
              总经验参照
              <select value={experienceBudgetReferenceLayer} onChange={(event) => {
                const layer = Number(event.target.value);
                setExperienceBudgetReferenceLayer(layer);
                setExperienceBudgetTotal(String(MATH_ANALYSIS_CUMULATIVE_EXPERIENCE[layer - 1]));
              }}>
                {MATH_ANALYSIS_CUMULATIVE_EXPERIENCE.map((value, index) => <option key={value} value={index + 1}>数学分析第 {index + 1} 层：{value.toLocaleString()}</option>)}
              </select>
            </label>
            <label>
              目标总经验
              <input type="number" min="1" max="10000000" step="1" value={experienceBudgetTotal} onChange={(event) => setExperienceBudgetTotal(event.target.value)} />
            </label>
            <label className="full-width-field">
              具体学习目标
              <textarea
                name="learningGoal"
                value={learningGoal}
                onChange={(event) => setLearningGoal(event.target.value)}
                maxLength={1000}
              />
              <FieldReference standardKey="learningGoal" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>补充信息</legend>
          <div className="creation-form-grid">
            <label>
              当前基础
              <input
                name="currentLevel"
                value={currentLevel}
                onChange={(event) => setCurrentLevel(event.target.value)}
              />
              <FieldReference standardKey="currentLevel" />
            </label>
            <label>
              学习周期（周）
              <input
                name="studyPeriodWeeks"
                type="number"
                min="1"
                max="260"
                step="1"
                value={studyPeriodWeeks}
                onChange={(event) => setStudyPeriodWeeks(event.target.value)}
              />
              <FieldReference
                standardKey="studyPeriodWeeks"
                preview={
                  studyPeriodWeeks
                    ? `当前计划约 ${studyPeriodWeeks} 周。`
                    : undefined
                }
              />
            </label>
            <label>
              每周投入（小时）
              <input
                name="weeklyHours"
                type="number"
                min="0.5"
                max="80"
                step="0.5"
                value={weeklyHours}
                onChange={(event) => setWeeklyHours(event.target.value)}
              />
              <FieldReference
                standardKey="weeklyHours"
                preview={
                  studyPeriodWeeks && weeklyHours
                    ? `预计总投入约 ${Math.round(
                        Number(studyPeriodWeeks) * Number(weeklyHours),
                      )} 小时。`
                    : undefined
                }
              />
            </label>
            <label>
              考试或成果形式
              <input
                name="assessmentForm"
                value={assessmentForm}
                onChange={(event) => setAssessmentForm(event.target.value)}
                maxLength={200}
              />
              <FieldReference standardKey="assessmentForm" />
            </label>
            <label>
              参考功法
              <select
                name="referenceTechniqueId"
                value={referenceTechniqueId}
                onChange={(event) =>
                  setReferenceTechniqueId(event.target.value)
                }
              >
                <option value="">使用系统基准</option>
                {visibleDefaultTechniques
                  .filter((technique) => technique.sectId === selectedSectId)
                  .map((technique) => (
                    <option key={technique.id} value={technique.id}>
                      {technique.name}
                    </option>
                  ))}
              </select>
              <FieldReference standardKey="referenceTechniqueId" />
            </label>
            <label>
              法力倾向
              <input
                name="preferredManaWeight"
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={preferredManaWeight}
                onChange={(event) =>
                  setPreferredManaWeight(event.target.value)
                }
              />
              <FieldReference standardKey="tendencyWeight" />
            </label>
            <label>
              神识倾向
              <input
                name="preferredInsightWeight"
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={preferredInsightWeight}
                onChange={(event) =>
                  setPreferredInsightWeight(event.target.value)
                }
              />
              <FieldReference standardKey="tendencyWeight" />
            </label>
            <label>
              神魂倾向
              <input
                name="preferredSoulWeight"
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={preferredSoulWeight}
                onChange={(event) =>
                  setPreferredSoulWeight(event.target.value)
                }
              />
              <FieldReference standardKey="tendencyWeight" />
            </label>
            <label className="full-width-field">
              重点内容
              <textarea
                name="focusText"
                value={focusText}
                onChange={(event) => setFocusText(event.target.value)}
                maxLength={1000}
              />
              <FieldReference standardKey="scopeText" />
            </label>
            <label className="full-width-field">
              排除内容
              <textarea
                name="excludedContent"
                value={excludedContent}
                onChange={(event) => setExcludedContent(event.target.value)}
                maxLength={1000}
              />
              <FieldReference standardKey="scopeText" />
            </label>
            <label className="full-width-field">
              其他生成要求
              <textarea
                name="requirementText"
                value={requirementText}
                onChange={(event) => setRequirementText(event.target.value)}
                maxLength={1000}
              />
              <FieldReference standardKey="scopeText" />
            </label>
          </div>
        </fieldset>

        {formError && <p className="form-error">{formError}</p>}
        <div className="inline-actions">
          <button type="submit" disabled={isCreating}>
            {isCreating ? "正在生成..." : "生成基本规则和大章"}
          </button>
          <Link className="button-link secondary-link" to="/ai-drafts">
            取消
          </Link>
        </div>
      </form>
    </section>
  );
}

type TechniqueStructureConfirmationRouteProps = {
  repository: TechniqueCreationDraftRepository;
  onSaveStructure: (draft: TechniqueCreationDraft) => {
    projectId: string;
    variantId: string;
  };
};

function TechniqueStructureConfirmationRoute({
  repository,
  onSaveStructure,
}: TechniqueStructureConfirmationRouteProps) {
  const { projectId } = useParams();
  const draft = projectId
    ? materializeTechniqueCreationDraft(repository, projectId)
    : undefined;

  if (!draft) {
    return <Navigate to="/ai-drafts" replace />;
  }

  return (
    <TechniqueStructureConfirmationPage
      draft={draft}
      onSaveStructure={onSaveStructure}
    />
  );
}

type TechniqueStructureConfirmationPageProps = {
  draft: TechniqueCreationDraft;
  onSaveStructure: (draft: TechniqueCreationDraft) => {
    projectId: string;
    variantId: string;
  };
};

function TechniqueStructureConfirmationPage({
  draft,
  onSaveStructure,
}: TechniqueStructureConfirmationPageProps) {
  const navigate = useNavigate();
  const [draftState, setDraftState] = useState(() => structuredClone(draft));
  const [saveMessage, setSaveMessage] = useState("");
  const sect = defaultSects.find(
    (item) => item.id === draftState.input.target.sectId,
  );

  useEffect(() => {
    setDraftState(structuredClone(draft));
  }, [draft]);

  function updateChapter(
    chapterIndex: number,
    patch: Partial<TechniqueChapterDraft>,
  ) {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      chapterDrafts: currentDraft.chapterDrafts.map((chapter, index) =>
        index === chapterIndex ? { ...chapter, ...patch } : chapter,
      ),
    }));
    setSaveMessage("");
  }

  function updateChapterDetailLevel(
    chapterIndex: number,
    detailLevel: KnowledgeGranularity | "custom",
  ) {
    const chapter = draftState.chapterDrafts[chapterIndex];
    const currentConfig = chapter.unitGenerationConfig;
    const commonConfig = {
      includeInGeneration: currentConfig.includeInGeneration,
      focusText: currentConfig.focusText,
      excludedContent: currentConfig.excludedContent,
      organizationRequirement: currentConfig.organizationRequirement,
      requirementText: currentConfig.requirementText,
    };
    const targetCount =
      currentConfig.targetCount ?? chapter.recommendedUnitCountRange?.min ?? 1;

    updateChapter(chapterIndex, {
      unitGenerationConfig:
        detailLevel === "custom"
          ? { ...commonConfig, detailLevel, targetCount }
          : { ...commonConfig, detailLevel },
    });
  }

  function updateChapterTargetCount(
    chapterIndex: number,
    targetCount: number | undefined,
  ) {
    const chapter = draftState.chapterDrafts[chapterIndex];
    const config = chapter.unitGenerationConfig;
    const commonConfig = {
      includeInGeneration: config.includeInGeneration,
      focusText: config.focusText,
      excludedContent: config.excludedContent,
      organizationRequirement: config.organizationRequirement,
      requirementText: config.requirementText,
    };

    updateChapter(chapterIndex, {
      unitGenerationConfig:
        config.detailLevel === "custom"
          ? {
              ...commonConfig,
              detailLevel: "custom",
              targetCount: Math.max(1, targetCount ?? 1),
            }
          : {
              ...commonConfig,
              detailLevel: config.detailLevel,
              targetCount:
                targetCount === undefined
                  ? undefined
                  : Math.max(1, targetCount),
            },
    });
  }

  function moveChapter(chapterIndex: number, direction: -1 | 1) {
    const targetIndex = chapterIndex + direction;
    if (targetIndex < 0 || targetIndex >= draftState.chapterDrafts.length) {
      return;
    }

    setDraftState((currentDraft) => {
      const chapterDrafts = [...currentDraft.chapterDrafts];
      const [chapter] = chapterDrafts.splice(chapterIndex, 1);
      chapterDrafts.splice(targetIndex, 0, chapter);

      return {
        ...currentDraft,
        chapterDrafts: chapterDrafts.map((item, index) => ({
          ...item,
          order: index + 1,
        })),
      };
    });
    setSaveMessage("");
  }

  function addChapter() {
    setDraftState((currentDraft) => {
      const nextOrder = currentDraft.chapterDrafts.length + 1;
      const chapter: TechniqueChapterDraft = {
        draftId: crypto.randomUUID(),
        code: `ch${String(nextOrder).padStart(2, "0")}`,
        name: "新大章",
        description: "",
        order: nextOrder,
        learningObjectives: [],
        recommendedUnitDetailLevel: "normal",
        recommendedUnitCountRange: { min: 3, max: 6 },
        unitGenerationConfig: {
          includeInGeneration: true,
          detailLevel: "normal",
        },
        unitDrafts: [],
      };

      return {
        ...currentDraft,
        chapterDrafts: [...currentDraft.chapterDrafts, chapter],
      };
    });
    setSaveMessage("");
  }

  function deleteChapter(chapterIndex: number) {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      chapterDrafts: currentDraft.chapterDrafts
        .filter((_, index) => index !== chapterIndex)
        .map((chapter, index) => ({ ...chapter, order: index + 1 })),
    }));
    setSaveMessage("");
  }

  function submitStructure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitIntent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute(
      "value",
    );
    if (!draftState.techniqueDraft) {
      return;
    }
    if (draftState.techniqueDraft.name.trim() === "") {
      setSaveMessage("功法名称不能为空。");
      return;
    }
    if (
      draftState.techniqueDraft.courseValueCoefficientSuggestion < 0.5 ||
      draftState.techniqueDraft.courseValueCoefficientSuggestion > 2
    ) {
      setSaveMessage("课程体量系数需要填写 0.50 到 2.00 之间的数值。");
      return;
    }
    if (
      !Number.isInteger(draftState.techniqueDraft.maxLayer) ||
      draftState.techniqueDraft.maxLayer < 1 ||
      draftState.techniqueDraft.maxLayer > 6
    ) {
      setSaveMessage("最高规划层数需要填写 1 到 6 之间的整数。");
      return;
    }
    if (
      [
        draftState.techniqueDraft.manaWeight,
        draftState.techniqueDraft.insightWeight,
        draftState.techniqueDraft.soulWeight,
      ].some((weight) => weight < 0 || weight > 1)
    ) {
      setSaveMessage("法力、神识和神魂权重需要填写 0 到 1 之间的数值。");
      return;
    }
    if (
      draftState.chapterDrafts.length === 0 ||
      draftState.chapterDrafts.some((chapter) => chapter.name.trim() === "")
    ) {
      setSaveMessage("至少保留一个具有名称的大章。");
      return;
    }
    if (
      draftState.chapterDrafts.some(
        (chapter) => chapter.code.trim() === "",
      ) ||
      new Set(
        draftState.chapterDrafts.map((chapter) => chapter.code.trim()),
      ).size !== draftState.chapterDrafts.length
    ) {
      setSaveMessage("每个大章都需要填写不重复的章节代码。");
      return;
    }
    if (
      !draftState.chapterDrafts.some(
        (chapter) => chapter.unitGenerationConfig.includeInGeneration,
      )
    ) {
      setSaveMessage("至少选择一个需要继续生成单元的大章。");
      return;
    }

    const chapterDrafts = draftState.chapterDrafts.map((chapter, index) => ({
      ...chapter,
      code: chapter.code.trim(),
      name: chapter.name.trim(),
      description: chapter.description.trim(),
      order: index + 1,
    }));
    const hasGeneratedUnits = chapterDrafts.some(
      (chapter) => chapter.unitDrafts.length > 0,
    );
    const unitStage = resolveUnitsStage(chapterDrafts);
    const laterStage = [
      "knowledge_pending",
      "knowledge_ready",
      "ready_to_import",
    ].includes(draftState.stage);
    const nextStage: TechniqueCreationDraft["stage"] = !hasGeneratedUnits
      ? "structure_ready"
      : unitStage === "units_pending"
        ? "units_pending"
        : laterStage
          ? draftState.stage
          : "units_ready";
    const mutation = onSaveStructure({
      ...draftState,
      stage: nextStage,
      techniqueDraft: {
        ...draftState.techniqueDraft,
        name: draftState.techniqueDraft.name.trim(),
        description: draftState.techniqueDraft.description.trim(),
      },
      layerRuleDrafts: reconcileDraftLayerRules(
        draftState.layerRuleDrafts,
        draftState.techniqueDraft.maxLayer,
      ),
      chapterDrafts,
    });
    setSaveMessage("大章结构已保存为新的草案版本。");

    if (submitIntent === "continue") {
      navigate(`/ai-drafts/projects/${mutation.projectId}/units`);
    }
  }

  if (!draftState.techniqueDraft) {
    return <Navigate to="/ai-drafts" replace />;
  }

  return (
    <section className="page-panel">
      <PageToolbar title="确认功法大章" backTo="/ai-drafts" />

      <div className="page-heading">
        <div>
          <p className="eyebrow">{sect?.name ?? draftState.input.target.sectId}</p>
          <p className="intro">
            {draftState.chapterDrafts.length} 个大章 ·{" "}
            {getTechniqueCreationStageLabel(draftState.stage)}
          </p>
        </div>
        <Link
          className="button-link secondary-link"
          to={`/ai-drafts/projects/${draft.projectId}/rules`}
        >
          配置功法规则
        </Link>
      </div>

      <DraftCompletionPanel draft={draftState} />

      <form className="rule-config-form" onSubmit={submitStructure}>
        <fieldset>
          <legend>功法基本信息</legend>
          <div className="creation-form-grid">
            <label>
              功法名称
              <input
                name="draftTechniqueName"
                value={draftState.techniqueDraft.name}
                maxLength={80}
                onChange={(event) =>
                  setDraftState((currentDraft) => ({
                    ...currentDraft,
                    techniqueDraft: currentDraft.techniqueDraft
                      ? {
                          ...currentDraft.techniqueDraft,
                          name: event.target.value,
                        }
                      : undefined,
                  }))
                }
              />
              <FieldReference standardKey="techniqueName" />
            </label>
            <label>
              课程体量系数
              <input
                name="courseValueCoefficient"
                type="number"
                min="0.5"
                max="2"
                step="0.01"
                value={draftState.techniqueDraft.courseValueCoefficientSuggestion}
                onChange={(event) =>
                  setDraftState((currentDraft) => ({
                    ...currentDraft,
                    techniqueDraft: currentDraft.techniqueDraft
                      ? {
                          ...currentDraft.techniqueDraft,
                          courseValueCoefficientSuggestion: Number(
                            event.target.value,
                          ),
                        }
                      : undefined,
                  }))
                }
              />
              <FieldReference
                standardKey="courseValueCoefficient"
                preview={`当前相当于系统基准的 ${Math.round(
                  draftState.techniqueDraft.courseValueCoefficientSuggestion *
                    100,
                )}%。`}
              />
            </label>
            <label>
              最高规划层数
              <input
                name="draftMaxLayer"
                type="number"
                min="1"
                max="6"
                step="1"
                value={draftState.techniqueDraft.maxLayer}
                onChange={(event) =>
                  setDraftState((currentDraft) => ({
                    ...currentDraft,
                    techniqueDraft: currentDraft.techniqueDraft
                      ? {
                          ...currentDraft.techniqueDraft,
                          maxLayer: Number(event.target.value),
                        }
                      : undefined,
                  }))
                }
              />
              <FieldReference standardKey="targetLayer" />
            </label>
            <label>
              法力权重
              <input
                name="draftManaWeight"
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={draftState.techniqueDraft.manaWeight}
                onChange={(event) =>
                  setDraftState((currentDraft) => ({
                    ...currentDraft,
                    techniqueDraft: currentDraft.techniqueDraft
                      ? {
                          ...currentDraft.techniqueDraft,
                          manaWeight: Number(event.target.value),
                        }
                      : undefined,
                  }))
                }
              />
              <FieldReference standardKey="tendencyWeight" />
            </label>
            <label>
              神识权重
              <input
                name="draftInsightWeight"
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={draftState.techniqueDraft.insightWeight}
                onChange={(event) =>
                  setDraftState((currentDraft) => ({
                    ...currentDraft,
                    techniqueDraft: currentDraft.techniqueDraft
                      ? {
                          ...currentDraft.techniqueDraft,
                          insightWeight: Number(event.target.value),
                        }
                      : undefined,
                  }))
                }
              />
              <FieldReference standardKey="tendencyWeight" />
            </label>
            <label>
              神魂权重
              <input
                name="draftSoulWeight"
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={draftState.techniqueDraft.soulWeight}
                onChange={(event) =>
                  setDraftState((currentDraft) => ({
                    ...currentDraft,
                    techniqueDraft: currentDraft.techniqueDraft
                      ? {
                          ...currentDraft.techniqueDraft,
                          soulWeight: Number(event.target.value),
                        }
                      : undefined,
                  }))
                }
              />
              <FieldReference standardKey="tendencyWeight" />
            </label>
            <label className="full-width-field">
              功法说明
              <textarea
                name="draftTechniqueDescription"
                value={draftState.techniqueDraft.description}
                maxLength={2000}
                onChange={(event) =>
                  setDraftState((currentDraft) => ({
                    ...currentDraft,
                    techniqueDraft: currentDraft.techniqueDraft
                      ? {
                          ...currentDraft.techniqueDraft,
                          description: event.target.value,
                        }
                      : undefined,
                  }))
                }
              />
              <FieldReference standardKey="structureDescription" />
            </label>
          </div>
        </fieldset>

        <div className="section-title-row">
          <h2>大章结构</h2>
          <button className="secondary-button" type="button" onClick={addChapter}>
            添加大章
          </button>
        </div>

        <div className="chapter-editor-list">
          {draftState.chapterDrafts.map((chapter, chapterIndex) => (
            <fieldset key={chapter.draftId}>
              <legend>大章 {chapterIndex + 1}</legend>
              <div className="chapter-editor-actions">
                <label className="inline-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      chapter.unitGenerationConfig.includeInGeneration
                    }
                    onChange={(event) =>
                      updateChapter(chapterIndex, {
                        unitGenerationConfig: {
                          ...chapter.unitGenerationConfig,
                          includeInGeneration: event.target.checked,
                        },
                      })
                    }
                  />
                  继续生成单元
                </label>
                <button
                  className="secondary-button compact-button"
                  type="button"
                  title="上移"
                  aria-label={`上移${chapter.name}`}
                  disabled={chapterIndex === 0}
                  onClick={() => moveChapter(chapterIndex, -1)}
                >
                  ↑
                </button>
                <button
                  className="secondary-button compact-button"
                  type="button"
                  title="下移"
                  aria-label={`下移${chapter.name}`}
                  disabled={chapterIndex === draftState.chapterDrafts.length - 1}
                  onClick={() => moveChapter(chapterIndex, 1)}
                >
                  ↓
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => deleteChapter(chapterIndex)}
                >
                  删除大章
                </button>
              </div>
              <div className="creation-form-grid">
                <label>
                  章节代码
                  <input
                    value={chapter.code}
                    maxLength={40}
                    onChange={(event) =>
                      updateChapter(chapterIndex, { code: event.target.value })
                    }
                  />
                  <FieldReference standardKey="structureCode" />
                </label>
                <label>
                  大章名称
                  <input
                    value={chapter.name}
                    maxLength={80}
                    onChange={(event) =>
                      updateChapter(chapterIndex, { name: event.target.value })
                    }
                  />
                  <FieldReference standardKey="structureName" />
                </label>
                <label className="full-width-field">
                  大章说明
                  <textarea
                    value={chapter.description}
                    maxLength={1500}
                    onChange={(event) =>
                      updateChapter(chapterIndex, {
                        description: event.target.value,
                      })
                    }
                  />
                  <FieldReference standardKey="structureDescription" />
                </label>
                <label className="full-width-field">
                  学习目标（每行一个）
                  <textarea
                    value={chapter.learningObjectives.join("\n")}
                    onChange={(event) =>
                      updateChapter(chapterIndex, {
                        learningObjectives: event.target.value
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <FieldReference standardKey="learningObjectives" />
                </label>
                <label>
                  单元划分精细度
                  <select
                    value={chapter.unitGenerationConfig.detailLevel}
                    onChange={(event) =>
                      updateChapterDetailLevel(
                        chapterIndex,
                        event.target.value as KnowledgeGranularity | "custom",
                      )
                    }
                  >
                    <option value="rough">粗略</option>
                    <option value="normal">普通</option>
                    <option value="detailed">细分</option>
                    <option value="custom">自定义数量</option>
                  </select>
                  <FieldReference standardKey="generationDetailLevel" />
                </label>
                <label>
                  目标单元数量
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={chapter.unitGenerationConfig.targetCount ?? ""}
                    placeholder={`${chapter.recommendedUnitCountRange?.min ?? 3}–${chapter.recommendedUnitCountRange?.max ?? 8}`}
                    onChange={(event) =>
                      updateChapterTargetCount(
                        chapterIndex,
                        event.target.value === ""
                          ? undefined
                          : Number(event.target.value),
                      )
                    }
                  />
                  <FieldReference
                    standardKey="chapterTargetCount"
                    recommendation={
                      chapter.recommendedUnitCountRange
                        ? `AI 建议 ${chapter.recommendedUnitCountRange.min}～${chapter.recommendedUnitCountRange.max} 个单元。`
                        : undefined
                    }
                    preview={
                      chapter.unitGenerationConfig.targetCount
                        ? `预计生成约 ${chapter.unitGenerationConfig.targetCount} 个单元。`
                        : undefined
                    }
                  />
                </label>
              </div>
            </fieldset>
          ))}
        </div>

        {saveMessage && (
          <p className={saveMessage.includes("已保存") ? "form-success" : "form-error"}>
            {saveMessage}
          </p>
        )}
        <div className="inline-actions">
          <button type="submit">保存大章结构</button>
          <button type="submit" name="intent" value="continue">
            保存并生成单元
          </button>
          <Link className="button-link secondary-link" to="/ai-drafts">
            返回草案总览
          </Link>
        </div>
      </form>
    </section>
  );
}

type TechniqueRulesRouteProps = {
  repository: TechniqueCreationDraftRepository;
  onSaveStructure: (draft: TechniqueCreationDraft) => {
    projectId: string;
    variantId: string;
  };
  onRedistributeKnowledgePointExperience: (
    draft: TechniqueCreationDraft,
    includeManualAdjustments: boolean,
  ) => {
    projectId: string;
    variantId: string;
  };
};

function TechniqueRulesRoute({
  repository,
  onSaveStructure,
  onRedistributeKnowledgePointExperience,
}: TechniqueRulesRouteProps) {
  const { projectId } = useParams();
  const draft = projectId
    ? materializeTechniqueCreationDraft(repository, projectId)
    : undefined;

  if (!draft || !draft.techniqueDraft || !draft.practiceDefaultsDraft) {
    return <Navigate to="/ai-drafts" replace />;
  }

  return (
    <TechniqueRulesPage
      draft={draft}
      onSaveStructure={onSaveStructure}
      onRedistributeKnowledgePointExperience={
        onRedistributeKnowledgePointExperience
      }
    />
  );
}

type TechniqueRulesPageProps = {
  draft: TechniqueCreationDraft;
  onSaveStructure: (draft: TechniqueCreationDraft) => {
    projectId: string;
    variantId: string;
  };
  onRedistributeKnowledgePointExperience: (
    draft: TechniqueCreationDraft,
    includeManualAdjustments: boolean,
  ) => {
    projectId: string;
    variantId: string;
  };
};

const techniqueDraftPracticeTypes: PracticeRecordType[] = [
  "exercise",
  "note",
  "thinking",
  "test",
  "review",
];

function createMissingLayerRuleDraft(layer: number): TechniqueLayerRuleDraft {
  return {
    draftId: crypto.randomUUID(),
    layer,
    requiredExperienceSuggestion: 10000 * layer * (layer + 1),
    requiredCoverageRatio: Math.min(0.53 + layer * 0.07, 0.95),
    requiredCoreCoverageRatio: Math.min(0.68 + layer * 0.07, 1),
    allowedWeakPointRatio: Math.max(0.4 - layer * 0.06, 0.05),
    breakthroughRequirements: [
      {
        draftId: crypto.randomUUID(),
        title: `完成第 ${layer} 层阶段检验`,
        description: "完成能够覆盖本层核心内容的阶段任务。",
        requirementType: "test",
        isRequired: true,
      },
    ],
  };
}

function reconcileDraftLayerRules(
  layerRules: TechniqueLayerRuleDraft[],
  maxLayer: number,
): TechniqueLayerRuleDraft[] {
  const layerRuleByLayer = new Map(
    layerRules.map((layerRule) => [layerRule.layer, layerRule]),
  );

  return Array.from({ length: maxLayer }, (_, index) => {
    const layer = index + 1;
    return (
      layerRuleByLayer.get(layer) ?? createMissingLayerRuleDraft(layer)
    );
  });
}

function TechniqueRulesPage({
  draft,
  onSaveStructure,
  onRedistributeKnowledgePointExperience,
}: TechniqueRulesPageProps) {
  const initialDraft = structuredClone(draft);
  initialDraft.layerRuleDrafts = reconcileDraftLayerRules(
    initialDraft.layerRuleDrafts,
    initialDraft.techniqueDraft?.maxLayer ?? 1,
  );
  const [draftState, setDraftState] = useState(initialDraft);
  const [selectedLayer, setSelectedLayer] = useState(1);
  const [reviewIntervalsText, setReviewIntervalsText] = useState(
    initialDraft.practiceDefaultsDraft?.reviewSchedule.intervalsDays.join(", ") ??
      "",
  );
  const [ruleMessage, setRuleMessage] = useState<UnitsPageMessage>();
  const [isExperienceRedistributionOpen, setIsExperienceRedistributionOpen] =
    useState(false);
  const practiceDefaults = draftState.practiceDefaultsDraft;
  const selectedLayerRule = draftState.layerRuleDrafts.find(
    (layerRule) => layerRule.layer === selectedLayer,
  );
  const includedKnowledgePoints = getIncludedDraftKnowledgePoints(draftState);
  const currentKnowledgePointBaseValue = includedKnowledgePoints.reduce(
    (total, knowledgePoint) =>
      total + (getEffectiveKnowledgePointBaseValue(knowledgePoint) ?? 0),
    0,
  );
  const manuallyAdjustedKnowledgePointCount = includedKnowledgePoints.filter(
    hasManualKnowledgePointBaseValue,
  ).length;

  useEffect(() => {
    const nextDraft = structuredClone(draft);
    nextDraft.layerRuleDrafts = reconcileDraftLayerRules(
      nextDraft.layerRuleDrafts,
      nextDraft.techniqueDraft?.maxLayer ?? 1,
    );
    setDraftState(nextDraft);
    setReviewIntervalsText(
      nextDraft.practiceDefaultsDraft?.reviewSchedule.intervalsDays.join(", ") ??
        "",
    );
    setSelectedLayer((currentLayer) =>
      currentLayer <= (nextDraft.techniqueDraft?.maxLayer ?? 1)
        ? currentLayer
        : 1,
    );
  }, [draft]);

  function updatePracticeDefaults(
    updater: (
      currentDefaults: TechniquePracticeDefaultsDraft,
    ) => TechniquePracticeDefaultsDraft,
  ) {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      practiceDefaultsDraft: currentDraft.practiceDefaultsDraft
        ? updater(currentDraft.practiceDefaultsDraft)
        : undefined,
    }));
    setRuleMessage(undefined);
  }

  function updatePracticeType(
    recordType: PracticeRecordType,
    patch: Partial<
      TechniquePracticeDefaultsDraft["recordTypeDefaults"][PracticeRecordType]
    >,
  ) {
    updatePracticeDefaults((currentDefaults) => ({
      ...currentDefaults,
      recordTypeDefaults: {
        ...currentDefaults.recordTypeDefaults,
        [recordType]: {
          ...currentDefaults.recordTypeDefaults[recordType],
          ...patch,
        },
      },
    }));
  }

  function updateLayerRule(patch: Partial<TechniqueLayerRuleDraft>) {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      layerRuleDrafts: currentDraft.layerRuleDrafts.map((layerRule) =>
        layerRule.layer === selectedLayer
          ? { ...layerRule, ...patch }
          : layerRule,
      ),
    }));
    setRuleMessage(undefined);
  }

  function updateExperienceBudget(
    patch: Partial<
      Pick<
        TechniqueCreationInput,
        "experienceBudgetReferenceLayer" | "experienceBudgetTotal"
      >
    >,
  ) {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      input: {
        ...currentDraft.input,
        ...patch,
      },
    }));
    setRuleMessage(undefined);
  }

  function redistributeKnowledgePointExperience(
    includeManualAdjustments: boolean,
  ): boolean {
    try {
      onRedistributeKnowledgePointExperience(
        draftState,
        includeManualAdjustments,
      );
      setRuleMessage({
        kind: "success",
        text: includeManualAdjustments
          ? "已保存目标总经验，并重新分配全部知识点经验。"
          : "已保存目标总经验，并重新分配未手动调整的知识点经验。",
      });
      return true;
    } catch (error) {
      setRuleMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "重新分配知识点经验失败。",
      });
      return false;
    }
  }

  function updateBreakthroughRequirement(
    requirementIndex: number,
    patch: Partial<
      TechniqueLayerRuleDraft["breakthroughRequirements"][number]
    >,
  ) {
    if (!selectedLayerRule) {
      return;
    }

    updateLayerRule({
      breakthroughRequirements:
        selectedLayerRule.breakthroughRequirements.map((requirement, index) =>
          index === requirementIndex
            ? { ...requirement, ...patch }
            : requirement,
        ),
    });
  }

  function addBreakthroughRequirement() {
    if (!selectedLayerRule) {
      return;
    }

    updateLayerRule({
      breakthroughRequirements: [
        ...selectedLayerRule.breakthroughRequirements,
        {
          draftId: crypto.randomUUID(),
          title: "新突破要求",
          description: "",
          requirementType: "summary",
          isRequired: true,
        },
      ],
    });
  }

  function deleteBreakthroughRequirement(requirementIndex: number) {
    if (!selectedLayerRule) {
      return;
    }

    updateLayerRule({
      breakthroughRequirements:
        selectedLayerRule.breakthroughRequirements.filter(
          (_, index) => index !== requirementIndex,
        ),
    });
  }

  function parseReviewIntervals(): number[] | undefined {
    const intervals = reviewIntervalsText
      .split(/[,，\s]+/)
      .filter(Boolean)
      .map(Number);
    if (
      intervals.length === 0 ||
      intervals.some(
        (interval, index) =>
          !Number.isInteger(interval) ||
          interval <= 0 ||
          (index > 0 && interval <= intervals[index - 1]),
      )
    ) {
      return undefined;
    }

    return intervals;
  }

  function validateRules(
    nextPracticeDefaults: TechniquePracticeDefaultsDraft,
  ): string | undefined {
    const defaultCounts = [
      {
        value: nextPracticeDefaults.requiredExerciseCount,
        maximum: 100,
        label: "默认练习次数",
      },
      {
        value: nextPracticeDefaults.requiredNoteCount,
        maximum: 20,
        label: "默认笔记次数",
      },
      {
        value: nextPracticeDefaults.requiredThinkingCount,
        maximum: 20,
        label: "默认思考次数",
      },
    ];
    const invalidCount = defaultCounts.find(
      ({ value, maximum }) =>
        !Number.isInteger(value) || value < 0 || value > maximum,
    );
    if (invalidCount) {
      return `${invalidCount.label}需要填写 0 到 ${invalidCount.maximum} 之间的整数。`;
    }
    if (
      nextPracticeDefaults.reviewSchedule.graceRatio < 0 ||
      nextPracticeDefaults.reviewSchedule.graceRatio > 1
    ) {
      return "复习宽限比例需要填写 0% 到 100% 之间的数值。";
    }
    if (
      draftState.input.experienceBudgetTotal !== undefined &&
      (!Number.isInteger(draftState.input.experienceBudgetTotal) ||
        draftState.input.experienceBudgetTotal < 1 ||
        draftState.input.experienceBudgetTotal > 10_000_000)
    ) {
      return "目标总经验需要填写 1 到 10000000 之间的整数。";
    }

    for (const recordType of techniqueDraftPracticeTypes) {
      const defaults = nextPracticeDefaults.recordTypeDefaults[recordType];
      if (defaults.requirementRatio < 0 || defaults.requirementRatio > 2) {
        return `${practiceRecordTypeLabels[recordType]}要求比例需要填写 0 到 2 之间的数值。`;
      }
      if (
        defaults.manaWeight < 0 ||
        defaults.manaWeight > 1 ||
        defaults.insightWeight < 0 ||
        defaults.insightWeight > 1
      ) {
        return `${practiceRecordTypeLabels[recordType]}收益权重需要填写 0 到 1 之间的数值。`;
      }
      if (
        recordType === "test" &&
        (!Number.isInteger(defaults.baseExperiencePerUnit) ||
          (defaults.baseExperiencePerUnit ?? 0) < 1 ||
          (defaults.baseExperiencePerUnit ?? 0) > 1000)
      ) {
        return "测试单位经验需要填写 1 到 1000 之间的整数。";
      }
    }

    const sortedLayerRules = [...draftState.layerRuleDrafts].sort(
      (left, right) => left.layer - right.layer,
    );
    for (let index = 0; index < sortedLayerRules.length; index += 1) {
      const layerRule = sortedLayerRules[index];
      const previousRule = sortedLayerRules[index - 1];
      if (
        !Number.isInteger(layerRule.requiredExperienceSuggestion) ||
        layerRule.requiredExperienceSuggestion <= 0 ||
        (previousRule &&
          layerRule.requiredExperienceSuggestion <=
            previousRule.requiredExperienceSuggestion)
      ) {
        return `第 ${layerRule.layer} 层经验门槛必须是高于上一层的正整数。`;
      }
      if (
        [
          layerRule.requiredCoverageRatio,
          layerRule.requiredCoreCoverageRatio,
          layerRule.allowedWeakPointRatio,
        ].some((ratio) => ratio < 0 || ratio > 1)
      ) {
        return `第 ${layerRule.layer} 层的覆盖和薄弱点比例需要在 0% 到 100% 之间。`;
      }
      if (
        previousRule &&
        (layerRule.requiredCoverageRatio <
          previousRule.requiredCoverageRatio ||
          layerRule.requiredCoreCoverageRatio <
            previousRule.requiredCoreCoverageRatio ||
          layerRule.allowedWeakPointRatio >
            previousRule.allowedWeakPointRatio)
      ) {
        return `第 ${layerRule.layer} 层的覆盖率不能降低，薄弱点上限不能升高。`;
      }
      if (
        layerRule.breakthroughRequirements.some(
          (requirement) => requirement.title.trim() === "",
        )
      ) {
        return `第 ${layerRule.layer} 层存在未填写标题的突破要求。`;
      }
    }

    return undefined;
  }

  function saveRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!practiceDefaults) {
      return;
    }

    const intervalsDays = parseReviewIntervals();
    if (!intervalsDays) {
      setRuleMessage({
        kind: "error",
        text: "复习间隔需要填写用逗号分隔、严格递增的正整数天数。",
      });
      return;
    }

    const nextPracticeDefaults: TechniquePracticeDefaultsDraft = {
      ...practiceDefaults,
      reviewSchedule: {
        ...practiceDefaults.reviewSchedule,
        intervalsDays,
      },
    };
    const validationError = validateRules(nextPracticeDefaults);
    if (validationError) {
      setRuleMessage({ kind: "error", text: validationError });
      return;
    }

    const normalizedDraft: TechniqueCreationDraft = {
      ...draftState,
      practiceDefaultsDraft: nextPracticeDefaults,
      layerRuleDrafts: [...draftState.layerRuleDrafts].sort(
        (left, right) => left.layer - right.layer,
      ),
    };
    onSaveStructure(normalizedDraft);
    setDraftState(normalizedDraft);
    const unbalancedTypeCount = techniqueDraftPracticeTypes.filter(
      (recordType) => {
        const defaults = nextPracticeDefaults.recordTypeDefaults[recordType];
        return Math.abs(defaults.manaWeight + defaults.insightWeight - 1) > 0.001;
      },
    ).length;
    setRuleMessage({
      kind: "success",
      text:
        unbalancedTypeCount > 0
          ? `规则已保存；有 ${unbalancedTypeCount} 类修炼的法力与神识权重之和不为 1，请确认这是有意设置。`
          : "功法修炼规则和层数规则已保存为新的草案版本。",
    });
  }

  if (!practiceDefaults || !selectedLayerRule || !draftState.techniqueDraft) {
    return <Navigate to="/ai-drafts" replace />;
  }

  return (
    <section className="page-panel">
      {isExperienceRedistributionOpen &&
        draftState.input.experienceBudgetTotal !== undefined && (
          <ExperienceRedistributionDialog
            targetTotal={draftState.input.experienceBudgetTotal}
            currentTotal={currentKnowledgePointBaseValue}
            manuallyAdjustedCount={manuallyAdjustedKnowledgePointCount}
            error={ruleMessage?.kind === "error" ? ruleMessage.text : undefined}
            onCancel={() => {
              setIsExperienceRedistributionOpen(false);
              setRuleMessage(undefined);
            }}
            onConfirm={redistributeKnowledgePointExperience}
          />
        )}
      <PageToolbar
        title="确认功法规则"
        backTo={`/ai-drafts/projects/${draft.projectId}/chapters`}
      />

      <div className="page-heading">
        <div>
          <p className="eyebrow">{draftState.techniqueDraft.name}</p>
          <p className="intro">
            {draftState.techniqueDraft.maxLayer} 层规则 · 修改只写入当前草案
          </p>
        </div>
        <Link
          className="button-link secondary-link"
          to={getTechniqueCreationEditPath(draftState)}
        >
          返回结构编辑
        </Link>
      </div>

      <DraftCompletionPanel draft={draftState} />

      <form className="rule-config-form" onSubmit={saveRules}>
        <fieldset>
          <legend>知识点默认完成与复习要求</legend>
          <div className="creation-form-grid">
            <label>
              默认练习次数
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={practiceDefaults.requiredExerciseCount}
                onChange={(event) =>
                  updatePracticeDefaults((currentDefaults) => ({
                    ...currentDefaults,
                    requiredExerciseCount: Number(event.target.value),
                  }))
                }
              />
              <FieldReference standardKey="requiredExerciseCount" />
            </label>
            <label>
              默认笔记次数
              <input
                type="number"
                min="0"
                max="20"
                step="1"
                value={practiceDefaults.requiredNoteCount}
                onChange={(event) =>
                  updatePracticeDefaults((currentDefaults) => ({
                    ...currentDefaults,
                    requiredNoteCount: Number(event.target.value),
                  }))
                }
              />
              <FieldReference standardKey="requiredNoteCount" />
            </label>
            <label>
              默认思考次数
              <input
                type="number"
                min="0"
                max="20"
                step="1"
                value={practiceDefaults.requiredThinkingCount}
                onChange={(event) =>
                  updatePracticeDefaults((currentDefaults) => ({
                    ...currentDefaults,
                    requiredThinkingCount: Number(event.target.value),
                  }))
                }
              />
              <FieldReference standardKey="requiredThinkingCount" />
            </label>
            <label>
              复习宽限比例
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={Math.round(
                  practiceDefaults.reviewSchedule.graceRatio * 100,
                )}
                onChange={(event) =>
                  updatePracticeDefaults((currentDefaults) => ({
                    ...currentDefaults,
                    reviewSchedule: {
                      ...currentDefaults.reviewSchedule,
                      graceRatio: Number(event.target.value) / 100,
                    },
                  }))
                }
              />
              <FieldReference standardKey="reviewGraceRatio" />
            </label>
            <label className="full-width-field">
              复习间隔（天）
              <input
                value={reviewIntervalsText}
                onChange={(event) => {
                  setReviewIntervalsText(event.target.value);
                  setRuleMessage(undefined);
                }}
                placeholder="2, 7, 21, 60, 180, 365"
              />
              <FieldReference standardKey="reviewIntervals" />
            </label>
          </div>
        </fieldset>

        <div className="section-title-row">
          <h2>修炼类型结算</h2>
        </div>
        <div className="practice-default-grid">
          {techniqueDraftPracticeTypes.map((recordType) => {
            const defaults = practiceDefaults.recordTypeDefaults[recordType];

            return (
              <fieldset key={recordType}>
                <legend>{practiceRecordTypeLabels[recordType]}</legend>
                <div className="creation-form-grid">
                  <label>
                    要求比例
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.05"
                      value={defaults.requirementRatio}
                      disabled={recordType === "test"}
                      onChange={(event) =>
                        updatePracticeType(recordType, {
                          requirementRatio: Number(event.target.value),
                        })
                      }
                    />
                    <FieldReference standardKey="practiceRequirementRatio" />
                  </label>
                  {recordType === "test" && (
                    <label>
                      单位基础经验
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        step="1"
                        value={defaults.baseExperiencePerUnit ?? 30}
                        onChange={(event) =>
                          updatePracticeType(recordType, {
                            baseExperiencePerUnit: Number(event.target.value),
                          })
                        }
                      />
                      <FieldReference standardKey="testBaseExperience" />
                    </label>
                  )}
                  <label>
                    法力权重
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={defaults.manaWeight}
                      onChange={(event) =>
                        updatePracticeType(recordType, {
                          manaWeight: Number(event.target.value),
                        })
                      }
                    />
                    <FieldReference standardKey="practiceTypeWeight" />
                  </label>
                  <label>
                    神识权重
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={defaults.insightWeight}
                      onChange={(event) =>
                        updatePracticeType(recordType, {
                          insightWeight: Number(event.target.value),
                        })
                      }
                    />
                    <FieldReference
                      standardKey="practiceTypeWeight"
                      preview={`当前权重和为 ${(
                        defaults.manaWeight + defaults.insightWeight
                      ).toFixed(2)}。`}
                    />
                  </label>
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="section-title-row">
          <h2>层数与突破要求</h2>
          <button
            className="secondary-button"
            type="button"
            onClick={addBreakthroughRequirement}
          >
            添加突破要求
          </button>
        </div>

        <fieldset>
          <legend>总经验与知识点分配</legend>
          <div className="creation-form-grid">
            <label>
              总经验参照
              <select
                value={draftState.input.experienceBudgetReferenceLayer ?? ""}
                onChange={(event) => {
                  const layer = Number(event.target.value);
                  if (!layer) {
                    updateExperienceBudget({
                      experienceBudgetReferenceLayer: undefined,
                    });
                    return;
                  }
                  updateExperienceBudget({
                    experienceBudgetReferenceLayer: layer,
                    experienceBudgetTotal:
                      MATH_ANALYSIS_CUMULATIVE_EXPERIENCE[layer - 1],
                  });
                }}
              >
                <option value="">不使用预设参照</option>
                {MATH_ANALYSIS_CUMULATIVE_EXPERIENCE.map((value, index) => (
                  <option key={value} value={index + 1}>
                    数学分析第 {index + 1} 层：{value.toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              目标总经验
              <input
                type="number"
                min="1"
                max="10000000"
                step="1"
                placeholder="例如：360000"
                value={draftState.input.experienceBudgetTotal ?? ""}
                onChange={(event) =>
                  updateExperienceBudget({
                    experienceBudgetTotal:
                      event.target.value === "" ? undefined : Number(event.target.value),
                  })
                }
              />
            </label>
            <p className="progress-muted full-width-field">
              当前知识点基础值合计：{currentKnowledgePointBaseValue.toLocaleString()} ·
              {draftState.input.experienceBudgetTotal === undefined
                ? "填写目标总经验后可重新分配。"
                : `差异：${(
                    currentKnowledgePointBaseValue -
                    draftState.input.experienceBudgetTotal
                  ).toLocaleString()}`}
            </p>
          </div>
          <div className="inline-actions">
            <button
              className="secondary-button"
              type="button"
              disabled={
                draftState.input.experienceBudgetTotal === undefined ||
                includedKnowledgePoints.length === 0
              }
              onClick={() => setIsExperienceRedistributionOpen(true)}
            >
              按目标重新分配知识点经验
            </button>
          </div>
        </fieldset>

        <section className="unit-stage-toolbar" aria-label="层数规则范围">
          <label>
            当前层数
            <select
              value={selectedLayer}
              onChange={(event) => {
                setSelectedLayer(Number(event.target.value));
                setRuleMessage(undefined);
              }}
            >
              {draftState.layerRuleDrafts.map((layerRule) => (
                <option key={layerRule.draftId} value={layerRule.layer}>
                  第 {layerRule.layer} 层
                </option>
              ))}
            </select>
          </label>
        </section>

        <fieldset>
          <legend>第 {selectedLayerRule.layer} 层门槛</legend>
          <div className="creation-form-grid">
            <label>
              累计经验门槛
              <input
                type="number"
                min="1"
                step="1"
                value={selectedLayerRule.requiredExperienceSuggestion}
                onChange={(event) =>
                  updateLayerRule({
                    requiredExperienceSuggestion: Number(event.target.value),
                  })
                }
              />
              <FieldReference standardKey="layerExperience" />
            </label>
            <label>
              知识点覆盖率
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={Math.round(
                  selectedLayerRule.requiredCoverageRatio * 100,
                )}
                onChange={(event) =>
                  updateLayerRule({
                    requiredCoverageRatio: Number(event.target.value) / 100,
                  })
                }
              />
              <FieldReference standardKey="layerCoverage" />
            </label>
            <label>
              核心知识点覆盖率
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={Math.round(
                  selectedLayerRule.requiredCoreCoverageRatio * 100,
                )}
                onChange={(event) =>
                  updateLayerRule({
                    requiredCoreCoverageRatio:
                      Number(event.target.value) / 100,
                  })
                }
              />
              <FieldReference standardKey="layerCoverage" />
            </label>
            <label>
              薄弱点比例上限
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={Math.round(
                  selectedLayerRule.allowedWeakPointRatio * 100,
                )}
                onChange={(event) =>
                  updateLayerRule({
                    allowedWeakPointRatio: Number(event.target.value) / 100,
                  })
                }
              />
              <FieldReference standardKey="layerWeakPointRatio" />
            </label>
          </div>
        </fieldset>

        <div className="breakthrough-rule-list">
          {selectedLayerRule.breakthroughRequirements.map(
            (requirement, requirementIndex) => (
              <fieldset key={requirement.draftId}>
                <legend>突破要求 {requirementIndex + 1}</legend>
                <div className="chapter-editor-actions">
                  <label className="inline-checkbox">
                    <input
                      type="checkbox"
                      checked={requirement.isRequired}
                      onChange={(event) =>
                        updateBreakthroughRequirement(requirementIndex, {
                          isRequired: event.target.checked,
                        })
                      }
                    />
                    硬性要求
                  </label>
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() =>
                      deleteBreakthroughRequirement(requirementIndex)
                    }
                  >
                    删除要求
                  </button>
                </div>
                <div className="creation-form-grid">
                  <label>
                    要求标题
                    <input
                      value={requirement.title}
                      maxLength={100}
                      onChange={(event) =>
                        updateBreakthroughRequirement(requirementIndex, {
                          title: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    要求类型
                    <select
                      value={requirement.requirementType}
                      onChange={(event) =>
                        updateBreakthroughRequirement(requirementIndex, {
                          requirementType: event.target
                            .value as typeof requirement.requirementType,
                        })
                      }
                    >
                      <option value="test">测试</option>
                      <option value="summary">总结</option>
                      <option value="output">输出</option>
                      <option value="review">复习</option>
                    </select>
                  </label>
                  <label className="full-width-field">
                    要求说明
                    <textarea
                      value={requirement.description}
                      maxLength={1000}
                      onChange={(event) =>
                        updateBreakthroughRequirement(requirementIndex, {
                          description: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </fieldset>
            ),
          )}
        </div>

        {ruleMessage && (
          <p
            className={
              ruleMessage.kind === "success" ? "form-success" : "form-error"
            }
          >
            {ruleMessage.text}
          </p>
        )}

        <div className="inline-actions">
          <button type="submit">保存功法规则</button>
          <Link className="button-link secondary-link" to="/ai-drafts">
            返回草案总览
          </Link>
        </div>
      </form>
    </section>
  );
}

type TechniqueUnitsRouteProps = {
  repository: TechniqueCreationDraftRepository;
  onGenerateUnits: (
    draft: TechniqueCreationDraft,
    chapterDraftIds: string[],
    onProgress?: (phase: "waiting" | "validating" | "saving") => void,
  ) => Promise<{
    projectId: string;
    variantId: string;
  }>;
  onSaveUnits: (
    draft: TechniqueCreationDraft,
    chapterDraftIds: string[],
  ) => {
    projectId: string;
    variantId: string;
  };
};

function TechniqueUnitsRoute({
  repository,
  onGenerateUnits,
  onSaveUnits,
}: TechniqueUnitsRouteProps) {
  const { projectId } = useParams();
  const draft = projectId
    ? materializeTechniqueCreationDraft(repository, projectId)
    : undefined;

  if (!draft) {
    return <Navigate to="/ai-drafts" replace />;
  }

  return (
    <TechniqueUnitsPage
      draft={draft}
      onGenerateUnits={onGenerateUnits}
      onSaveUnits={onSaveUnits}
    />
  );
}

type TechniqueUnitsPageProps = {
  draft: TechniqueCreationDraft;
  onGenerateUnits: (
    draft: TechniqueCreationDraft,
    chapterDraftIds: string[],
    onProgress?: (phase: "waiting" | "validating" | "saving") => void,
  ) => Promise<{
    projectId: string;
    variantId: string;
  }>;
  onSaveUnits: (
    draft: TechniqueCreationDraft,
    chapterDraftIds: string[],
  ) => {
    projectId: string;
    variantId: string;
  };
};

type UnitsPageMessage = {
  kind: "success" | "error";
  text: string;
};

type UnitGenerationProgress = {
  phase: "preparing" | "waiting" | "validating" | "saving" | "success" | "error";
  detail?: string;
  completedStepCount?: number;
};

const unitGenerationSteps = [
  { phase: "preparing", label: "准备生成请求" },
  { phase: "waiting", label: "等待 AI 生成单元" },
  { phase: "validating", label: "校验生成内容" },
  { phase: "saving", label: "保存草案版本" },
] as const;

function UnitGenerationProgressDialog({
  progress,
  onConfirm,
}: {
  progress: UnitGenerationProgress;
  onConfirm: () => void;
}) {
  const completedStepCount = progress.completedStepCount ?? (
    progress.phase === "success"
      ? unitGenerationSteps.length
      : progress.phase === "error"
        ? 0
        : unitGenerationSteps.findIndex((step) => step.phase === progress.phase)
  );
  const activeStep = progress.phase === "success" || progress.phase === "error"
    ? undefined
    : progress.phase;
  const isFinished = progress.phase === "success" || progress.phase === "error";

  return (
    <div className="generation-progress-backdrop" role="presentation">
      <section
        className="generation-progress-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generation-progress-title"
      >
        <p className="eyebrow">AI 草案生成</p>
        <h2 id="generation-progress-title">
          {progress.phase === "success"
            ? "生成完成"
            : progress.phase === "error"
              ? "生成失败"
              : "正在生成单元"}
        </h2>
        <ol className="generation-progress-steps">
          {unitGenerationSteps.map((step, index) => {
            const isComplete = index < completedStepCount;
            const isActive = step.phase === activeStep;
            return (
              <li
                key={step.phase}
                className={isComplete ? "complete" : isActive ? "active" : ""}
              >
                <span aria-hidden="true">{isComplete ? "✓" : index + 1}</span>
                {step.label}
              </li>
            );
          })}
        </ol>
        <p className={progress.phase === "error" ? "form-error" : "progress-muted"}>
          {progress.detail ?? "正在处理，请不要关闭此页面。"}
        </p>
        {isFinished && (
          <div className="inline-actions">
            <button type="button" onClick={onConfirm}>确认</button>
          </div>
        )}
      </section>
    </div>
  );
}

function ExperienceRedistributionDialog({
  targetTotal,
  currentTotal,
  manuallyAdjustedCount,
  error,
  onCancel,
  onConfirm,
}: {
  targetTotal: number;
  currentTotal: number;
  manuallyAdjustedCount: number;
  error?: string;
  onCancel: () => void;
  onConfirm: (includeManualAdjustments: boolean) => boolean;
}) {
  const [includeManualAdjustments, setIncludeManualAdjustments] = useState(false);

  return (
    <div className="generation-progress-backdrop" role="presentation">
      <section
        className="generation-progress-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="experience-redistribution-title"
      >
        <p className="eyebrow">知识点经验</p>
        <h2 id="experience-redistribution-title">按目标重新分配</h2>
        <p className="progress-muted">
          当前合计 {currentTotal.toLocaleString()}，将调整为 {targetTotal.toLocaleString()}。
          系统会保留各知识点当前的相对价值。
        </p>
        {manuallyAdjustedCount > 0 && (
          <fieldset className="experience-redistribution-options">
            <legend>手动调整过的知识点</legend>
            <label>
              <input
                type="radio"
                checked={!includeManualAdjustments}
                onChange={() => setIncludeManualAdjustments(false)}
              />
              保持不变，仅重新分配其余知识点
            </label>
            <label>
              <input
                type="radio"
                checked={includeManualAdjustments}
                onChange={() => setIncludeManualAdjustments(true)}
              />
              一并重新分配这 {manuallyAdjustedCount} 个手动调整
            </label>
          </fieldset>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="inline-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              if (onConfirm(includeManualAdjustments)) {
                onCancel();
              }
            }}
          >
            确认重新分配
          </button>
        </div>
      </section>
    </div>
  );
}

function resolveUnitsStage(
  chapterDrafts: TechniqueChapterDraft[],
): TechniqueCreationDraft["stage"] {
  const includedChapters = chapterDrafts.filter(
    (chapter) => chapter.unitGenerationConfig.includeInGeneration,
  );
  const hasPendingChapter = includedChapters.some(
    (chapter) => chapter.unitDrafts.length === 0,
  );

  return hasPendingChapter ? "units_pending" : "units_ready";
}

function getKnowledgeDetailLevelLabel(
  detailLevel: KnowledgeGranularity | "custom",
): string {
  switch (detailLevel) {
    case "rough":
      return "粗略";
    case "normal":
      return "普通";
    case "detailed":
      return "细分";
    case "custom":
      return "自定义数量";
  }
}

function TechniqueUnitsPage({
  draft,
  onGenerateUnits,
  onSaveUnits,
}: TechniqueUnitsPageProps) {
  const [draftState, setDraftState] = useState(() => structuredClone(draft));
  const [selectedChapterId, setSelectedChapterId] = useState(
    draft.chapterDrafts.find(
      (chapter) => chapter.unitGenerationConfig.includeInGeneration,
    )?.draftId ?? draft.chapterDrafts[0]?.draftId ?? "",
  );
  const [pageMessage, setPageMessage] = useState<UnitsPageMessage>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<UnitGenerationProgress>();
  const selectedChapter = draftState.chapterDrafts.find(
    (chapter) => chapter.draftId === selectedChapterId,
  );
  const includedChapters = draftState.chapterDrafts.filter(
    (chapter) => chapter.unitGenerationConfig.includeInGeneration,
  );
  const generatedChapterCount = includedChapters.filter(
    (chapter) => chapter.unitDrafts.length > 0,
  ).length;
  const pendingChapterIds = includedChapters
    .filter((chapter) => chapter.unitDrafts.length === 0)
    .map((chapter) => chapter.draftId);
  const totalUnitCount = draftState.chapterDrafts.reduce(
    (total, chapter) => total + chapter.unitDrafts.length,
    0,
  );

  useEffect(() => {
    setDraftState(structuredClone(draft));
    setSelectedChapterId((currentChapterId) =>
      draft.chapterDrafts.some(
        (chapter) => chapter.draftId === currentChapterId,
      )
        ? currentChapterId
        : draft.chapterDrafts.find(
              (chapter) =>
                chapter.unitGenerationConfig.includeInGeneration,
            )?.draftId ?? draft.chapterDrafts[0]?.draftId ?? "",
    );
  }, [draft]);

  function updateSelectedChapter(
    updater: (chapter: TechniqueChapterDraft) => TechniqueChapterDraft,
  ) {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      chapterDrafts: currentDraft.chapterDrafts.map((chapter) =>
        chapter.draftId === selectedChapterId ? updater(chapter) : chapter,
      ),
    }));
    setPageMessage(undefined);
  }

  function updateUnit(
    unitIndex: number,
    patch: Partial<TechniqueUnitDraft>,
  ) {
    updateSelectedChapter((chapter) => ({
      ...chapter,
      unitDrafts: chapter.unitDrafts.map((unit, index) =>
        index === unitIndex ? { ...unit, ...patch } : unit,
      ),
    }));
  }

  function updateKnowledgeDetailLevel(
    unitIndex: number,
    detailLevel: KnowledgeGranularity | "custom",
  ) {
    if (!selectedChapter) {
      return;
    }

    const unit = selectedChapter.unitDrafts[unitIndex];
    const currentConfig = unit.knowledgeGenerationConfig;
    const commonConfig = {
      includeInGeneration: currentConfig.includeInGeneration,
      focusText: currentConfig.focusText,
      excludedContent: currentConfig.excludedContent,
      organizationRequirement: currentConfig.organizationRequirement,
      requirementText: currentConfig.requirementText,
    };
    const targetCount =
      currentConfig.targetCount ??
      unit.recommendedKnowledgePointCountRange?.min ??
      1;

    updateUnit(unitIndex, {
      knowledgeGenerationConfig:
        detailLevel === "custom"
          ? { ...commonConfig, detailLevel, targetCount }
          : { ...commonConfig, detailLevel },
    });
  }

  function updateKnowledgeTargetCount(
    unitIndex: number,
    targetCount: number | undefined,
  ) {
    if (!selectedChapter) {
      return;
    }

    const config =
      selectedChapter.unitDrafts[unitIndex].knowledgeGenerationConfig;
    const commonConfig = {
      includeInGeneration: config.includeInGeneration,
      focusText: config.focusText,
      excludedContent: config.excludedContent,
      organizationRequirement: config.organizationRequirement,
      requirementText: config.requirementText,
    };

    updateUnit(unitIndex, {
      knowledgeGenerationConfig:
        config.detailLevel === "custom"
          ? {
              ...commonConfig,
              detailLevel: "custom",
              targetCount: Math.max(1, targetCount ?? 1),
            }
          : {
              ...commonConfig,
              detailLevel: config.detailLevel,
              targetCount:
                targetCount === undefined
                  ? undefined
                  : Math.max(1, targetCount),
            },
    });
  }

  function moveUnit(unitIndex: number, direction: -1 | 1) {
    if (!selectedChapter) {
      return;
    }

    const targetIndex = unitIndex + direction;
    if (
      targetIndex < 0 ||
      targetIndex >= selectedChapter.unitDrafts.length
    ) {
      return;
    }

    updateSelectedChapter((chapter) => {
      const unitDrafts = [...chapter.unitDrafts];
      const [unit] = unitDrafts.splice(unitIndex, 1);
      unitDrafts.splice(targetIndex, 0, unit);

      return {
        ...chapter,
        unitDrafts: unitDrafts.map((item, index) => ({
          ...item,
          order: index + 1,
        })),
      };
    });
  }

  function addUnit() {
    if (!selectedChapter) {
      return;
    }

    updateSelectedChapter((chapter) => {
      const nextOrder = chapter.unitDrafts.length + 1;
      const unit: TechniqueUnitDraft = {
        draftId: crypto.randomUUID(),
        chapterDraftId: chapter.draftId,
        code: `${chapter.code}-u${String(nextOrder).padStart(2, "0")}`,
        name: "新单元",
        description: "",
        order: nextOrder,
        learningObjectives: [],
        recommendedDetailLevel: "normal",
        recommendedKnowledgePointCountRange: { min: 3, max: 6 },
        knowledgeGenerationConfig: {
          includeInGeneration: true,
          detailLevel: "normal",
        },
        knowledgePointDrafts: [],
      };

      return {
        ...chapter,
        unitDrafts: [...chapter.unitDrafts, unit],
      };
    });
  }

  function deleteUnit(unitIndex: number) {
    updateSelectedChapter((chapter) => ({
      ...chapter,
      unitDrafts: chapter.unitDrafts
        .filter((_, index) => index !== unitIndex)
        .map((unit, index) => ({ ...unit, order: index + 1 })),
    }));
  }

  async function generateUnits(chapterDraftIds: string[]) {
    if (isGenerating) {
      return;
    }
    if (chapterDraftIds.length === 0) {
      setPageMessage({
        kind: "error",
        text: "当前没有等待生成单元的大章。",
      });
      return;
    }

    let completedStepCount = 0;
    try {
      setIsGenerating(true);
      setGenerationProgress({ phase: "preparing", detail: "正在整理当前大章和生成设置。" });
      await onGenerateUnits(draftState, chapterDraftIds, (phase) => {
        completedStepCount = unitGenerationSteps.findIndex(
          (step) => step.phase === phase,
        );
        setGenerationProgress({
          phase,
          completedStepCount,
          detail:
            phase === "waiting"
              ? "AI 正在生成单元结构，请耐心等待。"
              : phase === "validating"
                ? "AI 已返回，正在检查结构是否可用。"
                : "结构校验通过，正在保存新的草案版本。",
        });
      });
      setGenerationProgress({
        phase: "success",
        completedStepCount: unitGenerationSteps.length,
        detail:
          chapterDraftIds.length === 1
            ? "当前大章已生成新的单元版本。"
            : `已为 ${chapterDraftIds.length} 个大章生成单元版本。`,
      });
    } catch (error) {
      setGenerationProgress({
        phase: "error",
        completedStepCount,
        detail: error instanceof Error ? error.message : "生成单元失败。",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function saveUnits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChapter) {
      return;
    }
    if (selectedChapter.unitDrafts.length === 0) {
      setPageMessage({
        kind: "error",
        text: "当前大章至少需要保留一个单元。",
      });
      return;
    }
    if (
      selectedChapter.unitDrafts.some(
        (unit) => unit.code.trim() === "" || unit.name.trim() === "",
      )
    ) {
      setPageMessage({
        kind: "error",
        text: "每个单元都需要填写代码和名称。",
      });
      return;
    }
    if (
      new Set(
        selectedChapter.unitDrafts.map((unit) => unit.code.trim()),
      ).size !== selectedChapter.unitDrafts.length
    ) {
      setPageMessage({
        kind: "error",
        text: "当前大章中的单元代码不能重复。",
      });
      return;
    }
    if (
      selectedChapter.unitDrafts.some(
        (unit) =>
          unit.knowledgeGenerationConfig.targetCount !== undefined &&
          (unit.knowledgeGenerationConfig.targetCount < 1 ||
            unit.knowledgeGenerationConfig.targetCount > 30),
      )
    ) {
      setPageMessage({
        kind: "error",
        text: "目标知识点数量需要填写 1 到 30 之间的整数。",
      });
      return;
    }

    const normalizedChapter: TechniqueChapterDraft = {
      ...selectedChapter,
      unitDrafts: selectedChapter.unitDrafts.map((unit, index) => ({
        ...unit,
        code: unit.code.trim(),
        name: unit.name.trim(),
        description: unit.description.trim(),
        order: index + 1,
      })),
    };
    const chapterDrafts = draftState.chapterDrafts.map((chapter) =>
      chapter.draftId === normalizedChapter.draftId
        ? normalizedChapter
        : chapter,
    );
    const normalizedDraft: TechniqueCreationDraft = {
      ...draftState,
      stage: resolveUnitsStage(chapterDrafts),
      chapterDrafts,
    };

    try {
      onSaveUnits(normalizedDraft, [normalizedChapter.draftId]);
      setDraftState(normalizedDraft);
      setPageMessage({
        kind: "success",
        text: "当前大章的单元调整已保存为新的版本。",
      });
    } catch (error) {
      setPageMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "保存单元失败。",
      });
    }
  }

  return (
    <section className="page-panel">
      {generationProgress && (
        <UnitGenerationProgressDialog
          progress={generationProgress}
          onConfirm={() => setGenerationProgress(undefined)}
        />
      )}
      <PageToolbar
        title="生成与确认单元"
        backTo={`/ai-drafts/projects/${draft.projectId}/chapters`}
      />

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {draftState.techniqueDraft?.name ?? draftState.input.techniqueName}
          </p>
          <p className="intro">
            已生成 {generatedChapterCount} / {includedChapters.length} 个大章 ·
            共 {totalUnitCount} 个单元
          </p>
        </div>
        <div className="inline-actions unit-editor-commands">
          {totalUnitCount > 0 && (
            <Link
              className="button-link secondary-link"
              to={`/ai-drafts/projects/${draft.projectId}/knowledge`}
            >
              进入知识点生成
            </Link>
          )}
          <Link
            className="button-link secondary-link"
            to={`/ai-drafts/projects/${draft.projectId}/rules`}
          >
            功法规则
          </Link>
          <button
            type="button"
            disabled={isGenerating || pendingChapterIds.length === 0}
            onClick={() => generateUnits(pendingChapterIds)}
          >
            {isGenerating ? "正在生成单元..." : "生成全部未完成大章"}
          </button>
        </div>
      </div>

      <DraftCompletionPanel draft={draftState} />

      <section className="unit-stage-toolbar" aria-label="大章单元生成范围">
        <label>
          当前大章
          <select
            value={selectedChapterId}
            disabled={isGenerating}
            onChange={(event) => {
              setSelectedChapterId(event.target.value);
              setPageMessage(undefined);
            }}
          >
            {draftState.chapterDrafts.map((chapter, index) => (
              <option key={chapter.draftId} value={chapter.draftId}>
                {index + 1}. {chapter.name} · {chapter.unitDrafts.length} 个单元
              </option>
            ))}
          </select>
        </label>
        {selectedChapter && (
          <div className="unit-stage-meta">
            <span>
              {selectedChapter.unitGenerationConfig.includeInGeneration
                ? "参与生成"
                : "不参与生成"}
            </span>
            <span>
              单元精细度：
              {getKnowledgeDetailLevelLabel(
                selectedChapter.unitGenerationConfig.detailLevel,
              )}
            </span>
            <span>
              建议数量：
              {selectedChapter.recommendedUnitCountRange
                ? `${selectedChapter.recommendedUnitCountRange.min}–${selectedChapter.recommendedUnitCountRange.max}`
                : "未设置"}
            </span>
          </div>
        )}
      </section>

      {selectedChapter && (
        <form className="rule-config-form" onSubmit={saveUnits}>
          <div className="section-title-row">
            <div>
              <h2>{selectedChapter.name}</h2>
              <p className="progress-muted">{selectedChapter.description}</p>
            </div>
            <div className="inline-actions unit-editor-commands">
              <button
                className="secondary-button"
                type="button"
                disabled={
                  isGenerating ||
                  !selectedChapter.unitGenerationConfig.includeInGeneration
                }
                onClick={() => generateUnits([selectedChapter.draftId])}
              >
                {isGenerating
                  ? "正在生成单元..."
                  : selectedChapter.unitDrafts.length > 0
                  ? "重新生成当前大章"
                  : "生成当前大章"}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={addUnit}
              >
                添加单元
              </button>
            </div>
          </div>

          {selectedChapter.unitDrafts.length > 0 ? (
            <div className="unit-editor-list">
              {selectedChapter.unitDrafts.map((unit, unitIndex) => (
                <fieldset key={unit.draftId}>
                  <legend>单元 {unitIndex + 1}</legend>
                  <div className="chapter-editor-actions">
                    <label className="inline-checkbox">
                      <input
                        type="checkbox"
                        checked={
                          unit.knowledgeGenerationConfig.includeInGeneration
                        }
                        onChange={(event) =>
                          updateUnit(unitIndex, {
                            knowledgeGenerationConfig: {
                              ...unit.knowledgeGenerationConfig,
                              includeInGeneration: event.target.checked,
                            },
                          })
                        }
                      />
                      纳入知识点生成
                    </label>
                    <button
                      className="secondary-button compact-button"
                      type="button"
                      title="上移"
                      aria-label={`上移${unit.name}`}
                      disabled={unitIndex === 0}
                      onClick={() => moveUnit(unitIndex, -1)}
                    >
                      ↑
                    </button>
                    <button
                      className="secondary-button compact-button"
                      type="button"
                      title="下移"
                      aria-label={`下移${unit.name}`}
                      disabled={
                        unitIndex === selectedChapter.unitDrafts.length - 1
                      }
                      onClick={() => moveUnit(unitIndex, 1)}
                    >
                      ↓
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => deleteUnit(unitIndex)}
                    >
                      删除单元
                    </button>
                  </div>

                  <div className="creation-form-grid">
                    <label>
                      单元代码
                      <input
                        value={unit.code}
                        maxLength={40}
                        onChange={(event) =>
                          updateUnit(unitIndex, { code: event.target.value })
                        }
                      />
                      <FieldReference standardKey="structureCode" />
                    </label>
                    <label>
                      单元名称
                      <input
                        value={unit.name}
                        maxLength={80}
                        onChange={(event) =>
                          updateUnit(unitIndex, { name: event.target.value })
                        }
                      />
                      <FieldReference standardKey="structureName" />
                    </label>
                    <label className="full-width-field">
                      单元说明
                      <textarea
                        value={unit.description}
                        maxLength={1500}
                        onChange={(event) =>
                          updateUnit(unitIndex, {
                            description: event.target.value,
                          })
                        }
                      />
                      <FieldReference standardKey="structureDescription" />
                    </label>
                    <label className="full-width-field">
                      学习目标（每行一个）
                      <textarea
                        value={unit.learningObjectives.join("\n")}
                        onChange={(event) =>
                          updateUnit(unitIndex, {
                            learningObjectives: event.target.value
                              .split("\n")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                      <FieldReference standardKey="learningObjectives" />
                    </label>
                    <label>
                      知识点精细度
                      <select
                        value={unit.knowledgeGenerationConfig.detailLevel}
                        onChange={(event) =>
                          updateKnowledgeDetailLevel(
                            unitIndex,
                            event.target.value as
                              | KnowledgeGranularity
                              | "custom",
                          )
                        }
                      >
                        <option value="rough">粗略</option>
                        <option value="normal">普通</option>
                        <option value="detailed">细分</option>
                        <option value="custom">自定义数量</option>
                      </select>
                      <FieldReference standardKey="generationDetailLevel" />
                    </label>
                    <label>
                      目标知识点数量
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={
                          unit.knowledgeGenerationConfig.targetCount ?? ""
                        }
                        placeholder={
                          unit.recommendedKnowledgePointCountRange
                            ? `${unit.recommendedKnowledgePointCountRange.min}–${unit.recommendedKnowledgePointCountRange.max}`
                            : "3–6"
                        }
                        onChange={(event) =>
                          updateKnowledgeTargetCount(
                            unitIndex,
                            event.target.value === ""
                              ? undefined
                              : Number(event.target.value),
                          )
                        }
                      />
                      <FieldReference
                        standardKey="unitTargetCount"
                        recommendation={
                          unit.recommendedKnowledgePointCountRange
                            ? `AI 建议 ${unit.recommendedKnowledgePointCountRange.min}～${unit.recommendedKnowledgePointCountRange.max} 个知识点。`
                            : undefined
                        }
                        preview={
                          unit.knowledgeGenerationConfig.targetCount
                            ? `预计生成约 ${unit.knowledgeGenerationConfig.targetCount} 个知识点。`
                            : undefined
                        }
                      />
                    </label>
                  </div>
                </fieldset>
              ))}
            </div>
          ) : (
            <div className="empty-stage">
              <p>当前大章还没有单元。</p>
              {selectedChapter.unitGenerationConfig.includeInGeneration && (
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => generateUnits([selectedChapter.draftId])}
                >
                  {isGenerating ? "正在生成单元..." : "生成当前大章"}
                </button>
              )}
            </div>
          )}

          {pageMessage && (
            <p
              className={
                pageMessage.kind === "success" ? "form-success" : "form-error"
              }
            >
              {pageMessage.text}
            </p>
          )}

          <div className="inline-actions">
            {selectedChapter.unitDrafts.length > 0 && (
              <button type="submit">保存当前大章单元</button>
            )}
            <Link
              className="button-link secondary-link"
              to="/ai-drafts"
            >
              返回草案总览
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}

type TechniqueKnowledgeRouteProps = {
  repository: TechniqueCreationDraftRepository;
  catalog: TechniqueImportCatalog;
  onGenerateKnowledgePoints: (
    draft: TechniqueCreationDraft,
    unitDraftIds: string[],
    onProgress?: (phase: "waiting" | "validating" | "saving") => void,
  ) => Promise<{
    projectId: string;
    variantId: string;
  }>;
  onSaveKnowledgePoints: (
    draft: TechniqueCreationDraft,
    unitDraftIds: string[],
  ) => {
    projectId: string;
    variantId: string;
  };
};

function TechniqueKnowledgeRoute({
  repository,
  catalog,
  onGenerateKnowledgePoints,
  onSaveKnowledgePoints,
}: TechniqueKnowledgeRouteProps) {
  const { projectId } = useParams();
  const draft = projectId
    ? materializeTechniqueCreationDraft(repository, projectId)
    : undefined;

  if (!draft) {
    return <Navigate to="/ai-drafts" replace />;
  }

  return (
    <TechniqueKnowledgePage
      draft={draft}
      catalog={catalog}
      onGenerateKnowledgePoints={onGenerateKnowledgePoints}
      onSaveKnowledgePoints={onSaveKnowledgePoints}
    />
  );
}

type TechniqueKnowledgePageProps = {
  draft: TechniqueCreationDraft;
  catalog: TechniqueImportCatalog;
  onGenerateKnowledgePoints: (
    draft: TechniqueCreationDraft,
    unitDraftIds: string[],
    onProgress?: (phase: "waiting" | "validating" | "saving") => void,
  ) => Promise<{
    projectId: string;
    variantId: string;
  }>;
  onSaveKnowledgePoints: (
    draft: TechniqueCreationDraft,
    unitDraftIds: string[],
  ) => {
    projectId: string;
    variantId: string;
  };
};

function parseDelimitedDraftValues(value: string): string[] {
  return value.split(/[,，\n]/).map((item) => item.trim());
}

function normalizeDelimitedDraftValues(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function parseReviewIntervalDraft(value: string): number[] | undefined {
  if (value.trim().length === 0) {
    return undefined;
  }

  return value.split(/[,，\s]+/).map(Number);
}

function TechniqueKnowledgePage({
  draft,
  catalog,
  onGenerateKnowledgePoints,
  onSaveKnowledgePoints,
}: TechniqueKnowledgePageProps) {
  const initialChapter =
    draft.chapterDrafts.find((chapter) => chapter.unitDrafts.length > 0) ??
    draft.chapterDrafts[0];
  const initialUnit =
    initialChapter?.unitDrafts.find(
      (unit) => unit.knowledgeGenerationConfig.includeInGeneration,
    ) ?? initialChapter?.unitDrafts[0];
  const [draftState, setDraftState] = useState(() => structuredClone(draft));
  const [selectedChapterId, setSelectedChapterId] = useState(
    initialChapter?.draftId ?? "",
  );
  const [selectedUnitId, setSelectedUnitId] = useState(
    initialUnit?.draftId ?? "",
  );
  const [selectedKnowledgePointId, setSelectedKnowledgePointId] = useState(
    initialUnit?.knowledgePointDrafts[0]?.draftId ?? "",
  );
  const [isKnowledgeDirty, setIsKnowledgeDirty] = useState(false);
  const [knowledgeValidationErrors, setKnowledgeValidationErrors] = useState<
    string[]
  >([]);
  const [pageMessage, setPageMessage] = useState<UnitsPageMessage>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<UnitGenerationProgress>();
  const selectedChapter = draftState.chapterDrafts.find(
    (chapter) => chapter.draftId === selectedChapterId,
  );
  const selectedUnit = selectedChapter?.unitDrafts.find(
    (unit) => unit.draftId === selectedUnitId,
  );
  const selectedKnowledgePoint = selectedUnit?.knowledgePointDrafts.find(
    (knowledgePoint) => knowledgePoint.draftId === selectedKnowledgePointId,
  );
  const allUnits = draftState.chapterDrafts.flatMap(
    (chapter) => chapter.unitDrafts,
  );
  const includedUnits = allUnits.filter(
    (unit) => unit.knowledgeGenerationConfig.includeInGeneration,
  );
  const generatedUnitCount = includedUnits.filter(
    (unit) => unit.knowledgePointDrafts.length > 0,
  ).length;
  const pendingUnitIds = includedUnits
    .filter((unit) => unit.knowledgePointDrafts.length === 0)
    .map((unit) => unit.draftId);
  const totalKnowledgePointCount = allUnits.reduce(
    (total, unit) => total + unit.knowledgePointDrafts.length,
    0,
  );
  const currentKnowledgePointBaseValue = draftState.chapterDrafts.reduce(
    (chapterTotal, chapter) =>
      chapterTotal +
      (chapter.unitGenerationConfig.includeInGeneration
        ? chapter.unitDrafts.reduce(
            (unitTotal, unit) =>
              unitTotal +
              (unit.knowledgeGenerationConfig.includeInGeneration
                ? unit.knowledgePointDrafts.reduce(
                    (knowledgeTotal, knowledgePoint) =>
                      knowledgeTotal +
                      (getEffectiveKnowledgePointBaseValue(knowledgePoint) ?? 0),
                    0,
                  )
                : 0),
            0,
          )
        : 0),
    0,
  );
  const experienceBudgetDifference =
    draftState.input.experienceBudgetTotal === undefined
      ? undefined
      : currentKnowledgePointBaseValue - draftState.input.experienceBudgetTotal;
  const prerequisiteCandidates = allUnits.flatMap((unit) =>
    unit.knowledgePointDrafts.map((knowledgePoint) => ({
      knowledgePoint,
      unit,
      chapter: draftState.chapterDrafts.find(
        (chapter) => chapter.draftId === unit.chapterDraftId,
      ),
    })),
  );
  const selectableChapters = draftState.chapterDrafts.filter(
    (chapter) => chapter.unitDrafts.length > 0,
  );
  const importValidationIssues = useMemo(
    () => validateTechniqueCreationDraftForImport(draftState, catalog),
    [catalog, draftState],
  );

  useEffect(() => {
    const nextDraft = structuredClone(draft);
    setDraftState(nextDraft);
    setSelectedChapterId((currentChapterId) => {
      const currentChapter = nextDraft.chapterDrafts.find(
        (chapter) => chapter.draftId === currentChapterId,
      );
      return currentChapter?.unitDrafts.length
        ? currentChapterId
        : nextDraft.chapterDrafts.find(
              (chapter) => chapter.unitDrafts.length > 0,
            )?.draftId ?? "";
    });
    setSelectedUnitId((currentUnitId) =>
      nextDraft.chapterDrafts.some((chapter) =>
        chapter.unitDrafts.some((unit) => unit.draftId === currentUnitId),
      )
        ? currentUnitId
        : nextDraft.chapterDrafts
            .flatMap((chapter) => chapter.unitDrafts)
            .find(
              (unit) =>
                unit.knowledgeGenerationConfig.includeInGeneration,
            )?.draftId ?? "",
    );
    setSelectedKnowledgePointId((currentKnowledgePointId) =>
      nextDraft.chapterDrafts.some((chapter) =>
        chapter.unitDrafts.some((unit) =>
          unit.knowledgePointDrafts.some(
            (knowledgePoint) =>
              knowledgePoint.draftId === currentKnowledgePointId,
          ),
        ),
      )
        ? currentKnowledgePointId
        : nextDraft.chapterDrafts
            .flatMap((chapter) => chapter.unitDrafts)
            .flatMap((unit) => unit.knowledgePointDrafts)[0]?.draftId ?? "",
    );
    setIsKnowledgeDirty(false);
    setKnowledgeValidationErrors([]);
  }, [draft]);

  useEffect(() => {
    if (!selectedUnit) {
      if (selectedKnowledgePointId !== "") {
        setSelectedKnowledgePointId("");
      }
      return;
    }

    const selectedKnowledgePointBelongsToCurrentUnit =
      selectedUnit.knowledgePointDrafts.some(
        (knowledgePoint) =>
          knowledgePoint.draftId === selectedKnowledgePointId,
      );

    if (!selectedKnowledgePointBelongsToCurrentUnit) {
      setSelectedKnowledgePointId(
        selectedUnit.knowledgePointDrafts[0]?.draftId ?? "",
      );
    }
  }, [selectedKnowledgePointId, selectedUnit]);

  function selectChapter(chapterDraftId: string) {
    const chapter = draftState.chapterDrafts.find(
      (item) => item.draftId === chapterDraftId,
    );
    const nextUnit =
      chapter?.unitDrafts.find(
        (unit) => unit.knowledgeGenerationConfig.includeInGeneration,
      ) ?? chapter?.unitDrafts[0];

    setSelectedChapterId(chapterDraftId);
    setSelectedUnitId(nextUnit?.draftId ?? "");
    setSelectedKnowledgePointId(
      nextUnit?.knowledgePointDrafts[0]?.draftId ?? "",
    );
    setPageMessage(undefined);
  }

  function selectUnit(unitDraftId: string) {
    const unit = selectedChapter?.unitDrafts.find(
      (item) => item.draftId === unitDraftId,
    );

    setSelectedUnitId(unitDraftId);
    setSelectedKnowledgePointId(unit?.knowledgePointDrafts[0]?.draftId ?? "");
    setPageMessage(undefined);
    setKnowledgeValidationErrors([]);
  }

  function updateSelectedUnit(
    updater: (unit: TechniqueUnitDraft) => TechniqueUnitDraft,
  ) {
    setDraftState((currentDraft) => {
      const chapterDrafts = currentDraft.chapterDrafts.map((chapter) => ({
        ...chapter,
        unitDrafts: chapter.unitDrafts.map((unit) =>
          unit.draftId === selectedUnitId ? updater(unit) : unit,
        ),
      }));

      return {
        ...currentDraft,
        stage: resolveTechniqueKnowledgeStage(chapterDrafts),
        chapterDrafts,
        updatedAt: new Date().toISOString(),
      };
    });
    setIsKnowledgeDirty(true);
    setKnowledgeValidationErrors([]);
    setPageMessage(undefined);
  }

  function updateKnowledgePoint(
    patch: Partial<TechniqueCreationKnowledgePointDraft>,
  ) {
    updateSelectedUnit((unit) => ({
      ...unit,
      knowledgePointDrafts: unit.knowledgePointDrafts.map((knowledgePoint) =>
        knowledgePoint.draftId === selectedKnowledgePointId
          ? { ...knowledgePoint, ...patch }
          : knowledgePoint,
      ),
    }));
  }

  function addKnowledgePoint() {
    if (!selectedUnit || !selectedChapter) {
      return;
    }

    const draftId = crypto.randomUUID();
    const maxLayer = draftState.techniqueDraft?.maxLayer ?? 6;
    const practiceDefaults = draftState.practiceDefaultsDraft;
    const knowledgePoint: TechniqueCreationKnowledgePointDraft = {
      draftId,
      chapterDraftId: selectedChapter.draftId,
      unitDraftId: selectedUnit.draftId,
      name: "新知识点",
      description: "请补充当前知识点的学习内容、边界和完成目标。",
      granularity: selectedUnit.recommendedDetailLevel,
      typeTags: [],
      learningPerspectives: [],
      difficulty: 1,
      importance: 1,
      targetLayer: maxLayer,
      maxTrainableLayer: maxLayer,
      requiredExerciseCount: practiceDefaults?.requiredExerciseCount ?? 10,
      requiredNoteCount: practiceDefaults?.requiredNoteCount ?? 2,
      requiredThinkingCount: practiceDefaults?.requiredThinkingCount ?? 2,
      manaWeight: draftState.techniqueDraft?.manaWeight ?? 0.5,
      insightWeight: draftState.techniqueDraft?.insightWeight ?? 0.5,
      prerequisiteDraftIds: [],
      generationRationale: "用户在知识点确认阶段手动新增。",
    };

    updateSelectedUnit((unit) => ({
      ...unit,
      knowledgePointDrafts: [...unit.knowledgePointDrafts, knowledgePoint],
    }));
    setSelectedKnowledgePointId(draftId);
  }

  function deleteKnowledgePoint(draftId: string) {
    if (!selectedUnit) {
      return;
    }

    const externalDependent = prerequisiteCandidates.find(
      ({ knowledgePoint }) =>
        knowledgePoint.unitDraftId !== selectedUnit.draftId &&
        knowledgePoint.prerequisiteDraftIds.includes(draftId),
    );
    if (externalDependent) {
      setPageMessage({
        kind: "error",
        text: `“${externalDependent.knowledgePoint.name}”仍依赖当前知识点，请先在其所属单元解除依赖。`,
      });
      return;
    }

    const deletedIndex = selectedUnit.knowledgePointDrafts.findIndex(
      (knowledgePoint) => knowledgePoint.draftId === draftId,
    );
    const remainingKnowledgePoints = selectedUnit.knowledgePointDrafts.filter(
      (knowledgePoint) => knowledgePoint.draftId !== draftId,
    );
    const nextSelectedKnowledgePoint =
      remainingKnowledgePoints[Math.min(deletedIndex, remainingKnowledgePoints.length - 1)];

    updateSelectedUnit((unit) => ({
      ...unit,
      knowledgePointDrafts: unit.knowledgePointDrafts
        .filter((knowledgePoint) => knowledgePoint.draftId !== draftId)
        .map((knowledgePoint) => ({
          ...knowledgePoint,
          prerequisiteDraftIds: knowledgePoint.prerequisiteDraftIds.filter(
            (prerequisiteId) => prerequisiteId !== draftId,
          ),
        })),
    }));
    if (draftId === selectedKnowledgePointId) {
      setSelectedKnowledgePointId(nextSelectedKnowledgePoint?.draftId ?? "");
    }
  }

  function moveKnowledgePoint(draftId: string, direction: -1 | 1) {
    if (!selectedUnit) {
      return;
    }

    const currentIndex = selectedUnit.knowledgePointDrafts.findIndex(
      (knowledgePoint) => knowledgePoint.draftId === draftId,
    );
    const targetIndex = currentIndex + direction;
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= selectedUnit.knowledgePointDrafts.length
    ) {
      return;
    }

    updateSelectedUnit((unit) => {
      const knowledgePointDrafts = [...unit.knowledgePointDrafts];
      const [knowledgePoint] = knowledgePointDrafts.splice(currentIndex, 1);
      knowledgePointDrafts.splice(targetIndex, 0, knowledgePoint);
      return { ...unit, knowledgePointDrafts };
    });
  }

  function toggleKnowledgePrerequisite(
    prerequisiteDraftId: string,
    isSelected: boolean,
  ) {
    if (!selectedKnowledgePoint) {
      return;
    }

    const prerequisiteDraftIds = isSelected
      ? [
          ...new Set([
            ...selectedKnowledgePoint.prerequisiteDraftIds,
            prerequisiteDraftId,
          ]),
        ]
      : selectedKnowledgePoint.prerequisiteDraftIds.filter(
          (draftId) => draftId !== prerequisiteDraftId,
        );
    updateKnowledgePoint({ prerequisiteDraftIds });
  }

  function discardKnowledgeChanges() {
    const nextDraft = structuredClone(draft);
    const nextUnit = nextDraft.chapterDrafts
      .flatMap((chapter) => chapter.unitDrafts)
      .find((unit) => unit.draftId === selectedUnitId);

    setDraftState(nextDraft);
    setSelectedKnowledgePointId(
      nextUnit?.knowledgePointDrafts.find(
        (knowledgePoint) =>
          knowledgePoint.draftId === selectedKnowledgePointId,
      )?.draftId ?? nextUnit?.knowledgePointDrafts[0]?.draftId ?? "",
    );
    setIsKnowledgeDirty(false);
    setKnowledgeValidationErrors([]);
    setPageMessage({ kind: "success", text: "已放弃当前单元尚未保存的修改。" });
  }

  function saveKnowledgePoints(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnit) {
      return;
    }

    const normalizedDraft = structuredClone(draftState);
    const normalizedUnit = normalizedDraft.chapterDrafts
      .flatMap((chapter) => chapter.unitDrafts)
      .find((unit) => unit.draftId === selectedUnit.draftId);
    if (!normalizedUnit) {
      setPageMessage({ kind: "error", text: "当前单元已不存在，无法保存。" });
      return;
    }

    normalizedUnit.knowledgePointDrafts = normalizedUnit.knowledgePointDrafts.map(
      (knowledgePoint) => ({
        ...knowledgePoint,
        name: knowledgePoint.name.trim(),
        description: knowledgePoint.description.trim(),
        typeTags: normalizeDelimitedDraftValues(knowledgePoint.typeTags),
        learningPerspectives: normalizeDelimitedDraftValues(
          knowledgePoint.learningPerspectives,
        ),
        prerequisiteDraftIds: [...new Set(knowledgePoint.prerequisiteDraftIds)],
      }),
    );
    normalizedDraft.stage = resolveTechniqueKnowledgeStage(
      normalizedDraft.chapterDrafts,
    );

    const errors = validateUnitKnowledgePointDrafts(
      normalizedUnit,
      normalizedDraft.techniqueDraft?.maxLayer ?? 6,
      normalizedDraft.chapterDrafts.flatMap((chapter) =>
        chapter.unitDrafts.flatMap((unit) => unit.knowledgePointDrafts),
      ),
    );
    if (errors.length > 0) {
      setKnowledgeValidationErrors(errors);
      setPageMessage({
        kind: "error",
        text: `当前单元有 ${errors.length} 项内容需要修正后才能保存。`,
      });
      return;
    }

    try {
      onSaveKnowledgePoints(normalizedDraft, [normalizedUnit.draftId]);
      setDraftState(normalizedDraft);
      setIsKnowledgeDirty(false);
      setKnowledgeValidationErrors([]);
      setPageMessage({
        kind: "success",
        text: "当前单元的人工调整已保存为新的知识点版本。",
      });
    } catch (error) {
      setPageMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "保存知识点失败。",
      });
    }
  }

  async function generateKnowledgePoints(unitDraftIds: string[]) {
    if (isGenerating) {
      return;
    }
    if (isKnowledgeDirty) {
      setPageMessage({
        kind: "error",
        text: "请先保存或放弃当前单元的人工调整，再重新生成知识点。",
      });
      return;
    }
    if (unitDraftIds.length === 0) {
      setPageMessage({
        kind: "error",
        text: "当前没有等待生成知识点的单元。",
      });
      return;
    }

    let completedStepCount = 0;
    try {
      setIsGenerating(true);
      setGenerationProgress({ phase: "preparing", detail: "正在整理单元范围和知识点精细度。" });
      await onGenerateKnowledgePoints(draftState, unitDraftIds, (phase) => {
        completedStepCount = unitGenerationSteps.findIndex((step) => step.phase === phase);
        setGenerationProgress({
          phase,
          completedStepCount,
          detail: phase === "waiting"
            ? "AI 正在生成知识点，请耐心等待。"
            : phase === "validating"
              ? "AI 已返回，正在检查知识点结构是否可用。"
              : "知识点校验通过，正在保存草案版本。",
        });
      });
      setGenerationProgress({
        phase: "success",
        completedStepCount: unitGenerationSteps.length,
        detail: unitDraftIds.length === 1 ? "当前单元已生成新的知识点版本。" : `已为 ${unitDraftIds.length} 个单元生成知识点版本。`,
      });
    } catch (error) {
      setGenerationProgress({ phase: "error", completedStepCount, detail: error instanceof Error ? error.message : "生成知识点失败。" });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="page-panel">
      {generationProgress && (
        <UnitGenerationProgressDialog
          progress={generationProgress}
          onConfirm={() => setGenerationProgress(undefined)}
        />
      )}
      <PageToolbar
        title="生成与确认知识点"
        backTo={`/ai-drafts/projects/${draft.projectId}/units`}
      />

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {draftState.techniqueDraft?.name ?? draftState.input.techniqueName}
          </p>
          <p className="intro">
            已生成 {generatedUnitCount} / {includedUnits.length} 个单元 · 共
            {" "}
            {totalKnowledgePointCount} 个知识点
          </p>
          {draftState.input.experienceBudgetTotal !== undefined && (
            <p className="progress-muted">
              目标总经验：{draftState.input.experienceBudgetTotal.toLocaleString()} ·
              当前知识点基础值合计：{currentKnowledgePointBaseValue.toLocaleString()} ·
              差异：
              {experienceBudgetDifference !== undefined && experienceBudgetDifference > 0
                ? "+"
                : ""}
              {experienceBudgetDifference?.toLocaleString() ?? "待计算"}
            </p>
          )}
        </div>
        <div className="inline-actions unit-editor-commands">
          <Link
            className="button-link secondary-link"
            to={`/ai-drafts/projects/${draft.projectId}/rules`}
          >
            功法规则
          </Link>
          <button
            type="button"
            disabled={pendingUnitIds.length === 0 || isKnowledgeDirty}
            onClick={() => generateKnowledgePoints(pendingUnitIds)}
          >
            生成全部未完成单元
          </button>
        </div>
      </div>

      <DraftCompletionPanel
        draft={{ ...draftState, validationIssues: importValidationIssues }}
      />

      {selectableChapters.length > 0 ? (
        <>
          <section
            className="knowledge-stage-toolbar"
            aria-label="知识点生成范围"
          >
            <label>
              当前大章
              <select
                value={selectedChapterId}
                disabled={isKnowledgeDirty}
                onChange={(event) => selectChapter(event.target.value)}
              >
                {selectableChapters.map((chapter, index) => (
                  <option key={chapter.draftId} value={chapter.draftId}>
                    {index + 1}. {chapter.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              当前单元
              <select
                value={selectedUnitId}
                disabled={isKnowledgeDirty}
                onChange={(event) => selectUnit(event.target.value)}
              >
                {selectedChapter?.unitDrafts.map((unit, index) => (
                  <option key={unit.draftId} value={unit.draftId}>
                    {index + 1}. {unit.name} · {unit.knowledgePointDrafts.length}
                    个知识点
                  </option>
                ))}
              </select>
            </label>
            {isKnowledgeDirty && (
              <p className="knowledge-dirty-status">
                当前单元有未保存修改，保存或放弃后可以切换范围。
              </p>
            )}
          </section>

          {selectedUnit && (
            <section className="knowledge-stage-content">
              <div className="section-title-row">
                <div>
                  <h2>{selectedUnit.name}</h2>
                  <p className="progress-muted">{selectedUnit.description}</p>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={
                    !selectedUnit.knowledgeGenerationConfig
                      .includeInGeneration || isKnowledgeDirty
                  }
                  onClick={() =>
                    generateKnowledgePoints([selectedUnit.draftId])
                  }
                >
                  {selectedUnit.knowledgePointDrafts.length > 0
                    ? "重新生成当前单元知识点"
                    : "生成当前单元知识点"}
                </button>
              </div>

              <div className="unit-stage-meta">
                <span>
                  {selectedUnit.knowledgeGenerationConfig.includeInGeneration
                    ? "参与知识点生成"
                    : "不参与知识点生成"}
                </span>
                <span>
                  精细度：
                  {getKnowledgeDetailLevelLabel(
                    selectedUnit.knowledgeGenerationConfig.detailLevel,
                  )}
                </span>
                <span>
                  目标数量：
                  {selectedUnit.knowledgeGenerationConfig.targetCount ??
                    (selectedUnit.recommendedKnowledgePointCountRange
                      ? `${selectedUnit.recommendedKnowledgePointCountRange.min}–${selectedUnit.recommendedKnowledgePointCountRange.max}`
                      : "由 AI 决定")}
                </span>
              </div>

              <form
                className="knowledge-editor-form"
                onSubmit={saveKnowledgePoints}
              >
                <div className="knowledge-editor-heading">
                  <div>
                    <h3>当前单元知识点</h3>
                    <p className="progress-muted">
                      {selectedUnit.knowledgePointDrafts.length} 个知识点
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={addKnowledgePoint}
                  >
                    添加知识点
                  </button>
                </div>

                {selectedUnit.knowledgePointDrafts.length > 0 &&
                selectedKnowledgePoint ? (
                  <div className="knowledge-editor-layout">
                    <div
                      className="knowledge-editor-index"
                      aria-label="当前单元知识点目录"
                    >
                      {selectedUnit.knowledgePointDrafts.map(
                        (knowledgePoint, knowledgeIndex) => (
                          <div
                            className={
                              knowledgePoint.draftId ===
                              selectedKnowledgePoint.draftId
                                ? "knowledge-index-item is-selected"
                                : "knowledge-index-item"
                            }
                            key={knowledgePoint.draftId}
                          >
                            <button
                              className="knowledge-index-select"
                              type="button"
                              onClick={() =>
                                setSelectedKnowledgePointId(
                                  knowledgePoint.draftId,
                                )
                              }
                            >
                              <span>{knowledgeIndex + 1}</span>
                              <strong>{knowledgePoint.name}</strong>
                            </button>
                            <div className="knowledge-index-actions">
                              <button
                                className="secondary-button compact-button"
                                type="button"
                                title="上移"
                                aria-label={`上移${knowledgePoint.name}`}
                                disabled={knowledgeIndex === 0}
                                onClick={() =>
                                  moveKnowledgePoint(
                                    knowledgePoint.draftId,
                                    -1,
                                  )
                                }
                              >
                                ↑
                              </button>
                              <button
                                className="secondary-button compact-button"
                                type="button"
                                title="下移"
                                aria-label={`下移${knowledgePoint.name}`}
                                disabled={
                                  knowledgeIndex ===
                                  selectedUnit.knowledgePointDrafts.length - 1
                                }
                                onClick={() =>
                                  moveKnowledgePoint(
                                    knowledgePoint.draftId,
                                    1,
                                  )
                                }
                              >
                                ↓
                              </button>
                              <button
                                className="danger-button"
                                type="button"
                                onClick={() =>
                                  deleteKnowledgePoint(knowledgePoint.draftId)
                                }
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>

                    <fieldset className="knowledge-point-editor">
                      <legend>
                        编辑知识点 {selectedUnit.knowledgePointDrafts.findIndex(
                          (knowledgePoint) =>
                            knowledgePoint.draftId ===
                            selectedKnowledgePoint.draftId,
                        ) + 1}
                      </legend>
                      <div className="creation-form-grid">
                        <label className="full-width-field">
                          名称
                          <input
                            required
                            maxLength={80}
                            value={selectedKnowledgePoint.name}
                            onChange={(event) =>
                              updateKnowledgePoint({ name: event.target.value })
                            }
                          />
                          <FieldReference standardKey="knowledgeName" />
                        </label>
                        <label className="full-width-field">
                          学习边界说明
                          <textarea
                            required
                            maxLength={1500}
                            value={selectedKnowledgePoint.description}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                description: event.target.value,
                              })
                            }
                          />
                          <FieldReference standardKey="knowledgeDescription" />
                        </label>
                        <label>
                          精细度
                          <select
                            value={selectedKnowledgePoint.granularity}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                granularity: event.target
                                  .value as KnowledgeGranularity,
                              })
                            }
                          >
                            <option value="rough">粗略</option>
                            <option value="normal">普通</option>
                            <option value="detailed">细分</option>
                          </select>
                          <FieldReference standardKey="generationDetailLevel" />
                        </label>
                        <label>
                          类型标签
                          <input
                            value={selectedKnowledgePoint.typeTags.join(", ")}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                typeTags: parseDelimitedDraftValues(
                                  event.target.value,
                                ),
                              })
                            }
                          />
                          <FieldReference standardKey="knowledgeTags" />
                        </label>
                        <label>
                          学习视角
                          <input
                            value={selectedKnowledgePoint.learningPerspectives.join(
                              ", ",
                            )}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                learningPerspectives: parseDelimitedDraftValues(
                                  event.target.value,
                                ),
                              })
                            }
                          />
                          <FieldReference standardKey="knowledgeTags" />
                        </label>
                        <label>
                          难度
                          <input
                            type="number"
                            min="0.1"
                            max="5"
                            step="0.01"
                            value={selectedKnowledgePoint.difficulty}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                difficulty: Number(event.target.value),
                              })
                            }
                          />
                          <FieldReference standardKey="knowledgeDifficulty" />
                        </label>
                        <label>
                          重要度
                          <input
                            type="number"
                            min="0.1"
                            max="5"
                            step="0.01"
                            value={selectedKnowledgePoint.importance}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                importance: Number(event.target.value),
                              })
                            }
                          />
                          <FieldReference standardKey="knowledgeImportance" />
                        </label>
                        <label>
                          目标层数
                          <input
                            type="number"
                            min="1"
                            max={selectedKnowledgePoint.maxTrainableLayer}
                            step="1"
                            value={selectedKnowledgePoint.targetLayer}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                targetLayer: Number(event.target.value),
                              })
                            }
                          />
                          <FieldReference standardKey="knowledgeLayer" />
                        </label>
                        <label>
                          最高可修炼层数
                          <input
                            type="number"
                            min="1"
                            max={draftState.techniqueDraft?.maxLayer ?? 6}
                            step="1"
                            value={selectedKnowledgePoint.maxTrainableLayer}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                maxTrainableLayer: Number(event.target.value),
                              })
                            }
                          />
                          <FieldReference standardKey="knowledgeLayer" />
                        </label>
                        <label>
                          练习要求
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={selectedKnowledgePoint.requiredExerciseCount}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                requiredExerciseCount: Number(
                                  event.target.value,
                                ),
                              })
                            }
                          />
                          <FieldReference standardKey="requiredExerciseCount" />
                        </label>
                        <label>
                          笔记要求
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="1"
                            value={selectedKnowledgePoint.requiredNoteCount}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                requiredNoteCount: Number(event.target.value),
                              })
                            }
                          />
                          <FieldReference standardKey="requiredNoteCount" />
                        </label>
                        <label>
                          思考要求
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="1"
                            value={selectedKnowledgePoint.requiredThinkingCount}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                requiredThinkingCount: Number(
                                  event.target.value,
                                ),
                              })
                            }
                          />
                          <FieldReference standardKey="requiredThinkingCount" />
                        </label>
                        <label>
                          基础价值调整
                          <input
                            type="number"
                            min="-1000000"
                            max="1000000"
                            step="1"
                            placeholder="例如：+300 或 -200"
                            value={selectedKnowledgePoint.baseValueAdjustment ?? ""}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                baseValueAdjustment:
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                                baseValueAdjustmentIsManual:
                                  event.target.value === "" ? undefined : true,
                              })
                            }
                          />
                          <FieldReference
                            standardKey="knowledgeBaseValue"
                            preview={`当前生效值：${
                              getEffectiveKnowledgePointBaseValue(
                                selectedKnowledgePoint,
                              )?.toLocaleString() ?? "待计算"
                            }`}
                          />
                        </label>
                        <label>
                          法力倾向
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={selectedKnowledgePoint.manaWeight}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                manaWeight: Number(event.target.value),
                              })
                            }
                          />
                          <FieldReference
                            standardKey="knowledgeTendencyWeight"
                          />
                        </label>
                        <label>
                          神识倾向
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={selectedKnowledgePoint.insightWeight}
                            onChange={(event) =>
                              updateKnowledgePoint({
                                insightWeight: Number(event.target.value),
                              })
                            }
                          />
                          <FieldReference
                            standardKey="knowledgeTendencyWeight"
                          />
                        </label>
                        <label className="full-width-field">
                          自定义复习间隔
                          <input
                            key={`${selectedKnowledgePoint.draftId}-review`}
                            defaultValue={
                              selectedKnowledgePoint.reviewIntervalsOverride?.join(
                                ", ",
                              ) ?? ""
                            }
                            placeholder={
                              draftState.practiceDefaultsDraft?.reviewSchedule
                                .intervalsDays.join(", ")
                            }
                            onChange={(event) =>
                              updateKnowledgePoint({
                                reviewIntervalsOverride:
                                  parseReviewIntervalDraft(event.target.value),
                              })
                            }
                          />
                          <FieldReference
                            standardKey="knowledgeReviewIntervals"
                          />
                        </label>
                      </div>

                      <div className="knowledge-prerequisite-field">
                        <strong>前置知识点</strong>
                        <FieldReference standardKey="knowledgePrerequisites" />
                        <div className="knowledge-prerequisite-list">
                          {prerequisiteCandidates
                            .filter(
                              ({ knowledgePoint }) =>
                                knowledgePoint.draftId !==
                                selectedKnowledgePoint.draftId,
                            )
                            .map(({ knowledgePoint, unit, chapter }) => (
                              <label
                                className="inline-checkbox"
                                key={knowledgePoint.draftId}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedKnowledgePoint.prerequisiteDraftIds.includes(
                                    knowledgePoint.draftId,
                                  )}
                                  onChange={(event) =>
                                    toggleKnowledgePrerequisite(
                                      knowledgePoint.draftId,
                                      event.target.checked,
                                    )
                                  }
                                />
                                {chapter?.name ?? "未命名大章"} · {unit.name} · {knowledgePoint.name}
                              </label>
                            ))}
                          {prerequisiteCandidates.length === 1 && (
                            <span className="progress-muted">
                              当前功法没有其他可选知识点。
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="knowledge-generation-rationale">
                        草案来源说明：{selectedKnowledgePoint.generationRationale}
                      </p>
                    </fieldset>
                  </div>
                ) : (
                  <div className="empty-stage">
                    <p>当前单元没有知识点，可以手动添加或重新生成。</p>
                    <button type="button" onClick={addKnowledgePoint}>
                      添加第一个知识点
                    </button>
                  </div>
                )}

                {knowledgeValidationErrors.length > 0 && (
                  <section
                    className="knowledge-validation-errors"
                    aria-label="知识点校验问题"
                  >
                    <strong>保存前需要修正</strong>
                    <ul>
                      {knowledgeValidationErrors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <div className="inline-actions">
                  <button type="submit" disabled={!isKnowledgeDirty}>
                    {isKnowledgeDirty
                      ? "保存当前单元修改"
                      : selectedUnit.knowledgePointDrafts.length > 0
                        ? "当前生成版本已保存"
                        : "保存当前单元修改"}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={!isKnowledgeDirty}
                    onClick={discardKnowledgeChanges}
                  >
                    放弃未保存修改
                  </button>
                </div>
              </form>
            </section>
          )}
        </>
      ) : (
        <div className="empty-stage">
          <p>请先完成大章单元生成。</p>
          <Link
            className="button-link"
            to={`/ai-drafts/projects/${draft.projectId}/units`}
          >
            返回单元阶段
          </Link>
        </div>
      )}

      {pageMessage && (
        <p
          className={
            pageMessage.kind === "success" ? "form-success" : "form-error"
          }
        >
          {pageMessage.text}
        </p>
      )}

      <div className="inline-actions">
        {pendingUnitIds.length === 0 &&
          includedUnits.length > 0 &&
          !isKnowledgeDirty && (
            <Link
              className="button-link"
              to={`/ai-drafts/projects/${draft.projectId}/import-preview`}
            >
              生成导入预览
            </Link>
          )}
        <Link className="button-link secondary-link" to="/ai-drafts">
          返回草案总览
        </Link>
      </div>
    </section>
  );
}

type TechniqueImportPreviewRouteProps = {
  repository: TechniqueCreationDraftRepository;
  catalog: TechniqueImportCatalog;
  onApplyImport: (
    draft: TechniqueCreationDraft,
    plan: TechniqueImportPlan,
    confirmedActionIds: string[],
    acceptedIssueIds: string[],
  ) => void;
};

function TechniqueImportPreviewRoute({
  repository,
  catalog,
  onApplyImport,
}: TechniqueImportPreviewRouteProps) {
  const { projectId } = useParams();
  const draft = projectId
    ? materializeTechniqueCreationDraft(repository, projectId)
    : undefined;

  if (!draft) {
    return <Navigate to="/ai-drafts" replace />;
  }

  const plan = createTechniqueImportPlan(draft, catalog);
  return (
    <TechniqueImportPreviewPage
      draft={draft}
      plan={plan}
      onApplyImport={onApplyImport}
    />
  );
}

type TechniqueImportPreviewPageProps = {
  draft: TechniqueCreationDraft;
  plan: TechniqueImportPlan;
  onApplyImport: TechniqueImportPreviewRouteProps["onApplyImport"];
};

type ImportActionFilter = "all" | TechniqueImportAction["action"];
type ImportEntityFilter = "all" | TechniqueImportEntityType;

function getImportActionLabel(action: TechniqueImportAction["action"]): string {
  switch (action) {
    case "create":
      return "新建";
    case "update":
      return "更新";
    case "keep":
      return "保留";
    case "skip":
      return "跳过";
    case "archive":
      return "归档";
  }
}

function getImportEntityLabel(entityType: TechniqueImportEntityType): string {
  switch (entityType) {
    case "technique":
      return "功法";
    case "chapter":
      return "大章";
    case "unit":
      return "单元";
    case "knowledge_point":
      return "知识点";
    case "practice_defaults":
      return "修炼规则";
    case "layer_rule":
      return "层数规则";
  }
}

function formatImportPreviewValue(value: unknown): string {
  if (value === undefined) {
    return "未设置";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

function TechniqueImportPreviewPage({
  draft,
  plan,
  onApplyImport,
}: TechniqueImportPreviewPageProps) {
  const navigate = useNavigate();
  const [actionFilter, setActionFilter] = useState<ImportActionFilter>("all");
  const [entityFilter, setEntityFilter] = useState<ImportEntityFilter>("all");
  const [onlyConfirmation, setOnlyConfirmation] = useState(false);
  const [confirmedActionIds, setConfirmedActionIds] = useState<string[]>([]);
  const [acceptedIssueIds, setAcceptedIssueIds] = useState<string[]>([]);
  const [pageMessage, setPageMessage] = useState<string>();
  const errorCount = plan.issues.filter(
    (issue) => issue.severity === "error",
  ).length;
  const warningCount = plan.issues.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const visibleActions = plan.actions.filter(
    (action) =>
      (actionFilter === "all" || action.action === actionFilter) &&
      (entityFilter === "all" || action.entityType === entityFilter) &&
      (!onlyConfirmation || action.requiresConfirmation),
  );
  const requiredActions = plan.actions.filter(
    (action) => action.requiresConfirmation,
  );
  const warningIssues = plan.issues.filter(
    (issue) => issue.severity === "warning",
  );
  const canApply =
    errorCount === 0 &&
    requiredActions.every((action) => confirmedActionIds.includes(action.id)) &&
    warningIssues.every((issue) => acceptedIssueIds.includes(issue.id));

  function toggleId(
    currentIds: string[],
    id: string,
    checked: boolean,
    setIds: (ids: string[]) => void,
  ) {
    setIds(
      checked
        ? Array.from(new Set([...currentIds, id]))
        : currentIds.filter((item) => item !== id),
    );
  }

  function applyImport() {
    try {
      onApplyImport(draft, plan, confirmedActionIds, acceptedIssueIds);
      navigate(`/cultivation/sects/${plan.targetSectId}/techniques/${plan.targetTechniqueId}`);
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : "正式导入失败。");
    }
  }

  return (
    <section className="page-panel">
      <PageToolbar
        title="正式导入预览"
        backTo={`/ai-drafts/projects/${draft.projectId}/knowledge`}
      />

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {draft.techniqueDraft?.name ?? draft.input.techniqueName}
          </p>
          <p className="intro">
            {plan.mode === "create_new" ? "创建新功法" : "合并已有功法"} ·
            目标门派 {plan.targetSectId}
          </p>
        </div>
        <span
          className={
            errorCount > 0
              ? "import-readiness is-blocked"
              : "import-readiness is-ready"
          }
        >
          {errorCount > 0 ? `${errorCount} 项错误阻止导入` : "完整校验通过"}
        </span>
      </div>

      <section className="import-preview-notice">
        <strong>确认后会一次性写入正式数据</strong>
        <p>
          写入前会再次校验；导入记录会保留本次确认和字段差异。
        </p>
      </section>

      {(requiredActions.length > 0 || warningIssues.length > 0) && (
        <section className="import-confirmation-section" aria-label="导入确认">
          <div className="section-title-row">
            <div>
              <h2>写入确认</h2>
              <p className="progress-muted">只有明确确认后，相关覆盖和警告才会进入正式数据。</p>
            </div>
          </div>
          {requiredActions.map((action) => (
            <label className="inline-checkbox" key={action.id}>
              <input
                type="checkbox"
                checked={confirmedActionIds.includes(action.id)}
                onChange={(event) =>
                  toggleId(
                    confirmedActionIds,
                    action.id,
                    event.target.checked,
                    setConfirmedActionIds,
                  )
                }
              />
              确认{getImportActionLabel(action.action)}{getImportEntityLabel(action.entityType)}“{action.label}”
            </label>
          ))}
          {warningIssues.map((issue) => (
            <label className="inline-checkbox" key={issue.id}>
              <input
                type="checkbox"
                checked={acceptedIssueIds.includes(issue.id)}
                onChange={(event) =>
                  toggleId(
                    acceptedIssueIds,
                    issue.id,
                    event.target.checked,
                    setAcceptedIssueIds,
                  )
                }
              />
              已了解：{issue.message}
            </label>
          ))}
        </section>
      )}

      <dl className="import-summary" aria-label="导入动作汇总">
        <div>
          <dt>新建</dt>
          <dd>{plan.summary.createCount}</dd>
        </div>
        <div>
          <dt>更新</dt>
          <dd>{plan.summary.updateCount}</dd>
        </div>
        <div>
          <dt>保留</dt>
          <dd>{plan.summary.keepCount}</dd>
        </div>
        <div>
          <dt>跳过</dt>
          <dd>{plan.summary.skipCount}</dd>
        </div>
        <div>
          <dt>归档</dt>
          <dd>{plan.summary.archiveCount}</dd>
        </div>
      </dl>

      <section className="import-issues" aria-label="完整校验结果">
        <div className="section-title-row">
          <div>
            <h2>完整校验</h2>
            <p className="progress-muted">
              {errorCount} 项错误 · {warningCount} 项警告
            </p>
          </div>
        </div>
        {plan.issues.length > 0 ? (
          <div className="import-issue-list">
            {plan.issues.map((issue) => (
              <article
                className={`import-issue is-${issue.severity}`}
                key={issue.id}
              >
                <span>{issue.severity === "error" ? "错误" : "警告"}</span>
                <strong>{issue.message}</strong>
                {issue.path && <code>{issue.path}</code>}
              </article>
            ))}
          </div>
        ) : (
          <p className="form-success">
            草案结构、字段范围、引用关系和正式 id 映射均通过校验。
          </p>
        )}
      </section>

      <section className="import-actions-section">
        <div className="section-title-row">
          <div>
            <h2>差异动作</h2>
            <p className="progress-muted">
              当前显示 {visibleActions.length} / {plan.actions.length} 项
            </p>
          </div>
        </div>

        <div className="import-action-filters" aria-label="导入动作筛选">
          <label>
            操作
            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(event.target.value as ImportActionFilter)
              }
            >
              <option value="all">全部操作</option>
              <option value="create">新建</option>
              <option value="update">更新</option>
              <option value="keep">保留</option>
              <option value="skip">跳过</option>
              <option value="archive">归档</option>
            </select>
          </label>
          <label>
            对象
            <select
              value={entityFilter}
              onChange={(event) =>
                setEntityFilter(event.target.value as ImportEntityFilter)
              }
            >
              <option value="all">全部对象</option>
              <option value="technique">功法</option>
              <option value="chapter">大章</option>
              <option value="unit">单元</option>
              <option value="knowledge_point">知识点</option>
              <option value="practice_defaults">修炼规则</option>
              <option value="layer_rule">层数规则</option>
            </select>
          </label>
          <label className="inline-checkbox import-confirmation-filter">
            <input
              type="checkbox"
              checked={onlyConfirmation}
              onChange={(event) => setOnlyConfirmation(event.target.checked)}
            />
            只看需要确认
          </label>
        </div>

        <div className="import-action-list">
          {visibleActions.length > 0 ? (
            visibleActions.map((action) => (
              <details className="import-action-item" key={action.id}>
                <summary>
                  <span className={`import-action-badge is-${action.action}`}>
                    {getImportActionLabel(action.action)}
                  </span>
                  <span className="import-entity-label">
                    {getImportEntityLabel(action.entityType)}
                  </span>
                  <strong>{action.label}</strong>
                  {action.requiresConfirmation && <em>需要确认</em>}
                </summary>
                <div className="import-action-detail">
                  {action.formalEntityId && (
                    <p>
                      正式 id：<code>{action.formalEntityId}</code>
                    </p>
                  )}
                  {action.reason && <p>{action.reason}</p>}
                  {action.changes.length > 0 ? (
                    <dl>
                      {action.changes.map((change) => (
                        <div key={change.field}>
                          <dt>{change.field}</dt>
                          <dd>
                            {change.previousValue !== undefined && (
                              <span>
                                原值
                                <code>
                                  {formatImportPreviewValue(
                                    change.previousValue,
                                  )}
                                </code>
                              </span>
                            )}
                            <span>
                              新值
                              <code>
                                {formatImportPreviewValue(change.nextValue)}
                              </code>
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="progress-muted">没有字段变化。</p>
                  )}
                </div>
              </details>
            ))
          ) : (
            <div className="empty-stage">
              <p>当前筛选条件下没有导入动作。</p>
            </div>
          )}
        </div>
      </section>

      {pageMessage && <p className="form-error">{pageMessage}</p>}

      <div className="inline-actions">
        <button type="button" onClick={applyImport} disabled={!canApply}>
          确认并写入正式功法
        </button>
        <Link
          className="button-link secondary-link"
          to={`/ai-drafts/projects/${draft.projectId}/knowledge`}
        >
          返回修改草案
        </Link>
        <Link className="button-link secondary-link" to="/ai-drafts">
          返回草案总览
        </Link>
      </div>
    </section>
  );
}

type AiDraftRequestPageProps = {
  requests: AiDraftRequest[];
  drafts: TechniquePlanDraft[];
  onSaveRequest: (request: AiDraftRequest) => void;
  onGenerateDraft: (request: AiDraftRequest) => void;
  onDeleteDraft: (draftId: string) => void;
};

function AiDraftRequestPage({
  requests,
  drafts,
  onSaveRequest,
  onGenerateDraft,
  onDeleteDraft,
}: AiDraftRequestPageProps) {
  const { sectId } = useParams();
  const initialSectId = visibleDefaultSects.some((sect) => sect.id === sectId)
    ? sectId ?? visibleDefaultSects[0]?.id ?? ""
    : visibleDefaultSects[0]?.id ?? "";
  const [requestId] = useState(() => crypto.randomUUID());
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedSectId, setSelectedSectId] = useState(initialSectId);
  const [techniqueName, setTechniqueName] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [requirementText, setRequirementText] = useState("");
  const [formError, setFormError] = useState("");
  const currentRequestId = selectedRequestId || requestId;
  const currentDrafts = drafts.filter(
    (draft) => draft.requestId === currentRequestId,
  );

  function loadRequest(request: AiDraftRequest) {
    setSelectedRequestId(request.id);
    setSelectedSectId(request.sectId);
    setTechniqueName(request.techniqueName);
    setSourceText(request.sourceText);
    setLearningGoal(request.learningGoal);
    setRequirementText(request.requirementText);
    setFormError("");
  }

  function createRequest(): AiDraftRequest | undefined {
    if (techniqueName.trim().length === 0) {
      setFormError("请填写功法名称。");
      return undefined;
    }

    if (sourceText.trim().length === 0) {
      setFormError("请填写课程、教材、考纲或目标材料。");
      return undefined;
    }

    const now = new Date().toISOString();

    return {
      id: currentRequestId,
      sectId: selectedSectId,
      techniqueName: techniqueName.trim(),
      sourceText: sourceText.trim(),
      learningGoal: learningGoal.trim() || "建立可执行的知识点修炼计划",
      requirementText:
        requirementText.trim() ||
        "按章节生成知识点，标出基础价值、难度和重要度。",
      status: "active",
      createdAt:
        requests.find((request) => request.id === currentRequestId)?.createdAt ??
        now,
      updatedAt: now,
    };
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = createRequest();

    if (!request) {
      return;
    }

    onSaveRequest(request);
    onGenerateDraft(request);
    setFormError("");
  }

  return (
    <section className="page-panel">
      <PageToolbar title="新建 AI 草案" backTo="/ai-drafts" />

      <div className="two-column-layout">
        <section className="content-section">
          <h2>生成输入</h2>
          <form className="placeholder-form" onSubmit={submitRequest}>
            <label>
              目标门派
              <select
                value={selectedSectId}
                onChange={(event) => setSelectedSectId(event.target.value)}
              >
                {visibleDefaultSects.map((sect) => (
                  <option key={sect.id} value={sect.id}>
                    {sect.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              功法名称
              <input
                value={techniqueName}
                onChange={(event) => setTechniqueName(event.target.value)}
                placeholder="例如：数学分析强化"
              />
            </label>
            <label>
              课程 / 教材 / 考纲 / 目标材料
              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
              />
            </label>
            <label>
              学习目标
              <textarea
                value={learningGoal}
                onChange={(event) => setLearningGoal(event.target.value)}
              />
            </label>
            <label>
              生成要求
              <textarea
                value={requirementText}
                onChange={(event) => setRequirementText(event.target.value)}
              />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <button type="submit">生成 mock 草案</button>
          </form>

          <section className="practice-rule-summary">
            <h3>已有请求</h3>
            <div className="record-list">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <article className="record-card" key={request.id}>
                    <span>{request.techniqueName}</span>
                    <h3>{request.learningGoal}</h3>
                    <p>{request.requirementText}</p>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => loadRequest(request)}
                    >
                      载入并重新生成
                    </button>
                  </article>
                ))
              ) : (
                <p className="progress-muted">当前还没有草案请求。</p>
              )}
            </div>
          </section>
        </section>

        <aside className="side-panel">
          <h2>当前请求的草案版本</h2>
          <div className="record-list">
            {currentDrafts.length > 0 ? (
              currentDrafts.map((draft) => (
                <article className="record-card" key={draft.id}>
                  <span>{getDraftStatusLabel(draft.status)}</span>
                  <h3>{draft.techniqueName}</h3>
                  <p>{draft.knowledgePointDrafts.length} 个知识点草案</p>
                  <div className="inline-actions">
                    <Link className="button-link" to={`/ai-drafts/${draft.id}`}>
                      编辑
                    </Link>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => onDeleteDraft(draft.id)}
                    >
                      删除
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="progress-muted">生成后会在这里出现版本卡片。</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

type AiDraftDetailRouteProps = {
  drafts: TechniquePlanDraft[];
  onUpdateDraft: (draft: TechniquePlanDraft) => void;
  onDeleteDraft: (draftId: string) => void;
};

function AiDraftDetailRoute({
  drafts,
  onUpdateDraft,
  onDeleteDraft,
}: AiDraftDetailRouteProps) {
  const { draftId } = useParams();
  const draft = drafts.find((item) => item.id === draftId);

  if (!draft) {
    return <Navigate to="/ai-drafts" replace />;
  }

  return (
    <AiDraftDetailPage
      draft={draft}
      onUpdateDraft={onUpdateDraft}
      onDeleteDraft={onDeleteDraft}
    />
  );
}

type AiDraftDetailPageProps = {
  draft: TechniquePlanDraft;
  onUpdateDraft: (draft: TechniquePlanDraft) => void;
  onDeleteDraft: (draftId: string) => void;
};

function AiDraftDetailPage({
  draft,
  onUpdateDraft,
  onDeleteDraft,
}: AiDraftDetailPageProps) {
  const [draftState, setDraftState] = useState(draft);
  const sect = defaultSects.find((item) => item.id === draftState.sectId);

  useEffect(() => {
    setDraftState(draft);
  }, [draft]);

  function updateKnowledgePointDraft(
    index: number,
    patch: Partial<KnowledgePointDraft>,
  ) {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      knowledgePointDrafts: currentDraft.knowledgePointDrafts.map(
        (knowledgePointDraft, draftIndex) =>
          draftIndex === index
            ? { ...knowledgePointDraft, ...patch }
            : knowledgePointDraft,
      ),
    }));
  }

  function deleteKnowledgePointDraft(index: number) {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      knowledgePointDrafts: currentDraft.knowledgePointDrafts.filter(
        (_, draftIndex) => draftIndex !== index,
      ),
    }));
  }

  function addKnowledgePointDraft() {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      knowledgePointDrafts: [
        ...currentDraft.knowledgePointDrafts,
        {
          name: "新知识点",
          chapterCode: "ch00",
          chapter: "未分章",
          description: "",
          granularity: "normal",
          baseValue: 1000,
          difficulty: 1,
          importance: 1,
        },
      ],
    }));
  }

  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onUpdateDraft(draftState);
  }

  return (
    <section className="page-panel">
      <PageToolbar title="AI 草案详情" backTo="/ai-drafts" />

      <div className="page-heading">
        <div>
          <p className="eyebrow">{sect?.name ?? draftState.sectId}</p>
          <p className="intro">
            当前页面只编辑草案内容，暂不导入正式功法或知识点。
          </p>
        </div>
        <button
          className="danger-button"
          type="button"
          onClick={() => onDeleteDraft(draftState.id)}
        >
          删除草案
        </button>
      </div>

      <form className="rule-config-form" onSubmit={submitDraft}>
        <fieldset>
          <legend>草案信息</legend>
          <label>
            功法名称
            <input
              value={draftState.techniqueName}
              onChange={(event) =>
                setDraftState((currentDraft) => ({
                  ...currentDraft,
                  techniqueName: event.target.value,
                }))
              }
            />
          </label>
          <label>
            来源材料
            <textarea
              value={draftState.sourceText}
              onChange={(event) =>
                setDraftState((currentDraft) => ({
                  ...currentDraft,
                  sourceText: event.target.value,
                }))
              }
            />
          </label>
        </fieldset>

        <div className="knowledge-draft-list">
          {draftState.knowledgePointDrafts.map((knowledgePointDraft, index) => (
            <fieldset key={`${knowledgePointDraft.name}-${index}`}>
              <legend>知识点 {index + 1}</legend>
              <label>
                名称
                <input
                  value={knowledgePointDraft.name}
                  onChange={(event) =>
                    updateKnowledgePointDraft(index, {
                      name: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                章节代码
                <input
                  value={knowledgePointDraft.chapterCode}
                  onChange={(event) =>
                    updateKnowledgePointDraft(index, {
                      chapterCode: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                章节名称
                <input
                  value={knowledgePointDraft.chapter ?? ""}
                  onChange={(event) =>
                    updateKnowledgePointDraft(index, {
                      chapter: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                描述
                <textarea
                  value={knowledgePointDraft.description}
                  onChange={(event) =>
                    updateKnowledgePointDraft(index, {
                      description: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                精细度
                <select
                  value={knowledgePointDraft.granularity}
                  onChange={(event) =>
                    updateKnowledgePointDraft(index, {
                      granularity: event.target
                        .value as KnowledgePointDraft["granularity"],
                    })
                  }
                >
                  <option value="rough">粗略</option>
                  <option value="normal">标准</option>
                  <option value="detailed">细致</option>
                </select>
              </label>
              <label>
                基础价值
                <input
                  type="number"
                  min="0"
                  value={knowledgePointDraft.baseValue}
                  onChange={(event) =>
                    updateKnowledgePointDraft(index, {
                      baseValue: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                难度
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={knowledgePointDraft.difficulty}
                  onChange={(event) =>
                    updateKnowledgePointDraft(index, {
                      difficulty: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                重要度
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={knowledgePointDraft.importance}
                  onChange={(event) =>
                    updateKnowledgePointDraft(index, {
                      importance: Number(event.target.value),
                    })
                  }
                />
              </label>
              <button
                className="danger-button"
                type="button"
                onClick={() => deleteKnowledgePointDraft(index)}
              >
                删除知识点
              </button>
            </fieldset>
          ))}
        </div>

        <div className="inline-actions">
          <button type="submit">保存草案修改</button>
          <button
            className="secondary-button"
            type="button"
            onClick={addKnowledgePointDraft}
          >
            添加知识点
          </button>
        </div>
      </form>
    </section>
  );
}

function getBreakthroughStatusLabel(status: BreakthroughStatus): string {
  switch (status) {
    case "not_started":
      return "未开始";
    case "in_progress":
      return "进行中";
    case "completed":
      return "已完成";
    case "failed":
      return "未通过";
  }
}

const eventTypeOptions: EventType[] = [
  "exam",
  "course_project",
  "course_paper",
  "breakthrough_exam",
  "mock_test",
  "long_project",
  "review_week",
  "custom",
];

const journeyTypeOptions: JourneyType[] = [
  "reading",
  "movie",
  "anime",
  "game",
  "music",
  "exhibition",
  "theater",
  "custom",
];

const journeyStatusOptions: JourneyStatus[] = [
  "planned",
  "in_progress",
  "completed",
  "abandoned",
];

type EventsPageProps = {
  events: Event[];
  onAddEvent: (event: Event) => void;
  onCompleteEvent: (eventId: string) => void;
  onFailEvent: (eventId: string) => void;
  onUpdateEventSummary: (eventId: string, summary: string) => void;
};

function EventsPage({
  events,
  onAddEvent,
  onCompleteEvent,
  onFailEvent,
  onUpdateEventSummary,
}: EventsPageProps) {
  const firstSectId = visibleDefaultSects[0]?.id ?? "";
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("exam");
  const [status, setStatus] = useState<EventStatus>("in_progress");
  const [sectId, setSectId] = useState(firstSectId);
  const techniqueOptions = visibleDefaultTechniques.filter(
    (technique) => technique.sectId === sectId,
  );
  const [techniqueId, setTechniqueId] = useState(
    techniqueOptions[0]?.id ?? "",
  );
  const selectedTechniqueId =
    techniqueOptions.some((technique) => technique.id === techniqueId)
      ? techniqueId
      : techniqueOptions[0]?.id ?? "";
  const knowledgePointOptions = getDefaultKnowledgePointsByTechnique(
    selectedTechniqueId,
  );
  const [knowledgePointId, setKnowledgePointId] = useState(
    knowledgePointOptions[0]?.id ?? "",
  );
  const selectedKnowledgePointId =
    knowledgePointOptions.some(
      (knowledgePoint) => knowledgePoint.id === knowledgePointId,
    )
      ? knowledgePointId
      : knowledgePointOptions[0]?.id ?? "";
  const [startAt, setStartAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [targetRequirement, setTargetRequirement] = useState("");
  const [summary, setSummary] = useState("");
  const [manaReward, setManaReward] = useState(0);
  const [insightReward, setInsightReward] = useState(0);
  const [soulReward, setSoulReward] = useState(0);
  const sortedEvents = sortEventsByDueDate(events);

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !selectedTechniqueId) {
      return;
    }

    const now = new Date().toISOString();

    onAddEvent({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: targetRequirement.trim(),
      eventType,
      status,
      sectId,
      techniqueIds: [selectedTechniqueId],
      knowledgePointIds: selectedKnowledgePointId
        ? [selectedKnowledgePointId]
        : [],
      startAt: startAt || undefined,
      dueAt: dueAt || undefined,
      completedAt: status === "completed" ? now : undefined,
      targetRequirement: targetRequirement.trim(),
      difficulty: 1,
      importance: 1,
      manaReward,
      insightReward,
      soulReward,
      summary: summary.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    setTitle("");
    setTargetRequirement("");
    setSummary("");
    setManaReward(0);
    setInsightReward(0);
    setSoulReward(0);
  }

  return (
    <section className="page-panel">
      <PageToolbar title="事件界面" backTo="/" />

      <div className="two-column-layout">
        <section className="content-section">
          <h2>事件记录</h2>
          <div className="record-list">
            {sortedEvents.length > 0 ? (
              sortedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onCompleteEvent={onCompleteEvent}
                  onFailEvent={onFailEvent}
                  onUpdateEventSummary={onUpdateEventSummary}
                />
              ))
            ) : (
              <p className="progress-muted">当前还没有事件记录。</p>
            )}
          </div>
        </section>

        <aside className="side-panel">
          <h2>安排新事件</h2>
          <form className="placeholder-form" onSubmit={submitEvent}>
            <label>
              事件名称
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>
            <label>
              事件类型
              <select
                value={eventType}
                onChange={(event) =>
                  setEventType(event.target.value as EventType)
                }
              >
                {eventTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {getEventTypeLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              完成状态
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as EventStatus)
                }
              >
                <option value="not_started">未开始</option>
                <option value="in_progress">进行中</option>
                <option value="completed">成功</option>
                <option value="failed">失败</option>
              </select>
            </label>
            <label>
              关联门派
              <select
                value={sectId}
                onChange={(event) => {
                  const nextSectId = event.target.value;
                  const nextTechniqueId =
                    visibleDefaultTechniques.find(
                      (technique) => technique.sectId === nextSectId,
                    )?.id ?? "";
                  const nextKnowledgePointId =
                    getDefaultKnowledgePointsByTechnique(nextTechniqueId)[0]
                      ?.id ?? "";

                  setSectId(nextSectId);
                  setTechniqueId(nextTechniqueId);
                  setKnowledgePointId(nextKnowledgePointId);
                }}
              >
                {visibleDefaultSects.map((sect) => (
                  <option key={sect.id} value={sect.id}>
                    {sect.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              关联功法
              <select
                value={selectedTechniqueId}
                onChange={(event) => {
                  const nextTechniqueId = event.target.value;
                  const nextKnowledgePointId =
                    getDefaultKnowledgePointsByTechnique(nextTechniqueId)[0]
                      ?.id ?? "";

                  setTechniqueId(nextTechniqueId);
                  setKnowledgePointId(nextKnowledgePointId);
                }}
              >
                {techniqueOptions.map((technique) => (
                  <option key={technique.id} value={technique.id}>
                    {technique.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              关联知识点
              <select
                value={selectedKnowledgePointId}
                onChange={(event) => setKnowledgePointId(event.target.value)}
              >
                {knowledgePointOptions.map((knowledgePoint) => (
                  <option key={knowledgePoint.id} value={knowledgePoint.id}>
                    {knowledgePoint.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              开始日期
              <input
                type="date"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
              />
            </label>
            <label>
              截止日期
              <input
                type="date"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </label>
            <label>
              目标要求
              <textarea
                value={targetRequirement}
                onChange={(event) => setTargetRequirement(event.target.value)}
                required
              />
            </label>
            <label>
              成功奖励法力
              <input
                type="number"
                min="0"
                value={manaReward}
                onChange={(event) => setManaReward(Number(event.target.value))}
              />
            </label>
            <label>
              成功奖励神识
              <input
                type="number"
                min="0"
                value={insightReward}
                onChange={(event) =>
                  setInsightReward(Number(event.target.value))
                }
              />
            </label>
            <label>
              成功奖励神魂
              <input
                type="number"
                min="0"
                value={soulReward}
                onChange={(event) => setSoulReward(Number(event.target.value))}
              />
            </label>
            <label>
              结果总结
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
            <button type="submit">保存事件</button>
          </form>
        </aside>
      </div>
    </section>
  );
}

type JourneysPageProps = {
  journeys: Journey[];
  journeyStats: JourneyStats;
  journeySoulRule: JourneySoulRule;
  onAddJourney: (journey: Journey) => void;
};

function JourneysPage({
  journeys,
  journeyStats,
  journeySoulRule,
  onAddJourney,
}: JourneysPageProps) {
  const [workName, setWorkName] = useState("");
  const [creator, setCreator] = useState("");
  const [journeyType, setJourneyType] = useState<JourneyType>("reading");
  const [status, setStatus] = useState<JourneyStatus>("completed");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [completionPercent, setCompletionPercent] = useState(100);
  const [summary, setSummary] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [sectId, setSectId] = useState("");
  const [techniqueId, setTechniqueId] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [formError, setFormError] = useState("");
  const selectedSect = defaultSects.find((sect) => sect.id === sectId);
  const techniqueOptions = visibleDefaultTechniques.filter(
    (technique) => technique.sectId === sectId,
  );
  const selectedTechniqueId =
    techniqueOptions.some((technique) => technique.id === techniqueId)
      ? techniqueId
      : "";
  const completionRatio = completionPercent / 100;
  const previewSoulGain =
    durationMinutes === ""
      ? 0
      : calculateJourneySoulGain(
          durationMinutes,
          completionRatio,
          journeyType,
          journeySoulRule,
        );
  const sortedJourneys = sortJourneysByUpdatedAt(journeys);
  const journeySectStats = Object.values(journeyStats.sectStatsById).sort(
    (firstSect, secondSect) => secondSect.totalSoul - firstSect.totalSoul,
  );

  function submitJourney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (workName.trim().length === 0) {
      setFormError("请填写作品名称。");
      return;
    }

    if (
      durationMinutes === "" ||
      durationMinutes < 1 ||
      !Number.isFinite(durationMinutes)
    ) {
      setFormError("请填写至少 1 分钟的体验时长。");
      return;
    }

    if (
      completionPercent < 0 ||
      completionPercent > 100 ||
      !Number.isFinite(completionPercent)
    ) {
      setFormError("本次完成度需要在 0 到 100 之间。");
      return;
    }

    const now = new Date().toISOString();
    const keywords = keywordsInput
      .split(/[,，、\s]+/)
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    const soulGain = calculateJourneySoulGain(
      durationMinutes,
      completionRatio,
      journeyType,
      journeySoulRule,
    );
    const title = `${getJourneyTypeLabel(journeyType)}：${workName.trim()}`;

    onAddJourney({
      id: crypto.randomUUID(),
      title,
      journeyType,
      workName: workName.trim(),
      creator: creator.trim() || undefined,
      status,
      startedAt: startedAt || undefined,
      completedAt:
        completedAt || (status === "completed" ? now : undefined),
      durationMinutes,
      completionRatio,
      summary: summary.trim() || undefined,
      keywords,
      soulGain,
      sectId: sectId || undefined,
      techniqueId: selectedTechniqueId || undefined,
      createdAt: now,
      updatedAt: now,
    });

    setWorkName("");
    setCreator("");
    setDurationMinutes("");
    setCompletionPercent(100);
    setSummary("");
    setKeywordsInput("");
    setFormError("");
  }

  return (
    <section className="page-panel">
      <PageToolbar title="游历界面" backTo="/" />

      <div className="two-column-layout">
        <section className="content-section">
          <h2>游历记录</h2>
          <div className="record-list">
            {sortedJourneys.length > 0 ? (
              sortedJourneys.map((journey) => {
                const sect = defaultSects.find((item) => item.id === journey.sectId);
                const technique = defaultTechniques.find(
                  (item) => item.id === journey.techniqueId,
                );

                return (
                  <article className="record-card" key={journey.id}>
                    <span>
                      {getJourneyTypeLabel(journey.journeyType)} ·{" "}
                      {getJourneyStatusLabel(journey.status)} · 神魂 +
                      {journey.soulGain}
                    </span>
                    <h3>{journey.workName}</h3>
                    <p>
                      {journey.durationMinutes ?? 0} 分钟 · 本次完成度{" "}
                      {Math.round(journey.completionRatio * 100)}%
                    </p>
                    {(sect || technique) && (
                      <p>
                        涉猎：{sect?.name ?? "未关联门派"}
                        {technique ? ` · ${technique.name}` : ""}
                      </p>
                    )}
                    {journey.summary && <p>{journey.summary}</p>}
                    {journey.keywords.length > 0 && (
                      <p>标签：{journey.keywords.join("、")}</p>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="progress-muted">当前还没有游历记录。</p>
            )}
          </div>

          <section className="practice-rule-summary">
            <h3>神魂涉猎统计</h3>
            <dl>
              <div>
                <dt>总神魂</dt>
                <dd>{journeyStats.totalSoul}</dd>
              </div>
              <div>
                <dt>游历记录</dt>
                <dd>{journeyStats.journeyCount} 条</dd>
              </div>
              {journeySectStats.map((sectStats) => {
                const sect = defaultSects.find((item) => item.id === sectStats.sectId);

                return (
                  <div key={sectStats.sectId}>
                    <dt>{sect?.name ?? sectStats.sectId}</dt>
                    <dd>
                      {sectStats.totalSoul} 神魂 / {sectStats.journeyCount} 条
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </section>

        <aside className="side-panel">
          <h2>记录新游历</h2>
          <form className="placeholder-form" onSubmit={submitJourney}>
            <label>
              作品名称
              <input
                value={workName}
                onChange={(event) => setWorkName(event.target.value)}
                required
              />
            </label>
            <label>
              作者 / 导演 / 制作方
              <input
                value={creator}
                onChange={(event) => setCreator(event.target.value)}
              />
            </label>
            <label>
              游历类型
              <select
                value={journeyType}
                onChange={(event) =>
                  setJourneyType(event.target.value as JourneyType)
                }
              >
                {journeyTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {getJourneyTypeLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              状态
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as JourneyStatus)
                }
              >
                {journeyStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {getJourneyStatusLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              体验时长（分钟）
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
                required
              />
            </label>
            <label>
              本次完成度（%）
              <input
                type="number"
                min="0"
                max="100"
                value={completionPercent}
                onChange={(event) =>
                  setCompletionPercent(Number(event.target.value))
                }
              />
            </label>
            <label>
              涉猎门派
              <select
                value={sectId}
                onChange={(event) => {
                  const nextSectId = event.target.value;
                  const nextTechniqueId =
                    visibleDefaultTechniques.find(
                      (technique) => technique.sectId === nextSectId,
                    )?.id ?? "";

                  setSectId(nextSectId);
                  setTechniqueId(nextTechniqueId);
                }}
              >
                <option value="">暂不关联</option>
                {visibleDefaultSects.map((sect) => (
                  <option key={sect.id} value={sect.id}>
                    {sect.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              涉猎功法
              <select
                value={selectedTechniqueId}
                onChange={(event) => setTechniqueId(event.target.value)}
                disabled={!selectedSect}
              >
                <option value="">暂不关联</option>
                {techniqueOptions.map((technique) => (
                  <option key={technique.id} value={technique.id}>
                    {technique.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              开始日期
              <input
                type="date"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
              />
            </label>
            <label>
              完成日期
              <input
                type="date"
                value={completedAt}
                onChange={(event) => setCompletedAt(event.target.value)}
              />
            </label>
            <label>
              感想摘要
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
            <label>
              标签
              <input
                value={keywordsInput}
                onChange={(event) => setKeywordsInput(event.target.value)}
                placeholder="用逗号或空格分隔"
              />
            </label>
            <div className="experience-preview-total">
              <span>预计神魂</span>
              <strong>{previewSoulGain}</strong>
            </div>
            {formError && <p className="form-error">{formError}</p>}
            <button type="submit">保存游历</button>
          </form>
        </aside>
      </div>
    </section>
  );
}

type CultivationPageProps = {
  repository: CultivationStructureRepository;
  ownershipIndex: KnowledgeOwnershipIndex;
  sectStatsById: Record<string, SectPracticeStats>;
  techniqueStatsById: Record<string, TechniquePracticeStats>;
};

function CultivationPage({
  repository,
  ownershipIndex,
  sectStatsById,
  techniqueStatsById,
}: CultivationPageProps) {
  const visibleSects = repository.sects.filter(
    (sect) => !sect.isSystem && !sect.archivedAt,
  );
  const visibleTechniques = repository.techniques.filter(
    (technique) => !technique.isSystem && !technique.archivedAt,
  );
  const independentTechniques = visibleTechniques.filter(
    (technique) => technique.sectId === SYSTEM_STANDALONE_SECT_ID,
  );
  const independentStats = independentTechniques.reduce(
    (totals, technique) => {
      const stats = techniqueStatsById[technique.id];
      return {
        mana: totals.mana + (stats?.totalMana ?? 0),
        insight: totals.insight + (stats?.totalInsight ?? 0),
      };
    },
    { mana: 0, insight: 0 },
  );
  const standaloneTechnique = repository.techniques.find(
    (technique) => technique.id === STANDALONE_TECHNIQUE_ID,
  );
  const standaloneKnowledgePointCount = getKnowledgePointsByTechnique(
    repository.knowledgePoints,
    STANDALONE_TECHNIQUE_ID,
    ownershipIndex,
  ).length;
  const standaloneStats = techniqueStatsById[STANDALONE_TECHNIQUE_ID];

  return (
    <section className="page-panel">
      <PageToolbar title="修炼界面" backTo="/" />

      <div className="page-heading">
        <p className="intro">
          系统化学习可以归入门派或独立知识；少量零散内容直接收进秘术合集。
        </p>
        <button type="button">创建门派</button>
      </div>

      <div className="sect-grid">
        <article className="sect-card">
          <div>
            <span>独立知识</span>
            <h2>独立功法</h2>
            <p>存放不需要归入门派、但仍具有完整章节结构的功法。</p>
          </div>
          <dl>
            <div>
              <dt>功法</dt>
              <dd>{independentTechniques.length}</dd>
            </div>
            <div>
              <dt>法力</dt>
              <dd>{independentStats.mana}</dd>
            </div>
            <div>
              <dt>神识</dt>
              <dd>{independentStats.insight}</dd>
            </div>
          </dl>
          <Link className="button-link" to="/cultivation/independent">
            查看独立功法
          </Link>
        </article>
        {standaloneTechnique && (
          <article className="sect-card" key={standaloneTechnique.id}>
            <div>
              <span>零散知识</span>
              <h2>秘术合集</h2>
              <p>存放不需要建立完整功法、可以直接修炼的少量知识点。</p>
            </div>
            <dl>
              <div>
                <dt>知识点</dt>
                <dd>{standaloneKnowledgePointCount}</dd>
              </div>
              <div>
                <dt>法力</dt>
                <dd>{standaloneStats?.totalMana ?? 0}</dd>
              </div>
              <div>
                <dt>神识</dt>
                <dd>{standaloneStats?.totalInsight ?? 0}</dd>
              </div>
            </dl>
            <Link className="button-link" to="/cultivation/secret-arts">
              查看秘术知识点
            </Link>
          </article>
        )}
        {visibleSects.map((sect) => {
          const techniqueCount = visibleTechniques.filter(
            (technique) => technique.sectId === sect.id,
          ).length;
          const sectStats = sectStatsById[sect.id];
          const totalMana = sectStats?.totalMana ?? 0;
          const totalInsight = sectStats?.totalInsight ?? 0;

          return (
            <article className="sect-card" key={sect.id}>
              <div>
                <span>{sect.isDefault ? "默认门派" : "自定义门派"}</span>
                <h2>{sect.name}</h2>
                <p>{sect.description}</p>
              </div>
              <dl>
                <div>
                  <dt>法力</dt>
                  <dd>{totalMana}</dd>
                </div>
                <div>
                  <dt>神识</dt>
                  <dd>{totalInsight}</dd>
                </div>
                <div>
                  <dt>功法</dt>
                  <dd>{techniqueCount}</dd>
                </div>
              </dl>
              <Link
                className="button-link"
                to={`/cultivation/sects/${sect.id}`}
              >
                查看功法
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type TechniqueMigrationPanelProps = {
  technique: Technique;
  repository: CultivationStructureRepository;
  references: MigrationReferenceData;
  onConfirm: (
    techniqueId: string,
    toSectId: string,
    reason: string,
    targetSectName: string,
  ) => void;
  onCancel: () => void;
};

function TechniqueMigrationPanel({
  technique,
  repository,
  references,
  onConfirm,
  onCancel,
}: TechniqueMigrationPanelProps) {
  const targetSects = repository.sects.filter(
    (sect) =>
      (!sect.isSystem || sect.id === SYSTEM_STANDALONE_SECT_ID) &&
      !sect.archivedAt &&
      sect.id !== technique.sectId,
  );
  const [targetSectId, setTargetSectId] = useState(
    targetSects[0]?.id ?? "",
  );
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<TechniqueMigrationPreview>();
  const [formError, setFormError] = useState("");

  function previewMigration() {
    if (!targetSectId) {
      setFormError("当前没有可用的目标门派。");
      return;
    }

    try {
      setPreview(
        createTechniqueMigrationPreview(
          repository,
          technique.id,
          targetSectId,
          references,
        ),
      );
      setFormError("");
    } catch (error) {
      setPreview(undefined);
      setFormError(
        error instanceof Error ? error.message : "生成功法迁移预览失败。",
      );
    }
  }

  function confirmMigration() {
    const previewTargetSectId = preview?.toSectId;
    const targetSect = targetSects.find(
      (sect) => sect.id === previewTargetSectId,
    );

    if (!previewTargetSectId || !targetSect) {
      setFormError("请先生成当前目标的迁移预览。");
      return;
    }

    onConfirm(technique.id, previewTargetSectId, reason, targetSect.name);
  }

  const sourceSect = repository.sects.find(
    (sect) => sect.id === (preview?.fromSectId ?? technique.sectId),
  );
  const targetSect = repository.sects.find(
    (sect) => sect.id === preview?.toSectId,
  );

  return (
    <section
      className="technique-migration-panel"
      aria-label={`迁移${technique.name}`}
    >
      <div className="section-title-row">
        <div>
          <h2>迁移“{technique.name}”</h2>
          <p className="progress-muted">
            当前归属：
            {sourceSect?.id === SYSTEM_STANDALONE_SECT_ID
              ? "独立知识"
              : sourceSect?.name ?? "未知"}
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={onCancel}>
          取消
        </button>
      </div>

      <div className="rule-config-form">
        <div className="creation-form-grid">
          <label>
            目标归属
            <select
              value={targetSectId}
              disabled={targetSects.length === 0}
              onChange={(event) => {
                setTargetSectId(event.target.value);
                setPreview(undefined);
                setFormError("");
              }}
            >
              {targetSects.map((sect) => (
                <option key={sect.id} value={sect.id}>
                  {sect.id === SYSTEM_STANDALONE_SECT_ID
                    ? "独立知识（无门派归属）"
                    : sect.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            迁移原因（可选）
            <input
              maxLength={300}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        </div>
        <button
          className="secondary-button"
          type="button"
          disabled={!targetSectId}
          onClick={previewMigration}
        >
          预览影响
        </button>

        {preview && (
          <section className="migration-preview" aria-label="功法迁移影响预览">
            <dl>
              <div>
                <dt>归属变化</dt>
                <dd>
                  {sourceSect?.id === SYSTEM_STANDALONE_SECT_ID
                    ? "独立知识"
                    : sourceSect?.name ?? preview.fromSectId}{" "}
                  →{" "}
                  {targetSect?.id === SYSTEM_STANDALONE_SECT_ID
                    ? "独立知识"
                    : targetSect?.name ?? preview.toSectId}
                </dd>
              </div>
              <div>
                <dt>结构规模</dt>
                <dd>
                  {preview.chapterCount} 章 / {preview.unitCount} 单元 /{" "}
                  {preview.knowledgePointCount} 知识点
                </dd>
              </div>
              <div>
                <dt>关联记录</dt>
                <dd>
                  {preview.activePracticeRecordCount} 条有效 /{" "}
                  {preview.deletedPracticeRecordCount} 条已删除
                </dd>
              </div>
              <div>
                <dt>功法规则</dt>
                <dd>
                  {preview.practiceDefaultsCount} 组修炼默认 /{" "}
                  {preview.layerRuleCount} 条层数规则
                </dd>
              </div>
              <div>
                <dt>活动 AI 草案</dt>
                <dd>{preview.activeDraftProjectCount} 个合并目标</dd>
              </div>
              <div>
                <dt>实体 ID</dt>
                <dd>功法及全部下级结构保持不变</dd>
              </div>
            </dl>
            <p className="progress-muted">
              章节、单元和知识点自动跟随功法；历史修炼记录保留原门派快照，当前门派统计按新归属汇总。
            </p>
            <button type="button" onClick={confirmMigration}>
              确认迁移功法
            </button>
          </section>
        )}

        {formError && <p className="form-error">{formError}</p>}
      </div>
    </section>
  );
}

type TechniquesPageProps = {
  mode?: "sect" | "independent";
  repository: CultivationStructureRepository;
  sect: Sect;
  techniques: Technique[];
  sectStatsById: Record<string, SectPracticeStats>;
  techniqueStatsById: Record<string, TechniquePracticeStats>;
  techniqueProgressById: Record<string, TechniqueProgress>;
  migrationReferences: MigrationReferenceData;
  onMigrateTechnique: (
    techniqueId: string,
    toSectId: string,
    reason?: string,
  ) => void;
};

function TechniquesPage({
  mode = "sect",
  repository,
  sect,
  techniques: visibleTechniques,
  sectStatsById,
  techniqueStatsById,
  techniqueProgressById,
  migrationReferences,
  onMigrateTechnique,
}: TechniquesPageProps) {
  const navigate = useNavigate();
  const isIndependent = mode === "independent";
  const [migratingTechniqueId, setMigratingTechniqueId] = useState<string>();
  const [migrationMessage, setMigrationMessage] = useState("");
  const techniques = visibleTechniques.filter(
    (technique) => technique.sectId === sect.id,
  );
  const migratingTechnique = techniques.find(
    (technique) => technique.id === migratingTechniqueId,
  );
  const sectStats = sectStatsById[sect.id];
  const independentTechniqueStats = techniques.reduce(
    (totals, technique) => {
      const stats = techniqueStatsById[technique.id];
      return {
        mana: totals.mana + (stats?.totalMana ?? 0),
        insight: totals.insight + (stats?.totalInsight ?? 0),
      };
    },
    { mana: 0, insight: 0 },
  );
  const totalMana = isIndependent
    ? independentTechniqueStats.mana
    : sectStats?.totalMana ?? 0;
  const totalInsight = isIndependent
    ? independentTechniqueStats.insight
    : sectStats?.totalInsight ?? 0;

  function confirmTechniqueMigration(
    techniqueId: string,
    toSectId: string,
    reason: string,
    targetSectName: string,
  ) {
    const techniqueName = techniques.find(
      (technique) => technique.id === techniqueId,
    )?.name;

    onMigrateTechnique(techniqueId, toSectId, reason);
    setMigratingTechniqueId(undefined);
    setMigrationMessage(
      `“${techniqueName ?? "当前功法"}”已迁移到 ${targetSectName}。`,
    );
    navigate(
      toSectId === SYSTEM_STANDALONE_SECT_ID
        ? "/cultivation/independent"
        : `/cultivation/sects/${toSectId}`,
    );
  }

  return (
    <section className="page-panel">
      <PageToolbar
        title={isIndependent ? "独立知识" : `${sect.name}功法界面`}
        backTo="/cultivation"
      />

      <div className="page-heading">
        <div>
          <p className="intro">
            {isIndependent
              ? "这里存放不属于任何门派、但仍按完整功法结构学习的内容。"
              : "功法是门派下面的具体学习方向。选择功法后，再进入该功法所属的知识点。"}
          </p>
        </div>
        <div className="inline-actions">
          <button type="button">创建功法</button>
          <Link
            className="button-link"
            to={`/cultivation/sects/${sect.id}/ai-drafts/new`}
          >
            AI 草案规划
          </Link>
        </div>
      </div>

      <div className="sect-summary">
        <article>
          <span>{isIndependent ? "当前归属" : "当前门派"}</span>
          <strong>{isIndependent ? "独立知识" : sect.name}</strong>
        </article>
        <article>
          <span>法力</span>
          <strong>{totalMana}</strong>
        </article>
        <article>
          <span>神识</span>
          <strong>{totalInsight}</strong>
        </article>
        <article>
          <span>功法数量</span>
          <strong>{techniques.length}</strong>
        </article>
      </div>

      {migrationMessage && (
        <p className="form-success technique-migration-message">
          {migrationMessage}
        </p>
      )}

      {migratingTechnique && (
        <TechniqueMigrationPanel
          key={migratingTechnique.id}
          technique={migratingTechnique}
          repository={repository}
          references={migrationReferences}
          onConfirm={confirmTechniqueMigration}
          onCancel={() => setMigratingTechniqueId(undefined)}
        />
      )}

      <div className="technique-grid">
        {techniques.map((technique) => {
          const techniqueStats = techniqueStatsById[technique.id];
          const techniqueProgress = techniqueProgressById[technique.id];
          const currentValue = techniqueStats?.totalExperience ?? 0;
          const currentLayer =
            techniqueProgress?.currentLayer ?? technique.currentLayer;
          const maxLayer =
            techniqueProgress?.maxLayer || technique.maxLayer;
          const nextLayerRule = techniqueProgress?.nextLayerRule;
          const nextLayerLabel = nextLayerRule
            ? `下一层 ${nextLayerRule.layer}`
            : "已达最高层";

          return (
            <article className="technique-card" key={technique.id}>
              <div>
                <span>第 {currentLayer} / {maxLayer} 层 · {nextLayerLabel}</span>
                <h2>{technique.name}</h2>
                <p>{technique.description}</p>
              </div>
              {techniqueProgress ? (
                <div className="technique-progress-summary">
                  <div>
                    <span>覆盖</span>
                    <strong>{formatPercent(techniqueProgress.coverageRatio)}</strong>
                  </div>
                  <div>
                    <span>核心覆盖</span>
                    <strong>
                      {formatPercent(techniqueProgress.coreCoverageRatio)}
                    </strong>
                  </div>
                  <div>
                    <span>突破状态</span>
                    <strong>
                      {getTechniqueProgressStatusLabel(
                        techniqueProgress.nextLayerStatus,
                      )}
                    </strong>
                  </div>
                </div>
              ) : (
                <p className="progress-muted">当前功法尚未配置知识点进度规则。</p>
              )}
              <dl>
                <div>
                  <dt>法力倾向</dt>
                  <dd>{Math.round(technique.manaWeight * 100)}%</dd>
                </div>
                <div>
                  <dt>神识倾向</dt>
                  <dd>{Math.round(technique.insightWeight * 100)}%</dd>
                </div>
                <div>
                  <dt>当前数值</dt>
                  <dd>{currentValue}</dd>
                </div>
              </dl>
              {techniqueProgress?.nextLayerGap && (
                <p className="progress-muted">
                  距离下一层：经验差{" "}
                  {techniqueProgress.nextLayerGap.requiredExperienceGap}，覆盖差{" "}
                  {formatPercent(
                    techniqueProgress.nextLayerGap.requiredCoverageGap,
                  )}
                </p>
              )}
              <div className="technique-card-actions">
                <Link
                  className="button-link"
                  to={
                    isIndependent
                      ? `/cultivation/independent/techniques/${technique.id}`
                      : `/cultivation/sects/${sect.id}/techniques/${technique.id}`
                  }
                >
                  进入知识点
                </Link>
                <button
                  className="secondary-button"
                  type="button"
                  aria-expanded={migratingTechniqueId === technique.id}
                  onClick={() => {
                    setMigratingTechniqueId(
                      migratingTechniqueId === technique.id
                        ? undefined
                        : technique.id,
                    );
                    setMigrationMessage("");
                  }}
                >
                  迁移功法
                </button>
              </div>
            </article>
          );
        })}
        {techniques.length === 0 && (
          <p className="progress-muted">
            {isIndependent
              ? "当前还没有独立功法，可以从 AI 草案规划开始创建。"
              : "当前门派还没有功法。"}
          </p>
        )}
      </div>
    </section>
  );
}

type IndependentKnowledgePointInput = {
  name: string;
  description: string;
  domainTags: string[];
  topicTags: string[];
  granularity: KnowledgeGranularity;
  difficulty: number;
  importance: number;
};

type IndependentKnowledgePointFormProps = {
  onCreate: (input: IndependentKnowledgePointInput) => KnowledgePoint;
};

function IndependentKnowledgePointForm({
  onCreate,
}: IndependentKnowledgePointFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domainTagsInput, setDomainTagsInput] = useState("");
  const [topicTagsInput, setTopicTagsInput] = useState("");
  const [granularity, setGranularity] =
    useState<KnowledgeGranularity>("normal");
  const [difficulty, setDifficulty] = useState(1);
  const [importance, setImportance] = useState(1);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function submitIndependentKnowledgePoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const knowledgePoint = onCreate({
        name,
        description,
        domainTags: parseDelimitedDraftValues(domainTagsInput),
        topicTags: parseDelimitedDraftValues(topicTagsInput),
        granularity,
        difficulty,
        importance,
      });

      setName("");
      setDescription("");
      setDomainTagsInput("");
      setTopicTagsInput("");
      setGranularity("normal");
      setDifficulty(1);
      setImportance(1);
      setFormError("");
      setSuccessMessage(`已创建“${knowledgePoint.name}”。`);
    } catch (error) {
      setSuccessMessage("");
      setFormError(
        error instanceof Error ? error.message : "创建秘术知识点失败。",
      );
    }
  }

  return (
    <section
      className="independent-knowledge-create"
      aria-label="创建秘术知识点"
    >
      <div className="section-title-row">
        <h2>创建秘术知识点</h2>
      </div>
      <form className="rule-config-form" onSubmit={submitIndependentKnowledgePoint}>
        <fieldset>
          <legend>知识内容</legend>
          <div className="creation-form-grid">
            <label className="full-width-field">
              名称
              <input
                required
                minLength={1}
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldReference standardKey="knowledgeName" />
            </label>
            <label className="full-width-field">
              学习边界说明
              <textarea
                required
                minLength={10}
                maxLength={1500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <FieldReference standardKey="knowledgeDescription" />
            </label>
            <label>
              领域标签
              <input
                value={domainTagsInput}
                onChange={(event) => setDomainTagsInput(event.target.value)}
                placeholder="例如：数学、编程"
              />
              <FieldReference standardKey="knowledgeTags" />
            </label>
            <label>
              主题标签
              <input
                value={topicTagsInput}
                onChange={(event) => setTopicTagsInput(event.target.value)}
                placeholder="例如：概念、方法"
              />
              <FieldReference standardKey="knowledgeTags" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>学习校准</legend>
          <div className="creation-form-grid">
            <label>
              精细度
              <select
                value={granularity}
                onChange={(event) =>
                  setGranularity(event.target.value as KnowledgeGranularity)
                }
              >
                <option value="rough">粗略</option>
                <option value="normal">普通</option>
                <option value="detailed">细分</option>
              </select>
              <FieldReference
                standardKey="generationDetailLevel"
                preview={`系统基础价值：${getIndependentKnowledgeBaseValue(granularity)}`}
              />
            </label>
            <label>
              难度
              <input
                required
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={difficulty}
                onChange={(event) => setDifficulty(Number(event.target.value))}
              />
              <FieldReference standardKey="knowledgeDifficulty" />
            </label>
            <label>
              重要度
              <input
                required
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={importance}
                onChange={(event) => setImportance(Number(event.target.value))}
              />
              <FieldReference standardKey="knowledgeImportance" />
            </label>
          </div>
        </fieldset>

        {formError && <p className="form-error">{formError}</p>}
        {successMessage && <p className="form-success">{successMessage}</p>}
        <button type="submit">创建知识点</button>
      </form>
    </section>
  );
}

type KnowledgePointMigrationPanelProps = {
  knowledgePoint: KnowledgePoint;
  repository: CultivationStructureRepository;
  ownershipIndex: KnowledgeOwnershipIndex;
  practiceRecords: PracticeRecord[];
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[];
  onConfirm: (
    knowledgePointId: string,
    toUnitId: string,
    reason: string,
    targetLabel: string,
  ) => void;
  onCancel: () => void;
};

type KnowledgePointEditPanelProps = {
  knowledgePoint: KnowledgePoint;
  availablePrerequisites: KnowledgePoint[];
  maxTechniqueLayer: number;
  onSave: (
    knowledgePointId: string,
    patch: KnowledgePointEditPatch,
  ) => void;
  onCancel: () => void;
};

function KnowledgePointEditPanel({
  knowledgePoint,
  availablePrerequisites,
  maxTechniqueLayer,
  onSave,
  onCancel,
}: KnowledgePointEditPanelProps) {
  const [draft, setDraft] = useState(() => ({
    ...knowledgePoint,
    domainTags: [...knowledgePoint.domainTags],
    topicTags: [...knowledgePoint.topicTags],
    prerequisiteKnowledgePointIds: [
      ...knowledgePoint.prerequisiteKnowledgePointIds,
    ],
  }));
  const [domainTagsInput, setDomainTagsInput] = useState(
    knowledgePoint.domainTags.join("、"),
  );
  const [topicTagsInput, setTopicTagsInput] = useState(
    knowledgePoint.topicTags.join("、"),
  );
  const [reviewIntervalsInput, setReviewIntervalsInput] = useState(
    knowledgePoint.reviewIntervalsOverride?.join("、") ?? "",
  );
  const [formError, setFormError] = useState("");

  function updateDraft(patch: Partial<KnowledgePoint>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...patch }));
  }

  function togglePrerequisite(
    prerequisiteKnowledgePointId: string,
    isChecked: boolean,
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      prerequisiteKnowledgePointIds: isChecked
        ? Array.from(
            new Set([
              ...currentDraft.prerequisiteKnowledgePointIds,
              prerequisiteKnowledgePointId,
            ]),
          )
        : currentDraft.prerequisiteKnowledgePointIds.filter(
            (id) => id !== prerequisiteKnowledgePointId,
          ),
    }));
  }

  function submitKnowledgePointEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      onSave(knowledgePoint.id, {
        displayCode: draft.displayCode,
        name: draft.name,
        description: draft.description,
        domainTags: parseDelimitedDraftValues(domainTagsInput),
        topicTags: parseDelimitedDraftValues(topicTagsInput),
        granularity: draft.granularity,
        baseValue: draft.baseValue,
        difficulty: draft.difficulty,
        importance: draft.importance,
        targetLayer: draft.targetLayer,
        maxTrainableLayer: draft.maxTrainableLayer,
        requiredExerciseCount: draft.requiredExerciseCount,
        requiredNoteCount: draft.requiredNoteCount,
        requiredThinkingCount: draft.requiredThinkingCount,
        reviewIntervalsOverride: parseReviewIntervalDraft(
          reviewIntervalsInput,
        ),
        manaWeight: draft.manaWeight,
        insightWeight: draft.insightWeight,
        prerequisiteKnowledgePointIds:
          draft.prerequisiteKnowledgePointIds,
      });
      setFormError("");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "保存知识点失败。",
      );
    }
  }

  return (
    <form
      className="knowledge-management-panel rule-config-form"
      aria-label={`编辑${knowledgePoint.name}`}
      onSubmit={submitKnowledgePointEdit}
    >
      <div className="section-title-row">
        <h3>编辑“{knowledgePoint.name}”</h3>
        <button className="secondary-button" type="button" onClick={onCancel}>
          取消
        </button>
      </div>

      <fieldset>
        <legend>知识内容</legend>
        <div className="creation-form-grid">
          <label>
            显示编号
            <input
              maxLength={80}
              value={draft.displayCode ?? ""}
              onChange={(event) =>
                updateDraft({ displayCode: event.target.value || undefined })
              }
            />
            <FieldReference standardKey="knowledgeDisplayCode" />
          </label>
          <label>
            精细度
            <select
              value={draft.granularity}
              onChange={(event) =>
                updateDraft({
                  granularity: event.target.value as KnowledgeGranularity,
                })
              }
            >
              <option value="rough">粗略</option>
              <option value="normal">普通</option>
              <option value="detailed">细分</option>
            </select>
            <FieldReference standardKey="formalKnowledgeGranularity" />
          </label>
          <label className="full-width-field">
            名称
            <input
              required
              minLength={1}
              maxLength={80}
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
            />
            <FieldReference standardKey="knowledgeName" />
          </label>
          <label className="full-width-field">
            学习边界说明
            <textarea
              required
              minLength={10}
              maxLength={1500}
              value={draft.description}
              onChange={(event) =>
                updateDraft({ description: event.target.value })
              }
            />
            <FieldReference standardKey="knowledgeDescription" />
          </label>
          <label>
            领域标签
            <input
              value={domainTagsInput}
              onChange={(event) => setDomainTagsInput(event.target.value)}
              placeholder="例如：数学、编程"
            />
            <FieldReference standardKey="knowledgeTags" />
          </label>
          <label>
            主题标签
            <input
              value={topicTagsInput}
              onChange={(event) => setTopicTagsInput(event.target.value)}
              placeholder="例如：概念、方法"
            />
            <FieldReference standardKey="knowledgeTags" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>学习校准</legend>
        <div className="creation-form-grid">
          <label>
            基础价值
            <input
              required
              type="number"
              min="1"
              max="1000000"
              step="1"
              value={draft.baseValue}
              onChange={(event) =>
                updateDraft({ baseValue: Number(event.target.value) })
              }
            />
            <FieldReference
              standardKey="formalKnowledgeBaseValue"
              preview={`当前值：${draft.baseValue}`}
            />
          </label>
          <label>
            难度
            <input
              required
              type="number"
              min="0.1"
              max="5"
              step="0.01"
              value={draft.difficulty}
              onChange={(event) =>
                updateDraft({ difficulty: Number(event.target.value) })
              }
            />
            <FieldReference standardKey="knowledgeDifficulty" />
          </label>
          <label>
            重要度
            <input
              required
              type="number"
              min="0.1"
              max="5"
              step="0.01"
              value={draft.importance}
              onChange={(event) =>
                updateDraft({ importance: Number(event.target.value) })
              }
            />
            <FieldReference standardKey="knowledgeImportance" />
          </label>
          <label>
            目标层数
            <input
              required
              type="number"
              min="1"
              max={draft.maxTrainableLayer}
              step="1"
              value={draft.targetLayer}
              onChange={(event) =>
                updateDraft({ targetLayer: Number(event.target.value) })
              }
            />
            <FieldReference standardKey="knowledgeLayer" />
          </label>
          <label>
            最高可修炼层数
            <input
              required
              type="number"
              min="1"
              max={maxTechniqueLayer}
              step="1"
              value={draft.maxTrainableLayer}
              onChange={(event) =>
                updateDraft({
                  maxTrainableLayer: Number(event.target.value),
                })
              }
            />
            <FieldReference standardKey="knowledgeLayer" />
          </label>
          <label>
            练习要求
            <input
              required
              type="number"
              min="0"
              max="100"
              step="1"
              value={draft.requiredExerciseCount}
              onChange={(event) =>
                updateDraft({
                  requiredExerciseCount: Number(event.target.value),
                })
              }
            />
            <FieldReference standardKey="requiredExerciseCount" />
          </label>
          <label>
            笔记要求
            <input
              required
              type="number"
              min="0"
              max="20"
              step="1"
              value={draft.requiredNoteCount}
              onChange={(event) =>
                updateDraft({
                  requiredNoteCount: Number(event.target.value),
                })
              }
            />
            <FieldReference standardKey="requiredNoteCount" />
          </label>
          <label>
            思考要求
            <input
              required
              type="number"
              min="0"
              max="20"
              step="1"
              value={draft.requiredThinkingCount}
              onChange={(event) =>
                updateDraft({
                  requiredThinkingCount: Number(event.target.value),
                })
              }
            />
            <FieldReference standardKey="requiredThinkingCount" />
          </label>
          <label>
            法力倾向
            <input
              required
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={draft.manaWeight}
              onChange={(event) =>
                updateDraft({ manaWeight: Number(event.target.value) })
              }
            />
            <FieldReference standardKey="knowledgeTendencyWeight" />
          </label>
          <label>
            神识倾向
            <input
              required
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={draft.insightWeight}
              onChange={(event) =>
                updateDraft({ insightWeight: Number(event.target.value) })
              }
            />
            <FieldReference standardKey="knowledgeTendencyWeight" />
          </label>
          <label className="full-width-field">
            自定义复习间隔
            <input
              value={reviewIntervalsInput}
              onChange={(event) =>
                setReviewIntervalsInput(event.target.value)
              }
              placeholder="例如：2、7、21、60"
            />
            <FieldReference standardKey="knowledgeReviewIntervals" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>前置知识点</legend>
        <FieldReference standardKey="knowledgePrerequisites" />
        {availablePrerequisites.length > 0 ? (
          <div className="knowledge-prerequisite-list">
            {availablePrerequisites.map((prerequisite) => (
              <label className="inline-checkbox" key={prerequisite.id}>
                <input
                  type="checkbox"
                  checked={draft.prerequisiteKnowledgePointIds.includes(
                    prerequisite.id,
                  )}
                  onChange={(event) =>
                    togglePrerequisite(
                      prerequisite.id,
                      event.target.checked,
                    )
                  }
                />
                {prerequisite.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="progress-muted">当前单元没有其他可选知识点。</p>
        )}
      </fieldset>

      {formError && <p className="form-error">{formError}</p>}
      <div className="inline-actions">
        <button type="submit">保存修改</button>
        <button className="secondary-button" type="button" onClick={onCancel}>
          放弃修改
        </button>
      </div>
    </form>
  );
}

function getOwnershipPathLabel(
  repository: CultivationStructureRepository,
  path: KnowledgePointMigrationPreview["fromPath"],
): string {
  const technique = repository.techniques.find(
    (item) => item.id === path.techniqueId,
  );
  const sect = repository.sects.find((item) => item.id === path.sectId);
  const chapter = repository.chapters.find(
    (item) => item.id === path.chapterId,
  );
  const unit = repository.units.find((item) => item.id === path.unitId);

  if (technique?.kind === "standalone_container") {
    return ["秘术合集", chapter?.name, unit?.name]
      .filter(Boolean)
      .join(" / ");
  }

  return [sect?.name, technique?.name, chapter?.name, unit?.name]
    .filter(Boolean)
    .join(" / ");
}

function KnowledgePointMigrationPanel({
  knowledgePoint,
  repository,
  ownershipIndex,
  practiceRecords,
  practiceRecordKnowledgePoints,
  onConfirm,
  onCancel,
}: KnowledgePointMigrationPanelProps) {
  const destinationOptions = repository.units.flatMap((unit) => {
    if (unit.id === knowledgePoint.unitId || unit.archivedAt) {
      return [];
    }

    const chapter = ownershipIndex.chaptersById.get(unit.chapterId);
    const technique = chapter
      ? ownershipIndex.techniquesById.get(chapter.techniqueId)
      : undefined;
    const sect = technique
      ? repository.sects.find((item) => item.id === technique.sectId)
      : undefined;
    const isAllowedTechnique =
      technique?.kind === "standalone_container" ||
      (technique !== undefined && !technique.isSystem && !technique.archivedAt);

    if (!chapter || chapter.archivedAt || !technique || !isAllowedTechnique) {
      return [];
    }

    const label =
      technique.kind === "standalone_container"
        ? `秘术合集 / ${chapter.name} / ${unit.name}`
        : `${sect?.name ?? "未归类门派"} / ${technique.name} / ${chapter.name} / ${unit.name}`;

    return [{ unitId: unit.id, label }];
  });
  const [targetUnitId, setTargetUnitId] = useState(
    destinationOptions[0]?.unitId ?? "",
  );
  const [reason, setReason] = useState("");
  const [preview, setPreview] =
    useState<KnowledgePointMigrationPreview>();
  const [formError, setFormError] = useState("");

  function previewMigration() {
    if (!targetUnitId) {
      setFormError("当前没有可用的目标单元。");
      return;
    }

    try {
      setPreview(
        createKnowledgePointMigrationPreview(
          repository,
          knowledgePoint.id,
          targetUnitId,
          practiceRecords,
          practiceRecordKnowledgePoints,
        ),
      );
      setFormError("");
    } catch (error) {
      setPreview(undefined);
      setFormError(
        error instanceof Error ? error.message : "生成迁移预览失败。",
      );
    }
  }

  function confirmMigration() {
    const previewTargetUnitId = preview?.toPath.unitId;
    const targetLabel = destinationOptions.find(
      (option) => option.unitId === previewTargetUnitId,
    )?.label;

    if (!previewTargetUnitId || !targetLabel) {
      setFormError("请先生成当前目标的迁移预览。");
      return;
    }

    try {
      onConfirm(
        knowledgePoint.id,
        previewTargetUnitId,
        reason,
        targetLabel,
      );
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "迁移知识点失败。",
      );
    }
  }

  return (
    <section
      className="knowledge-migration-panel"
      aria-label={`调整${knowledgePoint.name}归属`}
    >
      <div className="section-title-row">
        <h3>调整“{knowledgePoint.name}”归属</h3>
        <button className="secondary-button" type="button" onClick={onCancel}>
          取消
        </button>
      </div>

      <div className="rule-config-form">
        <label>
          目标位置
          <select
            value={targetUnitId}
            disabled={destinationOptions.length === 0}
            onChange={(event) => {
              setTargetUnitId(event.target.value);
              setPreview(undefined);
              setFormError("");
            }}
          >
            {destinationOptions.map((option) => (
              <option key={option.unitId} value={option.unitId}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          调整原因（可选）
          <textarea
            maxLength={300}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <button
          className="secondary-button"
          type="button"
          disabled={!targetUnitId}
          onClick={previewMigration}
        >
          预览影响
        </button>

        {preview && (
          <section className="migration-preview" aria-label="迁移影响预览">
            <dl>
              <div>
                <dt>当前位置</dt>
                <dd>{getOwnershipPathLabel(repository, preview.fromPath)}</dd>
              </div>
              <div>
                <dt>目标位置</dt>
                <dd>{getOwnershipPathLabel(repository, preview.toPath)}</dd>
              </div>
              <div>
                <dt>调整范围</dt>
                <dd>{preview.isCrossTechnique ? "跨功法" : "同功法"}</dd>
              </div>
              <div>
                <dt>迁移方向</dt>
                <dd>
                  {preview.movesOutOfStandalone
                    ? "秘术知识点转入正式功法"
                    : preview.movesIntoStandalone
                      ? "功法知识点转入秘术合集"
                      : "现有结构内调整"}
                </dd>
              </div>
              <div>
                <dt>关联记录</dt>
                <dd>
                  {preview.activePracticeRecordCount} 条有效 /{" "}
                  {preview.deletedPracticeRecordCount} 条已删除
                </dd>
              </div>
              <div>
                <dt>知识点 ID</dt>
                <dd>保持不变</dd>
              </div>
              <div>
                <dt>自定义复习间隔</dt>
                <dd>{preview.keepsCustomReviewIntervals ? "保留" : "未设置"}</dd>
              </div>
            </dl>
            {preview.isCrossTechnique && (
              <p className="progress-muted">
                历史修炼记录继续保留原功法和门派快照，当前归属改为目标位置。
              </p>
            )}
            <button type="button" onClick={confirmMigration}>
              确认迁移
            </button>
          </section>
        )}

        {formError && <p className="form-error">{formError}</p>}
      </div>
    </section>
  );
}

type KnowledgePageProps = {
  repository: CultivationStructureRepository;
  sectId: string;
  sectName: string;
  techniqueName: string;
  techniqueId: string;
  backTo: string;
  isSecretArts?: boolean;
  knowledgePoints: KnowledgePoint[];
  archivedKnowledgePoints: KnowledgePoint[];
  ownershipIndex: KnowledgeOwnershipIndex;
  practiceDefaults?: TechniquePracticeDefaults;
  layerRules: TechniqueLayerRule[];
  knowledgePointStatsById: Record<string, KnowledgePointPracticeStats>;
  knowledgePointProgressById: Record<string, KnowledgePointProgress>;
  techniqueProgress?: TechniqueProgress;
  practiceRecords: PracticeRecord[];
  practiceRecordKnowledgePoints: PracticeRecordKnowledgePoint[];
  allPracticeRecords: PracticeRecord[];
  allPracticeRecordKnowledgePoints: PracticeRecordKnowledgePoint[];
  onAddPracticeRecord: (
    record: PracticeRecord,
    recordKnowledgePoints: PracticeRecordKnowledgePoint[],
  ) => void;
  onDeletePracticeRecord: (recordId: string) => void;
  onRestorePracticeRecord: (recordId: string) => void;
  onUpdatePracticeRecordContent: (recordId: string, content: string) => void;
  onClearLocalPracticeData: () => void;
  onUpdateTechniquePracticeRules: (
    practiceDefaults: TechniquePracticeDefaults,
    includeManualRecords: boolean,
  ) => void;
  onResetTechniquePracticeRules: (techniqueId: string) => void;
  onUpdateTechniqueLayerRules: (layerRules: TechniqueLayerRule[]) => void;
  onResetTechniqueLayerRules: (techniqueId: string) => void;
  onCreateIndependentKnowledgePoint?: (
    input: IndependentKnowledgePointInput,
  ) => KnowledgePoint;
  onMigrateKnowledgePoint: (
    knowledgePointId: string,
    toUnitId: string,
    reason?: string,
  ) => void;
  onEditKnowledgePoint: (
    knowledgePointId: string,
    patch: KnowledgePointEditPatch,
  ) => void;
  onDeleteKnowledgePoint: (knowledgePointId: string) => void;
  onRestoreKnowledgePoint: (knowledgePointId: string) => void;
};

function KnowledgePage({
  repository,
  sectId,
  sectName,
  techniqueName,
  techniqueId,
  backTo,
  isSecretArts = false,
  knowledgePoints,
  archivedKnowledgePoints,
  ownershipIndex,
  practiceDefaults,
  layerRules,
  knowledgePointStatsById,
  knowledgePointProgressById,
  techniqueProgress,
  practiceRecords,
  practiceRecordKnowledgePoints,
  allPracticeRecords,
  allPracticeRecordKnowledgePoints,
  onAddPracticeRecord,
  onDeletePracticeRecord,
  onRestorePracticeRecord,
  onUpdatePracticeRecordContent,
  onClearLocalPracticeData,
  onUpdateTechniquePracticeRules,
  onResetTechniquePracticeRules,
  onUpdateTechniqueLayerRules,
  onResetTechniqueLayerRules,
  onCreateIndependentKnowledgePoint,
  onMigrateKnowledgePoint,
  onEditKnowledgePoint,
  onDeleteKnowledgePoint,
  onRestoreKnowledgePoint,
}: KnowledgePageProps) {
  const [knowledgePointAllocations, setKnowledgePointAllocations] = useState<
    PracticeRecordKnowledgePointDraft[]
  >([]);
  const [formResetKey, setFormResetKey] = useState(0);
  const [editingKnowledgePointId, setEditingKnowledgePointId] =
    useState<string>();
  const [deletingKnowledgePointId, setDeletingKnowledgePointId] =
    useState<string>();
  const [migratingKnowledgePointId, setMigratingKnowledgePointId] =
    useState<string>();
  const [migrationMessage, setMigrationMessage] = useState("");
  const [managementMessage, setManagementMessage] = useState("");
  const [managementError, setManagementError] = useState("");
  const selectedKnowledgePointIdSet = new Set(
    knowledgePointAllocations.map((allocation) => allocation.knowledgePointId),
  );
  const visibleChapters = groupKnowledgePointsByChapter(
    knowledgePoints,
    ownershipIndex,
  );
  const selectedKnowledgePoints = knowledgePoints.filter((knowledgePoint) =>
    selectedKnowledgePointIdSet.has(knowledgePoint.id),
  );
  const technique = repository.techniques.find(
    (item) => item.id === techniqueId,
  );
  const maxTechniqueLayer =
    technique && technique.maxLayer > 0 ? technique.maxLayer : 6;

  function toggleKnowledgePoint(knowledgePointId: string) {
    setKnowledgePointAllocations((currentAllocations) => {
      const isSelected = currentAllocations.some(
        (allocation) => allocation.knowledgePointId === knowledgePointId,
      );
      const nextKnowledgePointIds = isSelected
        ? currentAllocations
            .filter(
              (allocation) =>
                allocation.knowledgePointId !== knowledgePointId,
            )
            .map((allocation) => allocation.knowledgePointId)
        : [
            ...currentAllocations.map(
              (allocation) => allocation.knowledgePointId,
            ),
            knowledgePointId,
          ];

      if (nextKnowledgePointIds.length === 0) {
        return [];
      }

      const equalWeight = 1 / nextKnowledgePointIds.length;

      return nextKnowledgePointIds.map((id) => ({
        knowledgePointId: id,
        allocationWeight: equalWeight,
      }));
    });
  }

  function updateKnowledgePointAllocation(
    knowledgePointId: string,
    allocationWeight: number,
  ) {
    const normalizedWeight = Math.min(Math.max(allocationWeight, 0), 1);

    setKnowledgePointAllocations((currentAllocations) =>
      currentAllocations.map((allocation) =>
        allocation.knowledgePointId === knowledgePointId
          ? { ...allocation, allocationWeight: normalizedWeight }
          : allocation,
      ),
    );
  }

  function submitPracticeRecord(submission: PracticeRecordFormSubmission) {
    const {
      knowledgePointAllocations: submittedAllocations,
      ...recordValues
    } = submission;
    const createdAt = new Date().toISOString();
    const recordId = crypto.randomUUID();
    const record: PracticeRecord = {
      id: recordId,
      sectId,
      techniqueId,
      ...recordValues,
      createdAt,
      updatedAt: createdAt,
    };
    const recordKnowledgePoints: PracticeRecordKnowledgePoint[] =
      submittedAllocations.map((allocation) => ({
        id: crypto.randomUUID(),
        recordId,
        knowledgePointId: allocation.knowledgePointId,
        allocationWeight: allocation.allocationWeight,
      }));

    onAddPracticeRecord(record, recordKnowledgePoints);
    setKnowledgePointAllocations([]);
    setFormResetKey((currentKey) => currentKey + 1);
  }

  function confirmKnowledgePointMigration(
    knowledgePointId: string,
    toUnitId: string,
    reason: string,
    targetLabel: string,
  ) {
    onMigrateKnowledgePoint(knowledgePointId, toUnitId, reason);
    setKnowledgePointAllocations((currentAllocations) =>
      currentAllocations.filter(
        (allocation) => allocation.knowledgePointId !== knowledgePointId,
      ),
    );
    setMigratingKnowledgePointId(undefined);
    setMigrationMessage(`知识点已迁移到 ${targetLabel}。`);
  }

  function saveKnowledgePointEdit(
    knowledgePointId: string,
    patch: KnowledgePointEditPatch,
  ) {
    onEditKnowledgePoint(knowledgePointId, patch);
    const knowledgePointName =
      patch.name?.trim() ||
      knowledgePoints.find((item) => item.id === knowledgePointId)?.name ||
      "当前知识点";
    setEditingKnowledgePointId(undefined);
    setManagementError("");
    setManagementMessage(`已保存“${knowledgePointName}”。`);
  }

  function confirmKnowledgePointDelete(knowledgePoint: KnowledgePoint) {
    try {
      onDeleteKnowledgePoint(knowledgePoint.id);
      setKnowledgePointAllocations((currentAllocations) =>
        currentAllocations.filter(
          (allocation) =>
            allocation.knowledgePointId !== knowledgePoint.id,
        ),
      );
      setEditingKnowledgePointId(undefined);
      setDeletingKnowledgePointId(undefined);
      setMigratingKnowledgePointId(undefined);
      setManagementError("");
      setManagementMessage(
        `已删除“${knowledgePoint.name}”，可以在已删除知识点中恢复。`,
      );
    } catch (error) {
      setManagementMessage("");
      setManagementError(
        error instanceof Error ? error.message : "删除知识点失败。",
      );
    }
  }

  function restoreDeletedKnowledgePoint(knowledgePoint: KnowledgePoint) {
    try {
      onRestoreKnowledgePoint(knowledgePoint.id);
      setManagementError("");
      setManagementMessage(`已恢复“${knowledgePoint.name}”。`);
    } catch (error) {
      setManagementMessage("");
      setManagementError(
        error instanceof Error ? error.message : "恢复知识点失败。",
      );
    }
  }

  return (
    <section className="page-panel">
      <PageToolbar
        title={isSecretArts ? "秘术合集" : "知识点修炼界面"}
        backTo={backTo}
      />

      <div className="knowledge-layout">
        <section className="content-section">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{sectName} / {techniqueName}</p>
              <p className="intro">
                {isSecretArts
                  ? "这里直接收纳不需要建立完整功法的零散知识点。"
                  : "知识点属于当前功法，先按章节做文件夹式层级展示，后续再升级成可点亮的图形知识树。"}
              </p>
            </div>
            <button
              className="danger-button"
              type="button"
              onClick={onClearLocalPracticeData}
            >
              清空本地修炼记录
            </button>
          </div>

          {onCreateIndependentKnowledgePoint && (
            <IndependentKnowledgePointForm
              onCreate={onCreateIndependentKnowledgePoint}
            />
          )}

          {migrationMessage && (
            <p className="form-success">{migrationMessage}</p>
          )}
          {managementMessage && (
            <p className="form-success">{managementMessage}</p>
          )}
          {managementError && (
            <p className="form-error">{managementError}</p>
          )}

          <div className="knowledge-tree">
            <article>
              <h2>{isSecretArts ? "秘术知识点" : techniqueName}</h2>
              {visibleChapters.length > 0 ? (
                visibleChapters.map((chapter) => (
                  <details key={chapter.chapterCode} open>
                    <summary>{chapter.chapterName}</summary>
                    <ul>
                      {chapter.knowledgePoints.map((knowledgePoint) => (
                        <li className="knowledge-tree-item" key={knowledgePoint.id}>
                          <div className="knowledge-tree-row">
                            <button
                              className="knowledge-tree-select"
                              type="button"
                              aria-pressed={selectedKnowledgePointIdSet.has(
                                knowledgePoint.id,
                              )}
                              onClick={() =>
                                toggleKnowledgePoint(knowledgePoint.id)
                              }
                            >
                              <span className="knowledge-point-row">
                                <span>{knowledgePoint.name}</span>
                                <span className="knowledge-point-stat">
                                  进度{" "}
                                  {formatPercent(
                                    knowledgePointProgressById[
                                      knowledgePoint.id
                                    ]?.totalProgressRatio ?? 0,
                                  )}{" "}
                                  /{" "}
                                  经验 {Math.round(
                                    (knowledgePointStatsById[
                                      knowledgePoint.id
                                    ]?.totalExperience ?? 0) * 100,
                                  ) / 100}
                                </span>
                              </span>
                            </button>
                            <div className="knowledge-tree-actions">
                              <button
                                className="secondary-button"
                                type="button"
                                aria-expanded={
                                  editingKnowledgePointId === knowledgePoint.id
                                }
                                onClick={() => {
                                  setEditingKnowledgePointId(
                                    editingKnowledgePointId === knowledgePoint.id
                                      ? undefined
                                      : knowledgePoint.id,
                                  );
                                  setDeletingKnowledgePointId(undefined);
                                  setMigratingKnowledgePointId(undefined);
                                  setManagementMessage("");
                                  setManagementError("");
                                }}
                              >
                                编辑
                              </button>
                              <button
                                className="secondary-button knowledge-migration-toggle"
                                type="button"
                                aria-expanded={
                                  migratingKnowledgePointId === knowledgePoint.id
                                }
                                onClick={() => {
                                  setMigratingKnowledgePointId(
                                    migratingKnowledgePointId === knowledgePoint.id
                                      ? undefined
                                      : knowledgePoint.id,
                                  );
                                  setEditingKnowledgePointId(undefined);
                                  setDeletingKnowledgePointId(undefined);
                                  setMigrationMessage("");
                                  setManagementMessage("");
                                  setManagementError("");
                                }}
                              >
                                调整归属
                              </button>
                              <button
                                className="danger-button"
                                type="button"
                                aria-expanded={
                                  deletingKnowledgePointId === knowledgePoint.id
                                }
                                onClick={() => {
                                  setDeletingKnowledgePointId(
                                    deletingKnowledgePointId === knowledgePoint.id
                                      ? undefined
                                      : knowledgePoint.id,
                                  );
                                  setEditingKnowledgePointId(undefined);
                                  setMigratingKnowledgePointId(undefined);
                                  setManagementMessage("");
                                  setManagementError("");
                                }}
                              >
                                删除
                              </button>
                            </div>
                          </div>
                          {editingKnowledgePointId === knowledgePoint.id && (
                            <KnowledgePointEditPanel
                              key={knowledgePoint.updatedAt}
                              knowledgePoint={knowledgePoint}
                              availablePrerequisites={knowledgePoints.filter(
                                (item) =>
                                  item.id !== knowledgePoint.id &&
                                  item.unitId === knowledgePoint.unitId,
                              )}
                              maxTechniqueLayer={maxTechniqueLayer}
                              onSave={saveKnowledgePointEdit}
                              onCancel={() =>
                                setEditingKnowledgePointId(undefined)
                              }
                            />
                          )}
                          {migratingKnowledgePointId === knowledgePoint.id && (
                            <KnowledgePointMigrationPanel
                              knowledgePoint={knowledgePoint}
                              repository={repository}
                              ownershipIndex={ownershipIndex}
                              practiceRecords={allPracticeRecords}
                              practiceRecordKnowledgePoints={
                                allPracticeRecordKnowledgePoints
                              }
                              onConfirm={confirmKnowledgePointMigration}
                              onCancel={() =>
                                setMigratingKnowledgePointId(undefined)
                              }
                            />
                          )}
                          {deletingKnowledgePointId === knowledgePoint.id && (
                            <section
                              className="knowledge-delete-confirmation"
                              aria-label={`删除${knowledgePoint.name}`}
                            >
                              <h3>删除“{knowledgePoint.name}”？</h3>
                              <p>
                                删除后不再参与当前修炼、进度和复习提醒，已有修炼记录与知识点 ID 会继续保留。
                              </p>
                              <div className="inline-actions">
                                <button
                                  className="danger-button"
                                  type="button"
                                  onClick={() =>
                                    confirmKnowledgePointDelete(knowledgePoint)
                                  }
                                >
                                  确认删除
                                </button>
                                <button
                                  className="secondary-button"
                                  type="button"
                                  onClick={() =>
                                    setDeletingKnowledgePointId(undefined)
                                  }
                                >
                                  取消
                                </button>
                              </div>
                            </section>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))
              ) : (
                <p>
                  {isSecretArts
                    ? "秘术合集中还没有知识点。"
                    : "当前功法尚未创建知识点。"}
                </p>
              )}
            </article>
          </div>

          {archivedKnowledgePoints.length > 0 && (
            <details className="archived-knowledge-points">
              <summary>
                已删除知识点（{archivedKnowledgePoints.length}）
              </summary>
              <ul>
                {archivedKnowledgePoints.map((knowledgePoint) => (
                  <li key={knowledgePoint.id}>
                    <div>
                      <strong>{knowledgePoint.name}</strong>
                      <span>
                        删除于 {new Date(
                          knowledgePoint.archivedAt ?? knowledgePoint.updatedAt,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        restoreDeletedKnowledgePoint(knowledgePoint)
                      }
                    >
                      恢复
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <PracticeRecordsList
            records={practiceRecords}
            recordKnowledgePoints={practiceRecordKnowledgePoints}
            knowledgePoints={knowledgePoints}
            onDelete={onDeletePracticeRecord}
            onRestore={onRestorePracticeRecord}
            onUpdateContent={onUpdatePracticeRecordContent}
          />
        </section>

        <aside className="side-panel">
          <h2>知识点详情</h2>
          <p>当前进度由修炼记录自动派生，练习、笔记、思考和到期复习分别封顶。</p>
          {techniqueProgress && (
            <section
              className="practice-rule-summary"
              aria-label={`${techniqueName}层数进度`}
            >
              <h3>功法层数进度</h3>
              <dl>
                <div>
                  <dt>当前层数</dt>
                  <dd>
                    第 {techniqueProgress.currentLayer} /{" "}
                    {techniqueProgress.maxLayer} 层
                  </dd>
                </div>
                <div>
                  <dt>经验</dt>
                  <dd>{techniqueProgress.currentExperience}</dd>
                </div>
                <div>
                  <dt>覆盖</dt>
                  <dd>{formatPercent(techniqueProgress.coverageRatio)}</dd>
                </div>
                <div>
                  <dt>核心覆盖</dt>
                  <dd>{formatPercent(techniqueProgress.coreCoverageRatio)}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>
                    {getTechniqueProgressStatusLabel(
                      techniqueProgress.nextLayerStatus,
                    )}
                  </dd>
                </div>
              </dl>
              {techniqueProgress.nextLayerRule &&
                techniqueProgress.nextLayerGap && (
                  <div className="next-layer-panel">
                    <h4>第 {techniqueProgress.nextLayerRule.layer} 层要求</h4>
                    <ul>
                      <li>
                        经验门槛{" "}
                        {techniqueProgress.nextLayerRule.requiredExperience}
                        ，还差{" "}
                        {techniqueProgress.nextLayerGap.requiredExperienceGap}
                      </li>
                      <li>
                        覆盖要求{" "}
                        {formatPercent(
                          techniqueProgress.nextLayerRule
                            .requiredCoverageRatio,
                        )}
                        ，还差{" "}
                        {formatPercent(
                          techniqueProgress.nextLayerGap.requiredCoverageGap,
                        )}
                      </li>
                      <li>
                        核心覆盖{" "}
                        {formatPercent(
                          techniqueProgress.nextLayerRule
                            .requiredCoreCoverageRatio,
                        )}
                        ，还差{" "}
                        {formatPercent(
                          techniqueProgress.nextLayerGap
                            .requiredCoreCoverageGap,
                        )}
                      </li>
                      <li>
                        薄弱点上限{" "}
                        {formatPercent(
                          techniqueProgress.nextLayerRule.allowedWeakPointRatio,
                        )}
                        ，超出{" "}
                        {formatPercent(
                          techniqueProgress.nextLayerGap.weakPointGap,
                        )}
                      </li>
                    </ul>
                    <h4>突破要求</h4>
                    <ul>
                      {techniqueProgress.nextLayerGap.pendingBreakthroughRequirements.map(
                        (requirement) => (
                          <li key={requirement.id}>{requirement.title}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </section>
          )}
          <section className="practice-rule-summary" aria-label="知识点进度">
            <h3>知识点进度概览</h3>
            <div className="knowledge-progress-list">
              {knowledgePoints.map((knowledgePoint) => {
                const progress =
                  knowledgePointProgressById[knowledgePoint.id];

                return (
                  <article key={knowledgePoint.id}>
                    <h4>{knowledgePoint.name}</h4>
                    {progress ? (
                      <>
                        <div className="progress-bar" aria-hidden="true">
                          <span
                            style={{
                              width: formatPercent(progress.totalProgressRatio),
                            }}
                          />
                        </div>
                        <p>
                          总进度 {formatPercent(progress.totalProgressRatio)}
                          ，复习状态 {getReviewStatusLabel(progress.reviewStatus)}
                        </p>
                        <dl>
                          <div>
                            <dt>练习</dt>
                            <dd>
                              {formatPercent(
                                progress.dimensions.exercise.progressRatio,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt>笔记</dt>
                            <dd>
                              {formatPercent(
                                progress.dimensions.note.progressRatio,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt>思考</dt>
                            <dd>
                              {formatPercent(
                                progress.dimensions.thinking.progressRatio,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt>复习</dt>
                            <dd>
                              {progress.dimensions.review.isActive
                                ? formatPercent(
                                    progress.dimensions.review.progressRatio,
                                  )
                                : "未到期"}
                            </dd>
                          </div>
                        </dl>
                      </>
                    ) : (
                      <p>当前知识点尚未配置进度规则。</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
          {practiceDefaults ? (
            <>
              <TechniquePracticeRulesForm
                techniqueName={techniqueName}
                practiceDefaults={practiceDefaults}
                onSave={onUpdateTechniquePracticeRules}
                onReset={() => onResetTechniquePracticeRules(techniqueId)}
              />
              {layerRules.length > 0 && (
                <TechniqueLayerRulesForm
                  techniqueName={techniqueName}
                  layerRules={layerRules}
                  onSave={onUpdateTechniqueLayerRules}
                  onReset={() => onResetTechniqueLayerRules(techniqueId)}
                />
              )}
              <section
                className="practice-rule-summary"
                aria-label={`${techniqueName}默认修炼规则`}
              >
                <h3>当前功法默认规则</h3>
                <dl>
                  <div>
                    <dt>练习</dt>
                    <dd>{practiceDefaults.requiredExerciseCount} 题</dd>
                  </div>
                  <div>
                    <dt>笔记</dt>
                    <dd>{practiceDefaults.requiredNoteCount} 个</dd>
                  </div>
                  <div>
                    <dt>思考</dt>
                    <dd>{practiceDefaults.requiredThinkingCount} 次</dd>
                  </div>
                  <div>
                    <dt>复习间隔</dt>
                    <dd>
                      {practiceDefaults.reviewSchedule.intervalsDays.join("、")} 天
                    </dd>
                  </div>
                </dl>
              </section>
              <PracticeRecordForm
                key={`${techniqueId}-${formResetKey}`}
                techniqueId={techniqueId}
                techniqueName={techniqueName}
                practiceDefaults={practiceDefaults}
                selectedKnowledgePoints={selectedKnowledgePoints}
                knowledgePointAllocations={knowledgePointAllocations}
                onKnowledgePointAllocationChange={
                  updateKnowledgePointAllocation
                }
                onSubmit={submitPracticeRecord}
              />
            </>
          ) : (
            <p className="practice-rule-missing">
              当前功法尚未配置修炼规则。
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

type TechniqueLayerRulesFormProps = {
  techniqueName: string;
  layerRules: TechniqueLayerRule[];
  onSave: (layerRules: TechniqueLayerRule[]) => void;
  onReset: () => void;
};

function toPercentInputValue(ratio: number): number {
  return Math.round(ratio * 100);
}

function fromPercentInputValue(percent: number): number {
  return Math.min(Math.max(percent / 100, 0), 1);
}

function TechniqueLayerRulesForm({
  techniqueName,
  layerRules,
  onSave,
  onReset,
}: TechniqueLayerRulesFormProps) {
  const sortedLayerRules = [...layerRules].sort(
    (firstRule, secondRule) => firstRule.layer - secondRule.layer,
  );
  const [draftRules, setDraftRules] = useState(sortedLayerRules);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setDraftRules(sortedLayerRules);
    setFormError("");
  }, [layerRules]);

  function updateLayerRuleNumber(
    ruleId: string,
    fieldName:
      | "requiredExperience"
      | "requiredCoverageRatio"
      | "requiredCoreCoverageRatio"
      | "allowedWeakPointRatio",
    value: number,
  ) {
    setDraftRules((currentRules) =>
      currentRules.map((rule) => {
        if (rule.id !== ruleId) {
          return rule;
        }

        const nextValue =
          fieldName === "requiredExperience"
            ? value
            : fromPercentInputValue(value);

        return {
          ...rule,
          [fieldName]: nextValue,
        };
      }),
    );
  }

  function updateLayerRequirementTitle(
    ruleId: string,
    requirementId: string,
    title: string,
  ) {
    setDraftRules((currentRules) =>
      currentRules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              breakthroughRequirements: rule.breakthroughRequirements.map(
                (requirement) =>
                  requirement.id === requirementId
                    ? { ...requirement, title }
                    : requirement,
              ),
            }
          : rule,
      ),
    );
  }

  function submitTechniqueLayerRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hasInvalidRule = draftRules.some(
      (rule) =>
        rule.requiredExperience < 0 ||
        rule.requiredCoverageRatio < 0 ||
        rule.requiredCoverageRatio > 1 ||
        rule.requiredCoreCoverageRatio < 0 ||
        rule.requiredCoreCoverageRatio > 1 ||
        rule.allowedWeakPointRatio < 0 ||
        rule.allowedWeakPointRatio > 1 ||
        rule.breakthroughRequirements.some(
          (requirement) => requirement.title.trim().length === 0,
        ),
    );

    if (hasInvalidRule) {
      setFormError("层数规则不能小于 0，百分比需要在 0 到 100 之间，突破要求标题不能为空。");
      return;
    }

    const updatedAt = new Date().toISOString();

    onSave(
      draftRules.map((rule) => ({
        ...rule,
        breakthroughRequirements: rule.breakthroughRequirements.map(
          (requirement) => ({
            ...requirement,
            title: requirement.title.trim(),
          }),
        ),
        isUserCustomized: true,
        updatedAt,
      })),
    );
    setFormError("");
  }

  return (
    <section
      className="practice-rule-summary"
      aria-label={`${techniqueName}层数规则配置`}
    >
      <h3>功法层数规则</h3>
      <form className="rule-config-form" onSubmit={submitTechniqueLayerRules}>
        <div className="layer-rule-list">
          {draftRules.map((rule) => (
            <fieldset key={rule.id}>
              <legend>第 {rule.layer} 层</legend>
              <label>
                经验门槛
                <input
                  type="number"
                  min="0"
                  value={rule.requiredExperience}
                  onChange={(event) =>
                    updateLayerRuleNumber(
                      rule.id,
                      "requiredExperience",
                      Number(event.target.value),
                    )
                  }
                />
              </label>
              <label>
                覆盖要求（%）
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={toPercentInputValue(rule.requiredCoverageRatio)}
                  onChange={(event) =>
                    updateLayerRuleNumber(
                      rule.id,
                      "requiredCoverageRatio",
                      Number(event.target.value),
                    )
                  }
                />
              </label>
              <label>
                核心覆盖（%）
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={toPercentInputValue(rule.requiredCoreCoverageRatio)}
                  onChange={(event) =>
                    updateLayerRuleNumber(
                      rule.id,
                      "requiredCoreCoverageRatio",
                      Number(event.target.value),
                    )
                  }
                />
              </label>
              <label>
                薄弱点上限（%）
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={toPercentInputValue(rule.allowedWeakPointRatio)}
                  onChange={(event) =>
                    updateLayerRuleNumber(
                      rule.id,
                      "allowedWeakPointRatio",
                      Number(event.target.value),
                    )
                  }
                />
              </label>
              <div className="layer-requirement-list">
                <span>突破要求</span>
                {rule.breakthroughRequirements.map((requirement) => (
                  <label key={requirement.id}>
                    {requirement.requirementType}
                    <input
                      value={requirement.title}
                      onChange={(event) =>
                        updateLayerRequirementTitle(
                          rule.id,
                          requirement.id,
                          event.target.value,
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <p className="progress-muted">
          层数规则会立刻影响当前功法层数、下一层缺口和突破状态；历史修炼记录本身不会被改写。
        </p>
        {formError && <p className="form-error">{formError}</p>}
        <div className="inline-actions">
          <button type="submit">保存层数规则</button>
          <button className="secondary-button" type="button" onClick={onReset}>
            重置层数默认
          </button>
        </div>
      </form>
    </section>
  );
}

type TechniquePracticeRulesFormProps = {
  techniqueName: string;
  practiceDefaults: TechniquePracticeDefaults;
  onSave: (
    practiceDefaults: TechniquePracticeDefaults,
    includeManualRecords: boolean,
  ) => void;
  onReset: () => void;
};

const editablePracticeRecordTypes: PracticeRecordType[] = [
  "exercise",
  "note",
  "thinking",
  "test",
  "review",
];

function TechniquePracticeRulesForm({
  techniqueName,
  practiceDefaults,
  onSave,
  onReset,
}: TechniquePracticeRulesFormProps) {
  const [draft, setDraft] = useState(practiceDefaults);
  const [reviewIntervalsText, setReviewIntervalsText] = useState(
    practiceDefaults.reviewSchedule.intervalsDays.join("、"),
  );
  const [includeManualRecords, setIncludeManualRecords] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setDraft(practiceDefaults);
    setReviewIntervalsText(
      practiceDefaults.reviewSchedule.intervalsDays.join("、"),
    );
    setFormError("");
  }, [practiceDefaults]);

  function updateDraftNumber(
    fieldName: keyof Pick<
      TechniquePracticeDefaults,
      "requiredExerciseCount" | "requiredNoteCount" | "requiredThinkingCount"
    >,
    value: number,
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [fieldName]: value,
    }));
  }

  function updateRecordTypeDefault(
    recordType: PracticeRecordType,
    fieldName:
      | "requirementRatio"
      | "baseExperiencePerUnit"
      | "manaWeight"
      | "insightWeight",
    value: number,
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      recordTypeDefaults: {
        ...currentDraft.recordTypeDefaults,
        [recordType]: {
          ...currentDraft.recordTypeDefaults[recordType],
          [fieldName]: value,
        },
      },
    }));
  }

  function parseReviewIntervals(): number[] {
    return reviewIntervalsText
      .split(/[,，、\s]+/)
      .map((interval) => Number(interval.trim()))
      .filter((interval) => Number.isFinite(interval) && interval > 0);
  }

  function submitTechniquePracticeRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const reviewIntervals = parseReviewIntervals();
    const hasInvalidRecordRule = editablePracticeRecordTypes.some(
      (recordType) => {
        const typeDefaults = draft.recordTypeDefaults[recordType];

        return (
          typeDefaults.requirementRatio < 0 ||
          (typeDefaults.baseExperiencePerUnit ?? 0) < 0 ||
          typeDefaults.manaWeight < 0 ||
          typeDefaults.insightWeight < 0
        );
      },
    );

    if (reviewIntervals.length === 0) {
      setFormError("请至少填写一个有效的复习间隔天数。");
      return;
    }

    if (
      draft.requiredExerciseCount < 0 ||
      draft.requiredNoteCount < 0 ||
      draft.requiredThinkingCount < 0 ||
      draft.reviewSchedule.graceRatio < 0 ||
      hasInvalidRecordRule
    ) {
      setFormError("规则数值不能小于 0。");
      return;
    }

    const updatedAt = new Date().toISOString();

    onSave({
      ...draft,
      reviewSchedule: {
        ...draft.reviewSchedule,
        intervalsDays: reviewIntervals,
      },
      updatedAt,
    }, includeManualRecords);
    setFormError("");
  }

  return (
    <section
      className="practice-rule-summary"
      aria-label={`${techniqueName}规则配置`}
    >
      <h3>功法规则配置</h3>
      <form className="rule-config-form" onSubmit={submitTechniquePracticeRules}>
        <fieldset>
          <legend>完成要求</legend>
          <label>
            默认练习题数
            <input
              type="number"
              min="0"
              value={draft.requiredExerciseCount}
              onChange={(event) =>
                updateDraftNumber(
                  "requiredExerciseCount",
                  Number(event.target.value),
                )
              }
            />
          </label>
          <label>
            默认笔记数量
            <input
              type="number"
              min="0"
              value={draft.requiredNoteCount}
              onChange={(event) =>
                updateDraftNumber(
                  "requiredNoteCount",
                  Number(event.target.value),
                )
              }
            />
          </label>
          <label>
            默认思考次数
            <input
              type="number"
              min="0"
              value={draft.requiredThinkingCount}
              onChange={(event) =>
                updateDraftNumber(
                  "requiredThinkingCount",
                  Number(event.target.value),
                )
              }
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>任务类型收益</legend>
          <div className="rule-type-grid">
            {editablePracticeRecordTypes.map((recordType) => {
              const typeDefaults = draft.recordTypeDefaults[recordType];

              return (
                <article key={recordType}>
                  <h4>{practiceRecordTypeLabels[recordType]}</h4>
                  <label>
                    要求比例
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={typeDefaults.requirementRatio}
                      onChange={(event) =>
                        updateRecordTypeDefault(
                          recordType,
                          "requirementRatio",
                          Number(event.target.value),
                        )
                      }
                    />
                  </label>
                  <label>
                    单位经验
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={typeDefaults.baseExperiencePerUnit ?? 0}
                      onChange={(event) =>
                        updateRecordTypeDefault(
                          recordType,
                          "baseExperiencePerUnit",
                          Number(event.target.value),
                        )
                      }
                    />
                  </label>
                  <label>
                    法力权重
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={typeDefaults.manaWeight}
                      onChange={(event) =>
                        updateRecordTypeDefault(
                          recordType,
                          "manaWeight",
                          Number(event.target.value),
                        )
                      }
                    />
                  </label>
                  <label>
                    神识权重
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={typeDefaults.insightWeight}
                      onChange={(event) =>
                        updateRecordTypeDefault(
                          recordType,
                          "insightWeight",
                          Number(event.target.value),
                        )
                      }
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend>复习节奏</legend>
          <label>
            复习间隔天数
            <input
              value={reviewIntervalsText}
              onChange={(event) => setReviewIntervalsText(event.target.value)}
              placeholder="2、7、21、60、180、365"
            />
          </label>
          <label>
            到期宽限比例
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.reviewSchedule.graceRatio}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  reviewSchedule: {
                    ...currentDraft.reviewSchedule,
                    graceRatio: Number(event.target.value),
                  },
                }))
              }
            />
          </label>
        </fieldset>

        <p className="progress-muted">
          保存后会重算当前功法下未手动调整过的修炼记录；手动调整过的记录默认保留人的判断。
        </p>
        <label className="inline-checkbox">
          <input
            type="checkbox"
            checked={includeManualRecords}
            onChange={(event) =>
              setIncludeManualRecords(event.target.checked)
            }
          />
          同时重算手动调整过的记录
        </label>
        {formError && <p className="form-error">{formError}</p>}
        <div className="inline-actions">
          <button type="submit">保存规则</button>
          <button className="secondary-button" type="button" onClick={onReset}>
            重置默认
          </button>
        </div>
      </form>
    </section>
  );
}

type PreviewItem = {
  title: string;
  meta: string;
  description: string;
};

type PreviewSectionProps = {
  title: string;
  items: PreviewItem[];
};

function PreviewSection({ title, items }: PreviewSectionProps) {
  return (
    <section className="content-section">
      <h2>{title}</h2>
      <div className="record-list">
        {items.length > 0 ? (
          items.map((item) => <RecordCard key={item.title} item={item} />)
        ) : (
          <p className="progress-muted">当前暂无记录。</p>
        )}
      </div>
    </section>
  );
}

type RecordCardProps = {
  item: PreviewItem;
};

function RecordCard({ item }: RecordCardProps) {
  return (
    <article className="record-card">
      <span>{item.meta}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </article>
  );
}

type EventCardProps = {
  event: Event;
  onCompleteEvent: (eventId: string) => void;
  onFailEvent: (eventId: string) => void;
  onUpdateEventSummary: (eventId: string, summary: string) => void;
};

function EventCard({
  event,
  onCompleteEvent,
  onFailEvent,
  onUpdateEventSummary,
}: EventCardProps) {
  const [summaryDraft, setSummaryDraft] = useState(event.summary ?? "");
  const sect = defaultSects.find((item) => item.id === event.sectId);
  const techniqueNames = event.techniqueIds
    .map(
      (techniqueId) =>
        defaultTechniques.find((technique) => technique.id === techniqueId)
          ?.name,
    )
    .filter(Boolean)
    .join("、");
  const knowledgePointNames = event.knowledgePointIds
    .map(
      (knowledgePointId) =>
        defaultKnowledgePoints.find(
          (knowledgePoint) => knowledgePoint.id === knowledgePointId,
        )?.name,
    )
    .filter(Boolean)
    .join("、");
  const canSettle =
    event.status !== "completed" &&
    event.status !== "failed" &&
    !event.generatedPracticeRecordId;

  return (
    <article className="record-card">
      <span>
        {getEventTypeLabel(event.eventType)} · {getEventStatusLabel(event.status)} ·{" "}
        {getDaysUntilLabel(event.dueAt)}
      </span>
      <h3>{event.title}</h3>
      <p>{event.targetRequirement || event.description}</p>
      <p>
        {sect?.name ?? "未关联门派"}
        {techniqueNames ? ` / ${techniqueNames}` : ""}
        {knowledgePointNames ? ` / ${knowledgePointNames}` : ""}
      </p>
      {event.generatedPracticeRecordId && (
        <p>已生成对应修炼记录。</p>
      )}
      <label className="summary-editor">
        事件总结
        <textarea
          value={summaryDraft}
          onChange={(event) => setSummaryDraft(event.target.value)}
        />
      </label>
      {canSettle && (
        <div className="inline-actions">
          <button type="button" onClick={() => onCompleteEvent(event.id)}>
            标记成功并结算
          </button>
          <button type="button" onClick={() => onFailEvent(event.id)}>
            标记失败
          </button>
        </div>
      )}
      <div className="inline-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => onUpdateEventSummary(event.id, summaryDraft)}
        >
          保存事件总结
        </button>
      </div>
    </article>
  );
}

type PageToolbarProps = {
  title: string;
  backTo: string;
};

function PageToolbar({ title, backTo }: PageToolbarProps) {
  return (
    <header className="page-toolbar">
      <Link className="button-link" to={backTo}>
        返回
      </Link>
      <h1>{title}</h1>
    </header>
  );
}

export default App;
