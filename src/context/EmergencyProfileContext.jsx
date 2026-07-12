import React, { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '../utils/StorageService';

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

export function EmergencyProfileProvider({ userId, children }) {
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [criticalMedications, setCriticalMedications] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const [medicalConditions, setMedicalConditions] = useState([]);
    const [emergencyInfo, setEmergencyInfo] = useState({
        bloodType: '',
        organDonor: false,
        emergencyNotes: ''
    });
    const [emergencyLoaded, setEmergencyLoaded] = useState(false);

    // Subscribe to emergency profile document in Firestore
    useEffect(() => {
        if (!userId) return;

        const unsubscribe = StorageService.subscribeToDocument(userId, 'emergencyProfile/main', (data) => {
            if (data) {
                setEmergencyContacts(data.emergencyContacts || []);
                setCriticalMedications(data.criticalMedications || []);
                setAllergies(data.allergies || []);
                setMedicalConditions(data.medicalConditions || []);
                setEmergencyInfo(data.emergencyInfo || {
                    bloodType: '',
                    organDonor: false,
                    emergencyNotes: ''
                });
            } else {
                // Try migrating from localStorage
                try {
                    const stored = localStorage.getItem('emergencyProfile');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        setEmergencyContacts(parsed.emergencyContacts || []);
                        setCriticalMedications(parsed.criticalMedications || []);
                        setAllergies(parsed.allergies || []);
                        setMedicalConditions(parsed.medicalConditions || []);
                        setEmergencyInfo(parsed.emergencyInfo || {
                            bloodType: '',
                            organDonor: false,
                            emergencyNotes: ''
                        });
                        // Persist migration to Firestore
                        StorageService.setDocument(userId, 'emergencyProfile/main', parsed);
                    }
                } catch (error) {
                    console.error('Error migrating emergency profile:', error);
                }
            }
            setEmergencyLoaded(true);
        });

        return () => unsubscribe();
    }, [userId]);

    // Save to Firestore whenever data changes (debounced by React batching)
    function persistEmergencyProfile(overrides = {}) {
        if (!userId) return;
        const data = {
            emergencyContacts: overrides.emergencyContacts ?? emergencyContacts,
            criticalMedications: overrides.criticalMedications ?? criticalMedications,
            allergies: overrides.allergies ?? allergies,
            medicalConditions: overrides.medicalConditions ?? medicalConditions,
            emergencyInfo: overrides.emergencyInfo ?? emergencyInfo,
            lastUpdated: new Date().toISOString()
        };
        StorageService.setDocument(userId, 'emergencyProfile/main', data);
    }

    // Emergency Contacts
    function addEmergencyContact(contact) {
        const newContact = {
            ...contact,
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        setEmergencyContacts(prev => {
            const updated = [...prev, newContact];
            persistEmergencyProfile({ emergencyContacts: updated });
            return updated;
        });
        return newContact;
    }

    function updateEmergencyContact(id, updates) {
        setEmergencyContacts(prev => {
            const updated = prev.map(contact =>
                contact.id === id ? { ...contact, ...updates } : contact
            );
            persistEmergencyProfile({ emergencyContacts: updated });
            return updated;
        });
    }

    function removeEmergencyContact(id) {
        setEmergencyContacts(prev => {
            const updated = prev.filter(contact => contact.id !== id);
            persistEmergencyProfile({ emergencyContacts: updated });
            return updated;
        });
    }

    function setPrimaryContact(id) {
        setEmergencyContacts(prev => {
            const updated = prev.map(contact => ({
                ...contact,
                isPrimary: contact.id === id
            }));
            persistEmergencyProfile({ emergencyContacts: updated });
            return updated;
        });
    }

    // Critical Medications
    function markCriticalMedication(medicationId, isCritical) {
        setCriticalMedications(prev => {
            let updated;
            if (isCritical) {
                updated = prev.includes(medicationId) ? prev : [...prev, medicationId];
            } else {
                updated = prev.filter(id => id !== medicationId);
            }
            persistEmergencyProfile({ criticalMedications: updated });
            return updated;
        });
    }

    // Allergies
    function addAllergy(allergy) {
        const newAllergy = {
            ...allergy,
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        setAllergies(prev => {
            const updated = [...prev, newAllergy];
            persistEmergencyProfile({ allergies: updated });
            return updated;
        });
        return newAllergy;
    }

    function updateAllergy(id, updates) {
        setAllergies(prev => {
            const updated = prev.map(allergy =>
                allergy.id === id ? { ...allergy, ...updates } : allergy
            );
            persistEmergencyProfile({ allergies: updated });
            return updated;
        });
    }

    function removeAllergy(id) {
        setAllergies(prev => {
            const updated = prev.filter(allergy => allergy.id !== id);
            persistEmergencyProfile({ allergies: updated });
            return updated;
        });
    }

    // Medical Conditions
    function addMedicalCondition(condition) {
        const newCondition = {
            ...condition,
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        setMedicalConditions(prev => {
            const updated = [...prev, newCondition];
            persistEmergencyProfile({ medicalConditions: updated });
            return updated;
        });
        return newCondition;
    }

    function updateMedicalCondition(id, updates) {
        setMedicalConditions(prev => {
            const updated = prev.map(condition =>
                condition.id === id ? { ...condition, ...updates } : condition
            );
            persistEmergencyProfile({ medicalConditions: updated });
            return updated;
        });
    }

    function removeMedicalCondition(id) {
        setMedicalConditions(prev => {
            const updated = prev.filter(condition => condition.id !== id);
            persistEmergencyProfile({ medicalConditions: updated });
            return updated;
        });
    }

    // Emergency Info
    function updateEmergencyInfo(updates) {
        setEmergencyInfo(prev => {
            const updated = { ...prev, ...updates };
            persistEmergencyProfile({ emergencyInfo: updated });
            return updated;
        });
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
        emergencyLoaded,

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
