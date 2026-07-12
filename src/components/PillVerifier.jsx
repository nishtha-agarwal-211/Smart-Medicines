import React, { useState, useRef } from 'react';
import { useMedications } from '../context/MedicationContext';
import { verifyPillImage } from '../utils/gemini';
import { Camera, Upload, RotateCcw, AlertTriangle, Check, X, Loader } from 'lucide-react';

export default function PillVerifier({ onNavigate }) {
    const { medications } = useMedications();
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleFileSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setImageFile(file);
        setResult(null);
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleAnalyze = async () => {
        if (!imageFile || medications.length === 0) return;
        setAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const res = await verifyPillImage(imageFile, medications);
            setResult(res);
        } catch (err) {
            setError(err.message || 'Failed to analyze pill. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleReset = () => {
        setImageFile(null);
        setImagePreview(null);
        setResult(null);
        setError(null);
    };

    const getResultType = () => {
        if (!result) return '';
        if (result.matchFound && result.confidence >= 70) return 'match';
        if (result.matchFound && result.confidence < 70) return 'partial';
        return 'no-match';
    };

    const getResultIcon = () => {
        const type = getResultType();
        if (type === 'match') return '✅';
        if (type === 'partial') return '⚠️';
        return '❌';
    };

    const getResultTitle = () => {
        const type = getResultType();
        if (type === 'match') return 'Match Found!';
        if (type === 'partial') return 'Possible Match';
        return 'No Match Found';
    };

    const getConfidenceClass = () => {
        if (!result) return '';
        if (result.confidence >= 70) return 'confidence-high';
        if (result.confidence >= 40) return 'confidence-medium';
        return 'confidence-low';
    };

    return (
        <div className="pill-verifier-container">
            {/* Header */}
            <div className="pill-verifier-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>← Back</button>
                <h2>📸 Pill Verifier</h2>
            </div>

            {/* Safety Disclaimer */}
            <div className="pill-safety-disclaimer">
                <span className="pill-safety-icon">⚠️</span>
                <div className="pill-safety-text">
                    <strong>Important Safety Notice</strong>
                    <p>
                        This tool provides AI-assisted visual matching only. <strong>Never take unidentified pills</strong> without
                        consulting a pharmacist or healthcare provider. Visual identification has limitations and should not
                        replace professional verification.
                    </p>
                </div>
            </div>

            {/* No Medications Warning */}
            {medications.length === 0 && (
                <div className="caregiver-empty">
                    <div className="caregiver-empty-icon">💊</div>
                    <h3>No Active Medications</h3>
                    <p>Add your medications first so the AI can compare pills against your prescriptions</p>
                    <button className="btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={() => onNavigate('manual')}>
                        Add Medication
                    </button>
                </div>
            )}

            {/* Capture Zone / Preview */}
            {medications.length > 0 && !imagePreview && !analyzing && !result && (
                <div
                    className={`pill-capture-zone ${dragOver ? 'pill-zone-dragover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="pill-capture-icon">📸</div>
                    <div className="pill-capture-title">Take a Photo of Your Pill</div>
                    <div className="pill-capture-subtitle">
                        AI will compare it against your {medications.length} active medication{medications.length !== 1 ? 's' : ''}
                    </div>
                    <div className="pill-capture-or">— or —</div>
                    <div className="pill-capture-buttons" onClick={e => e.stopPropagation()}>
                        <button
                            className="pill-capture-btn pill-capture-btn-primary"
                            onClick={() => cameraInputRef.current?.click()}
                        >
                            <Camera size={18} /> Take Photo
                        </button>
                        <button
                            className="pill-capture-btn pill-capture-btn-secondary"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={18} /> Upload Image
                        </button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleFileSelect(e.target.files?.[0])}
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={e => handleFileSelect(e.target.files?.[0])}
                    />
                </div>
            )}

            {/* Image Preview */}
            {imagePreview && !analyzing && !result && (
                <div className="pill-preview-card">
                    <div className="pill-preview-img-wrap">
                        <img src={imagePreview} alt="Pill to verify" className="pill-preview-img" />
                    </div>
                    <div className="pill-preview-actions">
                        <button className="btn-secondary" onClick={handleReset}>
                            <RotateCcw size={16} /> Retake
                        </button>
                        <button className="btn-primary" onClick={handleAnalyze}>
                            🔍 Analyze Pill
                        </button>
                    </div>
                </div>
            )}

            {/* Analyzing State */}
            {analyzing && (
                <div className="pill-preview-card">
                    <div className="pill-analyzing">
                        <div className="pill-analyzing-spinner" />
                        <div className="pill-analyzing-text">Analyzing your pill...</div>
                        <div className="pill-analyzing-sub">
                            Comparing against {medications.length} active medication{medications.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="pill-preview-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>😕</div>
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>Analysis Failed</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{error}</p>
                    <button className="btn-primary" onClick={handleReset}>
                        <RotateCcw size={16} /> Try Again
                    </button>
                </div>
            )}

            {/* Result Card */}
            {result && (
                <>
                    <div className="pill-result-card">
                        {/* Header */}
                        <div className={`pill-result-header result-${getResultType()}`}>
                            <div className="pill-result-icon">{getResultIcon()}</div>
                            <div className="pill-result-summary">
                                <h3>{getResultTitle()}</h3>
                                <p>
                                    {result.matchFound
                                        ? `Matches: ${result.matchedMedication}`
                                        : 'This pill does not match any of your active prescriptions'}
                                </p>
                            </div>
                        </div>

                        {/* Confidence Meter */}
                        <div className="pill-confidence-section">
                            <div className="pill-confidence-label">
                                <span>Confidence Level</span>
                                <span style={{ color: result.confidence >= 70 ? 'var(--success)' : result.confidence >= 40 ? 'var(--warning-dark)' : 'var(--error)' }}>
                                    {result.confidence}%
                                </span>
                            </div>
                            <div className="pill-confidence-bar">
                                <div
                                    className={`pill-confidence-fill ${getConfidenceClass()}`}
                                    style={{ width: `${result.confidence}%` }}
                                />
                            </div>
                        </div>

                        {/* Pill Description */}
                        {result.pillDescription && (
                            <div className="pill-result-details">
                                <h4>Pill Characteristics</h4>
                                <div className="pill-detail-row">
                                    <span className="pill-detail-label">Color</span>
                                    <span className="pill-detail-value">{result.pillDescription.color}</span>
                                </div>
                                <div className="pill-detail-row">
                                    <span className="pill-detail-label">Shape</span>
                                    <span className="pill-detail-value">{result.pillDescription.shape}</span>
                                </div>
                                <div className="pill-detail-row">
                                    <span className="pill-detail-label">Markings</span>
                                    <span className="pill-detail-value">{result.pillDescription.markings}</span>
                                </div>
                                <div className="pill-detail-row">
                                    <span className="pill-detail-label">Size</span>
                                    <span className="pill-detail-value">{result.pillDescription.size}</span>
                                </div>
                            </div>
                        )}

                        {/* Analysis */}
                        {result.analysis && (
                            <div className="pill-result-details" style={{ borderTop: '1px solid var(--border-default)' }}>
                                <h4>Analysis</h4>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                                    {result.analysis}
                                </p>
                            </div>
                        )}

                        {/* Recommendation */}
                        {result.recommendation && (
                            <div className="pill-result-details" style={{ borderTop: '1px solid var(--border-default)', background: 'var(--primary-light)' }}>
                                <h4>💡 Recommendation</h4>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-primary)', lineHeight: 'var(--leading-relaxed)', fontWeight: '500' }}>
                                    {result.recommendation}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pill-result-actions">
                            <button className="btn-secondary" onClick={handleReset}>
                                <RotateCcw size={16} /> Scan Another
                            </button>
                            <button className="btn-primary" onClick={() => onNavigate('chat')}>
                                🤖 Ask AI Assistant
                            </button>
                        </div>
                    </div>

                    {/* Repeat Safety Warning */}
                    <div className="pill-safety-disclaimer">
                        <span className="pill-safety-icon">🏥</span>
                        <div className="pill-safety-text">
                            <strong>Always Verify with a Professional</strong>
                            <p>
                                If you are unsure about any medication, contact your pharmacist or doctor immediately.
                                Do not rely solely on AI for pill identification.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
