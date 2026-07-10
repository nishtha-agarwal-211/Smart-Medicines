import React, { useState, useEffect, useCallback } from 'react';
import { X, Pill, AlertTriangle, Zap, Bell, Package, Clock } from 'lucide-react';
import { useMedications } from '../context/MedicationContext';

// Generate notifications from app state
function useNotifications(medications, missedDoses) {
    const [notifications, setNotifications] = useState([]);
    const [dismissed, setDismissed] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
        } catch { return []; }
    });

    useEffect(() => {
        const notifs = [];
        const now = new Date();

        // Missed dose notifications
        missedDoses.forEach(missed => {
            const id = `missed-${missed.medication.id}-${missed.scheduledTime}`;
            if (!dismissed.includes(id)) {
                notifs.push({
                    id,
                    type: 'missed',
                    icon: <Clock size={18} />,
                    title: `Missed: ${missed.medication.drugName}`,
                    message: `${missed.hoursLate}h late — ${missed.medication.dosage}`,
                    time: missed.scheduledTime,
                    color: 'notif-error',
                });
            }
        });

        // Low supply notifications
        medications.forEach(med => {
            const remaining = med.pillsRemaining ?? med.quantity ?? null;
            if (remaining !== null && remaining <= 7) {
                const id = `low-supply-${med.id}`;
                if (!dismissed.includes(id)) {
                    notifs.push({
                        id,
                        type: 'supply',
                        icon: <Package size={18} />,
                        title: `Low supply: ${med.drugName}`,
                        message: `Only ${remaining} pill${remaining !== 1 ? 's' : ''} remaining`,
                        time: now.toISOString(),
                        color: 'notif-warning',
                    });
                }
            }
        });

        // Upcoming dose notifications (within 30 min)
        medications.forEach(med => {
            if (!med.schedule) return;
            med.schedule.forEach(t => {
                const [h, m] = t.split(':').map(Number);
                const dose = new Date();
                dose.setHours(h, m, 0, 0);
                const diff = dose - now;
                if (diff > 0 && diff <= 30 * 60 * 1000) {
                    const id = `upcoming-${med.id}-${t}`;
                    if (!dismissed.includes(id)) {
                        notifs.push({
                            id,
                            type: 'upcoming',
                            icon: <Pill size={18} />,
                            title: `Coming up: ${med.drugName}`,
                            message: `Due in ${Math.round(diff / 60000)} minutes`,
                            time: dose.toISOString(),
                            color: 'notif-info',
                        });
                    }
                }
            });
        });

        setNotifications(notifs);
    }, [medications, missedDoses, dismissed]);

    const dismiss = useCallback((id) => {
        setDismissed(prev => {
            const next = [...prev, id];
            localStorage.setItem('dismissedNotifs', JSON.stringify(next));
            return next;
        });
    }, []);

    const clearAll = useCallback(() => {
        const allIds = notifications.map(n => n.id);
        setDismissed(prev => {
            const next = [...prev, ...allIds];
            localStorage.setItem('dismissedNotifs', JSON.stringify(next));
            return next;
        });
    }, [notifications]);

    return { notifications, dismiss, clearAll };
}

export default function NotificationPanel({ isOpen, onClose, medications, missedDoses }) {
    const { notifications, dismiss, clearAll } = useNotifications(medications, missedDoses);

    if (!isOpen) return null;

    return (
        <>
            <div className="notif-overlay" onClick={onClose} />
            <div className="notif-panel">
                <div className="notif-panel-header">
                    <div className="notif-panel-title">
                        <Bell size={18} />
                        <h3>Notifications</h3>
                        {notifications.length > 0 && (
                            <span className="notif-badge-inline">{notifications.length}</span>
                        )}
                    </div>
                    <div className="notif-panel-actions">
                        {notifications.length > 0 && (
                            <button className="notif-clear-btn" onClick={clearAll}>
                                Clear all
                            </button>
                        )}
                        <button className="notif-close-btn" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="notif-list">
                    {notifications.length === 0 ? (
                        <div className="notif-empty">
                            <Bell size={32} />
                            <p>You're all caught up!</p>
                            <span>No pending notifications</span>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif.id} className={`notif-item ${notif.color}`}>
                                <div className="notif-item-icon">
                                    {notif.icon}
                                </div>
                                <div className="notif-item-content">
                                    <strong>{notif.title}</strong>
                                    <span>{notif.message}</span>
                                </div>
                                <button
                                    className="notif-dismiss"
                                    onClick={() => dismiss(notif.id)}
                                    title="Dismiss"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
