"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "@/app/thesis.css";

const sections = [
  { id: "challenge", num: "01", label: "The Challenge" },
  { id: "bottleneck", num: "02", label: "The Bottleneck" },
  { id: "gridagent", num: "03", label: "Enter GridAgent" },
  { id: "moat", num: "04", label: "Our Moat" },
  { id: "cta", num: "05", label: "Reach Out" },
];

export function ThesisPage() {
  const [dark, setDark] = useState(true);
  const [activeSection, setActiveSection] = useState("challenge");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -50% 0px",
        threshold: 0,
      },
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={`thesis-page${dark ? " thesis-dark" : ""}`}>
      {/* Sidebar */}
      <nav className="thesis-sidebar">
        <Link href="/" className="thesis-sidebar-icon" aria-label="Home">
          G
        </Link>
        <span className="thesis-sidebar-label mono">The Thesis</span>
        <span className="thesis-sidebar-label mono">2025</span>
      </nav>

      {/* Main content */}
      <div className="thesis-content">
        {/* Top bar */}
        <header className="thesis-header">
          <Link href="/" className="thesis-back">
            ← Back
          </Link>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span className="mono" style={{ color: "var(--c-muted)" }}>
              [02]
            </span>
            <button
              className="thesis-toggle"
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle dark mode"
            >
              {dark ? "☀" : "☾"}
            </button>
          </div>
        </header>

        {/* Hero */}
        <div className="thesis-hero">
          <span className="thesis-hero-label mono">GridAgent / Manifesto</span>
          <h1 className="thesis-hero-title">
            The
            <br />
            Thesis
          </h1>
          <p className="thesis-hero-subtitle">
            Why we&apos;re building the intelligence layer for US power markets,
            and why now.
          </p>
        </div>

        {/* Body */}
        <div className="thesis-body">
          {/* Section nav */}
          <nav className="thesis-nav">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`thesis-nav-item${activeSection === s.id ? " active" : ""}`}
                onClick={() => scrollTo(s.id)}
              >
                {s.num} - {s.label}
              </button>
            ))}
          </nav>

          {/* Article */}
          <article className="thesis-article">
            {/* Section 01 */}
            <section id="challenge" className="thesis-section">
              <span className="thesis-section-num">01 - The Challenge</span>
              <h2 className="thesis-section-title">
                An Overwhelmed Grid in an Accelerating World
              </h2>
              <p>
                The power grid is the most complex coordinated machine on Earth,
                and it&apos;s now facing a scale and pace of load growth it has
                never seen before. In places like PJM, SPP, MISO, and ERCOT,
                load growth forecasts are already outrunning supply plans,
                leading to real risks of blackouts, years-long project delays,
                and rapidly rising costs.
              </p>
              <p>
                Regulators are actively rewriting the rules in real time (and
                for good reason) to try to get generation connected faster. New
                processes and technology are speeding up studies and
                streamlining workflows, which is great. The tradeoff is that
                data and results are pouring out at a frequency the industry has
                never had to absorb before.
              </p>
            </section>

            <hr className="thesis-divider" />

            {/* Section 02 */}
            <section id="bottleneck" className="thesis-section">
              <span className="thesis-section-num">02 - The Bottleneck</span>
              <h2 className="thesis-section-title">
                The Bottleneck Isn&apos;t Data. It&apos;s Understanding.
              </h2>
              <p>
                The power markets are short on talent for exactly this reason:
                the domain is incredibly complex, deeply temporal, and carries
                massive financial and reliability stakes. That intelligence gap
                is more than inefficient. It&apos;s costing billions in lost
                productivity and holding back innovation in the one sector that
                underpins economic growth, climate goals, and the entire tech
                revolution.
              </p>

              <div className="thesis-pullquote">
                An analyst can easily spend hours decoding a single tariff
                change, cross-checking it against the latest queue results, and
                trying to connect it to bigger-picture risks.
              </div>

              <p>
                Today&apos;s power market research still depends on human
                analysts manually combing through mountains of fragmented
                information: ISO stakeholder meetings, generator interconnection
                queues, tariffs and manuals, cluster study results, regulatory
                filings, and more. Multiply that across seven ISOs/RTOs,
                thousands of queued projects, and constant regulatory flux, and
                you end up with a system that&apos;s mostly reactive and often
                paralyzed.
              </p>
              <p>
                The problem has two faces: power market data is built for
                humans, not AI. General models can&apos;t reach decision-level
                intelligence on it. And there&apos;s no scalable intelligence
                layer to make sense of it all in real time.
              </p>
            </section>

            <hr className="thesis-divider" />

            {/* Section 03 */}
            <section id="gridagent" className="thesis-section">
              <span className="thesis-section-num">03 - Enter GridAgent</span>
              <h2 className="thesis-section-title">
                The AI Analyst for Power Market Mastery
              </h2>
              <p>
                At GridAgent, we&apos;re automating research and rebuilding the
                workflow around it. Think of us as your 24/7 AI agent being
                built specifically for US power market analysis. Our moat sits
                in two tightly connected layers:
              </p>

              <div className="thesis-pullquote">
                This isn&apos;t off-the-shelf AI. Anyone can call an LLM API.
                What makes GridAgent different is the full ecosystem we&apos;re
                building.
              </div>

              <p>
                <strong>The data transformation layer.</strong> AI agents are
                only as good as the context they can actually use. We&apos;re
                taking messy, unstructured power market data from dozens of
                sources and turning it into clean, structured, interconnected,
                AI-literate context that models can truly reason over.
              </p>
              <p>
                <strong>The intelligence layer.</strong> We&apos;ve broken down
                what a seasoned power markets analyst actually does day in, day
                out and rebuilt those workflows as native AI skills. Our analyst
                retrieves data and explains what it means: how interconnection
                queues really work, why clusters form and what risks they carry,
                how tariff language translates to project economics, what
                stakeholder meetings actually signal about the future.
              </p>
              <p>
                What makes GridAgent different is the full ecosystem:
                proprietary data pipelines, custom skills being writen
                rigorously on real power-market problems, intuitive UX that will
                let humans and AI work together seamlessly, and reliability
                being engineered for an industry that doesn&apos;t forgive
                mistakes.
              </p>
            </section>

            <hr className="thesis-divider" />

            {/* Section 04 */}
            <section id="moat" className="thesis-section">
              <span className="thesis-section-num">04 - Our Moat</span>
              <h2 className="thesis-section-title">
                Why Domain Knowledge Is the Ultimate Moat
              </h2>
              <p>
                In today&apos;s world, AI models are getting commoditized. Real
                differentiation lives in everything around the model: the
                quality of context, the depth of domain-specific skills, the UX,
                and how well the system actually solves the customer&apos;s
                hardest problems.
              </p>

              <div className="thesis-pullquote">
                We&apos;ve lived the pain points, sat through the same brutal
                stakeholder calls, read the same endless FERC filings, watched
                the same queues balloon.
              </div>

              <p>
                Our edge comes from more than 10 years of hands-on experience in
                the trenches, working as consultants with generation developers,
                data center teams, tax equity investors, utilities, and more.
                That immersion helps us build context that&apos;s accurate and
                forward-looking.
              </p>
            </section>

            <hr className="thesis-divider" />

            {/* Section 05 */}
            <section id="cta" className="thesis-section">
              <span className="thesis-section-num">05 - Reach Out</span>
              <h2 className="thesis-section-title">
                Close the Intelligence Gap
              </h2>
              <p>
                GridAgent will help decision-makers reclaim hours for high-level
                strategy, help developers pick sites with real risk-adjusted
                visibility, and give investors sharper edges in portfolio
                decisions. We won&apos;t replace experts. We will amplify them
                and close the intelligence gap at scale.
              </p>
              <p>
                If you&apos;re a developer, analyst, or investor trying to
                navigate this fast-moving, high-stakes landscape, reach out.
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}
