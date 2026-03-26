"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import "@/app/landing.css";

const CHAT_CONVERSATIONS = [
  {
    query:
      "Cross-reference my 250MW solar project in PJM AE Zone against all Transition Cycle 2 withdrawal patterns — what's my queue attrition-adjusted probability of reaching ISA?",
    response:
      "Analyzing 847 TC2 projects in AE Zone: 34% withdrawal rate post-SIS, 52% pre-FSA. Your project's 250MW solar profile matches 23 comparable active projects. Attrition-adjusted ISA probability: 61%. Key risk: 3 upstream projects share your POI at Deans 230kV — if Q1847 withdraws, your network upgrade allocation drops $4.2M.",
  },
  {
    query:
      "Model the cascading network upgrade cost reallocation if the top 5 MW projects in MISO West DPP 2024 Phase 3 withdraw before the final GIA stage",
    response:
      "Modeled withdrawal of projects M482, M519, M531, M602, M617 (combined 2.1 GW). Cascading NRIS reallocation shifts $187M across 43 remaining projects. Avg cost increase: $38/kW. Worst impacted: M445 (340MW storage) sees upgrades jump from $12.1M to $29.8M due to shared Huntley-Wilmarth 345kV dependency. 7 projects likely become uneconomic above $950/kW threshold.",
  },
  {
    query:
      "What's the historical correlation between ERCOT West Zone congestion revenue rights and interconnection queue completion rates for projects within 10 miles of the Permian Basin load pockets?",
    response:
      "Analyzed 312 queue entries within 10mi of Permian load pockets (2019-2025). CRR value at nearby nodes averaged -$4.70/MWh, correlating -0.73 with project completion (p<0.01). Projects at nodes with CRR below -$6/MWh showed 78% withdrawal rate vs. 31% baseline. Exception: 4 co-located solar+storage projects with tolling agreements completed despite -$8.2/MWh CRR exposure.",
  },
  {
    query:
      "Run a sensitivity analysis on FERC Order 2023 cluster study timelines — how does Phase 1 restudying in PJM TC1 affect capital deployment windows for projects targeting 2028 ITC step-down?",
    response:
      "TC1 restudy adds 8-14 months to current timelines. Of 412 TC1 projects targeting 2028 COD, 67% now face ITC step-down from 30% to 22.5%. Estimated capital-at-risk: $2.8B across affected portfolio. Safe harbor strategies: 38 projects (9.2 GW) have begun equipment procurement. Recommendation: projects without safe harbor should model 22.5% ITC base case — breakeven shifts from $34/MWh to $41/MWh PPA floor.",
  },
];

function useTypingAnimation() {
  const [convIndex, setConvIndex] = useState(0);
  const [phase, setPhase] = useState<"typing-query" | "thinking" | "typing-response" | "pause">("typing-query");
  const [displayedQuery, setDisplayedQuery] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");

  const conv = CHAT_CONVERSATIONS[convIndex];

  const advanceConversation = useCallback(() => {
    setConvIndex((i) => (i + 1) % CHAT_CONVERSATIONS.length);
    setDisplayedQuery("");
    setDisplayedResponse("");
    setPhase("typing-query");
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === "typing-query") {
      if (displayedQuery.length < conv.query.length) {
        timer = setTimeout(() => {
          setDisplayedQuery(conv.query.slice(0, displayedQuery.length + 1));
        }, 35);
      } else {
        timer = setTimeout(() => setPhase("thinking"), 400);
      }
    } else if (phase === "thinking") {
      timer = setTimeout(() => setPhase("typing-response"), 1200);
    } else if (phase === "typing-response") {
      if (displayedResponse.length < conv.response.length) {
        timer = setTimeout(() => {
          setDisplayedResponse(
            conv.response.slice(0, displayedResponse.length + 1)
          );
        }, 18);
      } else {
        timer = setTimeout(() => setPhase("pause"), 600);
      }
    } else if (phase === "pause") {
      timer = setTimeout(advanceConversation, 3000);
    }

    return () => clearTimeout(timer);
  }, [phase, displayedQuery, displayedResponse, conv, advanceConversation]);

  return { displayedQuery, displayedResponse, phase };
}

export function LandingPage() {
  const [dark, setDark] = useState(true);
  const { displayedQuery, displayedResponse, phase } = useTypingAnimation();

  return (
    <div
      className={`landing-page${dark ? " landing-dark" : ""}`}
      style={{ backgroundColor: "var(--c-nav-bg)" }}
    >
      <div className="landing-grid-container">
        <nav className="landing-panel landing-nav-panel">
          <div className="landing-brand-icon">
            <Image src="/logo.png" alt="Gridsurf" width={28} height={28} />
          </div>
          <div className="landing-vertical-text mono">
            Gridsurf
          </div>
          <div className="landing-vertical-text mono">Sys. v1</div>
        </nav>

        <main className="landing-panel landing-main-panel">
          <span className="landing-corner landing-corner-tl" />
          <span className="landing-corner landing-corner-tr" />
          <span className="landing-corner landing-corner-bl" />
          <span className="landing-corner landing-corner-br" />
          <div className="landing-meta-header mono">
            <span>Gridsurf / Decision Intelligence</span>
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
              Surf
            </h1>
            <h2 className="landing-hero-sub">
              Gridsurf builds AI intelligence for power markets research
            </h2>
          </div>

          <div className="landing-chatbox">
            <div className="landing-chatbox-header">
              <span>Gridsurf Terminal</span>
              <div className="landing-chatbox-status">
                <span className="landing-chatbox-status-dot" />
                <span>Active</span>
              </div>
            </div>

            <div className="landing-chatbox-messages">
              {displayedQuery && (
                <div className="landing-chatbox-msg msg-user">
                  <span className="landing-chatbox-prefix">&gt;</span>
                  <span className="landing-chatbox-content">
                    {displayedQuery}
                    {phase === "typing-query" && (
                      <span className="landing-chatbox-cursor" />
                    )}
                  </span>
                </div>
              )}

              {phase === "thinking" && (
                <div className="landing-chatbox-msg msg-agent">
                  <span className="landing-chatbox-prefix">&lt;</span>
                  <span className="landing-chatbox-content">
                    <span className="landing-chatbox-thinking">
                      <span />
                      <span />
                      <span />
                    </span>
                  </span>
                </div>
              )}

              {(phase === "typing-response" || phase === "pause") &&
                displayedResponse && (
                  <div className="landing-chatbox-msg msg-agent">
                    <span className="landing-chatbox-prefix">&lt;</span>
                    <span className="landing-chatbox-content">
                      {displayedResponse}
                      {phase === "typing-response" && (
                        <span className="landing-chatbox-cursor" />
                      )}
                    </span>
                  </div>
                )}
            </div>

            <div className="landing-chatbox-input">
              <span>&gt;</span>
              <span className="landing-chatbox-input-cursor" />
              <span>Ask about power markets...</span>
            </div>
          </div>

          <div className="landing-body-grid">
            <div className="v-flex" style={{ gap: "1rem" }}>
              <p className="landing-body-text">
                Gridsurf is building a system to turn fragmented grid,
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
                  Our agent is structuring power market data into
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
                  Gridsurf combines experience in power markets, grid
                  engineering, and AI systems. One founder works in energy
                  markets analysis in the U.S., focusing on interconnection,
                  market dynamics, and project risk. The other is a grid
                  engineer working on utility-scale solar and storage projects
                  and previously built GridSensAI, a tool for querying and
                  analyzing grid data. We started building our agent after
                  repeatedly seeing how fragmented and difficult power market
                  data is, and how much time developers spend interpreting it
                  manually.
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
