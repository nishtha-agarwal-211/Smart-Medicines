/**
 * Browser Notification System for Medication Reminders
 */

// Request notification permission
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

/**
 * Send a medication reminder notification
 * @param {Object} medication - Medication details
 * @param {string} time - Scheduled time
 */
export function sendMedicationReminder(medication, time) {
    if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
    }

    const notification = new Notification('💊 Medication Reminder', {
        body: `Time to take ${medication.drugName} ${medication.dosage}${medication.withFood ? ' with food' : ''}`,
        icon: '/pill-icon.png',
        badge: '/badge-icon.png',
        tag: `medication-${medication.id}`,
        requireInteraction: true,
        data: {
            medicationId: medication.id,
            scheduledTime: time
        }
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
        // Navigate to medication confirmation page
        window.location.hash = `#/confirm/${medication.id}`;
    };

    return notification;
}

/**
 * Schedule all medication reminders
 * @param {Array} medications - All user medications
 * @param {Function} onReminder - Callback when reminder triggers
 */
export function scheduleMedicationReminders(medications, onReminder) {
    const scheduledReminders = [];

    medications.forEach(medication => {
        if (!medication.schedule || medication.schedule.length === 0) {
            return;
        }

        medication.schedule.forEach(time => {
            const interval = calculateNextReminderInterval(time);

            if (interval > 0) {
                const timeoutId = setTimeout(() => {
                    sendMedicationReminder(medication, time);
                    if (onReminder) {
                        onReminder(medication, time);
                    }
                }, interval);

                scheduledReminders.push({
                    medicationId: medication.id,
                    time,
                    timeoutId
                });
            }
        });
    });

    return scheduledReminders;
}

/**
 * Calculate milliseconds until next reminder time
 * @param {string} timeString - Time in HH:MM format
 * @returns {number} Milliseconds until that time
 */
function calculateNextReminderInterval(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    return scheduledTime.getTime() - now.getTime();
}

/**
 * Clear all scheduled reminders
 * @param {Array} scheduledReminders - Array of reminder objects with timeoutIds
 */
export function clearAllReminders(scheduledReminders) {
    scheduledReminders.forEach(reminder => {
        clearTimeout(reminder.timeoutId);
    });
}

/**
 * Check for missed doses
 * @param {Array} medications - All medications
 * @param {Array} adherenceLogs - History of taken medications
 * @returns {Array} List of missed doses
 */
export function checkMissedDoses(medications, adherenceLogs) {
    const missedDoses = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    medications.forEach(medication => {
        if (!medication.schedule) return;

        medication.schedule.forEach(time => {
            const scheduledDateTime = new Date(`${today}T${time}`);

            // Check if scheduled time has passed
            if (scheduledDateTime < now) {
                // Check if this dose was logged as taken
                const wasTaken = adherenceLogs.some(log =>
                    log.medicationId === medication.id &&
                    log.scheduledTime.includes(today) &&
                    log.scheduledTime.includes(time) &&
                    (log.status === 'taken' || log.status === 'taken_late')
                );

                if (!wasTaken) {
                    const hoursLate = (now - scheduledDateTime) / (1000 * 60 * 60);
                    missedDoses.push({
                        medication,
                        scheduledTime: scheduledDateTime.toISOString(),
                        hoursLate: Math.round(hoursLate * 10) / 10
                    });
                }
            }
        });
    });

    return missedDoses;
}

export default {
    requestNotificationPermission,
    sendMedicationReminder,
    scheduleMedicationReminders,
    clearAllReminders,
    checkMissedDoses
};
