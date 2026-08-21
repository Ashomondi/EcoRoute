import { Link } from 'react-router-dom'
import hero from '../assets/hero.png'

const FEATURES = [
  {
    title: 'Smarter collection routes',
    body: 'Our optimizer reorders truck stops to cut distance, fuel and time — one click, measurable savings.',
  },
  {
    title: 'Smart bins & monitoring',
    body: 'Live fill levels flag critical points before they overflow, so trucks go where they matter most.',
  },
  {
    title: 'Community reporting',
    body: 'Spot overflowing bins or missed collections? Report it in seconds and track it to resolution.',
  },
  {
    title: 'Environmental impact',
    body: 'Every optimized route shows the distance, fuel and CO2 your city saves — for real.',
  },
]

export default function LandingPage() {
  return (
    <div className="container">
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0 24px',
        }}
      >
        <div className="community-brand">
          <span className="logo-dot" />
          <strong>EcoRoute</strong>
        </div>
        <div className="landing-cta">
          <Link className="btn btn-outline" to="/login">
            Log in
          </Link>
          <Link className="btn btn-primary" to="/signup">
            Get started
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <h1>
            Overflowing bins. Missed pickups. Trucks burning fuel on bad routes.
          </h1>
          <p>
            EcoRoute puts your city&apos;s waste on one live map — fill levels are monitored before
            points overflow, truck routes optimize themselves in a click, and residents can report
            issues in seconds.
          </p>
          <div className="landing-cta">
            <Link className="btn btn-primary" to="/signup">
              Join your city
            </Link>
            <Link className="btn btn-outline" to="/login">
              Try a demo account
            </Link>
          </div>
        </div>
        <img src={hero} alt="EcoRoute hero" className="hero-img" />
      </section>

      <section className="grid cols-2" style={{ margin: '16px 0 40px' }}>
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <h3>{f.title}</h3>
            <p className="muted">{f.body}</p>
          </div>
        ))}
      </section>

      <footer style={{ padding: '20px 0 8px', borderTop: '1px solid var(--border)' }}>
        <p className="muted" style={{ fontSize: 13 }}>
          EcoRoute
        </p>
      </footer>
    </div>
  )
}
