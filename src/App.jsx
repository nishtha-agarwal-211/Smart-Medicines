import React, { useState, useEffect } from 'react';
import { MedicationProvider } from './context/MedicationContext';
import { EmergencyProfileProvider } from './context/EmergencyProfileContext';
import { requestNotificationPermission } from './utils/notifications';
import Dashboard from './components/Dashboard';
import PrescriptionScanner from './components/PrescriptionScanner';
import ManualMedicationEntry from './components/ManualMedicationEntry';
import ChatAssistant from './components/ChatAssistant';
import MissedDoseAdvisor from './components/MissedDoseAdvisor';
import MedicationList from './components/MedicationList';
import EmergencyProfile from './components/EmergencyProfile';
import EmergencyCard from './components/EmergencyCard';
import './styles/main.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  useEffect(() => {
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    setApiKeyConfigured(!!apiKey && apiKey !== 'your_api_key_here');

    // Request notification permission
    requestNotificationPermission();
  }, []);

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  return (
    <MedicationProvider>
      <EmergencyProfileProvider>
        <div className="app">
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

          {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentView === 'scan' && <PrescriptionScanner onNavigate={handleNavigate} />}
          {currentView === 'manual' && <ManualMedicationEntry onNavigate={handleNavigate} />}
          {currentView === 'chat' && <ChatAssistant onNavigate={handleNavigate} />}
          {currentView === 'missed' && <MissedDoseAdvisor onNavigate={handleNavigate} />}
          {currentView === 'medications' && <MedicationList onNavigate={handleNavigate} />}
          {currentView === 'emergency' && <EmergencyProfile onNavigate={handleNavigate} />}
          {currentView === 'emergency-card' && <EmergencyCard onNavigate={handleNavigate} />}
        </div>
      </EmergencyProfileProvider>
    </MedicationProvider>
  );
}

export default App;
