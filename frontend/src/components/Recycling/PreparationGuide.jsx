export default function PreparationGuide({ wasteType }) {
  const steps = wasteType.preparation || []
  return (
    <div className="card">
      <div className="card-head">
        <h3>Preparation guide</h3>
      </div>
      <p className="sub">How to prep {wasteType.name.toLowerCase()} before it goes to a recycler.</p>
      {steps.length === 0 ? (
        <div className="empty">No preparation steps available.</div>
      ) : (
        <div>
          {steps.map((step, i) => (
            <div className="activity-item" key={i}>
              <span className="activity-icon activity-icon-green">{i + 1}</span>
              <span style={{ flex: 1 }}>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
