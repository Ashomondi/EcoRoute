import { useEffect, useState } from 'react'
import ScanWaste from '../../components/Recycling/ScanWaste'
import WasteTypePicker from '../../components/Recycling/WasteTypePicker'
import ClassificationResult from '../../components/Recycling/ClassificationResult'
import RecyclingGuide from '../../components/Recycling/RecyclingGuide'
import PreparationGuide from '../../components/Recycling/PreparationGuide'
import NearbyRecyclerMap from '../../components/Recycling/NearbyRecyclerMap'
import RecyclerCard from '../../components/Recycling/RecyclerCard'
import ImpactSaved from '../../components/Recycling/ImpactSaved'
import RecyclingHistory from '../../components/Recycling/RecyclingHistory'
import { useMyRecycling, useRecycle, useRecyclers, useWasteTypes } from '../../hooks/useRecycling'
import { validNumber } from '../../utils/validators'

const STEPS = ['Scan', 'Type', 'Classify', 'Guide', 'Prepare', 'Recycler', 'Record']

export default function RecycleWaste() {
  const [step, setStep] = useState('scan')
  const [photoUrl, setPhotoUrl] = useState(null)
  const [typeSlug, setTypeSlug] = useState(null)
  const [recycler, setRecycler] = useState(null)
  const [weight, setWeight] = useState('1')
  const [geo, setGeo] = useState(null)
  const [geoError, setGeoError] = useState('')

  const { wasteTypes, loading: typesLoading } = useWasteTypes()
  const { recyclers, loading: recyclersLoading } = useRecyclers({ lat: geo?.lat, lng: geo?.lng, type: typeSlug })
  const { impact, reload: reloadImpact } = useMyRecycling()
  const { submit, submitting, error: submitError } = useRecycle()
  const [done, setDone] = useState(false)

  const wasteType = wasteTypes.find((t) => t.slug === typeSlug)

  useEffect(() => {
    if (step === 'recycler' && !geo && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGeoError('Location unavailable — showing all recyclers.'),
        { timeout: 5000 },
      )
    }
  }, [step, geo])

  const go = (next) => {
    setStep(next)
    setDone(false)
  }

  const handleSubmit = async () => {
    const err = validNumber(weight, { min: 0.1, max: 1000, label: 'Weight' })
    if (err) return
    const result = await submit({
      waste_type: typeSlug,
      estimated_kg: Number(weight),
      recycler_id: recycler?.id || null,
      photo_url: photoUrl || null,
    })
    if (result) {
      await reloadImpact()
      setDone(true)
    }
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <div>
      <div className="page-header">
        <h1>Recycle waste</h1>
      </div>

      {done ? (
        <>
          <ImpactSaved impact={impact} />
          <div style={{ marginTop: 20 }}>
            <RecyclingHistory onRecycleAgain={() => go('scan')} />
          </div>
        </>
      ) : (
        <div className="grid cols-2">
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STEPS.map((label, i) => (
                <span
                  key={label}
                  className={`badge ${i === stepIndex ? 'badge-critical' : i < stepIndex ? 'badge-ok' : 'badge-active'}`}
                >
                  {i < stepIndex ? '✓' : ''} {label}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>
                {step === 'scan' && 'Scan your waste'}
                {step === 'type' && 'Select waste type'}
                {step === 'classify' && 'Classification'}
                {step === 'guide' && 'Recycling guide'}
                {step === 'prepare' && 'Preparation'}
                {step === 'recycler' && 'Nearby recyclers'}
                {step === 'record' && 'Record your drop-off'}
              </h3>
            </div>
            <p className="sub">
              {step === 'scan' && 'Capture the item with your camera or upload a photo.'}
              {step === 'type' && 'Pick the closest match for what you are recycling.'}
              {step === 'guide' && 'Learn what happens to it after it leaves your hands.'}
              {step === 'prepare' && 'A quick checklist before you drop it off.'}
              {step === 'record' && 'Enter the weight to log your impact.'}
            </p>

            {step === 'scan' && <ScanWaste onCapture={(url) => { setPhotoUrl(url); go('type') }} />}

            {step === 'type' && (
              typesLoading ? (
                <div className="spinner" />
              ) : (
                <WasteTypePicker wasteTypes={wasteTypes} selected={typeSlug} onSelect={(slug) => { setTypeSlug(slug); go('classify') }} />
              )
            )}

            {step === 'classify' && wasteType && <ClassificationResult wasteType={wasteType} photoUrl={photoUrl} />}

            {step === 'guide' && wasteType && <RecyclingGuide wasteType={wasteType} />}

            {step === 'prepare' && wasteType && <PreparationGuide wasteType={wasteType} />}

            {step === 'recycler' && (
              <>
                {geoError && <div className="error" style={{ marginBottom: 10 }}>{geoError}</div>}
                {recyclersLoading ? (
                  <div className="spinner" />
                ) : recyclers.length === 0 ? (
                  <div className="empty">No recyclers found nearby.</div>
                ) : (
                  <>
                    <NearbyRecyclerMap recyclers={recyclers} selectedId={recycler?.id} onSelect={setRecycler} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {recyclers.map((rc) => (
                        <RecyclerCard key={rc.id} recycler={rc} selected={recycler?.id === rc.id} onSelect={setRecycler} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {step === 'record' && (
              <>
                <div className="field">
                  <label htmlFor="weight">Estimated weight (kg)</label>
                  <input
                    id="weight"
                    className="input"
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                {recycler && (
                  <div className="field">
                    <label>Drop-off point</label>
                    <div className="card" style={{ padding: 12 }}>
                      <strong>{recycler.name}</strong>
                      <div className="muted" style={{ fontSize: 13 }}>{recycler.address}</div>
                    </div>
                  </div>
                )}
                {wasteType && (
                  <div className="stat-sub muted" style={{ marginBottom: 12 }}>
                    Estimated impact: <strong>~{(wasteType.co2_per_kg * Number(weight || 0)).toFixed(2)} kg CO₂</strong> saved
                  </div>
                )}
                {submitError && <div className="error">{submitError}</div>}
                <button type="button" className="btn btn-primary btn-block" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Recording…' : '♻ Record & recycle'}
                </button>
              </>
            )}
          </div>

          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="card-head">
              <h3>Preview</h3>
            </div>
            {photoUrl && <img src={photoUrl} className="photo-preview" alt="Scan" style={{ maxWidth: '100%', maxHeight: 180, marginBottom: 10 }} />}
            {wasteType ? (
              <>
                <div className="stat-sub muted">Type</div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{wasteType.name}</div>
              </>
            ) : (
              <p className="muted">Scan an item to begin.</p>
            )}
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <button type="button" className="btn btn-outline" onClick={() => go('scan')} disabled={step === 'scan'}>
              ← Start over
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {step === 'classify' && (
                <button type="button" className="btn btn-primary" onClick={() => go('guide')}>
                  View guide →
                </button>
              )}
              {step === 'guide' && (
                <button type="button" className="btn btn-primary" onClick={() => go('prepare')}>
                  Preparation →
                </button>
              )}
              {step === 'prepare' && (
                <button type="button" className="btn btn-primary" onClick={() => go('recycler')}>
                  Find recycler →
                </button>
              )}
              {step === 'recycler' && (
                <button type="button" className="btn btn-primary" onClick={() => go('record')}>
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
