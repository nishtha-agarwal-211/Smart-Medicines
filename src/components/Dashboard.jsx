import React, { useState, useEffect, useRef } from 'react';
import { useMedications } from '../context/MedicationContext';
import { Pill, TrendingUp, Calendar, AlertCircle, Plus, Zap, Clock, Activity, CheckCircle, ChevronRight, BarChart3, Flame } from 'lucide-react';
import { detectDrugInteractions } from '../utils/gemini';

// ── Animated counter hook ────────────────────────────────────────────────────
function useAnimatedCounter(target, duration = 800) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        if (target === 0) { setValue(0); return; }
        const start = 0;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(start + (target - start) * eased));
            if (progress < 1) ref.current = requestAnimationFrame(tick);
        }
        ref.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(ref.current);
    }, [target, duration]);

    return value;
}

// ── Radial Progress Ring ─────────────────────────────────────────────────────
function HealthScoreRing({ score, size = 120, strokeWidth = 10 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        const timer = setTimeout(() => {
            setOffset(circumference - (score / 100) * circumference);
        }, 150);
        return () => clearTimeout(timer);
    }, [score, circumference]);

    const getColor = (s) => {
        if (s >= 80) return { stroke: '#10B981', glow: 'rgba(16,185,129,0.25)', label: 'Excellent' };
        if (s >= 60) return { stroke: '#3B82F6', glow: 'rgba(59,130,246,0.25)', label: 'Good' };
        if (s >= 40) return { stroke: '#F59E0B', glow: 'rgba(245,158,11,0.25)', label: 'Fair' };
        return { stroke: '#EF4444', glow: 'rgba(239,68,68,0.25)', label: 'Needs Work' };
    };

    const { stroke, glow, label } = getColor(score);
    const animatedScore = useAnimatedCounter(score, 1000);

    return (
        <div className="health-ring-wrapper">
            <svg width={size} height={size} className="health-ring-svg">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--slate-200)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="health-ring-progress"
                    style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
                />
            </svg>
            <div className="health-ring-center">
                <span className="health-ring-value">{animatedScore}</span>
                <span className="health-ring-label">{label}</span>
            </div>
        </div>
    );
}

// ── Streak Component ─────────────────────────────────────────────────────────
function StreakCard({ adherenceLogs, medications }) {
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        if (medications.length === 0) { setStreak(0); return; }

        let currentStreak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const scheduledCount = medications.reduce((sum, med) => sum + (med.schedule?.length || 0), 0);
            if (scheduledCount === 0) break;

            const takenCount = adherenceLogs.filter(log =>
                log.scheduledTime?.startsWith(dateStr) &&
                (log.status === 'taken' || log.status === 'taken_late')
            ).length;

            if (takenCount >= scheduledCount) {
                currentStreak++;
            } else {
                // Don't count today if it's still in progress
                if (i === 0) continue;
                break;
            }
        }
        setStreak(currentStreak);
    }, [adherenceLogs, medications]);

    const animatedStreak = useAnimatedCounter(streak, 600);

    const getStreakLevel = (s) => {
        if (s >= 30) return { emoji: '🔥', class: 'streak-legendary', text: 'Legendary!' };
        if (s >= 14) return { emoji: '🔥', class: 'streak-fire', text: 'On Fire!' };
        if (s >= 7)  return { emoji: '⚡', class: 'streak-hot', text: 'Great Streak!' };
        if (s >= 3)  return { emoji: '✨', class: 'streak-warm', text: 'Building!' };
        return { emoji: '💪', class: 'streak-start', text: 'Keep going!' };
    };

    const { emoji, class: streakClass, text } = getStreakLevel(streak);

    if (medications.length === 0) return null;

    return (
        <div className={`streak-card ${streakClass}`}>
            <div className="streak-flame">
                <span className="streak-emoji">{emoji}</span>
            </div>
            <div className="streak-info">
                <span className="streak-count">{animatedStreak} day{streak !== 1 ? 's' : ''}</span>
                <span className="streak-text">{text}</span>
            </div>
            <Flame size={18} className="streak-icon" />
        </div>
    );
}


