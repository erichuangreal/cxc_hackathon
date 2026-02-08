import { useMemo } from "react";
import "./landing.css";
import logo from "./assets/logo.png";

function ValueIcon({ type }) {
  if (type === "live") {
    return (
      <svg viewBox="0 0 24 24" className="gw-vi" aria-hidden="true">
        <path
          d="M12 3v3m0 12v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M3 12h3m12 0h3M4.2 19.8l2.1-2.1m11.4-11.4 2.1-2.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="12"
          r="3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (type === "scenario") {
    return (
      <svg viewBox="0 0 24 24" className="gw-vi" aria-hidden="true">
        <path
          d="M6 7h12M6 12h12M6 17h12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="9" cy="7" r="2" fill="currentColor" opacity="0.9" />
        <circle cx="15" cy="12" r="2" fill="currentColor" opacity="0.9" />
        <circle cx="11" cy="17" r="2" fill="currentColor" opacity="0.9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="gw-vi" aria-hidden="true">
      <path
        d="M5 16l5-5 3 3 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 8h2v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingPage({ onEnter }) {
  const scrollToDetails = useMemo(() => {
    return () => {
      const el = document.getElementById("details");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };
  }, []);

  return (
    <div className="gw-landing">
      <div className="gw-bg">
        <div className="gw-aurora" />
        <div className="gw-grid" />

        <div className="gw-shapes" aria-hidden="true">
          <span className="gw-shape gw-shape-ring" />
          <span className="gw-shape gw-shape-blob" />
          <span className="gw-shape gw-shape-chip" />
          <span className="gw-shape gw-shape-lines" />
        </div>

        <div className="gw-noise" />
        <div className="gw-vignette" />
      </div>

      <header className="gw-nav">
        <div className="gw-brand">
          <img className="gw-brand-logo" src={logo} alt="GrowWiseAI logo" />
          <span className="gw-brand-name">GrowWiseAI</span>
        </div>
      </header>

      {/* HERO: keep it light / minimal */}
      <main className="gw-hero">
        <div className="gw-hero-inner">
          <div className="gw-logo-wrap" aria-hidden="true">
            <img className="gw-hero-logo" src={logo} alt="" />
          </div>

          <h1 className="gw-title">
            GrowWiseAI<span className="gw-title-accent">.</span>
          </h1>

          <p className="gw-slogan">
            “not every soil can bear all things. Be practical”
          </p>

          {/* Less wordy subtitle */}
          <p className="gw-subtitle">
            Click a point in the lower 48. We pull daily-refreshed soil + climate
            baselines and predict tree survivability.
          </p>

          <div className="gw-live" role="note" aria-label="Live data note">
            <span className="gw-pill gw-pill-live">
              <span className="gw-live-dot" aria-hidden="true" /> Live data
            </span>
            <span className="gw-live-text">
              Baseline environmental inputs refresh every 24h for every location
              you pick.
            </span>
          </div>

          <div className="gw-cta">
            <button className="gw-btn gw-btn-primary" onClick={onEnter} type="button">
              Launch Demo
            </button>

            <button className="gw-btn gw-btn-ghost" type="button" onClick={scrollToDetails}>
              See details
            </button>
          </div>

          {/* Keep mini steps but compact */}
          <div className="gw-mini gw-mini-compact">
            <div className="gw-mini-item">
              <div className="gw-mini-num">01</div>
              <div className="gw-mini-text">Pick a point</div>
            </div>
            <div className="gw-mini-item">
              <div className="gw-mini-num">02</div>
              <div className="gw-mini-text">Adjust inputs</div>
            </div>
            <div className="gw-mini-item">
              <div className="gw-mini-num">03</div>
              <div className="gw-mini-text">Run prediction</div>
            </div>
          </div>
        </div>

        <div className="gw-preview">
          <div className="gw-preview-card">
            <div className="gw-preview-top">
              <div className="gw-dot gw-dot-r" />
              <div className="gw-dot gw-dot-y" />
              <div className="gw-dot gw-dot-g" />
              <span className="gw-preview-title">Preview</span>
            </div>

            <div className="gw-preview-body">
              <div className="gw-preview-map">
                <div className="gw-preview-map-label">Contiguous USA</div>
              </div>

              <div className="gw-preview-panel">
                <div className="gw-skel gw-skel-lg" />
                <div className="gw-skel" />
                <div className="gw-skel" />
                <div className="gw-skel gw-skel-md" />
                <div className="gw-preview-btn">Run prediction</div>
              </div>
            </div>

            <div className="gw-preview-foot">
              React + Leaflet • FastAPI • ML inference
            </div>
          </div>
        </div>
      </main>

      {/* DETAILS: cleaner + expandable */}
      <section className="gw-details" id="details">
        <div className="gw-details-inner">
          <h2 className="gw-details-title">Details</h2>
          <p className="gw-details-lead">
            Want the full story? Expand what you care about.
          </p>

          <details className="gw-acc" open={false}>
            <summary className="gw-acc-sum">Why it matters</summary>
            <div className="gw-acc-body">
              Planting decisions fail when local soil nutrients and climate don’t
              match what a species needs. GrowWiseAI pulls baseline conditions
              for your exact location and helps you sanity-check survivability
              before you commit time, labor, and budget.
            </div>
          </details>

          <details className="gw-acc" open={false}>
            <summary className="gw-acc-sum">What makes GrowWiseAI different</summary>
            <div className="gw-acc-body">
              <div className="gw-values-grid">
                <div className="gw-value-card">
                  <div className="gw-value-top">
                    <div className="gw-value-ic">
                      <ValueIcon type="live" />
                    </div>
                    <div className="gw-value-head">Daily refreshed baselines</div>
                  </div>
                  <div className="gw-value-text">
                    Elevation, climate, and soil nutrients are pulled for the
                    point you choose and refreshed every 24h.
                  </div>
                </div>

                <div className="gw-value-card">
                  <div className="gw-value-top">
                    <div className="gw-value-ic">
                      <ValueIcon type="scenario" />
                    </div>
                    <div className="gw-value-head">Scenario testing</div>
                  </div>
                  <div className="gw-value-text">
                    Tweak inputs to explore “what if” changes without losing the
                    original baseline.
                  </div>
                </div>

                <div className="gw-value-card">
                  <div className="gw-value-top">
                    <div className="gw-value-ic">
                      <ValueIcon type="predict" />
                    </div>
                    <div className="gw-value-head">Instant prediction</div>
                  </div>
                  <div className="gw-value-text">
                    One click runs the model and returns a survivability estimate
                    in seconds.
                  </div>
                </div>
              </div>
            </div>
          </details>

          <details className="gw-acc" open={false}>
            <summary className="gw-acc-sum">How it works</summary>
            <div className="gw-acc-body">
              <div className="gw-how-grid">
                <div className="gw-how-card">
                  <div className="gw-how-num">01</div>
                  <div className="gw-how-head">Click a location (lower-48 only)</div>
                  <div className="gw-how-text">
                    The map only accepts clicks inside the contiguous U.S.
                    Outside the boundary you’ll see a red ❌ and clicks are ignored.
                  </div>
                </div>

                <div className="gw-how-card">
                  <div className="gw-how-num">02</div>
                  <div className="gw-how-head">Fetch baseline conditions</div>
                  <div className="gw-how-text">
                    Your click sends <span className="gw-code">lat/lon</span> to{" "}
                    <span className="gw-code">/api/fetch-features</span> to
                    retrieve elevation, temperature, humidity, and soil nutrients.
                  </div>
                </div>

                <div className="gw-how-card">
                  <div className="gw-how-num">03</div>
                  <div className="gw-how-head">Override any values</div>
                  <div className="gw-how-text">
                    Adjust sliders to explore scenarios. You can always reset back
                    to the baseline.
                  </div>
                </div>

                <div className="gw-how-card">
                  <div className="gw-how-num">04</div>
                  <div className="gw-how-head">Run prediction</div>
                  <div className="gw-how-text">
                    Press run to POST the current features to{" "}
                    <span className="gw-code">/api/predict</span> and view the result.
                  </div>
                </div>
              </div>

              <div className="gw-details-cta">
                <button className="gw-btn gw-btn-primary" onClick={onEnter} type="button">
                  Launch Demo
                </button>
              </div>
            </div>
          </details>
        </div>
      </section>

      <footer className="gw-footer">
        <span>© {new Date().getFullYear()} GrowWiseAI</span>
        <span className="gw-footer-muted">CXC Hackathon</span>
      </footer>
    </div>
  );
}
