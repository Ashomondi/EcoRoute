import { useEffect, useRef, useState } from 'react'
import api from '../../services/apiClient'

export default function ScanWaste({ onCapture }) {
  const [stream, setStream] = useState(null)
  const [cameraError, setCameraError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    let active = true
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera unavailable in this browser — you can still upload a photo.')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = s
        setStream(s)
      })
      .catch(() => {
        if (active) setCameraError('Camera permission denied — you can still upload a photo.')
      })
    return () => {
      active = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const upload = async (blob) => {
    const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' })
    setUploading(true)
    setError('')
    try {
      const result = await api.upload(file)
      onCapture(result.url)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => blob && upload(blob), 'image/jpeg', 0.85)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    api
      .upload(file)
      .then((result) => onCapture(result.url))
      .catch((err) => setError(err.message || 'Upload failed'))
      .finally(() => setUploading(false))
  }

  return (
    <div>
      {stream && !uploading && (
        <div className="map-container" style={{ height: 280, marginBottom: 12 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {(cameraError || error) && <div className="error">{error || cameraError}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {stream && (
          <button type="button" className="btn btn-primary" onClick={capturePhoto} disabled={uploading}>
            {uploading ? 'Uploading…' : '📷 Capture'}
          </button>
        )}
        <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          Upload photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </div>
  )
}
