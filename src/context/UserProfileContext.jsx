import React, { createContext, useContext, useState, useEffect } from 'react';

const UserProfileContext = createContext();

const DEFAULT_PROFILE = {
    name: '',
    age: '',
    dob: '',
    bloodType: '',
    gender: '',
    phone: '',
    emergencyNote: '',
};

export function UserProfileProvider({ children }) {
    const [profile, setProfile] = useState(() => {
        try {
            const saved = localStorage.getItem('userProfile');
            if (saved) return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
            // Migrate pre-existing patientName from old storage key
            const legacyName = localStorage.getItem('patientName') || '';
            return { ...DEFAULT_PROFILE, name: legacyName };
        } catch {
            return { ...DEFAULT_PROFILE };
        }
    });

    useEffect(() => {
        localStorage.setItem('userProfile', JSON.stringify(profile));
        // Keep the legacy key in sync so components still using patientName prop work
        if (profile.name) localStorage.setItem('patientName', profile.name);
    }, [profile]);

    const updateProfile = (updates) =>
        setProfile(prev => ({ ...prev, ...updates }));

    return (
        <UserProfileContext.Provider value={{ profile, updateProfile }}>
            {children}
        </UserProfileContext.Provider>
    );
}

export function useUserProfile() {
    const ctx = useContext(UserProfileContext);
    if (!ctx) throw new Error('useUserProfile must be used inside <UserProfileProvider>');
    return ctx;
}
