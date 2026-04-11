import React, { useState, useEffect } from 'react';
import { useMedications } from '../context/MedicationContext';
import { Pill, Calendar, TrendingUp, AlertCircle, Plus, Zap, User, Moon, Sun } from 'lucide-react';
import { detectDrugInteractions } from '../utils/gemini';

export default function Dashboard({ onNavigate, patientName, onEditName, darkMode, onToggleDarkMode }) {
    const { medications, getTodaySchedule, getAdherenceRate, missedDoses, adherenceLogs } = useMedications();

    const todaySchedule = getTodaySchedule();
    const adherenceRate = getAdherenceRate(7);
    const pendingDoses = todaySchedule.filter(item => item.status === 'pending');
    const takenDoses = todaySchedule.filter(item =>
        item.status === 'taken' || item.status === 'taken_late'
    );

    // Bug 1: Drug interaction detection — run whenever medications list changes
    const [interactions, setInteractions] = useState([]);
    const [interactionsLoading, setInteractionsLoading] = useState(false);
    const [showAllInteractions, setShowAllInteractions] = useState(false);

    useEffect(() => {
        if (medications.length < 2) {
            setInteractions([]);
            return;
        }
        setInteractionsLoading(true);
        detectDrugInteractions(medications)
            .then(setInteractions)
            .catch(() => setInteractions([]))
            .finally(() => setInteractionsLoading(false));
    }, [medications]);

    const highSeverity = interactions.filter(i => i.severity === 'high');
    const otherInteractions = interactions.filter(i => i.severity !== 'high');

    const getSeverityClass = (severity) => {
        if (severity === 'high') return 'interaction-high';
        if (severity === 'moderate') return 'interaction-moderate';
        return 'interaction-low';
    };

    const visibleInteractions = showAllInteractions ? interactions : interactions.slice(0, 2);

    // 7-day adherence chart data
    const chartDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });

        // Count how many doses were logged as taken on that day
        const taken = adherenceLogs.filter(log =>
            log.scheduledTime?.startsWith(dateStr) &&
            (log.status === 'taken' || log.status === 'taken_late')
        ).length;

        // Count how many were scheduled on that day
        const scheduled = medications.reduce((sum, med) => sum + (med.schedule?.length || 0), 0);

        const pct = scheduled > 0 ? Math.min(100, Math.round((taken / scheduled) * 100)) : 0;
        return { label, pct, isToday: i === 6 };
    });

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>💊 Smart Medicine</h1>
                    <p className="subtitle">
                        {patientName
                            ? <>Hello, <strong>{patientName}</strong> 👋</>
                            : 'Your AI Health Companion'}
                    </p>
                </div>
                <div className="header-actions">
                    {onEditName && (
                        <button className="btn-icon-sm" onClick={onEditName} title="Edit name">
                            <User size={18} />
                        </button>
                    )}
                    <button className="btn-icon-sm" onClick={() => onNavigate('profile')} title="My Profile">
                        <User size={18} />
                    </button>
                    {onToggleDarkMode && (
                        <button className="btn-icon-sm" onClick={onToggleDarkMode} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    )}
                    <button className="chat-btn" onClick={() => onNavigate('chat')}>
                        💬 Ask AI
                    </button>
                </div>
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

            {/* Bug 1: Drug Interaction Alerts */}
            {interactionsLoading && medications.length >= 2 && (
                <div className="interaction-checking">
                    <Zap size={16} className="spinner-slow" />
                    <span>Checking for drug interactions…</span>
                </div>
            )}

            {!interactionsLoading && interactions.length > 0 && (
                <div className="interaction-banner">
                    <div className="interaction-banner-header">
                        <span className="interaction-banner-title">
                            ⚡ Drug Interaction{interactions.length > 1 ? 's' : ''} Detected
                            <span className="interaction-count">{interactions.length}</span>
                        </span>
                        <button
                            className="btn-link"
                            onClick={() => setShowAllInteractions(v => !v)}
                        >
                            {showAllInteractions ? 'Show less' : `Show all ${interactions.length}`}
                        </button>
                    </div>

                    <div className="interaction-list">
                        {visibleInteractions.map((interaction, idx) => (
                            <div key={idx} className={`interaction-item ${getSeverityClass(interaction.severity)}`}>
                                <div className="interaction-drugs">
                                    <strong>{interaction.drug1}</strong>
                                    <span className="interaction-plus">+</span>
                                    <strong>{interaction.drug2}</strong>
                                    <span className={`severity-pill severity-${interaction.severity}`}>
                                        {interaction.severity.toUpperCase()}
                                    </span>
                                </div>
                                <p className="interaction-desc">{interaction.description}</p>
                                {interaction.recommendation && (
                                    <p className="interaction-rec">
                                        💡 {interaction.recommendation}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {highSeverity.length > 0 && (
                        <button className="btn-interaction-chat" onClick={() => onNavigate('chat')}>
                            🤖 Discuss with AI Assistant
                        </button>
                    )}
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

            {/* 7-Day Adherence Chart */}
            {medications.length > 0 && (
                <section className="adherence-chart-section">
                    <div className="section-header">
                        <h2>📊 7-Day Adherence</h2>
                        <span className="adherence-rate-label">{adherenceRate}% overall</span>
                    </div>
                    <div className="adherence-bars">
                        {chartDays.map((day, i) => (
                            <div key={i} className={`adherence-bar-col ${day.isToday ? 'adherence-today' : ''}`}>
                                <div className="adherence-bar-wrap">
                                    <div
                                        className={`adherence-bar-fill ${
                                            day.pct >= 70 ? 'bar-good' :
                                            day.pct >= 40 ? 'bar-ok' : 'bar-poor'
                                        }`}
                                        style={{ height: `${Math.max(day.pct, 4)}%` }}
                                        title={`${day.pct}% adherence`}
                                    />
                                </div>
                                <span className="adherence-bar-pct">{day.pct > 0 ? `${day.pct}%` : '—'}</span>
                                <span className="adherence-bar-label">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

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
