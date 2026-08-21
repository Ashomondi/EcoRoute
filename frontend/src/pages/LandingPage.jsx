import { Link } from 'react-router-dom'
import hero from '../assets/hero.png'

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#impact', label: 'Impact' },
  { href: '#pricing', label: 'Cities' },
]

const FEATURES = [
  {
    icon: 'route',
    title: 'Smarter collection routes',
    body: 'Our optimizer reorders truck stops to cut distance, fuel and time — one click, measurable savings on every run.',
  },
  {
    icon: 'bin',
    title: 'Smart bins & monitoring',
    body: 'Live fill levels flag critical points before they overflow, so trucks go where they matter most — not everywhere.',
  },
  {
    icon: 'report',
    title: 'Community reporting',
    body: 'Spot overflowing bins or missed collections? Report it in seconds, track it to resolution, see it fixed.',
  },
  {
    icon: 'leaf',
    title: 'Environmental impact',
    body: 'Every optimized route shows the distance, fuel and CO2 your city saves — real numbers, proven outcomes.',
  },
]

const STEPS = [
  {
    step: '01',
    icon: 'monitor',
    title: 'Monitor',
    body: 'Fill-level sensors and community reports give you a live picture of every waste point in the city.',
  },
  {
    step: '02',
    icon: 'priority',
    title: 'Prioritize',
    body: 'EcoRoute scores each point by urgency, so critical bins get serviced first — automatically, every time.',
  },
  {
    step: '03',
    icon: 'optimize',
    title: 'Optimize',
    body: 'Routes are re-sequenced in a click to slash mileage, fuel burn and crew time. Dispatch and go.',
  },
]

const STATS = [
  { value: '32%', label: 'Less distance driven' },
  { value: '28%', label: 'Less fuel consumed' },
  { value: '41%', label: 'Fewer overflows' },
  { value: '24/7', label: 'Live city coverage' },
]

