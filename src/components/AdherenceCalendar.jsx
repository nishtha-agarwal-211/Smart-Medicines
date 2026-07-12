import React, { useState, useMemo } from 'react';
import { useMedications } from '../context/MedicationContext';
import { ChevronLeft, ChevronRight, TrendingUp, Check, X } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdherenceCalendar({ onNavigate }) {
    const { medications, adherenceLogs, logRetroactiveDose } = useMedications();
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedDay, setSelectedDay] = useState(null);
    const [retroChanges, setRetroChanges] = useState({});

    // Current viewing month
    const viewDate = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + monthOffset);
        return d;
    }, [monthOffset]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPad = firstDay.getDay(); // 0=Sun
        const totalDays = lastDay.getDate();

        const days = [];
        // Add empty cells for padding
        for (let i = 0; i < startPad; i++) {
            days.push({ empty: true });
        }
        // Add actual days
        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(year, month, d);
            date.setHours(0, 0, 0, 0);
            const dateStr = date.toISOString().split('T')[0];
            const isFuture = date > today;
            const isToday = date.getTime() === today.getTime();

            // Calculate compliance for this day
            let scheduled = 0;
            let taken = 0;

            medications.forEach(med => {
                if (!med.schedule) return;
                // Only count meds that existed by this date
                const createdDate = new Date(med.createdAt);
                createdDate.setHours(0, 0, 0, 0);
                if (createdDate > date) return;

                med.schedule.forEach(time => {
                    scheduled++;
                    const log = adherenceLogs.find(
                        l => l.medicationId === med.id &&
                             l.scheduledTime?.startsWith(dateStr) &&
                             l.scheduledTime?.includes(time) &&
                             (l.status === 'taken' || l.status === 'taken_late')
                    );
                    if (log) taken++;
                });
            });

            let compliance = 'none';
            if (scheduled > 0) {
                const pct = (taken / scheduled) * 100;
                if (pct >= 100) compliance = 'perfect';
                else if (pct > 0) compliance = 'partial';
                else compliance = 'missed';
            }

            days.push({
                date,
                day: d,
                dateStr,
                isFuture,
                isToday,
                scheduled,
                taken,
                compliance,
            });
        }
        return days;
    }, [year, month, medications, adherenceLogs]);

    // Monthly stats
    const monthStats = useMemo(() => {
        const activeDays = calendarDays.filter(d => !d.empty && !d.isFuture && d.scheduled > 0);
        const perfectDays = activeDays.filter(d => d.compliance === 'perfect').length;
        const partialDays = activeDays.filter(d => d.compliance === 'partial').length;
        const missedDays = activeDays.filter(d => d.compliance === 'missed').length;
        const totalTaken = activeDays.reduce((s, d) => s + d.taken, 0);
        const totalScheduled = activeDays.reduce((s, d) => s + d.scheduled, 0);
        const overallRate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

        return { perfectDays, partialDays, missedDays, overallRate, activeDays: activeDays.length };
    }, [calendarDays]);

    // Trend graph data (last 30 days from end of current month)
    const trendData = useMemo(() => {
        const data = [];
        const lastDay = new Date(year, month + 1, 0);
        const startDay = new Date(lastDay);
        startDay.setDate(startDay.getDate() - 29);

        for (let i = 0; i < 30; i++) {
            const d = new Date(startDay);
            d.setDate(d.getDate() + i);
            d.setHours(0, 0, 0, 0);
            const dateStr = d.toISOString().split('T')[0];

            if (d > today) {
                data.push({ pct: 0, level: 'none', date: dateStr });
                continue;
            }

            let scheduled = 0, taken = 0;
            medications.forEach(med => {
                if (!med.schedule) return;
                const createdDate = new Date(med.createdAt);
                createdDate.setHours(0, 0, 0, 0);
                if (createdDate > d) return;
                med.schedule.forEach(time => {
                    scheduled++;
                    const log = adherenceLogs.find(
                        l => l.medicationId === med.id &&
                             l.scheduledTime?.startsWith(dateStr) &&
                             l.scheduledTime?.includes(time) &&
                             (l.status === 'taken' || l.status === 'taken_late')
                    );
                    if (log) taken++;
                });
            });

            const pct = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;
            const level = pct >= 80 ? 'good' : pct > 0 ? 'ok' : scheduled > 0 ? 'poor' : 'none';
            data.push({ pct, level, date: dateStr });
        }
        return data;
    }, [year, month, medications, adherenceLogs]);

    // Handle day click for retroactive logging
    const handleDayClick = (day) => {
        if (day.empty || day.isFuture || day.scheduled === 0) return;
        setSelectedDay(day);
        setRetroChanges({});
    };

    // Get doses for selected day
    const selectedDayDoses = useMemo(() => {
        if (!selectedDay) return [];
        const doses = [];
        medications.forEach(med => {
            if (!med.schedule) return;
            const createdDate = new Date(med.createdAt);
            createdDate.setHours(0, 0, 0, 0);
            if (createdDate > selectedDay.date) return;

            med.schedule.forEach(time => {
                const scheduledTime = `${selectedDay.dateStr}T${time}`;
                const log = adherenceLogs.find(
                    l => l.medicationId === med.id &&
                         l.scheduledTime?.startsWith(selectedDay.dateStr) &&
                         l.scheduledTime?.includes(time)
                );
                doses.push({
                    medication: med,
                    time,
                    scheduledTime,
                    currentStatus: log?.status || 'missed',
                });
            });
        });
        return doses.sort((a, b) => a.time.localeCompare(b.time));
    }, [selectedDay, medications, adherenceLogs]);

    const formatTime = (timeStr) => {
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
    };

    const handleRetroSave = () => {
        Object.entries(retroChanges).forEach(([key, status]) => {
            const [medId, scheduledTime] = key.split('|||');
            logRetroactiveDose(medId, scheduledTime, status, scheduledTime);
        });
        setSelectedDay(null);
        setRetroChanges({});
    };

    const getRateClass = (rate) => {
        if (rate >= 80) return 'stat-good';
        if (rate >= 50) return 'stat-ok';
        return 'stat-poor';
    };

    const canGoForward = monthOffset < 0;

    return (
        <div className="calendar-container">
            {/* Header */}
            <div className="calendar-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>← Back</button>
                <h2>📅 Adherence Calendar</h2>
            </div>

            {/* Month Stats */}
            <div className="calendar-stats">
                <div className="calendar-stat">
                    <div className={`calendar-stat-value ${getRateClass(monthStats.overallRate)}`}>
                        {monthStats.overallRate}%
                    </div>
                    <div className="calendar-stat-label">Monthly Rate</div>
                </div>
                <div className="calendar-stat">
                    <div className="calendar-stat-value stat-good">{monthStats.perfectDays}</div>
                    <div className="calendar-stat-label">Perfect Days</div>
                </div>
                <div className="calendar-stat">
                    <div className="calendar-stat-value stat-poor">{monthStats.missedDays}</div>
                    <div className="calendar-stat-label">Missed Days</div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-card">
                {/* Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                    <button className="calendar-nav-btn" onClick={() => setMonthOffset(prev => prev - 1)}>
                        <ChevronLeft size={18} />
                    </button>
                    <span className="calendar-month-label">{monthLabel}</span>
                    <button
                        className="calendar-nav-btn"
                        onClick={() => canGoForward && setMonthOffset(prev => prev + 1)}
                        style={{ opacity: canGoForward ? 1 : 0.3, cursor: canGoForward ? 'pointer' : 'default' }}
                        disabled={!canGoForward}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Weekday Headers */}
                <div className="calendar-weekday-row">
                    {WEEKDAYS.map(d => (
                        <div key={d} className="calendar-weekday">{d}</div>
                    ))}
                </div>

                {/* Day Grid */}
                <div className="calendar-grid">
                    {calendarDays.map((day, i) => {
                        if (day.empty) {
                            return <div key={`empty-${i}`} className="calendar-day calendar-day-empty" />;
                        }
                        return (
                            <div
                                key={day.dateStr}
                                className={`calendar-day calendar-day-${day.isFuture ? 'future' : day.compliance} ${day.isToday ? 'calendar-day-today' : ''}`}
                                onClick={() => handleDayClick(day)}
                                title={day.isFuture ? '' : `${day.taken}/${day.scheduled} doses taken`}
                            >
                                <span className="calendar-day-number">{day.day}</span>
                                {!day.isFuture && day.scheduled > 0 && (
                                    <span className="calendar-day-dot" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="calendar-legend">
                    <div className="calendar-legend-item">
                        <span className="calendar-legend-dot legend-perfect" />
                        All taken
                    </div>
                    <div className="calendar-legend-item">
                        <span className="calendar-legend-dot legend-partial" />
                        Partial
                    </div>
                    <div className="calendar-legend-item">
                        <span className="calendar-legend-dot legend-missed" />
                        Missed
                    </div>
                    <div className="calendar-legend-item">
                        <span className="calendar-legend-dot legend-none" />
                        No data
                    </div>
                </div>
            </div>

            {/* Monthly Trend */}
            {medications.length > 0 && (
                <div className="calendar-trend-section">
                    <h3 className="calendar-trend-title">
                        <TrendingUp size={18} /> 30-Day Trend
                    </h3>
                    <div className="trend-graph">
                        {trendData.map((bar, i) => (
                            <div
                                key={i}
                                className={`trend-bar trend-${bar.level}`}
                                style={{ height: `${Math.max(bar.pct, 4)}%` }}
                                title={`${bar.date}: ${bar.pct}%`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Retroactive Log Modal */}
            {selectedDay && (
                <div className="retro-modal-overlay" onClick={() => setSelectedDay(null)}>
                    <div className="retro-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="retro-modal-title">📝 Edit Doses</h3>
                        <p className="retro-modal-date">
                            {selectedDay.date.toLocaleDateString('en-US', {
                                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                            })}
                            {' '} — {selectedDay.taken}/{selectedDay.scheduled} taken
                        </p>

                        <div className="retro-dose-list">
                            {selectedDayDoses.map((dose, i) => {
                                const key = `${dose.medication.id}|||${dose.scheduledTime}`;
                                const displayStatus = retroChanges[key] || dose.currentStatus;
                                return (
                                    <div key={i} className="retro-dose-item">
                                        <div className="retro-dose-info">
                                            <span className="retro-dose-drug">{dose.medication.drugName}</span>
                                            <span className="retro-dose-time">
                                                {dose.medication.dosage} • {formatTime(dose.time)}
                                            </span>
                                        </div>
                                        <div className="retro-dose-status">
                                            <select
                                                value={displayStatus}
                                                onChange={e => setRetroChanges(prev => ({
                                                    ...prev,
                                                    [key]: e.target.value
                                                }))}
                                            >
                                                <option value="taken">✅ Taken</option>
                                                <option value="taken_late">⏰ Taken Late</option>
                                                <option value="missed">❌ Missed</option>
                                                <option value="skipped">⏭️ Skipped</option>
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="retro-modal-actions">
                            <button className="btn-secondary" onClick={() => setSelectedDay(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleRetroSave}
                                disabled={Object.keys(retroChanges).length === 0}
                            >
                                <Check size={16} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