export default function Dashboard({ onNavigate, patientName, onEditName, darkMode, onToggleDarkMode }) {
    const { medications, getTodaySchedule, getAdherenceRate, missedDoses, adherenceLogs } = useMedications();

    const todaySchedule = getTodaySchedule();
    const adherenceRate = getAdherenceRate(7);
    const pendingDoses = todaySchedule.filter(item => item.status === 'pending');
    const takenDoses = todaySchedule.filter(item =>
        item.status === 'taken' || item.status === 'taken_late'
    );
    const missedCount = todaySchedule.filter(item => item.status === 'missed').length;

    // Health score calculation
    const healthScore = Math.round(
        (adherenceRate * 0.7) +
        (medications.length > 0 ? 20 : 0) +
        (missedDoses.length === 0 ? 10 : 0)
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

    // Animated counters
    const animatedMedCount = useAnimatedCounter(medications.length, 600);
    const animatedAdherence = useAnimatedCounter(adherenceRate, 800);
    const animatedTaken = useAnimatedCounter(takenDoses.length, 500);
    const animatedTotal = useAnimatedCounter(todaySchedule.length, 500);

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="dashboard">
            {/* Hero greeting — animated gradient */}
            <div className="dashboard-hero">
                <div className="dashboard-hero-bg" />
                <div className="dashboard-hero-text">
                    <h1 className="dashboard-greeting">
                        {getGreeting()}{patientName ? `, ${patientName}` : ''} 👋
                    </h1>
                    <p className="dashboard-subtitle">
                        {todaySchedule.length > 0
                            ? `You have ${pendingDoses.length} pending dose${pendingDoses.length !== 1 ? 's' : ''} today`
                            : 'No medications scheduled for today'}
                    </p>
                </div>
                <div className="dashboard-hero-right">
                    <div className="dashboard-hero-date">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </div>
                    <StreakCard adherenceLogs={adherenceLogs} medications={medications} />
                </div>
            </div>

            {/* Missed Dose Alert */}
            {missedDoses.length > 0 && (
                <button className="alert-card alert-card-warning" onClick={() => onNavigate('missed')}>
                    <div className="alert-card-icon alert-icon-warning">
                        <AlertCircle size={20} />
                    </div>
                    <div className="alert-card-content">
                        <strong>You missed {missedDoses.length} dose{missedDoses.length !== 1 ? 's' : ''}</strong>
                        <span>Tap for AI guidance on what to do</span>
                    </div>
                    <ChevronRight size={18} className="alert-card-arrow" />
                </button>
            )}

            {/* Drug Interaction Alerts */}
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
                            <Zap size={16} />
                            Drug Interaction{interactions.length > 1 ? 's' : ''} Detected
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
                                    <span className="interaction-plus">×</span>
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

            {/* Stats + Health Score Row */}
            <div className="stats-health-row">
                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card stat-card-blue">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrap stat-icon-blue">
                                <Pill size={20} />
                            </div>
                            <span className="stat-trend stat-trend-neutral">Active</span>
                        </div>
                        <div className="stat-value">{animatedMedCount}</div>
                        <div className="stat-label">Medications</div>
                    </div>

                    <div className="stat-card stat-card-green">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrap stat-icon-green">
                                <TrendingUp size={20} />
                            </div>
                            <span className={`stat-trend ${adherenceRate >= 70 ? 'stat-trend-up' : 'stat-trend-down'}`}>
                                {adherenceRate >= 70 ? '↑ Good' : '↓ Needs work'}
                            </span>
                        </div>
                        <div className="stat-value">{animatedAdherence}%</div>
                        <div className="stat-label">7-Day Adherence</div>
                    </div>

                    <div className="stat-card stat-card-purple">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrap stat-icon-purple">
                                <Calendar size={20} />
                            </div>
                            <span className="stat-trend stat-trend-neutral">Today</span>
                        </div>
                        <div className="stat-value">{animatedTaken}/{animatedTotal}</div>
                        <div className="stat-label">Doses Completed</div>
                    </div>
                </div>

                {/* Health Score Ring */}
                <div className="health-score-card">
                    <h3 className="health-score-title">Health Score</h3>
                    <HealthScoreRing score={healthScore} size={130} strokeWidth={12} />
                </div>
            </div>

            {/* 7-Day Adherence Chart */}
            {medications.length > 0 && (
                <section className="adherence-chart-section">
                    <div className="section-header">
                        <div className="section-header-left">
                            <BarChart3 size={20} className="section-header-icon" />
                            <h2>Weekly Adherence</h2>
                        </div>
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
                    <div className="section-header-left">
                        <Clock size={20} className="section-header-icon" />
                        <h2>Today's Schedule</h2>
                    </div>
                    <span className="date">{new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    })}</span>
                </div>

                {todaySchedule.length === 0 ? (
                    <div className="empty-state">
                        <Pill size={48} />
                        <h3>No medications scheduled</h3>
                        <p>Add your first medication to start tracking your health journey</p>
                        <div className="empty-state-actions">
                            <button className="btn-primary" onClick={() => onNavigate('manual')}>
                                <Plus size={18} /> Add Manually
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
                <button className="action-card" onClick={() => onNavigate('manual')}>
                    <div className="action-card-icon action-icon-blue">
                        <Plus size={22} />
                    </div>
                    <div className="action-card-content">
                        <span className="action-card-title">Add Manually</span>
                        <span className="action-card-desc">Enter medication details</span>
                    </div>
                    <ChevronRight size={18} className="action-card-arrow" />
                </button>

                <button className="action-card" onClick={() => onNavigate('scan')}>
                    <div className="action-card-icon action-icon-green">📸</div>
                    <div className="action-card-content">
                        <span className="action-card-title">Scan Prescription</span>
                        <span className="action-card-desc">AI-powered extraction</span>
                    </div>
                    <ChevronRight size={18} className="action-card-arrow" />
                </button>

                <button className="action-card" onClick={() => onNavigate('emergency')}>
                    <div className="action-card-icon action-icon-red">🚨</div>
                    <div className="action-card-content">
                        <span className="action-card-title">Emergency Profile</span>
                        <span className="action-card-desc">Contacts & allergies</span>
                    </div>
                    <ChevronRight size={18} className="action-card-arrow" />
                </button>

                <button className="action-card" onClick={() => onNavigate('chat')}>
                    <div className="action-card-icon action-icon-purple">🤖</div>
                    <div className="action-card-content">
                        <span className="action-card-title">AI Assistant</span>
                        <span className="action-card-desc">Get health guidance</span>
                    </div>
                    <ChevronRight size={18} className="action-card-arrow" />
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

    const formatTime = (timeStr) => {
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
    };

    return (
        <div className={`schedule-item schedule-item-${status}`}>
            <div className="schedule-timeline">
                <div className={`schedule-dot schedule-dot-${status}`}>
                    {isTaken && <CheckCircle size={14} />}
                </div>
            </div>

            <div className="schedule-time">
                <span className="time-text">{formatTime(time)}</span>
                {medication.withFood && <span className="food-badge">🍽️</span>}
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
                        <CheckCircle size={16} /> Take
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
