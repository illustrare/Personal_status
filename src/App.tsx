import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import {
  PracticeRecordForm,
  type PracticeRecordFormSubmission,
} from "./components/PracticeRecordForm";
import { PracticeRecordsList } from "./components/PracticeRecordsList";
import {
  defaultKnowledgePoints,
  getDefaultKnowledgePointsByTechnique,
} from "./data/defaultKnowledgePoints";
import { defaultSects } from "./data/defaultSects";
import {
  defaultTechniquePracticeDefaults,
  findTechniquePracticeDefaults,
} from "./data/defaultTechniquePracticeDefaults";
import { defaultTechniqueLayerRules } from "./data/defaultTechniqueLayerRules";
import { defaultRealmRules } from "./data/defaultRealmRules";
import { defaultTechniques } from "./data/defaultTechniques";
import type {
  Breakthrough,
  BreakthroughStatus,
  Event,
  EventStatus,
  EventType,
  Journey,
  JourneyStatus,
  JourneyType,
  KnowledgePoint,
  PracticeRecord,
  PracticeRecordKnowledgePoint,
  PracticeRecordKnowledgePointDraft,
} from "./types/domain";
import {
  calculateRealmProgress,
  type RealmProgress,
} from "./utils/realmProgress";
import {
  calculatePracticeStats,
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
  calculateJourneySoulGain,
  calculateJourneyStats,
  type JourneyStats,
} from "./utils/journeyStats";

