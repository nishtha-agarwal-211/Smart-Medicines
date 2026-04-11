import React, { useState } from 'react';
import { Camera, Upload, Loader, CheckCircle, X } from 'lucide-react';
import { analyzePrescription } from '../utils/gemini';
import { useMedications } from '../context/MedicationContext';

export default function PrescriptionScanner({ onNavigate }) {
    const { addMedication } = useMedications();
    const [step, setStep] = useState('select'); // 'select', 'processing', 'review', 'success'
    const [selectedImage, setSelectedImage] = useState(null);
    const [extractedMeds, setExtractedMeds] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(file);
            processImage(file);
        }
    };

    const processImage = async (file) => {
        setStep('processing');
        setLoading(true);
        setError(null);

        try {
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);

            // Analyze with Gemini
            const medications = await analyzePrescription(file);

            if (medications.length === 0) {
                setError('Could not extract medication information. Please try a clearer image.');
                setStep('select');
            } else {
                // Bug 3: Convert timing label strings ("morning", "evening") to HH:MM
                // so that the notification scheduler can work correctly
                const timingToHHMM = {
                    morning:   '08:00',
                    afternoon: '13:00',
                    noon:      '12:00',
                    evening:   '18:00',
                    night:     '21:00',
                    bedtime:   '22:00',
                };

                const medsWithPreview = medications.map(med => {
                    // Build a proper schedule (HH:MM array) from the timing field
                    const rawTiming = Array.isArray(med.timing) ? med.timing : [];
                    const schedule = rawTiming
                        .map(t => timingToHHMM[t.toLowerCase().trim()] || null)
                        .filter(Boolean);

                    return {
                        ...med,
                        prescriptionImage: previewUrl,
                        // Normalise timing to labels; schedule to HH:MM
                        timing: rawTiming,
                        schedule: schedule.length > 0 ? schedule : ['08:00'], // default morning
                    };
                });
                setExtractedMeds(medsWithPreview);
                setStep('review');
            }
        } catch (err) {
            setError(err.message || 'Failed to analyze prescription');
            setStep('select');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMedications = () => {
        extractedMeds.forEach(med => {
            addMedication({
                ...med,
                aiExtracted: true,
                startDate: new Date().toISOString().split('T')[0]
            });
        });
        setStep('success');
        setTimeout(() => {
            onNavigate('dashboard');
        }, 2000);
    };

    if (step === 'success') {
        return (
            <div className="scanner-container">
                <div className="success-screen">
                    <CheckCircle size={64} className="success-icon" />
                    <h2>Medications Added!</h2>
                    <p>{extractedMeds.length} medication(s) added to your profile</p>
                </div>
            </div>
        );
    }

    if (step === 'review') {
        return (
            <div className="scanner-container">
                <header className="scanner-header">
                    <button className="btn-back" onClick={() => setStep('select')}>
                        ← Back
                    </button>
                    <h2>Review Medications</h2>
                </header>

                <div className="review-content">
                    <p className="review-instruction">
                        AI found {extractedMeds.length} medication(s). Please review and confirm:
                    </p>

                    <div className="extracted-meds-list">
                        {extractedMeds.map((med, index) => (
                            <div key={index} className="extracted-med-card">
                                <div className="med-header">
                                    <span className="med-number">#{index + 1}</span>
                                    <h3>{med.drugName}</h3>
                                </div>
                                <div className="med-details">
                                    <div className="detail-row">
                                        <span className="label">Dosage:</span>
                                        <span className="value">{med.dosage}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Frequency:</span>
                                        <span className="value">{med.frequency}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Timing:</span>
                                        <span className="value">{med.timing?.join(', ') || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">With food:</span>
                                        <span className="value">{med.withFood ? 'Yes 🍽️' : 'No'}</span>
                                    </div>
                                    {med.warnings && med.warnings.length > 0 && (
                                        <div className="detail-row warnings">
                                            <span className="label">⚠️ Warnings:</span>
                                            <span className="value">{med.warnings.join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="review-actions">
                        <button className="btn-secondary" onClick={() => setStep('select')}>
                            Cancel
                        </button>
                        <button className="btn-primary" onClick={handleSaveMedications}>
                            ✓ Confirm & Add to My Medications
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="scanner-container">
            <header className="scanner-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>
                    ← Back
                </button>
                <h2>Scan Prescription</h2>
            </header>

            <div className="scanner-content">
                {loading ? (
                    <div className="loading-screen">
                        <Loader size={48} className="spinner" />
                        <h3>AI is reading your prescription...</h3>
                        <p>This may take a few seconds</p>
                        <div className="loading-tips">
                            <p>💡 Tip: Gemini is analyzing the image to extract medication details</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="scan-instruction">
                            <h3>Upload a prescription image</h3>
                            <p>AI will extract medication names, dosages, and instructions</p>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <X size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="upload-options">
                            <label className="upload-card">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageSelect}
                                    className="file-input"
                                />
                                <Camera size={48} />
                                <h4>Take Photo</h4>
                                <p>Use your camera to capture prescription</p>
                            </label>

                            <label className="upload-card">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="file-input"
                                />
                                <Upload size={48} />
                                <h4>Upload Image</h4>
                                <p>Select from your photo library</p>
                            </label>
                        </div>

                        <div className="scan-tips">
                            <h4>📋 Tips for best results:</h4>
                            <ul>
                                <li>✓ Ensure good lighting</li>
                                <li>✓ Keep the prescription flat and visible</li>
                                <li>✓ Avoid shadows and glare</li>
                                <li>✓ Make sure text is readable</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
