import {useState} from "react";

type ViewName = 'home' | 'events' | 'journeys' | 'cultivation';

function App() {
  const [currentView, setCurrentView] = useState<ViewName>('home');

  return (
    <main className="app-shell">
      {currentView === 'home' && 
      (<HomePage onNavigate={setCurrentView}/>
      )}

      {currentView === 'events' &&
      (<EventsPage onBack={() => setCurrentView('home')}/>
      )}

      {currentView === 'journeys' &&
      (<JourneysPage onBack={() => setCurrentView('home')}/>
      )}

      {currentView === 'cultivation' &&
      (<CultivationPage onBack={() => setCurrentView('home')}/>
      )}  
    </main>
  );
}

type HomePageProps = {onNavigate: (view: ViewName) => void;};

function HomePage({ onNavigate }: HomePageProps) {
  return (
    <section className="page-panel">
      <p className="eyebrow">Personal Cultivation Dashboard</p>
      <h1>个人修炼状态系统</h1>

      <div className="status-grid" aria-label="个人属性面板">
        <article>
          <span>境界</span>
          <strong>炼气一层</strong>
        </article>
        <article>
          <span>法力</span>
          <strong>0</strong>
        </article>
        <article>
          <span>神识</span>
          <strong>0</strong>
        </article>
        <article>
          <span>神魂</span>
          <strong>0</strong>
        </article>
      </div>

      <div className="action-grid">
        <button type="button" onClick={() => onNavigate("events")}>
          事件
        </button>
        <button type="button" onClick={() => onNavigate("journeys")}>
          游历
        </button>
        <button type="button" onClick={() => onNavigate("cultivation")}>
          修炼
        </button>
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
      <button type="button" onClick={onBack}>
        返回首页
      </button>
      <h1>事件界面</h1>
      <p>这里以后记录期末考试、课程设计、突破考试和长期项目。</p>
    </section>
  );
}

function JourneysPage({ onBack }: SubPageProps) {
  return (
    <section className="page-panel">
      <button type="button" onClick={onBack}>
        返回首页
      </button>
      <h1>游历界面</h1>
      <p>这里以后记录阅读、电影、番剧、游戏等神魂游历。</p>
    </section>
  );
}

function CultivationPage({ onBack }: SubPageProps) {
  return (
    <section className="page-panel">
      <button type="button" onClick={onBack}>
        返回首页
      </button>
      <h1>修炼界面</h1>
      <p>这里以后选择和创建门派，并进入知识点修炼界面。</p>
    </section>
  );
}

export default App;