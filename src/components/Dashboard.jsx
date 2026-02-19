import React from 'react';
import { useMedications } from '../context/MedicationContext';
import { Pill, Calendar, TrendingUp, AlertCircle, Plus } from 'lucide-react';

export default function Dashboard({ onNavigate }) {
    const { medications, getTodaySchedule, getAdherenceRate, missedDoses } = useMedications();

    const todaySchedule = getTodaySchedule();
    const adherenceRate = getAdherenceRate(7);
    const pendingDoses = todaySchedule.filter(item => item.status === 'pending');
    const takenDoses = todaySchedule.filter(item =>
        item.status === 'taken' || item.status === 'taken_late'
    );

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>💊 Smart Medicine</h1>
                    <p className="subtitle">Your AI Health Companion</p>
                </div>
                <button className="chat-btn" onClick={() => onNavigate('chat')}>
                    💬 Ask AI
                </button>
            </header>

            {/* Missed Dose Alert */}
            {missedDoses.length > 0 && (
                <div className="alert alert-warning" onClick={() => onNavigate('missed')}>
                    <AlertCircle size={24} />
                    <div>
                        <strong>You missed {missedDoses.length} dose(s)</strong>
                        <p>Tap for AI guidance on what to do</p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-primary">
                        <Pill size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>{medications.length}</h3>
                        <p>Active Medications</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-success">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>{adherenceRate}%</h3>
                        <p>7-Day Adherence</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-info">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-content">
                        <h3>{takenDoses.length}/{todaySchedule.length}</h3>
                        <p>Today's Progress</p>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <section className="schedule-section">
                <div className="section-header">
                    <h2>Today's Schedule</h2>
                    <span className="date">{new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    })}</span>
                </div>

                {todaySchedule.length === 0 ? (
                    <div className="empty-state">
                        <Pill size={48} />
                        <p>No medications scheduled for today</p>
                        <div className="empty-state-actions">
                            <button className="btn-primary" onClick={() => onNavigate('manual')}>
                                <Plus size={20} /> Add Manually
                            </button>
                            <button className="btn-secondary" onClick={() => onNavigate('scan')}>
                                📸 Scan Prescription
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="schedule-list">
                        {todaySchedule.map((item, index) => (
                            <ScheduleItem
                                key={index}
                                item={item}
                                onNavigate={onNavigate}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button className="action-btn action-primary" onClick={() => onNavigate('manual')}>
                    <span className="action-icon">📝</span>
                    <span className="action-label">Add Manually</span>
                </button>

                <button className="action-btn action-secondary" onClick={() => onNavigate('scan')}>
                    <span className="action-icon">📸</span>
                    <span className="action-label">Scan Prescription</span>
                </button>

                <button className="action-btn action-danger" onClick={() => onNavigate('emergency')}>
                    <span className="action-icon">🚨</span>
                    <span className="action-label">Emergency Profile</span>
                </button>

                <button className="action-btn action-info" onClick={() => onNavigate('medications')}>
                    <span className="action-icon">💊</span>
                    <span className="action-label">My Medications</span>
                </button>

                <button className="action-btn action-accent" onClick={() => onNavigate('chat')}>
                    <span className="action-icon">🤖</span>
                    <span className="action-label">AI Assistant</span>
                </button>
            </div>
        </div>
    );
}

function ScheduleItem({ item, onNavigate }) {
    const { logAdherence } = useMedications();
    const { medication, time, status } = item;

    const handleTaken = () => {
        const scheduledDateTime = new Date();
        const [hours, minutes] = time.split(':');
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        const now = new Date();
        const isLate = now - scheduledDateTime > 15 * 60 * 1000; // 15 minutes grace period

        logAdherence(
            medication.id,
            scheduledDateTime.toISOString(),
            isLate ? 'taken_late' : 'taken'
        );
    };

    const isPending = status === 'pending';
    const isTaken = status === 'taken' || status === 'taken_late';
    const isMissed = status === 'missed';

    return (
        <div className={`schedule-item ${status}`}>
            <div className="schedule-time">
                <span className="time-text">{time}</span>
                {item.medication.withFood && <span className="food-icon">🍽️</span>}
            </div>

            <div className="schedule-content">
                <h4>{medication.drugName}</h4>
                <p>{medication.dosage} • {medication.frequency}</p>
                {medication.warnings && medication.warnings.length > 0 && (
                    <p className="warning-text">⚠️ {medication.warnings[0]}</p>
                )}
            </div>

            <div className="schedule-action">
                {isPending && (
                    <button className="btn-take" onClick={handleTaken}>
                        ✓ Take Now
                    </button>
                )}
                {isTaken && (
                    <span className="status-badge status-success">✓ Taken</span>
                )}
                {isMissed && (
                    <span className="status-badge status-missed">Missed</span>
                )}
            </div>
        </div>
    );
}
