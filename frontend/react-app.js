import React, { useState, useEffect } from 'react';

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --c-bone: #F2F0EB;
        --c-lavender: #E0D0F5;
        --c-black: #0D0D0D;
        --c-ink: #000000;
        --c-white: #FFFFFF;
        
        --f-sans: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        --f-mono: 'Courier New', Courier, monospace;
        
        --s-gutter: 1.5rem;
        --border-width: 1px;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        background-color: var(--c-black);
        color: var(--c-ink);
        font-family: var(--f-sans);
        height: 100vh;
        overflow: hidden; 
        display: flex;
        flex-direction: column;
      }

      .mono {
        font-family: var(--f-mono);
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        line-height: 1.4;
      }

      .h-flex { display: flex; }
      .v-flex { display: flex; flex-direction: column; }
      .j-btwn { justify-content: space-between; }
      .a-center { align-items: center; }

      .grid-container {
        display: grid;
        grid-template-columns: 60px 1.4fr 1fr; 
        height: 100%;
        width: 100%;
        border-top: 1px solid #333;
      }

      .panel {
        position: relative;
        padding: 2.5rem;
        display: flex;
        flex-direction: column;
      }

      .crop-marks::before,
      .crop-marks::after {
        content: "";
        position: absolute;
        width: 12px;
        height: 12px;
        border-color: currentColor;
        border-style: solid;
        pointer-events: none;
      }

      .crop-marks::before {
        top: 24px;
        left: 24px;
        border-width: 1px 0 0 1px; 
      }

      .crop-marks::after {
        top: 24px;
        right: 24px;
        border-width: 1px 1px 0 0; 
      }

      .crop-btm::before,
      .crop-btm::after {
        content: "";
        position: absolute;
        width: 12px;
        height: 12px;
        border-color: currentColor;
        border-style: solid;
        pointer-events: none;
        bottom: 24px;
      }

      .crop-btm::before {
        left: 24px;
        border-width: 0 0 1px 1px; 
      }

      .crop-btm::after {
        right: 24px;
        border-width: 0 1px 1px 0; 
      }

      .nav-panel {
        background-color: var(--c-black);
        color: var(--c-bone);
        border-right: 1px solid #333;
        padding: 1.5rem 0;
        align-items: center;
        justify-content: space-between;
      }

      .vertical-text {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        white-space: nowrap;
        letter-spacing: 0.15em;
        font-size: 0.7rem;
        opacity: 0.6;
      }

      .brand-icon {
        width: 24px;
        height: 24px;
        border: 1px solid var(--c-bone);
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-size: 10px;
        font-family: var(--f-mono);
      }

      .main-panel {
        background-color: var(--c-bone);
        color: var(--c-black);
        justify-content: space-between;
      }

      .meta-header {
        width: 100%;
        border-bottom: 1px solid rgba(0,0,0,0.1);
        padding-bottom: 1rem;
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
      }

      .hero-title {
        font-size: clamp(3rem, 6vw, 7rem);
        font-weight: 700;
        line-height: 0.85;
        letter-spacing: -0.04em;
        text-transform: uppercase;
        margin-bottom: 2rem;
        max-width: 90%;
      }

      .hero-sub {
        font-size: 1.5rem;
        font-weight: 400;
        line-height: 1.1;
        letter-spacing: -0.02em;
        margin-bottom: 3rem;
        max-width: 80%;
      }

      .body-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-top: auto;
        border-top: 1px solid rgba(0,0,0,0.1);
        padding-top: 2rem;
      }

      .body-text {
        font-family: var(--f-mono);
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .lg-copyright {
        font-size: 4rem;
        line-height: 1;
        font-weight: 300;
        align-self: flex-end;
      }

      .agent-panel {
        background-color: var(--c-lavender);
        color: var(--c-black);
        display: flex;
        flex-direction: column;
      }

      .agent-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 3rem;
        border-bottom: 1px solid rgba(0,0,0,0.1);
        padding-bottom: 1rem;
      }

      .agent-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        background-color: var(--c-black);
        border-radius: 50%;
        animation: blink 2s infinite;
      }

      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .query-box {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .input-label {
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        line-height: 1;
        text-transform: uppercase;
      }

      .terminal-input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 2px solid var(--c-black);
        font-family: var(--f-mono);
        font-size: 1rem;
        color: var(--c-black);
        padding: 1rem 0;
        border-radius: 0;
        outline: none;
      }

      .terminal-input::placeholder {
        color: rgba(0,0,0,0.4);
        text-transform: uppercase;
      }

      .terminal-input:focus {
        border-bottom-width: 4px;
      }

      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .pill {
        border: 1px solid var(--c-black);
        padding: 6px 12px;
        font-family: var(--f-mono);
        font-size: 0.7rem;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .pill:hover {
        background-color: var(--c-black);
        color: var(--c-lavender);
      }

      .submit-btn {
        margin-top: auto;
        background-color: var(--c-black);
        color: var(--c-white);
        border: none;
        padding: 1.5rem;
        font-family: var(--f-mono);
        text-transform: uppercase;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .submit-btn:hover {
        background-color: #222;
      }

      @media (max-width: 1024px) {
        .grid-container {
          grid-template-columns: 50px 1fr;
        }
        .agent-panel {
          display: none; 
        }
      }

      @media (max-width: 768px) {
        body { height: auto; overflow: auto; }
        .grid-container {
          display: flex;
          flex-direction: column;
        }
        .nav-panel {
          flex-direction: row;
          width: 100%;
          height: 60px;
          padding: 0 1.5rem;
          border-bottom: 1px solid #333;
          border-right: none;
        }
        .vertical-text {
          writing-mode: horizontal-tb;
          transform: none;
        }
        .panel {
          min-height: 80vh;
          padding: 1.5rem;
        }
        .hero-title {
          font-size: 3.5rem;
        }
        .body-grid {
          grid-template-columns: 1fr;
        }
        .agent-panel {
          display: flex;
          min-height: 60vh;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="grid-container">
      <nav className="nav-panel">
        <div className="brand-icon">G</div>
        <div className="vertical-text mono">Power Markets Research</div>
        <div className="vertical-text mono">Sys. v2.4</div>
      </nav>

      <main className="panel main-panel crop-marks crop-btm">
        <div className="meta-header mono">
          <span>Decision Intelligence</span>
          <span>[01]</span>
        </div>

        <div>
          <h1 className="hero-title">
            Grid<br />Agent
          </h1>
          <h2 className="hero-sub">AI Analyst for Power Markets Research</h2>
        </div>

        <div className="body-grid">
          <div className="v-flex" style={{ gap: '1rem' }}>
            <p className="body-text">
              We turn fragmented grid, interconnection, and market data into clear, actionable answers.
            </p>
            <p className="body-text">
              Evaluate projects faster, reduce risk, and allocate capital with confidence.
            </p>
          </div>
        </div>
      </main>

      <aside className="panel agent-panel crop-marks">
        <div className="agent-header mono">
          <span>Terminal</span>
          <div className="agent-status">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </div>

        <div className="query-box">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h3 className="mono" style={{ fontSize: '0.75rem', marginBottom: '0.75rem', opacity: 0.7 }}>
                THE CHALLENGE
              </h3>
              <p className="body-text" style={{ fontSize: '0.9rem' }}>
                Power market data is fragmented across queue reports, regulatory filings, and market datasets. 
                Developers and investors spend weeks analyzing this information manually. 
                Most decisions still rely on spreadsheets and consultants.
              </p>
            </div>
            
            <div>
              <h3 className="mono" style={{ fontSize: '0.75rem', marginBottom: '0.75rem', opacity: 0.7 }}>
                WHAT WE'RE BUILDING
              </h3>
              <p className="body-text" style={{ fontSize: '0.9rem' }}>
                GridAgent structures power market data into machine-readable context. 
                Our decision agents answer questions about project risks, timelines, and constraints with citations. 
                This speeds up analysis from weeks to seconds.
              </p>
            </div>
            
            <div>
              <h3 className="mono" style={{ fontSize: '0.75rem', marginBottom: '0.75rem', opacity: 0.7 }}>
                WHO WE ARE
              </h3>
              <p className="body-text" style={{ fontSize: '0.9rem' }}>
                We combine experience in power markets, grid engineering, and AI systems.
                One founder works in energy markets analysis in the U.S., focusing on interconnection, market dynamics, and project risk.
                The other is a grid engineer working on utility-scale solar and storage projects and previously built GridSensAI, a tool for querying and analyzing grid data.
                We started GridAgent after repeatedly seeing how fragmented and difficult power market data is, and how much time developers spend interpreting it manually.
              </p>
            </div>
          </div>
        </div>

        <button className="submit-btn">
          <span>Currently Building</span>
          <span>→</span>
        </button>
        
        <div className="mono" style={{ marginTop: '1rem', fontSize: '0.6rem', opacity: 0.6 }}>
          IN DEVELOPMENT<br />
          LAUNCHING SOON
        </div>
      </aside>
    </div>
  );
};

export default App;