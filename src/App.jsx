import React, { useState, useEffect, useCallback } from 'react';
import { MedicationProvider, useMedications } from './context/MedicationContext';
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
import Onboarding from './components/Onboarding';
import NotificationPanel from './components/NotificationPanel';
import {
  LayoutDashboard, Pill, MessageSquare, Shield, User,
  Moon, Sun, Menu, X, Search, Bell, Plus, Scan, Camera
} from 'lucide-react';
import './styles/main.css';

// Page title map
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  scan: 'Scan Prescription',
  manual: 'Add Medication',
  chat: 'AI Assistant',
  missed: 'Missed Doses',
  medications: 'My Medications',
  emergency: 'Emergency Profile',
  'emergency-card': 'Emergency Card',
  profile: 'My Profile',
};

// Inner app (needs contexts)
function AppShell() {
  const { profile, updateProfile } = useUserProfile();
  const { medications, missedDoses } = useMedications();
  const [currentView, setCurrentView] = useState('dashboard');
  const [prevView, setPrevView] = useState('dashboard');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Check if first-time user
  useEffect(() => {
    const hasOnboarded = localStorage.getItem('onboardingDone');
    if (!hasOnboarded && !profile.name && medications.length === 0) {
      setShowOnboarding(true);
    }
  }, []);

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

  // Auto dark mode from system preference
  useEffect(() => {
    if (localStorage.getItem('darkMode') === null) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  };

  const handleNavigate = useCallback((view) => {
    setPrevView(currentView);
    setCurrentView(view);
    setSidebarOpen(false);
    setFabOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) updateProfile({ name: trimmed });
    setEditingName(false);
  };

  const handleStartEditName = () => {
    setNameInput(profile.name || '');
    setEditingName(true);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingDone', 'true');
    setShowOnboarding(false);
  };

  // Toast system
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Notification count
  const notifCount = (() => {
    let count = missedDoses.length;
    medications.forEach(med => {
      const remaining = med.pillsRemaining ?? med.quantity ?? null;
      if (remaining !== null && remaining <= 7) count++;
    });
    return count;
  })();

  // Navigation items
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'emergency', label: 'Emergency', icon: Shield },
  ];

  const actionNavItems = [
    { id: 'scan', label: 'Scan Prescription', icon: Scan },
    { id: 'manual', label: 'Add Manually', icon: Plus },
  ];

  return (
    <div className={`app${darkMode ? ' dark' : ''}`}>

      {/* Onboarding for first-time users */}
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        medications={medications}
        missedDoses={missedDoses}
      />

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
      {!profile.name && !editingName && !showOnboarding && (
        <div className="name-prompt-banner">
          <span>👤 Set your name so your Emergency Card is personalised</span>
          <button className="btn-name-set" onClick={handleStartEditName}>Set Name</button>
        </div>
      )}

      {/* Inline name editor modal */}
      {editingName && (
        <div className="name-modal-overlay" onClick={() => setEditingName(false)}>
          <div className="name-modal" onClick={e => e.stopPropagation()}>
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

      <div className="app-layout">
        {/* === SIDEBAR (Desktop) === */}
        <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`} role="navigation" aria-label="Main navigation">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">💊</div>
            <div className="sidebar-logo-text">
              Smart Medicine
              <span>AI Companion</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Menu</div>
            {mainNavItems.map(item => (
              <button
                key={item.id}
                className={`sidebar-nav-item${currentView === item.id ? ' active' : ''}`}
                onClick={() => handleNavigate(item.id)}
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                <span className="sidebar-nav-icon">
                  <item.icon size={20} />
                </span>
                {item.label}
                {item.id === 'medications' && missedDoses.length > 0 && (
                  <span className="sidebar-badge">{missedDoses.length}</span>
                )}
              </button>
            ))}

            <div className="sidebar-section-label">Quick Actions</div>
            {actionNavItems.map(item => (
              <button
                key={item.id}
                className={`sidebar-nav-item${currentView === item.id ? ' active' : ''}`}
                onClick={() => handleNavigate(item.id)}
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                <span className="sidebar-nav-icon">
                  <item.icon size={20} />
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-user" onClick={() => handleNavigate('profile')}>
              <div className="sidebar-user-avatar">
                {getInitials(profile.name)}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{profile.name || 'Set up profile'}</div>
                <div className="sidebar-user-role">Patient</div>
              </div>
            </button>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />
        )}

        {/* === MAIN WRAPPER === */}
        <div className="app-main-wrapper">
          {/* Top Bar */}
          <header className="topbar" role="banner">
            <div className="topbar-left">
              <button
                className="topbar-btn topbar-menu-btn"
                onClick={() => setSidebarOpen(prev => !prev)}
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="topbar-page-title">{PAGE_TITLES[currentView] || 'Dashboard'}</h1>
            </div>
            <div className="topbar-right">
              {/* Notification Bell */}
              <button
                className="topbar-btn"
                onClick={() => setNotifOpen(true)}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {notifCount > 0 && (
                  <span className="topbar-badge">{notifCount > 9 ? '9+' : notifCount}</span>
                )}
              </button>
              <button
                className="topbar-btn"
                onClick={toggleDarkMode}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                className="topbar-btn"
                onClick={() => handleNavigate('profile')}
                title="My Profile"
                aria-label="My Profile"
              >
                <User size={20} />
              </button>
            </div>
          </header>

          {/* Main Content with page transition */}
          <main className="main-content" role="main">
            <div className="page-transition" key={currentView}>
              {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} patientName={profile.name} onEditName={handleStartEditName} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />}
              {currentView === 'scan' && <PrescriptionScanner onNavigate={handleNavigate} />}
              {currentView === 'manual' && <ManualMedicationEntry onNavigate={handleNavigate} />}
              {currentView === 'chat' && <ChatAssistant onNavigate={handleNavigate} />}
              {currentView === 'missed' && <MissedDoseAdvisor onNavigate={handleNavigate} />}
              {currentView === 'medications' && <MedicationList onNavigate={handleNavigate} />}
              {currentView === 'emergency' && <EmergencyProfile onNavigate={handleNavigate} />}
              {currentView === 'emergency-card' && <EmergencyCard onNavigate={handleNavigate} patientName={profile.name} />}
              {currentView === 'profile' && <UserProfile onNavigate={handleNavigate} />}
            </div>
          </main>
        </div>
      </div>

      {/* Bottom Nav (Mobile) */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <div className="bottom-nav-items">
          {[
            { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { id: 'medications', label: 'Meds', icon: Pill },
            { id: 'chat', label: 'AI Chat', icon: MessageSquare },
            { id: 'emergency', label: 'Emergency', icon: Shield },
            { id: 'profile', label: 'Profile', icon: User },
          ].map(item => (
            <button
              key={item.id}
              className={`bottom-nav-item${currentView === item.id ? ' active' : ''}`}
              onClick={() => handleNavigate(item.id)}
              aria-label={item.label}
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <span className="bottom-nav-icon">
                <item.icon size={22} />
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* FAB Button (Mobile) */}
      <div className="fab-container">
        <button
          className={`fab-btn ${fabOpen ? 'fab-open' : ''}`}
          onClick={() => setFabOpen(prev => !prev)}
          aria-label="Quick add medication"
        >
          <Plus size={24} />
        </button>
        {fabOpen && (
          <div className="fab-menu">
            <button className="fab-menu-item" onClick={() => handleNavigate('scan')}>
              <Camera size={18} /> Scan Prescription
            </button>
            <button className="fab-menu-item" onClick={() => handleNavigate('manual')}>
              <Plus size={18} /> Add Manually
            </button>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <span className="toast-icon">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// AppShell needs MedicationProvider context, so we wrap it
function AppInner() {
  return (
    <MedicationProvider>
      <AppShellWrapper />
    </MedicationProvider>
  );
}

function AppShellWrapper() {
  const { profile } = useUserProfile();
  return (
    <EmergencyProfileProvider patientName={profile.name}>
      <AppShell />
    </EmergencyProfileProvider>
  );
}

export default function App() {
  return (
    <UserProfileProvider>
      <AppInner />
    </UserProfileProvider>
  );
}