type KnowledgeChapter = {
  chapterCode: string;
  chapterName: string;
  knowledgePoints: KnowledgePoint[];
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
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

const practiceDefaultsByTechniqueId = Object.fromEntries(
  defaultTechniquePracticeDefaults.map((practiceDefaults) => [
    practiceDefaults.techniqueId,
    practiceDefaults,
  ]),
);
const layerRulesByTechniqueId = groupById(
  defaultTechniqueLayerRules,
  (layerRule) => layerRule.techniqueId,
);

function groupKnowledgePointsByChapter(
  knowledgePoints: KnowledgePoint[],
): KnowledgeChapter[] {
  const chapters = new Map<string, KnowledgeChapter>();

  knowledgePoints.forEach((knowledgePoint) => {
    const existingChapter = chapters.get(knowledgePoint.chapterCode);

    if (existingChapter) {
      existingChapter.knowledgePoints.push(knowledgePoint);
      return;
    }

    chapters.set(knowledgePoint.chapterCode, {
      chapterCode: knowledgePoint.chapterCode,
      chapterName: knowledgePoint.chapter ?? "默认章节",
      knowledgePoints: [knowledgePoint],
    });
  });

  return Array.from(chapters.values());
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
  const practiceStats = calculatePracticeStats(
    practiceRecords,
    practiceRecordKnowledgePoints,
  );
  const journeyStats = calculateJourneyStats(journeys);
  const profileStats = {
    ...practiceStats.profileStats,
    totalSoul: practiceStats.profileStats.totalSoul + journeyStats.totalSoul,
  };
  const realmProgress = calculateRealmProgress(
    profileStats,
    breakthroughs,
    defaultRealmRules,
  );
  const practiceProgress = calculatePracticeProgress(
    defaultKnowledgePoints,
    practiceRecords,
    practiceRecordKnowledgePoints,
    practiceDefaultsByTechniqueId,
    layerRulesByTechniqueId,
  );

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
              onAddJourney={addJourney}
            />
          }
        />
        <Route
          path="/cultivation"
          element={
            <CultivationPage sectStatsById={practiceStats.sectStatsById} />
          }
        />
        <Route
          path="/cultivation/sects/:sectId"
          element={
            <SectTechniquesRoute
              sectStatsById={practiceStats.sectStatsById}
              techniqueStatsById={practiceStats.techniqueStatsById}
              techniqueProgressById={practiceProgress.techniqueProgressById}
            />
          }
        />
        <Route
          path="/cultivation/sects/:sectId/techniques/:techniqueId"
          element={
            <KnowledgeRoute
              knowledgePointStatsById={practiceStats.knowledgePointStatsById}
              knowledgePointProgressById={
                practiceProgress.knowledgePointProgressById
              }
              techniqueProgressById={practiceProgress.techniqueProgressById}
              practiceRecords={practiceRecords}
              practiceRecordKnowledgePoints={practiceRecordKnowledgePoints}
              onAddPracticeRecord={addPracticeRecord}
              onDeletePracticeRecord={softDeletePracticeRecord}
              onRestorePracticeRecord={restorePracticeRecord}
              onUpdatePracticeRecordContent={updatePracticeRecordContent}
              onClearLocalPracticeData={clearLocalPracticeData}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

type SectTechniquesRouteProps = {
  sectStatsById: Record<string, SectPracticeStats>;
  techniqueStatsById: Record<string, TechniquePracticeStats>;
  techniqueProgressById: Record<string, TechniqueProgress>;
};

function SectTechniquesRoute({
  sectStatsById,
  techniqueStatsById,
  techniqueProgressById,
}: SectTechniquesRouteProps) {
  const { sectId } = useParams();
  const sect = defaultSects.find((item) => item.id === sectId);

  if (!sect) {
    return <Navigate to="/cultivation" replace />;
  }

  return (
    <TechniquesPage
      sect={sect}
      sectStatsById={sectStatsById}
      techniqueStatsById={techniqueStatsById}
      techniqueProgressById={techniqueProgressById}
    />
  );
}

type KnowledgeRouteProps = {
  knowledgePointStatsById: Record<string, KnowledgePointPracticeStats>;
  knowledgePointProgressById: Record<string, KnowledgePointProgress>;
  techniqueProgressById: Record<string, TechniqueProgress>;
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
};

function KnowledgeRoute({
  knowledgePointStatsById,
  knowledgePointProgressById,
  techniqueProgressById,
  practiceRecords,
  practiceRecordKnowledgePoints,
  onAddPracticeRecord,
  onDeletePracticeRecord,
  onRestorePracticeRecord,
  onUpdatePracticeRecordContent,
  onClearLocalPracticeData,
}: KnowledgeRouteProps) {
  const { sectId, techniqueId } = useParams();
  const sect = defaultSects.find((item) => item.id === sectId);
  const technique = defaultTechniques.find(
    (item) => item.id === techniqueId && item.sectId === sectId,
  );

  if (!sect || !technique) {
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
      sectId={sect.id}
      sectName={sect.name}
      techniqueName={technique.name}
      techniqueId={technique.id}
      knowledgePointStatsById={knowledgePointStatsById}
      knowledgePointProgressById={knowledgePointProgressById}
      techniqueProgress={techniqueProgressById[technique.id]}
      practiceRecords={techniqueRecords}
      practiceRecordKnowledgePoints={techniqueRecordKnowledgePoints}
      onAddPracticeRecord={onAddPracticeRecord}
      onDeletePracticeRecord={onDeletePracticeRecord}
      onRestorePracticeRecord={onRestorePracticeRecord}
      onUpdatePracticeRecordContent={onUpdatePracticeRecordContent}
      onClearLocalPracticeData={onClearLocalPracticeData}
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
  onAddBreakthrough: (breakthrough: Breakthrough) => void;
};

function HomePage({
  profileStats,
  realmProgress,
  breakthroughs,
  events,
  journeys,
  journeyStats,
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
      </div>

      <div className="preview-grid">
        <PreviewSection title="近期事件" items={upcomingEventItems} />
        <PreviewSection
          title={`最近游历 · ${journeyStats.journeyCount} 条`}
          items={recentJourneyItems}
        />
        <PreviewSection
          title="当前修炼"
          items={[
            {
              title: "数学分析 · 第一章",
              meta: "知识点树准备中",
              description: "后续在知识点界面记录修炼并点亮知识节点。",
            },
          ]}
        />
      </div>
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
  const firstSectId = defaultSects[0]?.id ?? "";
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("exam");
  const [status, setStatus] = useState<EventStatus>("in_progress");
  const [sectId, setSectId] = useState(firstSectId);
  const techniqueOptions = defaultTechniques.filter(
    (technique) => technique.sectId === sectId,
  );
  const [techniqueId, setTechniqueId] = useState(
    techniqueOptions[0]?.id ?? "",
  );
  const selectedTechniqueId =
    techniqueOptions.some((technique) => technique.id === techniqueId)
      ? techniqueId
      : techniqueOptions[0]?.id ?? "";
  const knowledgePointOptions = defaultKnowledgePoints.filter(
    (knowledgePoint) => knowledgePoint.techniqueId === selectedTechniqueId,
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
                    defaultTechniques.find(
                      (technique) => technique.sectId === nextSectId,
                    )?.id ?? "";
                  const nextKnowledgePointId =
                    defaultKnowledgePoints.find(
                      (knowledgePoint) =>
                        knowledgePoint.techniqueId === nextTechniqueId,
                    )?.id ?? "";

                  setSectId(nextSectId);
                  setTechniqueId(nextTechniqueId);
                  setKnowledgePointId(nextKnowledgePointId);
                }}
              >
                {defaultSects.map((sect) => (
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
                    defaultKnowledgePoints.find(
                      (knowledgePoint) =>
                        knowledgePoint.techniqueId === nextTechniqueId,
                    )?.id ?? "";

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
  onAddJourney: (journey: Journey) => void;
};

function JourneysPage({ journeys, journeyStats, onAddJourney }: JourneysPageProps) {
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
  const techniqueOptions = defaultTechniques.filter(
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
      : calculateJourneySoulGain(durationMinutes, completionRatio);
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
    const soulGain = calculateJourneySoulGain(durationMinutes, completionRatio);
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
                    defaultTechniques.find(
                      (technique) => technique.sectId === nextSectId,
                    )?.id ?? "";

                  setSectId(nextSectId);
                  setTechniqueId(nextTechniqueId);
                }}
              >
                <option value="">暂不关联</option>
                {defaultSects.map((sect) => (
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
  sectStatsById: Record<string, SectPracticeStats>;
};

function CultivationPage({ sectStatsById }: CultivationPageProps) {
  return (
    <section className="page-panel">
      <PageToolbar title="修炼界面" backTo="/" />

      <div className="page-heading">
        <p className="intro">
          先选择门派，再进入该门派的功法列表。
        </p>
        <button type="button">创建门派</button>
      </div>

      <div className="sect-grid">
        {defaultSects.map((sect) => {
          const techniqueCount = defaultTechniques.filter(
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

type TechniquesPageProps = {
  sect: (typeof defaultSects)[number];
  sectStatsById: Record<string, SectPracticeStats>;
  techniqueStatsById: Record<string, TechniquePracticeStats>;
  techniqueProgressById: Record<string, TechniqueProgress>;
};

function TechniquesPage({
  sect,
  sectStatsById,
  techniqueStatsById,
  techniqueProgressById,
}: TechniquesPageProps) {
  const techniques = defaultTechniques.filter(
    (technique) => technique.sectId === sect.id,
  );
  const sectStats = sectStatsById[sect.id];
  const totalMana = sectStats?.totalMana ?? 0;
  const totalInsight = sectStats?.totalInsight ?? 0;

  return (
    <section className="page-panel">
      <PageToolbar title={`${sect.name}功法界面`} backTo="/cultivation" />

      <div className="page-heading">
        <div>
          <p className="intro">
            功法是门派下面的具体学习方向。选择功法后，再进入该功法所属的知识点。
          </p>
        </div>
        <button type="button">创建功法</button>
      </div>

      <div className="sect-summary">
        <article>
          <span>当前门派</span>
          <strong>{sect.name}</strong>
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
              <Link
                className="button-link"
                to={`/cultivation/sects/${sect.id}/techniques/${technique.id}`}
              >
                进入知识点
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type KnowledgePageProps = {
  sectId: string;
  sectName: string;
  techniqueName: string;
  techniqueId: string;
  knowledgePointStatsById: Record<string, KnowledgePointPracticeStats>;
  knowledgePointProgressById: Record<string, KnowledgePointProgress>;
  techniqueProgress?: TechniqueProgress;
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
};

function KnowledgePage({
  sectId,
  sectName,
  techniqueName,
  techniqueId,
  knowledgePointStatsById,
  knowledgePointProgressById,
  techniqueProgress,
  practiceRecords,
  practiceRecordKnowledgePoints,
  onAddPracticeRecord,
  onDeletePracticeRecord,
  onRestorePracticeRecord,
  onUpdatePracticeRecordContent,
  onClearLocalPracticeData,
}: KnowledgePageProps) {
  const knowledgePoints = getDefaultKnowledgePointsByTechnique(techniqueId);
  const [knowledgePointAllocations, setKnowledgePointAllocations] = useState<
    PracticeRecordKnowledgePointDraft[]
  >([]);
  const [formResetKey, setFormResetKey] = useState(0);
  const selectedKnowledgePointIdSet = new Set(
    knowledgePointAllocations.map((allocation) => allocation.knowledgePointId),
  );
  const visibleChapters = groupKnowledgePointsByChapter(
    knowledgePoints,
  );
  const selectedKnowledgePoints = knowledgePoints.filter((knowledgePoint) =>
    selectedKnowledgePointIdSet.has(knowledgePoint.id),
  );
  const practiceDefaults = findTechniquePracticeDefaults(techniqueId);

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

  return (
    <section className="page-panel">
      <PageToolbar
        title="知识点修炼界面"
        backTo={`/cultivation/sects/${sectId}`}
      />

      <div className="knowledge-layout">
        <section className="content-section">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{sectName} / {techniqueName}</p>
              <p className="intro">
                知识点属于当前功法，先按章节做文件夹式层级展示，后续再升级成可点亮的图形知识树。
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

          <div className="knowledge-tree">
            <article>
              <h2>{techniqueName}</h2>
              {visibleChapters.length > 0 ? (
                visibleChapters.map((chapter) => (
                  <details key={chapter.chapterCode} open>
                    <summary>{chapter.chapterName}</summary>
                    <ul>
                      {chapter.knowledgePoints.map((knowledgePoint) => (
                        <li key={knowledgePoint.id}>
                          <button
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
                                  knowledgePointProgressById[knowledgePoint.id]
                                    ?.totalProgressRatio ?? 0,
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
                        </li>
                      ))}
                    </ul>
                  </details>
                ))
              ) : (
                <p>当前功法尚未创建知识点。</p>
              )}
            </article>
          </div>

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
