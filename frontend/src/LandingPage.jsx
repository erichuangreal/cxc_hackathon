import "./landing.css";
import logo from "./assets/logo.png";

export default function LandingPage({ onEnter }) {
  return (
    <div className="gw-landing">
      <div className="gw-bg">
        <div className="gw-dots" />
        <div className="gw-glow gw-glow-a" />
        <div className="gw-glow gw-glow-b" />
        <div className="gw-vignette" />
      </div>

      <header className="gw-nav">
        <div className="gw-brand">
          <img className="gw-brand-logo" src={logo} alt="GrowWiseAI logo" />
          <span className="gw-brand-name">GrowWiseAI</span>
        </div>

        <button className="gw-openapp" onClick={onEnter}>
          Open App <span className="gw-arrow">→</span>
        </button>
      </header>

      <main className="gw-hero">
        <div className="gw-hero-inner">
          <div className="gw-logo-wrap" aria-hidden="true">
            <img className="gw-hero-logo" src={logo} alt="" />
          </div>

          <h1 className="gw-title">
            GrowWiseAI
            <span className="gw-title-accent">.</span>
          </h1>

          <p className="gw-slogan">
            “not every soil can bear all things. Be practical”
          </p>

          <p className="gw-subtitle">
            Click a location in the contiguous USA, fetch environmental features,
            tweak inputs, and run a prediction instantly.
          </p>

          <div className="gw-cta">
            <button className="gw-btn gw-btn-primary" onClick={onEnter}>
              Launch Demo
            </button>
            <a className="gw-btn gw-btn-ghost" href="#how">
              How it works
            </a>
          </div>

          <div className="gw-mini" id="how">
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

      <footer className="gw-footer">
        <span>© {new Date().getFullYear()} GrowWiseAI</span>
        <span className="gw-footer-muted">CXC Hackathon</span>
      </footer>
    </div>
  );
}
