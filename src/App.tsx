import { useState } from "react";
import { defaultSects } from "./data/defaultSects";
import { defaultTechniques } from "./data/defaultTechniques";

type ViewName = "home" | "events" | "journeys" | "cultivation" | "techniques" | "knowledge";

const profileStats = [
  { label: "境界", value: "炼气一层" },
  { label: "法力", value: "0" },
  { label: "神识", value: "0" },
  { label: "神魂", value: "0" },
];

const eventPreviews = [
  {
    title: "数学分析期末复习",
    meta: "考试试炼 · 14 天后",
    description: "整理极限、连续、导数和积分的基础题型。",
  },
  {
    title: "个人修炼系统第七步",
    meta: "长期项目 · 进行中",
    description: "完成首页、事件、游历、修炼和知识树静态页面。",
  },
];

const journeyPreviews = [
  {
    title: "《悉达多》阅读整理",
    meta: "阅读 · 神魂 +20",
    description: "记录人物精神变化、核心意象和可转化为写作素材的片段。",
  },
  {
    title: "电影主题观察",
    meta: "电影 · 待总结",
    description: "补充镜头、叙事结构和情绪体验记录。",
  },
];

const knowledgeTree = [
  {
    techniqueId: "math_analysis",
    technique: "数学分析",
    chapters: [
      {
        name: "第一章 函数与极限",
        points: ["函数概念", "数列极限", "函数极限"],
      },
      {
        name: "第二章 连续与导数",
        points: ["连续性", "导数定义", "微分法则"],
      },
    ],
  },
  {
    techniqueId: "phil_western",
    technique: "西方哲学史",
    chapters: [
      {
        name: "近代哲学开端",
        points: ["笛卡尔方法论怀疑", "我思故我在", "身心二元论"],
      },
    ],
  },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewName>("home");
  const [selectedSectId, setSelectedSectId] = useState(defaultSects[0].id);
  const [selectedTechniqueId, setSelectedTechniqueId] = useState(
    defaultTechniques[0].id,
  );

  const selectedSect =
    defaultSects.find((sect) => sect.id === selectedSectId) ?? defaultSects[0];

  const selectedTechnique =
    defaultTechniques.find((technique) => technique.id === selectedTechniqueId) ??
    defaultTechniques[0];

  return (
    <main className="app-shell">
      {currentView === "home" && <HomePage onNavigate={setCurrentView} />}

      {currentView === "events" && (
        <EventsPage onBack={() => setCurrentView("home")} />
      )}

      {currentView === "journeys" && (
        <JourneysPage onBack={() => setCurrentView("home")} />
      )}

      {currentView === "cultivation" && (
        <CultivationPage
          onBack={() => setCurrentView("home")}
          onEnterTechniques={(sectId) => {
            setSelectedSectId(sectId);
            setCurrentView("techniques");
          }}
        />
      )}

      {currentView === "techniques" && (
        <TechniquesPage
          sect={selectedSect}
          onBack={() => setCurrentView("cultivation")}
          onEnterKnowledge={(techniqueId) => {
            setSelectedTechniqueId(techniqueId);
            setCurrentView("knowledge");
          }}
        />
      )}

      {currentView === "knowledge" && (
        <KnowledgePage
          sectName={selectedSect.name}
          techniqueName={selectedTechnique.name}
          techniqueId={selectedTechnique.id}
          onBack={() => setCurrentView("techniques")}
        />
      )}
    </main>
  );
}

type HomePageProps = {
  onNavigate: (view: ViewName) => void;
};