const IMPACT_ROWS = [
  { label: 'Route distance', before: '128 km', after: '87 km', pct: 68 },
  { label: 'Fuel used', before: '42 L', after: '30 L', pct: 71 },
  { label: 'CO2 emitted', before: '108 kg', after: '77 kg', pct: 71 },
]

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="container landing-nav-inner">
          <div className="community-brand">
            <span className="logo-dot" />
            <strong>EcoRoute</strong>
          </div>
          <nav className="landing-nav-links">
            {NAV_LINKS.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="landing-cta">
            <Link className="btn btn-ghost" to="/login">
              Log in
            </Link>
            <Link className="btn btn-primary" to="/signup">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-hero-wrap">
        <div className="landing-hero-glow" aria-hidden="true" />
        <div className="container landing-hero">
          <div className="landing-copy">
            <span className="landing-eyebrow">
              <span className="landing-eyebrow-dot" />
              Built for city operations teams
            </span>
            <h1>
              Waste collection that <span className="landing-accent">runs itself smarter</span>
            </h1>
            <p className="landing-lead">
              EcoRoute monitors every bin in your city, prioritizes what really needs collecting, and
              rewrites truck routes in a click — so streets stay clean with less fuel, less time and
              less cost.
            </p>
            <div className="landing-cta">
              <Link className="btn btn-primary btn-lg" to="/signup">
                Join your city
                <span className="btn-arrow">→</span>
              </Link>
              <Link className="btn btn-outline btn-lg" to="/login">
                Try a demo account
              </Link>
            </div>
            <ul className="landing-trust">
              <li>No hardware lock-in</li>
              <li>Live dashboards</li>
              <li>Free for pilot cities</li>
            </ul>
          </div>

          <div className="landing-visual">
            <div className="mock-window">
              <div className="mock-titlebar">
                <span className="mock-dot" style={{ background: '#f87171' }} />
                <span className="mock-dot" style={{ background: '#fbbf24' }} />
                <span className="mock-dot" style={{ background: '#34d399' }} />
                <span className="mock-url">app.ecoroute.city</span>
              </div>
              <div className="mock-body">
                <div className="mock-sidebar">
                  <div className="mock-sidebar-logo" />
                  <span className="mock-nav active" />
                  <span className="mock-nav" />
                  <span className="mock-nav" />
                  <span className="mock-nav" />
                </div>
                <div className="mock-content">
                  <div className="mock-kpi-row">
                    <span className="mock-kpi" />
                    <span className="mock-kpi" />
                    <span className="mock-kpi" />
                    <span className="mock-kpi" />
                  </div>
                  <div className="mock-map">
                    <img src={hero} alt="EcoRoute route map" className="mock-hero-img" />
                  </div>
                  <div className="mock-rows">
                    <span className="mock-row" />
                    <span className="mock-row short" />
                    <span className="mock-row" />
                  </div>
                </div>
              </div>
              <div className="mock-route-card">
                <span className="mock-route-dot" />
                <div>
                  <p>Route #12 · Optimized</p>
                  <small>-31% distance · 12 stops</small>
                </div>
                <span className="mock-route-badge">Live</span>
              </div>
            </div>
            <div className="landing-float-card">
              <span className="status-dot ok" />
              <div>
                <p>Overflow prevented</p>
                <small>Bin #A-114 · 2 min ago</small>
              </div>
            </div>
          </div>
        </div>

        <div className="container landing-stats-band">
          {STATS.map((s) => (
            <div key={s.label} className="landing-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="container landing-section">
        <div className="landing-section-head">
          <span className="landing-section-tag">Features</span>
          <h2>Everything your city needs to run cleaner collections</h2>
          <p className="muted">
            One platform connecting the operations room, the truck cab and every resident who reports an issue.
          </p>
        </div>
        <div className="grid cols-4 landing-feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="card landing-feature-card">
              <span className="landing-feature-icon">
                <FeatureIcon name={f.icon} />
              </span>
              <h3>{f.title}</h3>
              <p className="muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-how-wrap">
        <div className="container landing-section" id="how-it-works">
          <div className="landing-section-head">
            <span className="landing-section-tag">How it works</span>
            <h2>From overflowing bin to collected — in three steps</h2>
            <p className="muted">
              EcoRoute connects sensing, prioritization and dispatch so nothing falls through the cracks.
            </p>
          </div>
          <div className="grid cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="card landing-step-card">
                <span className="landing-step-num">{s.step}</span>
                <span className="landing-feature-icon">
                  <FeatureIcon name={s.icon} />
                </span>
                <h3>{s.title}</h3>
                <p className="muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="impact" className="container landing-section">
        <div className="grid cols-2 landing-impact-grid">
          <div className="landing-impact-copy">
            <span className="landing-section-tag">Measurable impact</span>
            <h2>Real savings on every single run</h2>
            <p className="muted">
              Compare a typical manual collection day against an EcoRoute-optimized one. The numbers
              speak for themselves — less distance, less fuel, less carbon.
            </p>
            <ul className="landing-impact-list">
              <li>Automated route optimization in one click</li>
              <li>Live fleet and bin status for every team</li>
              <li>Transparent CO2 and fuel reporting for audits</li>
            </ul>
            <Link className="btn btn-primary" to="/signup">
              See it live on your city map
            </Link>
          </div>
          <div className="card landing-impact-card">
            <h3>Before vs after optimization</h3>
            <div className="compare-bar">
              {IMPACT_ROWS.map((row) => (
                <div key={row.label} className="compare-row">
                  <span className="row-label">{row.label}</span>
                  <div className="compare-track">
                    <div style={{ width: `${row.pct}%`, background: 'var(--gradient)' }} />
                  </div>
                  <div className="landing-compare-vals">
                    <span className="landing-before">{row.before}</span>
                    <span className="landing-after">→ {row.after}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="landing-impact-foot">
              <span>Average across pilot city routes</span>
              <strong>−31% distance</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="landing-cta-wrap">
        <div className="container landing-cta-card">
          <div>
            <span className="landing-eyebrow landing-eyebrow-light">Ready when you are</span>
            <h2>Make your city cleaner, cheaper and greener</h2>
            <p>
              Join pilot cities already cutting collection costs with EcoRoute. Set up a demo
              environment in minutes.
            </p>
          </div>
          <div className="landing-cta">
            <Link className="btn btn-light" to="/signup">
              Start your pilot
            </Link>
            <Link className="btn btn-outline btn-outline-light" to="/login">
              Explore the demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <div className="community-brand">
            <span className="logo-dot" />
            <strong>EcoRoute</strong>
          </div>
          <p className="muted">Smart waste collection for cleaner cities.</p>
          <div className="landing-footer-links">
            <Link to="/login">Log in</Link>
            <Link to="/signup">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureIcon({ name }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (name) {
    case 'route':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" {...common}>
          <circle cx="6" cy="19" r="2.2" />
          <circle cx="18" cy="5" r="2.2" />
          <path d="M6 19C6 10 12 14 18 5" />
          <path d="M12 8l-2-2m0 0l2-2m-2 2h8" />
        </svg>
      )
    case 'bin':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" {...common}>
          <path d="M5 8h14l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8z" />
          <path d="M3 8l1.2-3.5A2 2 0 0 1 6 3h12a2 2 0 0 1 1.8 1.5L21 8" />
          <path d="M10 12v6m4-6v6" />
        </svg>
      )
    case 'report':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" {...common}>
          <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
          <path d="M8 7h8m-8 4h8m-8 4h5" />
        </svg>
      )
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" {...common}>
          <path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 16-9 0 10-3 16-9 16z" />
          <path d="M4 20c4-6 8-9 12-11" />
        </svg>
      )
    case 'monitor':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" {...common}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8m-4-4v4" />
          <path d="M7 11l2.5-2.5L12 11l3-3" />
        </svg>
      )
    case 'priority':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" {...common}>
          <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z" />
        </svg>
      )
    case 'optimize':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      )
    default:
      return null
  }
}
