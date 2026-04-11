import React, { useState, useEffect } from 'react';
import { MedicationProvider } from './context/MedicationContext';
import { EmergencyProfileProvider } from './context/EmergencyProfileContext';
import { UserProfileProvider, useUserProfile } from './context/UserProfileContext';
import { requestNotificationPermission } from './utils/notifications';
import Dashboard from './components/Dashboard';
import PrescriptionScanner from './components/PrescriptionScanner';
import ManualMedicationEntry from './components/ManualMedicationEntry';
import ChatAssistant from './components/ChatAssistant';
import MissedDoseAdvisor from './components/MissedDoseAdvisor';
import MedicationList from './components/MedicationList';
import EmergencyProfile from './components/EmergencyProfile';
import EmergencyCard from './components/EmergencyCard';
import UserProfile from './components/UserProfile';
import './styles/main.css';

// Inner app reads from context (must be a child of UserProfileProvider)
function AppInner() {
  const { profile, updateProfile } = useUserProfile();
  const [currentView, setCurrentView]     = useState('dashboard');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [darkMode, setDarkMode]           = useState(() => localStorage.getItem('darkMode') === 'true');
  const [editingName, setEditingName]     = useState(false);
  const [nameInput, setNameInput]         = useState('');

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    setApiKeyConfigured(!!apiKey && apiKey !== 'your_api_key_here');
    requestNotificationPermission();

    // Bug 2: listen for notification-click navigation events
    const handleNavigateEvent = (e) => {
      if (e.detail?.view) setCurrentView(e.detail.view);
    };
    window.addEventListener('navigateToView', handleNavigateEvent);
    return () => window.removeEventListener('navigateToView', handleNavigateEvent);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  };

  const handleNavigate = (view) => setCurrentView(view);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) updateProfile({ name: trimmed });
    setEditingName(false);
  };

  const handleStartEditName = () => {
    setNameInput(profile.name || '');
    setEditingName(true);
  };

  return (
    <MedicationProvider>
      <EmergencyProfileProvider patientName={profile.name}>
        <div className={`app${darkMode ? ' dark' : ''}`}>

          {/* API key warning */}
          {!apiKeyConfigured && (
            <div className="api-key-warning">
              <div className="warning-content">
                <span className="warning-icon">⚠️</span>
                <div>
                  <strong>Gemini API Key Required</strong>
                  <p>
                    Create a <code>.env</code> file with <code>VITE_GEMINI_API_KEY=your_key_here</code>
                    <br />
                    Get a free key at:{' '}
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                      Google AI Studio
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Name prompt banner (shown until name is set) */}
          {!profile.name && !editingName && (
            <div className="name-prompt-banner">
              <span>👤 Set your name so your Emergency Card is personalised</span>
              <button className="btn-name-set" onClick={handleStartEditName}>Set Name</button>
            </div>
          )}

          {/* Inline name editor modal */}
          {editingName && (
            <div className="name-modal-overlay">
              <div className="name-modal">
                <h3>👤 What's your name?</h3>
                <p>This will appear on your Emergency Card and PDF</p>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Nishtha Agarwal"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                />
                <div className="name-modal-actions">
                  <button className="btn-secondary" onClick={() => setEditingName(false)}>Skip</button>
                  <button className="btn-primary" onClick={handleSaveName}>Save</button>
                </div>
              </div>
            </div>
          )}

          {/* Views */}
          {currentView === 'dashboard'      && <Dashboard onNavigate={handleNavigate} patientName={profile.name} onEditName={handleStartEditName} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />}
          {currentView === 'scan'           && <PrescriptionScanner onNavigate={handleNavigate} />}
          {currentView === 'manual'         && <ManualMedicationEntry onNavigate={handleNavigate} />}
          {currentView === 'chat'           && <ChatAssistant onNavigate={handleNavigate} />}
          {currentView === 'missed'         && <MissedDoseAdvisor onNavigate={handleNavigate} />}
          {currentView === 'medications'    && <MedicationList onNavigate={handleNavigate} />}
          {currentView === 'emergency'      && <EmergencyProfile onNavigate={handleNavigate} />}
          {currentView === 'emergency-card' && <EmergencyCard onNavigate={handleNavigate} patientName={profile.name} />}
          {currentView === 'profile'        && <UserProfile onNavigate={handleNavigate} />}
        </div>
      </EmergencyProfileProvider>
    </MedicationProvider>
  );
}

export default function App() {
  return (
    <UserProfileProvider>
      <AppInner />
    </UserProfileProvider>
  );
}
