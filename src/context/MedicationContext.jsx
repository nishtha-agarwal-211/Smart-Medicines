import React, { createContext, useContext, useState, useEffect } from 'react';
import { scheduleMedicationReminders, clearAllReminders, checkMissedDoses } from '../utils/notifications';

const MedicationContext = createContext();

export function useMedications() {
    const context = useContext(MedicationContext);
    if (!context) {
        throw new Error('useMedications must be used within MedicationProvider');
    }
    return context;
}

export function MedicationProvider({ children }) {
    const [medications, setMedications] = useState([]);
    const [adherenceLogs, setAdherenceLogs] = useState([]);
    const [scheduledReminders, setScheduledReminders] = useState([]);
    const [missedDoses, setMissedDoses] = useState([]);

    // Load data from localStorage on mount
    useEffect(() => {
        const savedMedications = localStorage.getItem('medications');
        const savedLogs = localStorage.getItem('adherenceLogs');

        if (savedMedications) {
            setMedications(JSON.parse(savedMedications));
        }
        if (savedLogs) {
            setAdherenceLogs(JSON.parse(savedLogs));
        }
    }, []);

    // Save medications to localStorage whenever they change
    useEffect(() => {
        if (medications.length > 0) {
            localStorage.setItem('medications', JSON.stringify(medications));
        }
    }, [medications]);

    // Save adherence logs to localStorage
    useEffect(() => {
        if (adherenceLogs.length > 0) {
            localStorage.setItem('adherenceLogs', JSON.stringify(adherenceLogs));
        }
    }, [adherenceLogs]);

    // Schedule reminders whenever medications change
    useEffect(() => {
        // Clear existing reminders
        clearAllReminders(scheduledReminders);

        // Schedule new reminders
        const newReminders = scheduleMedicationReminders(medications, handleReminderTrigger);
        setScheduledReminders(newReminders);

        // Cleanup on unmount
        return () => clearAllReminders(newReminders);
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
    }

    function addMedication(medication) {
        const newMedication = {
            ...medication,
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        setMedications(prev => [...prev, newMedication]);
        return newMedication;
    }

    function updateMedication(id, updates) {
        setMedications(prev =>
            prev.map(med => (med.id === id ? { ...med, ...updates } : med))
        );
    }

    function deleteMedication(id) {
        setMedications(prev => prev.filter(med => med.id !== id));
        // Also remove related adherence logs
        setAdherenceLogs(prev => prev.filter(log => log.medicationId !== id));
    }

    function logAdherence(medicationId, scheduledTime, status, actualTime = null) {
        const log = {
            id: generateId(),
            medicationId,
            scheduledTime,
            actualTime: actualTime || new Date().toISOString(),
            status, // 'taken', 'taken_late', 'missed', 'skipped'
            timestamp: new Date().toISOString()
        };
        setAdherenceLogs(prev => [...prev, log]);

        // Remove from missed doses if it was there
        setMissedDoses(prev =>
            prev.filter(missed =>
                !(missed.medication.id === medicationId &&
                    missed.scheduledTime === scheduledTime)
            )
        );

        return log;
    }

    function getMedicationById(id) {
        return medications.find(med => med.id === id);
    }

    function getTodaySchedule() {
        const today = new Date().toISOString().split('T')[0];
        const schedule = [];

        medications.forEach(medication => {
            if (!medication.schedule) return;

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
        medications.forEach(medication => {
            if (medication.schedule) {
                total += medication.schedule.length * days;
            }
        });
        return total;
    }

    function generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    const value = {
        medications,
        adherenceLogs,
        missedDoses,
        addMedication,
        updateMedication,
        deleteMedication,
        logAdherence,
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
