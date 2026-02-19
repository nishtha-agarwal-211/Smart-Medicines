import React, { createContext, useContext, useState, useEffect } from 'react';

const EmergencyProfileContext = createContext();

export function useEmergencyProfile() {
    const context = useContext(EmergencyProfileContext);
    if (!context) {
        throw new Error('useEmergencyProfile must be used within EmergencyProfileProvider');
    }
    return context;
}

function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function EmergencyProfileProvider({ children }) {
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [criticalMedications, setCriticalMedications] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const [medicalConditions, setMedicalConditions] = useState([]);
    const [emergencyInfo, setEmergencyInfo] = useState({
        bloodType: '',
        organDonor: false,
        emergencyNotes: ''
    });

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('emergencyProfile');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setEmergencyContacts(data.emergencyContacts || []);
                setCriticalMedications(data.criticalMedications || []);
                setAllergies(data.allergies || []);
                setMedicalConditions(data.medicalConditions || []);
                setEmergencyInfo(data.emergencyInfo || {
                    bloodType: '',
                    organDonor: false,
                    emergencyNotes: ''
                });
            } catch (error) {
                console.error('Error loading emergency profile:', error);
            }
        }
    }, []);

    // Save to localStorage whenever data changes
    useEffect(() => {
        const data = {
            emergencyContacts,
            criticalMedications,
            allergies,
            medicalConditions,
            emergencyInfo,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('emergencyProfile', JSON.stringify(data));
    }, [emergencyContacts, criticalMedications, allergies, medicalConditions, emergencyInfo]);

    // Emergency Contacts
    function addEmergencyContact(contact) {
        const newContact = {
            ...contact,
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        setEmergencyContacts(prev => [...prev, newContact]);
        return newContact;
    }

    function updateEmergencyContact(id, updates) {
        setEmergencyContacts(prev =>
            prev.map(contact =>
                contact.id === id ? { ...contact, ...updates } : contact
            )
        );
    }

    function removeEmergencyContact(id) {
        setEmergencyContacts(prev => prev.filter(contact => contact.id !== id));
    }

    function setPrimaryContact(id) {
        setEmergencyContacts(prev =>
            prev.map(contact => ({
                ...contact,
                isPrimary: contact.id === id
            }))
        );
    }

    // Critical Medications
    function markCriticalMedication(medicationId, isCritical) {
        if (isCritical) {
            if (!criticalMedications.includes(medicationId)) {
                setCriticalMedications(prev => [...prev, medicationId]);
            }
        } else {
            setCriticalMedications(prev => prev.filter(id => id !== medicationId));
        }
    }

    // Allergies
    function addAllergy(allergy) {
        const newAllergy = {
            ...allergy,
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        setAllergies(prev => [...prev, newAllergy]);
        return newAllergy;
    }

    function updateAllergy(id, updates) {
        setAllergies(prev =>
            prev.map(allergy =>
                allergy.id === id ? { ...allergy, ...updates } : allergy
            )
        );
    }

    function removeAllergy(id) {
        setAllergies(prev => prev.filter(allergy => allergy.id !== id));
    }

    // Medical Conditions
    function addMedicalCondition(condition) {
        const newCondition = {
            ...condition,
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        setMedicalConditions(prev => [...prev, newCondition]);
        return newCondition;
    }

    function updateMedicalCondition(id, updates) {
        setMedicalConditions(prev =>
            prev.map(condition =>
                condition.id === id ? { ...condition, ...updates } : condition
            )
        );
    }

    function removeMedicalCondition(id) {
        setMedicalConditions(prev => prev.filter(condition => condition.id !== id));
    }

    // Emergency Info
    function updateEmergencyInfo(updates) {
        setEmergencyInfo(prev => ({ ...prev, ...updates }));
    }

    // Check if profile is complete
    function isProfileComplete() {
        return (
            emergencyContacts.length > 0 &&
            (criticalMedications.length > 0 || allergies.length > 0 || medicalConditions.length > 0)
        );
    }

    const value = {
        // State
        emergencyContacts,
        criticalMedications,
        allergies,
        medicalConditions,
        emergencyInfo,

        // Emergency Contacts
        addEmergencyContact,
        updateEmergencyContact,
        removeEmergencyContact,
        setPrimaryContact,

        // Critical Medications
        markCriticalMedication,

        // Allergies
        addAllergy,
        updateAllergy,
        removeAllergy,

        // Medical Conditions
        addMedicalCondition,
        updateMedicalCondition,
        removeMedicalCondition,

        // Emergency Info
        updateEmergencyInfo,

        // Utilities
        isProfileComplete
    };

    return (
        <EmergencyProfileContext.Provider value={value}>
            {children}
        </EmergencyProfileContext.Provider>
    );
}