function HomePage({ onNavigate }: HomePageProps) {
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
        {profileStats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      <div className="action-grid" aria-label="核心系统入口">
        <button type="button" onClick={() => onNavigate("events")}>
          <span>事件</span>
          <strong>试炼与截止日期</strong>
        </button>
        <button type="button" onClick={() => onNavigate("journeys")}>
          <span>游历</span>
          <strong>阅读、电影和体验</strong>
        </button>
        <button type="button" onClick={() => onNavigate("cultivation")}>
          <span>修炼</span>
          <strong>门派、功法和知识点</strong>
        </button>
      </div>

      <div className="preview-grid">
        <PreviewSection title="近期事件" items={eventPreviews.slice(0, 1)} />
        <PreviewSection title="最近游历" items={journeyPreviews.slice(0, 1)} />
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

type SubPageProps = {
  onBack: () => void;
};

function EventsPage({ onBack }: SubPageProps) {
  return (
    <section className="page-panel">
      <PageToolbar title="事件界面" onBack={onBack} />

      <div className="two-column-layout">
        <section className="content-section">
          <h2>事件记录</h2>
          <div className="record-list">
            {eventPreviews.map((event) => (
              <RecordCard key={event.title} item={event} />
            ))}
          </div>
        </section>

        <aside className="side-panel">
          <h2>安排新事件</h2>
          <div className="placeholder-form">
            <label>
              事件名称
              <input value="高等代数阶段测试" readOnly />
            </label>
            <label>
              截止日期
              <input value="2026-09-01" readOnly />
            </label>
            <button type="button">保存事件</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function JourneysPage({ onBack }: SubPageProps) {
  return (
    <section className="page-panel">
      <PageToolbar title="游历界面" onBack={onBack} />

      <div className="two-column-layout">
        <section className="content-section">
          <h2>游历记录</h2>
          <div className="record-list">
            {journeyPreviews.map((journey) => (
              <RecordCard key={journey.title} item={journey} />
            ))}
          </div>
        </section>

        <aside className="side-panel">
          <h2>记录新游历</h2>
          <div className="placeholder-form">
            <label>
              作品名称
              <input value="一部待记录的电影" readOnly />
            </label>
            <label>
              游历类型
              <input value="电影" readOnly />
            </label>
            <label>
              感想摘要
              <textarea value="这里以后填写体验、主题和神魂收益。" readOnly />
            </label>
            <button type="button">保存游历</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

type CultivationPageProps = SubPageProps & {
  onEnterTechniques: (sectId: string) => void;
};

function CultivationPage({ onBack, onEnterTechniques }: CultivationPageProps) {
  return (
    <section className="page-panel">
      <PageToolbar title="修炼界面" onBack={onBack} />

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
                  <dd>{sect.mana}</dd>
                </div>
                <div>
                  <dt>神识</dt>
                  <dd>{sect.insight}</dd>
                </div>
                <div>
                  <dt>功法</dt>
                  <dd>{techniqueCount}</dd>
                </div>
              </dl>
              <button type="button" onClick={() => onEnterTechniques(sect.id)}>
                查看功法
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type TechniquesPageProps = SubPageProps & {
  sect: (typeof defaultSects)[number];
  onEnterKnowledge: (techniqueId: string) => void;
};

function TechniquesPage({ sect, onBack, onEnterKnowledge }: TechniquesPageProps) {
  const techniques = defaultTechniques.filter(
    (technique) => technique.sectId === sect.id,
  );

  return (
    <section className="page-panel">
      <PageToolbar title={`${sect.name}功法界面`} onBack={onBack} />

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
          <strong>{sect.mana}</strong>
        </article>
        <article>
          <span>神识</span>
          <strong>{sect.insight}</strong>
        </article>
        <article>
          <span>功法数量</span>
          <strong>{techniques.length}</strong>
        </article>
      </div>

      <div className="technique-grid">
        {techniques.map((technique) => (
          <article className="technique-card" key={technique.id}>
            <div>
              <span>第 {technique.currentLayer} / {technique.maxLayer} 层</span>
              <h2>{technique.name}</h2>
              <p>{technique.description}</p>
            </div>
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
                <dd>{technique.currentValue}</dd>
              </div>
            </dl>
            <button type="button" onClick={() => onEnterKnowledge(technique.id)}>
              进入知识点
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

type KnowledgePageProps = SubPageProps & {
  sectName: string;
  techniqueName: string;
  techniqueId: string;
};

function KnowledgePage({
  sectName,
  techniqueName,
  techniqueId,
  onBack,
}: KnowledgePageProps) {
  const selectedTree = knowledgeTree.find(
    (tree) => tree.techniqueId === techniqueId,
  );

  const visibleTree = selectedTree
    ? [selectedTree]
    : [
        {
          techniqueId,
          technique: techniqueName,
          chapters: [
            {
              name: "默认章节",
              points: ["待创建知识点"],
            },
          ],
        },
      ];

  return (
    <section className="page-panel">
      <PageToolbar title="知识点修炼界面" onBack={onBack} />

      <div className="knowledge-layout">
        <section className="content-section">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{sectName} / {techniqueName}</p>
              <p className="intro">
                知识点属于当前功法，先按章节做文件夹式层级展示，后续再升级成可点亮的图形知识树。
              </p>
            </div>
            <button type="button">直接记录修炼</button>
          </div>

          <div className="knowledge-tree">
            {visibleTree.map((technique) => (
              <article key={technique.technique}>
                <h2>{technique.technique}</h2>
                {technique.chapters.map((chapter) => (
                  <details key={chapter.name} open>
                    <summary>{chapter.name}</summary>
                    <ul>
                      {chapter.points.map((point) => (
                        <li key={point}>
                          <button type="button">{point}</button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </article>
            ))}
          </div>
        </section>

        <aside className="side-panel">
          <h2>知识点详情</h2>
          <p>点击知识点后，这里会显示说明、当前进度、最近修炼记录。</p>
          <div className="placeholder-form">
            <label>
              修炼类型
              <input value="练习 / 笔记 / 思考 / 测试 / 巩固" readOnly />
            </label>
            <label>
              本次记录
              <textarea value="这里以后记录该知识点下的修炼内容。" readOnly />
            </label>
            <button type="button">记录到当前知识点</button>
          </div>
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
        {items.map((item) => (
          <RecordCard key={item.title} item={item} />
        ))}
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

type PageToolbarProps = {
  title: string;
  onBack: () => void;
};

function PageToolbar({ title, onBack }: PageToolbarProps) {
  return (
    <header className="page-toolbar">
      <button type="button" onClick={onBack}>
        返回
      </button>
      <h1>{title}</h1>
    </header>
  );
}

export default App;
