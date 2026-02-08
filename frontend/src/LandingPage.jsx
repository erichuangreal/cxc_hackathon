import "./landing.css";
import logo from "./assets/logo.png";

export default function LandingPage({ onEnter }) {
  return (
    <div className="gw-landing">
      <div className="gw-bg">
        <div className="gw-tunnel" />
        <div className="gw-dots" />
        <div className="gw-sweep" />
        <div className="gw-glow gw-glow-a" />
        <div className="gw-glow gw-glow-b" />
        <div className="gw-vignette" />
      </div>

      <header className="gw-nav">
        <div className="gw-brand">
          <img className="gw-brand-logo" src={logo} alt="GrowWiseAI logo" />
          <span className="gw-brand-name">GrowWiseAI</span>
        </div>

        <button className="gw-openapp" onClick={onEnter} type="button">
          Open App <span className="gw-arrow">→</span>
        </button>
      </header>

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

          <p className="gw-subtitle">
            Pick a point in the contiguous U.S. We auto-fetch elevation, climate,
            and soil nutrients, let you fine-tune inputs, then estimate tree
            survivability instantly.
          </p>

          <div className="gw-cta">
            <button className="gw-btn gw-btn-primary" onClick={onEnter} type="button">
              Launch Demo
            </button>

            <a
              className="gw-btn gw-btn-ghost"
              href="#how"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("how");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              How it works
            </a>
          </div>

          <div className="gw-mini">
            <div className="gw-mini-item">
              <div className="gw-mini-num">01</div>
              <div className="gw-mini-text">Select a point (lower-48 only)</div>
            </div>
            <div className="gw-mini-item">
              <div className="gw-mini-num">02</div>
              <div className="gw-mini-text">Override soil + climate features</div>
            </div>
            <div className="gw-mini-item">
              <div className="gw-mini-num">03</div>
              <div className="gw-mini-text">Run prediction + view survivability</div>
            </div>
          </div>
        </div>

        <div className="gw-preview">
          <div className="gw-preview-card">
            <div className="gw-preview-top">
              <div className="gw-dot gw-dot-g" />
              <div className="gw-dot gw-dot-y" />
              <div className="gw-dot gw-dot-r" />
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

      <section className="gw-how" id="how">
        <div className="gw-how-inner">
          <h2 className="gw-how-title">How GrowWiseAI works</h2>

          <p className="gw-how-lead">
            GrowWiseAI combines map-based selection with real environmental inputs.
            You click a location, we fetch local conditions, you can override values
            if needed, and then the model estimates survivability.
          </p>

          <div className="gw-how-grid">
            <div className="gw-how-card">
              <div className="gw-how-num">01</div>
              <div className="gw-how-head">Select a location (lower-48 only)</div>
              <div className="gw-how-text">
                The map is restricted to the contiguous United States. Outside the
                boundary, the cursor shows a red ❌ and clicks are blocked—so you
                don’t accidentally pick Canada or Mexico.
              </div>
            </div>

            <div className="gw-how-card">
              <div className="gw-how-num">02</div>
              <div className="gw-how-head">Fetch base environmental features</div>
              <div className="gw-how-text">
                On click, the frontend calls{" "}
                <span className="gw-code">/api/fetch-features</span> with latitude/
                longitude. The backend returns base conditions for that spot:
                elevation, temperature, humidity, and soil nutrients.
              </div>
            </div>

            <div className="gw-how-card">
              <div className="gw-how-num">03</div>
              <div className="gw-how-head">Override inputs (optional)</div>
              <div className="gw-how-text">
                Use sliders to explore “what-if” scenarios. Your app keeps both the
                base values and your overrides—so “Reset all” can snap everything
                back to the fetched baseline.
              </div>
            </div>

            <div className="gw-how-card">
              <div className="gw-how-num">04</div>
              <div className="gw-how-head">Run the prediction</div>
              <div className="gw-how-text">
                When you press “Run prediction,” the frontend POSTs the current
                feature set to <span className="gw-code">/api/predict</span>. The
                backend loads the trained model and returns a survivability estimate
                shown in the results card.
              </div>
            </div>
          </div>

          <div className="gw-how-cta">
            <button className="gw-btn gw-btn-primary" onClick={onEnter} type="button">
              Launch Demo
            </button>
          </div>
        </div>
      </section>

      <footer className="gw-footer">
        <span>© {new Date().getFullYear()} GrowWiseAI</span>
        <span className="gw-footer-muted">CXC Hackathon</span>
      </footer>
    </div>
  );
}
