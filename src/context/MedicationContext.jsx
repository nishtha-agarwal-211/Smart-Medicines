import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { scheduleMedicationReminders, clearAllReminders, checkMissedDoses } from '../utils/notifications';
import { isMedicationScheduledForDate } from '../utils/schedule';
import StorageService from '../utils/StorageService';

const MedicationContext = createContext();

export function useMedications() {
    const context = useContext(MedicationContext);
    if (!context) {
        throw new Error('useMedications must be used within MedicationProvider');
    }
    return context;
}

export function MedicationProvider({ userId, children }) {
    const [medications, setMedications] = useState([]);
    const [adherenceLogs, setAdherenceLogs] = useState([]);
    const [scheduledReminders, setScheduledReminders] = useState([]);
    const [missedDoses, setMissedDoses] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Load data from Firestore (or localStorage fallback) on mount / userId change
    useEffect(() => {
        if (!userId) return;

        setDataLoaded(false);

        // Subscribe to medications collection for real-time sync
        const unsubMeds = StorageService.subscribeToCollection(userId, 'medications', (items) => {
            setMedications(items);
        });

        // Subscribe to adherence logs
        const unsubLogs = StorageService.subscribeToCollection(userId, 'adherenceLogs', (items) => {
            setAdherenceLogs(items);
            setDataLoaded(true);
        });

        return () => {
            unsubMeds();
            unsubLogs();
        };
    }, [userId]);

    // Schedule reminders whenever medications change
    useEffect(() => {
        // Clear existing reminders and schedule fresh ones
        clearAllReminders(scheduledReminders);
        const newReminders = scheduleMedicationReminders(medications, handleReminderTrigger);
        setScheduledReminders(newReminders);

        // Improvement #3: Re-evaluate reminders every hour so that
        // the next day's doses get scheduled even if the tab stays open.
        const hourlyReschedule = setInterval(() => {
            clearAllReminders(newReminders);
            const refreshed = scheduleMedicationReminders(medications, handleReminderTrigger);
            setScheduledReminders(refreshed);
        }, 60 * 60 * 1000); // every hour

        return () => {
            clearAllReminders(newReminders);
            clearInterval(hourlyReschedule);
        };
    }, [medications]);

    // Check for missed doses periodically
    useEffect(() => {
        const checkInterval = setInterval(() => {
            const missed = checkMissedDoses(medications, adherenceLogs);
            setMissedDoses(missed);
        }, 60000); // Check every minute

        // Initial check
        const missed = checkMissedDoses(medications, adherenceLogs);
        setMissedDoses(missed);

        return () => clearInterval(checkInterval);
    }, [medications, adherenceLogs]);

    function handleReminderTrigger(medication, time) {
        // This is called when a reminder notification is sent
        console.log(`Reminder triggered for ${medication.drugName} at ${time}`);
        // Dispatch a custom event so App.jsx can react (e.g. navigate) without hash routing
        window.dispatchEvent(new CustomEvent('medicationReminder', { detail: { medication, time } }));
    }

    function generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    async function addMedication(medication) {
        const newMedication = {
            ...medication,
            id: generateId(),
            createdAt: new Date().toISOString()
        };

        // Optimistic update
        setMedications(prev => [...prev, newMedication]);

        // Persist to Firestore
        if (userId) {
            const saved = await StorageService.addToCollection(userId, 'medications', newMedication);
            // If Firestore assigned a different id, update it
            if (saved.id !== newMedication.id) {
                setMedications(prev =>
                    prev.map(m => m.id === newMedication.id ? { ...m, id: saved.id } : m)
                );
                return { ...newMedication, id: saved.id };
            }
        }

        return newMedication;
    }

    async function updateMedication(id, updates) {
        // Optimistic update
        setMedications(prev =>
            prev.map(med => (med.id === id ? { ...med, ...updates } : med))
        );

        // Persist to Firestore
        if (userId) {
            await StorageService.updateInCollection(userId, 'medications', id, updates);
        }
    }

    async function deleteMedication(id) {
        // Optimistic update
        setMedications(prev => prev.filter(med => med.id !== id));
        setAdherenceLogs(prev => prev.filter(log => log.medicationId !== id));

        // Persist to Firestore
        if (userId) {
            await StorageService.deleteFromCollection(userId, 'medications', id);
            // Note: adherence log cleanup in Firestore would need a batch delete
            // For now, the real-time listener will handle the UI state
        }
    }

    async function logAdherence(medicationId, scheduledTime, status, actualTime = null) {
        // Prevent duplicate logs for the same medication and scheduled time
        const alreadyLogged = adherenceLogs.some(
            existing =>
                existing.medicationId === medicationId &&
                existing.scheduledTime === scheduledTime
        );
        if (alreadyLogged) return null;

        const log = {
            id: generateId(),
            medicationId,
            scheduledTime,
            actualTime: actualTime || new Date().toISOString(),
            status, // 'taken', 'taken_late', 'missed', 'skipped'
            timestamp: new Date().toISOString()
        };

        // Optimistic update
        setAdherenceLogs(prev => [...prev, log]);

        // Remove from missed doses if it was there
        setMissedDoses(prev =>
            prev.filter(missed =>
                !(missed.medication.id === medicationId &&
                    missed.scheduledTime === scheduledTime)
            )
        );

        // Persist to Firestore
        if (userId) {
            await StorageService.addToCollection(userId, 'adherenceLogs', log);
        }

        return log;
    }

    async function logRetroactiveDose(medicationId, scheduledTime, status, actualTime) {
        // Allow backdated logging — check for existing log
        const alreadyLogged = adherenceLogs.some(
            existing =>
                existing.medicationId === medicationId &&
                existing.scheduledTime === scheduledTime
        );

        if (alreadyLogged) {
            // Update existing log instead of adding duplicate
            setAdherenceLogs(prev =>
                prev.map(log =>
                    log.medicationId === medicationId && log.scheduledTime === scheduledTime
                        ? { ...log, status, actualTime: actualTime || log.actualTime }
                        : log
                )
            );

            // Find the log id to update in Firestore
            if (userId) {
                const existingLog = adherenceLogs.find(
                    l => l.medicationId === medicationId && l.scheduledTime === scheduledTime
                );
                if (existingLog?.id) {
                    await StorageService.updateInCollection(userId, 'adherenceLogs', existingLog.id, {
                        status,
                        actualTime: actualTime || existingLog.actualTime,
                    });
                }
            }
            return;
        }

        const log = {
            id: generateId(),
            medicationId,
            scheduledTime,
            actualTime: actualTime || new Date().toISOString(),
            status,
            timestamp: new Date().toISOString(),
            isRetroactive: true
        };

        // Optimistic update
        setAdherenceLogs(prev => [...prev, log]);

        // Persist to Firestore
        if (userId) {
            await StorageService.addToCollection(userId, 'adherenceLogs', log);
        }
    }

    function getMedicationById(id) {
        return medications.find(med => med.id === id);
    }

    function getTodaySchedule() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const schedule = [];

        medications.forEach(medication => {
            if (!medication.schedule) return;
            if (!isMedicationScheduledForDate(medication, now)) return;

            medication.schedule.forEach(time => {
                const scheduledDateTime = `${today}T${time}`;
                const log = adherenceLogs.find(
                    log =>
                        log.medicationId === medication.id &&
                        log.scheduledTime.includes(today) &&
                        log.scheduledTime.includes(time)
                );

                schedule.push({
                    medication,
                    time,
                    scheduledDateTime,
                    status: log ? log.status : 'pending',
                    log
                });
            });
        });

        // Sort by time
        return schedule.sort((a, b) => a.time.localeCompare(b.time));
    }

    function getAdherenceRate(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentLogs = adherenceLogs.filter(
            log => new Date(log.timestamp) >= cutoffDate
        );

        const takenCount = recentLogs.filter(
            log => log.status === 'taken' || log.status === 'taken_late'
        ).length;

        const totalScheduled = calculateTotalScheduled(days);

        return totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 0;
    }

    function calculateTotalScheduled(days) {
        // Calculate total doses that should have been taken in the period
        let total = 0;
        const today = new Date();
        medications.forEach(medication => {
            if (!medication.schedule) return;
            
            // Loop through each day in the window and check if the medication is scheduled
            for (let i = 0; i < days; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                if (isMedicationScheduledForDate(medication, d)) {
                    total += medication.schedule.length;
                }
            }
        });
        return total;
    }

    const value = {
        medications,
        adherenceLogs,
        missedDoses,
        dataLoaded,
        addMedication,
        updateMedication,
        deleteMedication,
        logAdherence,
        logRetroactiveDose,
        getMedicationById,
        getTodaySchedule,
        getAdherenceRate
    };

    return (
        <MedicationContext.Provider value={value}>
            {children}
        </MedicationContext.Provider>
    );
}
