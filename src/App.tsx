function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Personal Cultivation Dashboard</p>
        <h1>个人修炼状态系统</h1>
        <p className="intro">
          这里会逐步变成你的门派、功法、知识点、事件试炼和神魂游历面板。
        </p>
      </section>

      <section className="status-grid" aria-label="初始属性面板">
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
      </section>
    </main>
  );
}

export default App;
