import React, { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '../utils/StorageService';

const UserProfileContext = createContext();

const DEFAULT_PROFILE = {
    name: '',
    age: '',
    dob: '',
    bloodType: '',
    gender: '',
    phone: '',
    emergencyNote: '',
    caregiverName: '',
    caregiverEmail: '',
    caregiverPhone: '',
};

export function UserProfileProvider({ userId, children }) {
    const [profile, setProfile] = useState({ ...DEFAULT_PROFILE });
    const [profileLoaded, setProfileLoaded] = useState(false);

    // Subscribe to profile document in Firestore (or localStorage fallback)
    useEffect(() => {
        if (!userId) {
            // No user — reset to defaults
            setProfile({ ...DEFAULT_PROFILE });
            setProfileLoaded(false);
            return;
        }

        const unsubscribe = StorageService.subscribeToDocument(userId, 'profile/main', (data) => {
            if (data) {
                setProfile({ ...DEFAULT_PROFILE, ...data });
            } else {
                // No profile yet — initialize with defaults
                // Try migrating legacy localStorage data
                try {
                    const legacyProfile = localStorage.getItem('userProfile');
                    const legacyName = localStorage.getItem('patientName');
                    if (legacyProfile) {
                        const parsed = JSON.parse(legacyProfile);
                        const migrated = { ...DEFAULT_PROFILE, ...parsed };
                        setProfile(migrated);
                        // Persist migration to Firestore
                        StorageService.setDocument(userId, 'profile/main', migrated);
                    } else if (legacyName) {
                        const migrated = { ...DEFAULT_PROFILE, name: legacyName };
                        setProfile(migrated);
                        StorageService.setDocument(userId, 'profile/main', migrated);
                    } else {
                        setProfile({ ...DEFAULT_PROFILE });
                    }
                } catch {
                    setProfile({ ...DEFAULT_PROFILE });
                }
            }
            setProfileLoaded(true);
        });

        return () => unsubscribe();
    }, [userId]);

    const updateProfile = async (updates) => {
        const newProfile = { ...profile, ...updates };
        // Optimistic update
        setProfile(newProfile);

        // Persist to Firestore
        if (userId) {
            await StorageService.setDocument(userId, 'profile/main', newProfile);
        }

        // Keep the legacy key in sync so components still using patientName prop work
        if (newProfile.name) {
            try { localStorage.setItem('patientName', newProfile.name); } catch { /* ignore */ }
        }
    };

    return (
        <UserProfileContext.Provider value={{ profile, profileLoaded, updateProfile }}>
            {children}
        </UserProfileContext.Provider>
    );
}

export function useUserProfile() {
    const ctx = useContext(UserProfileContext);
    if (!ctx) throw new Error('useUserProfile must be used inside <UserProfileProvider>');
    return ctx;
}
