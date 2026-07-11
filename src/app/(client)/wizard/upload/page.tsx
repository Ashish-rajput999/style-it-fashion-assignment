'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter, useSearchParams } from 'next/navigation'

const ACCEPTED_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/mp4': ['.m4a'],
  'audio/ogg': ['.ogg'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

const MAX_SIZE_MB = 500
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function WizardUploadPage() {
  const router = useRouter()
  const params = useSearchParams()
  const draftId = params.get('draftId') ?? ''

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setFileError('')
    if (rejected.length > 0) {
      const err = rejected[0].errors[0]
      if (err.code === 'file-too-large') {
        setFileError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`)
      } else if (err.code === 'file-invalid-type') {
        setFileError('File type not supported. Please upload audio, video, PDF, or Word documents.')
      } else {
        setFileError(err.message)
      }
      return
    }
    if (accepted.length > 0) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
  })

  async function handleUpload() {
    if (!file || !draftId) return
    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('draftId', draftId)

    // Simulate progress with XHR for real progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(xhr.responseText))
      })
      xhr.addEventListener('error', () => reject(new Error('Network error')))
      xhr.open('POST', '/api/wizard/upload')
      xhr.send(formData)
    })

    setUploaded(true)
    setUploading(false)
    setUploadProgress(100)

    // Navigate to processing after brief moment
    setTimeout(() => {
      router.push(`/wizard/processing?draftId=${draftId}`)
    }, 800)
  }

  if (!draftId) {
    return (
      <div className="wizard-error-state">
        <p>No wizard session found. <a href="/wizard/region" className="auth-link">Start over →</a></p>
      </div>
    )
  }

  return (
    <div className="wizard-upload-layout">
      <div className="wizard-upload-card">
        <h2 className="wizard-upload-title">Upload Your Meeting Recording</h2>
        <p className="wizard-upload-sub">
          Supported formats: MP3, WAV, M4A, OGG, MP4, MOV, WebM, PDF, DOCX — up to 500 MB
        </p>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={[
            'wizard-dropzone',
            isDragActive ? 'wizard-dropzone--active' : '',
            file ? 'wizard-dropzone--filled' : '',
            fileError ? 'wizard-dropzone--error' : '',
          ].join(' ')}
          id="upload-dropzone"
        >
          <input {...getInputProps()} id="upload-file-input" />

          {file ? (
            <div className="wizard-file-info">
              <div className="wizard-file-icon">
                {file.type.startsWith('audio') ? '🎙️'
                  : file.type.startsWith('video') ? '🎬'
                  : '📄'}
              </div>
              <div className="wizard-file-details">
                <p className="wizard-file-name">{file.name}</p>
                <p className="wizard-file-size">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="wizard-file-remove"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="wizard-dropzone-prompt">
              <div className="wizard-dropzone-icon">☁️</div>
              <p className="wizard-dropzone-main">
                {isDragActive ? 'Drop the file here…' : 'Click or drag and drop your meeting file.'}
              </p>
              <p className="wizard-dropzone-hint">Audio, video, or document — up to 500 MB</p>
            </div>
          )}
        </div>

        {fileError && (
          <div className="auth-error" role="alert">
            <span className="auth-error-icon">⚠</span>
            {fileError}
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="wizard-progress-wrap">
            <div className="wizard-progress-bar">
              <div
                className="wizard-progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="wizard-progress-pct">{uploadProgress}% uploaded</p>
          </div>
        )}

        {uploaded && (
          <div className="wizard-upload-success">
            ✓ File uploaded successfully! Preparing analysis…
          </div>
        )}

        {/* Actions */}
        <div className="wizard-details-actions" style={{ marginTop: 32 }}>
          <button
            type="button"
            onClick={() => router.back()}
            className="wizard-back-btn"
          >
            ← Back
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading || uploaded}
            className="auth-submit-btn"
            id="upload-start"
            style={{ maxWidth: 220 }}
          >
            {uploading ? `Uploading ${uploadProgress}%…`
              : uploaded ? 'Processing…'
              : 'Upload & Analyse →'}
          </button>
        </div>
      </div>
    </div>
  )
}
