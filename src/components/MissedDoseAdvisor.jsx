import React, { useState } from 'react';
import { AlertCircle, Clock, Pill, Loader } from 'lucide-react';
import { useMedications } from '../context/MedicationContext';
import { analyzeMissedDose } from '../utils/gemini';

export default function MissedDoseAdvisor({ onNavigate }) {
    const { missedDoses, logAdherence } = useMedications();
    const [selectedMissed, setSelectedMissed] = useState(null);
    const [aiAdvice, setAiAdvice] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGetAdvice = async (missedDose) => {
        setSelectedMissed(missedDose);
        setLoading(true);

        try {
            // Calculate next dose time (assuming same time tomorrow for daily meds)
            const nextDoseTime = new Date(missedDose.scheduledTime);
            nextDoseTime.setDate(nextDoseTime.getDate() + 1);
            const nextDoseString = nextDoseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const advice = await analyzeMissedDose(
                missedDose.medication,
                missedDose.hoursLate,
                nextDoseString
            );

            setAiAdvice(advice);
        } catch (error) {
            setAiAdvice({
                action: 'call_doctor',
                reasoning: 'Unable to provide specific guidance',
                safetyNotes: 'Please consult your healthcare provider',
                advice: 'Contact your doctor or pharmacist for guidance on this missed dose.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTakeAction = (action, medication, scheduledTime) => {
        if (action === 'take_now') {
            logAdherence(medication.id, scheduledTime, 'taken_late');
            setSelectedMissed(null);
            setAiAdvice(null);
        } else if (action === 'skip_and_continue') {
            logAdherence(medication.id, scheduledTime, 'skipped');
            setSelectedMissed(null);
            setAiAdvice(null);
        }
    };

    const getActionDetails = (action) => {
        switch (action) {
            case 'take_now':
                return { label: 'Take Now', color: 'success', icon: '✓' };
            case 'skip_and_continue':
                return { label: 'Skip This Dose', color: 'warning', icon: '→' };
            case 'take_half':
                return { label: 'Take Half Dose', color: 'info', icon: '½' };
            case 'call_doctor':
                return { label: 'Call Doctor', color: 'danger', icon: '📞' };
            default:
                return { label: action, color: 'secondary', icon: '?' };
        }
    };

    if (missedDoses.length === 0) {
        return (
            <div className="missed-dose-container">
                <header className="missed-header">
                    <button className="btn-back" onClick={() => onNavigate('dashboard')}>
                        ← Back
                    </button>
                    <h2>Missed Doses</h2>
                </header>

                <div className="empty-state">
                    <div className="success-icon">✓</div>
                    <h3>Great job!</h3>
                    <p>You haven't missed any doses today</p>
                    <button className="btn-primary" onClick={() => onNavigate('dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (selectedMissed && aiAdvice) {
        const actionDetails = getActionDetails(aiAdvice.action);

        return (
            <div className="missed-dose-container">
                <header className="missed-header">
                    <button className="btn-back" onClick={() => {
                        setSelectedMissed(null);
                        setAiAdvice(null);
                    }}>
                        ← Back
                    </button>
                    <h2>AI Guidance</h2>
                </header>

                <div className="advice-content">
                    <div className="medication-info-card">
                        <Pill size={32} />
                        <div>
                            <h3>{selectedMissed.medication.drugName}</h3>
                            <p>{selectedMissed.medication.dosage} • {selectedMissed.medication.frequency}</p>
                        </div>
                    </div>

                    <div className="time-info">
                        <Clock size={20} />
                        <span>Missed by {selectedMissed.hoursLate} hours</span>
                    </div>

                    <div className={`ai-recommendation recommendation-${actionDetails.color}`}>
                        <div className="recommendation-header">
                            <span className="recommendation-icon">{actionDetails.icon}</span>
                            <h3>Recommendation: {actionDetails.label}</h3>
                        </div>
                    </div>

                    <div className="advice-section">
                        <h4>🧠 AI Reasoning</h4>
                        <p>{aiAdvice.reasoning}</p>
                    </div>

                    <div className="advice-section">
                        <h4>⚠️ Safety Notes</h4>
                        <p>{aiAdvice.safetyNotes}</p>
                    </div>

                    <div className="advice-section advice-highlight">
                        <h4>📋 What to Do</h4>
                        <p>{aiAdvice.advice}</p>
                    </div>

                    <div className="action-buttons">
                        {aiAdvice.action === 'take_now' && (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() => handleTakeAction('take_now', selectedMissed.medication, selectedMissed.scheduledTime)}
                                >
                                    ✓ I Took It Now
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => handleTakeAction('skip_and_continue', selectedMissed.medication, selectedMissed.scheduledTime)}
                                >
                                    Skip This Dose
                                </button>
                            </>
                        )}

                        {aiAdvice.action === 'skip_and_continue' && (
                            <button
                                className="btn-primary"
                                onClick={() => handleTakeAction('skip_and_continue', selectedMissed.medication, selectedMissed.scheduledTime)}
                            >
                                ✓ Got It, I'll Skip
                            </button>
                        )}

                        {aiAdvice.action === 'call_doctor' && (
                            <button className="btn-danger">
                                📞 Call Doctor
                            </button>
                        )}
                    </div>

                    <p className="disclaimer">
                        💡 This is AI-generated guidance. When in doubt, always consult your healthcare provider.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="missed-dose-container">
            <header className="missed-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>
                    ← Back
                </button>
                <h2>Missed Doses</h2>
            </header>

            <div className="missed-alert">
                <AlertCircle size={32} />
                <div>
                    <h3>You have {missedDoses.length} missed dose(s)</h3>
                    <p>Let AI help you decide what to do</p>
                </div>
            </div>

            <div className="missed-list">
                {missedDoses.map((missed, index) => (
                    <div key={index} className="missed-card">
                        <div className="missed-card-header">
                            <div>
                                <h4>{missed.medication.drugName}</h4>
                                <p>{missed.medication.dosage}</p>
                            </div>
                            <span className="missed-badge">
                                {missed.hoursLate}h late
                            </span>
                        </div>

                        <div className="missed-card-details">
                            <div className="detail-item">
                                <Clock size={16} />
                                <span>
                                    Scheduled: {new Date(missed.scheduledTime).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className="detail-item">
                                <Pill size={16} />
                                <span>{missed.medication.frequency}</span>
                            </div>
                        </div>

                        <button
                            className="btn-ai-advice"
                            onClick={() => handleGetAdvice(missed)}
                            disabled={loading}
                        >
                            {loading && selectedMissed === missed ? (
                                <>
                                    <Loader size={16} className="spinner" />
                                    <span>AI is analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <span>🤖 Get AI Guidance</span>
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
