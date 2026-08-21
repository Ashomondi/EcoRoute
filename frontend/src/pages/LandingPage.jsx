import { Link } from 'react-router-dom'
import heroImg from '../assets/hero.png'

const FEATURES = [
  {
    title: 'Live bin monitoring',
    desc: 'Every waste point reports its fill level in real time, colour-coded so critical bins never get missed.',
  },
  {
    title: 'Optimized truck routes',
    desc: 'Nearest-neighbour + 2-opt routing cuts distance, fuel and CO₂ on every collection run.',
  },
  {
    title: 'Community reporting',
    desc: 'Residents flag overflowing bins, missed collections and illegal dumping in one tap.',
  },
  {
    title: 'AI fill forecasting',
    desc: 'Predicts tomorrow’s fill level per point so collections are scheduled before bins overflow.',
  },
  {
    title: 'Recycle with impact',
    desc: 'Scan and sort your waste, find nearby recyclers and watch the CO₂ you save add up.',
  },
  {
    title: 'Measured impact',
    desc: 'Every dashboard number is computed from real collections — distance, fuel and CO₂ saved.',
  },
]

const STEPS = [
  { title: 'Monitor', desc: 'Sensors and community reports keep every bin’s status live on the map.' },
  { title: 'Optimize', desc: 'One click builds the shortest, capacity-aware route for any truck.' },
  { title: 'Collect', desc: 'Drivers follow the ordered stops and mark each collection in the app.' },
  { title: 'Recycle', desc: 'Residents sort, drop off at nearby recyclers and track their impact.' },
]

const STATS = [
  { value: '4', label: 'Live waste points' },
  { value: '1', label: 'Active truck' },
  { value: '92%', label: 'Highest bin level' },
  { value: '8km', label: 'Saved per run' },
]

export default function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <span className="logo-dot" />
            <strong>EcoRoute</strong>
          </Link>
          <div className="landing-nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#impact">Impact</a>
          </div>
          <Link to="/login" className="btn btn-ghost">
            Sign in
          </Link>
        </div>
      </nav>

      <div className="landing-hero-wrap">
        <div className="landing-hero-glow" />
        <div className="landing-hero">
          <div className="landing-copy">
            <span className="landing-eyebrow">
              <span className="landing-eyebrow-dot" /> Smart waste management
            </span>
            <h1>
              Cleaner cities, <span className="landing-accent">one smart route</span> at a time
            </h1>
            <p className="landing-lead">
              EcoRoute monitors waste points across the city, builds optimized collection routes, and
              lets residents report problems and recycle with measurable impact.
            </p>
            <div className="landing-cta">
              <Link to="/login" className="btn btn-primary btn-lg">
                Launch demo <span className="btn-arrow">→</span>
              </Link>
              <a href="#features" className="btn btn-outline btn-lg">
                Explore features
              </a>
            </div>
            <ul className="landing-trust">
              <li>Live bin status</li>
              <li>Route optimization</li>
              <li>Community reporting</li>
            </ul>
          </div>

          <div className="landing-visual">
            <div className="landing-float-card">
              <span className="mock-route-dot" />
              <div>
                <p>Route optimized</p>
                <small>−8.0 km saved this run</small>
              </div>
            </div>
            <div className="mock-window">
              <div className="mock-titlebar">
                <span className="mock-dot" style={{ background: '#f87171' }} />
                <span className="mock-dot" style={{ background: '#fbbf24' }} />
                <span className="mock-dot" style={{ background: '#34d399' }} />
                <span className="mock-url">ecoroute.dev/admin</span>
              </div>
              <div className="mock-body">
                <div className="mock-sidebar">
                  <div className="mock-sidebar-logo" />
                  <div className="mock-nav active" />
                  <div className="mock-nav" />
                  <div className="mock-nav" />
                </div>
                <div className="mock-content">
                  <div className="mock-kpi-row">
                    <div className="mock-kpi" />
                    <div className="mock-kpi" />
                    <div className="mock-kpi" />
                    <div className="mock-kpi" />
                  </div>
                  <div className="mock-map">
                    <img src={heroImg} className="mock-hero-img" alt="Live waste map" />
                  </div>
                  <div className="mock-rows">
                    <div className="mock-row" />
                    <div className="mock-row short" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="landing-stats-band">
            {STATS.map((s) => (
              <div className="card landing-stat" key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section id="features" className="landing-section">
        <div className="landing-section-head">
          <span className="landing-section-tag">Features</span>
          <h2>Everything a clean city needs</h2>
          <p>One platform for monitoring, routing, reporting and recycling.</p>
        </div>
        <div className="container">
          <div className="grid cols-3 landing-feature-grid">
            {FEATURES.map((f) => (
              <div className="card landing-feature-card" key={f.title}>
                <span className="landing-feature-icon">✦</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="landing-section landing-how-wrap">
        <div className="landing-section-head">
          <span className="landing-section-tag">How it works</span>
          <h2>From overflowing bin to recycled impact</h2>
        </div>
        <div className="container">
          <div className="grid cols-4">
            {STEPS.map((s, i) => (
              <div className="card landing-step-card" key={s.title}>
                <span className="landing-step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="impact" className="landing-section">
        <div className="container">
          <div className="grid cols-2 landing-impact-grid">
            <div className="landing-impact-copy">
              <span className="landing-section-tag">Impact</span>
              <h2>Real savings, measured from real data</h2>
              <ul className="landing-impact-list">
                <li>Distance saved vs naive routing</li>
                <li>Fuel and CO₂ avoided per collection run</li>
                <li>Kilograms recycled and diverted from landfill</li>
              </ul>
              <Link to="/login" className="btn btn-primary">
                See the live dashboard <span className="btn-arrow">→</span>
              </Link>
            </div>
            <div className="card landing-impact-card">
              <h3>Distance per run</h3>
              <div className="compare-bar">
                <div className="compare-row">
                  <span className="row-label">Baseline</span>
                  <div className="compare-track">
                    <div className="impact-fill" style={{ width: '100%' }} />
                  </div>
                  <div className="landing-compare-vals">
                    <span className="landing-before">22.3 km</span>
                    <span className="landing-after">14.3 km</span>
                  </div>
                </div>
                <div className="compare-row">
                  <span className="row-label">Optimized</span>
                  <div className="compare-track">
                    <div className="impact-fill" style={{ width: '64%' }} />
                  </div>
                  <div className="landing-compare-vals">
                    <span className="landing-after">−8.0 km</span>
                    <span>36% shorter</span>
                  </div>
                </div>
              </div>
              <div className="landing-impact-foot">
                <span>
                  Fuel saved <strong>1.6 L</strong>
                </span>
                <span>
                  CO₂ avoided <strong>4.3 kg</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-cta-wrap">
        <div className="container">
          <div className="landing-cta-card">
            <div>
              <h2>Ready for a cleaner city?</h2>
              <p>
                Jump into the live demo as an admin, driver or resident and see every flow working end to end.
              </p>
            </div>
            <Link to="/login" className="btn btn-light btn-lg">
              Launch the demo <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <span className="muted">© {new Date().getFullYear()} EcoRoute</span>
          <div className="landing-footer-links">
            <Link to="/login">Sign in</Link>
            <a href="#how">How it works</a>
            <a href="#impact">Impact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
