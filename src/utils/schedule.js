/**
 * Helper to check if a medication is scheduled on a given date
 */
export function isMedicationScheduledForDate(medication, date) {
    if (!medication) return false;

    // Normalise frequency
    const freq = (medication.frequency || '').toLowerCase().trim();

    if (freq === 'as needed') {
        // As needed medications are not scheduled on a daily basis
        return false;
    }

    if (freq === 'every other day') {
        if (!medication.startDate) return true; // fallback
        const start = new Date(medication.startDate);
        start.setHours(0, 0, 0, 0);
        const current = new Date(date);
        current.setHours(0, 0, 0, 0);

        // Calculate direct difference in calendar days, taking timezones into account
        const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
        const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
        const diffDays = Math.round((utcCurrent - utcStart) / (1000 * 60 * 60 * 24));
        
        return diffDays >= 0 && diffDays % 2 === 0;
    }

    if (freq === 'once weekly' || freq === 'twice weekly') {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = dayNames[date.getDay()];

        // If specific days are selected
        if (medication.frequencyDays && medication.frequencyDays.length > 0) {
            return medication.frequencyDays.includes(currentDayName);
        }

        // Fallback: use the day of the week from the start date
        if (medication.startDate) {
            const startDayName = dayNames[new Date(medication.startDate).getDay()];
            return currentDayName === startDayName;
        }

        return false;
    }

    if (freq === 'once monthly') {
        const currentDayOfMonth = date.getDate();

        // If specific day of month is selected
        if (medication.frequencyMonthDay) {
            const targetDay = Number(medication.frequencyMonthDay);
            
            // Handle shorter months (e.g. if target is 31 but month has 30 days)
            const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            if (targetDay > daysInMonth) {
                return currentDayOfMonth === daysInMonth;
            }
            return currentDayOfMonth === targetDay;
        }

        // Fallback: use start date's day of month
        if (medication.startDate) {
            const targetDay = new Date(medication.startDate).getDate();
            const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            if (targetDay > daysInMonth) {
                return currentDayOfMonth === daysInMonth;
            }
            return currentDayOfMonth === targetDay;
        }

        return false;
    }

    // Default for daily frequencies ('once daily', 'twice daily', etc.) or unknown frequencies
    return true;
}

/**
 * Helper to get the next scheduled date-time for a specific medication time string
 */
export function getNextScheduledDateTime(medication, timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();

    let checkDate = new Date();
    checkDate.setHours(hours, minutes, 0, 0);

    // Search up to 366 days in the future
    for (let i = 0; i < 366; i++) {
        if (isMedicationScheduledForDate(medication, checkDate)) {
            if (checkDate > now) {
                return checkDate;
            }
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }
    return null;
}

/**
 * Format frequency text to show details like which day(s) of the week/month
 */
export function formatFrequencyText(medication) {
    if (!medication) return '';
    const freq = (medication.frequency || '').toLowerCase().trim();

    if (freq === 'once weekly') {
        if (medication.frequencyDays && medication.frequencyDays.length > 0) {
            return `once weekly (${medication.frequencyDays.join(', ')})`;
        }
        if (medication.startDate) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const startDayName = dayNames[new Date(medication.startDate).getDay()];
            return `once weekly (${startDayName})`;
        }
        return 'once weekly';
    }

    if (freq === 'twice weekly') {
        if (medication.frequencyDays && medication.frequencyDays.length > 0) {
            return `twice weekly (${medication.frequencyDays.join(', ')})`;
        }
        return 'twice weekly';
    }

    if (freq === 'once monthly') {
        if (medication.frequencyMonthDay) {
            return `once monthly (Day ${medication.frequencyMonthDay})`;
        }
        if (medication.startDate) {
            const startDay = new Date(medication.startDate).getDate();
            return `once monthly (Day ${startDay})`;
        }
        return 'once monthly';
    }

    return medication.frequency || '';
}
