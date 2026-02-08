"use client";

import { useState } from "react";
import Link from "next/link";
import "@/app/landing.css";

export function LandingPage() {
  const [dark, setDark] = useState(false);

  return (
    <div
      className={`landing-page${dark ? " landing-dark" : ""}`}
      style={{ backgroundColor: "var(--c-nav-bg)" }}
    >
      <div className="landing-grid-container">
        <nav className="landing-panel landing-nav-panel">
          <div className="landing-brand-icon">G</div>
          <div className="landing-vertical-text mono">
            Power Markets Research
          </div>
          <div className="landing-vertical-text mono">Sys. v1</div>
        </nav>

        <main className="landing-panel landing-main-panel">
          <span className="landing-corner landing-corner-tl" />
          <span className="landing-corner landing-corner-tr" />
          <span className="landing-corner landing-corner-bl" />
          <span className="landing-corner landing-corner-br" />
          <div className="landing-meta-header mono">
            <span>Decision Intelligence</span>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <span>[01]</span>
              <button
                className="landing-theme-toggle"
                onClick={() => setDark((d) => !d)}
                aria-label="Toggle dark mode"
              >
                {dark ? "☀" : "☾"}
              </button>
            </div>
          </div>

          <div>
            <h1 className="landing-hero-title">
              Grid
              <br />
              Agent
            </h1>
            <h2 className="landing-hero-sub">
              AI Analyst for Power Markets Research
            </h2>
          </div>

          <div className="landing-body-grid">
            <div className="v-flex" style={{ gap: "1rem" }}>
              <p className="landing-body-text">
                We&apos;re building a system to turn fragmented grid,
                interconnection, and market data into clear, actionable answers.
              </p>
              <p className="landing-body-text">
                Evaluate projects faster, reduce risk, and allocate capital with
                confidence.
              </p>
            </div>
          </div>
        </main>

        <aside className="landing-panel landing-agent-panel">
          <span className="landing-corner landing-corner-tl" />
          <span className="landing-corner landing-corner-tr" />
          <div className="landing-agent-header mono">
            <span>Terminal</span>
            <div className="landing-agent-status">
              <span className="landing-status-dot"></span>
              <span>Online</span>
            </div>
          </div>

          <div className="landing-query-box">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <div>
                <h3
                  className="mono"
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.75rem",
                    opacity: 0.7,
                  }}
                >
                  THE CHALLENGE
                </h3>
                <p className="landing-body-text">
                  Power market data is fragmented across queue reports,
                  regulatory filings, and market datasets. Developers and
                  investors spend weeks analyzing this information manually.
                  Most decisions still rely on spreadsheets and consultants.
                </p>
              </div>

              <div>
                <h3
                  className="mono"
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.75rem",
                    opacity: 0.7,
                  }}
                >
                  WHAT WE&apos;RE BUILDING
                </h3>
                <p className="landing-body-text">
                  GridAgent is structuring power market data into
                  machine-readable context. Our decision agents are being built
                  to answer questions about project risks, timelines, and
                  constraints with citations. This will speed up analysis from
                  weeks to seconds.
                </p>
              </div>

              <div>
                <h3
                  className="mono"
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.75rem",
                    opacity: 0.7,
                  }}
                >
                  WHO WE ARE
                </h3>
                <p className="landing-body-text">
                  We combine experience in power markets, grid engineering, and
                  AI systems. One founder works in energy markets analysis in
                  the U.S., focusing on interconnection, market dynamics, and
                  project risk. The other is a grid engineer working on
                  utility-scale solar and storage projects and previously built
                  GridSensAI, a tool for querying and analyzing grid data. We
                  started GridAgent after repeatedly seeing how fragmented and
                  difficult power market data is, and how much time developers
                  spend interpreting it manually.
                </p>
              </div>
            </div>
          </div>

          <Link href="/thesis" className="landing-submit-btn">
            <span>The Thesis</span>
            <span>→</span>
          </Link>

          <div
            className="mono"
            style={{ marginTop: "1rem", fontSize: "0.6rem", opacity: 0.6 }}
          >
            IN DEVELOPMENT
            <br />
            LAUNCHING SOON
          </div>
        </aside>
      </div>
    </div>
  );
}
