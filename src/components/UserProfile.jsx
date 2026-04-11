import React, { useState } from 'react';
import { User, Phone, Calendar, Droplet, CheckCircle, Edit2, ChevronRight } from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS     = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function UserProfile({ onNavigate }) {
    const { profile, updateProfile } = useUserProfile();
    const [editing, setEditing] = useState(!profile.name); // auto-open editor if name missing
    const [form, setForm]       = useState({ ...profile });
    const [saved, setSaved]     = useState(false);

    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = (e) => {
        e.preventDefault();
        updateProfile(form);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const age = profile.dob
        ? Math.floor((Date.now() - new Date(profile.dob)) / (365.25 * 24 * 3600 * 1000))
        : profile.age || null;

    return (
        <div className="profile-container">
            {/* Header */}
            <header className="profile-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>← Back</button>
                <h2>👤 My Profile</h2>
                {!editing && (
                    <button className="btn-icon-sm" onClick={() => { setForm({ ...profile }); setEditing(true); }} title="Edit">
                        <Edit2 size={18} />
                    </button>
                )}
            </header>

            <div className="profile-content">
                {!editing ? (
                    /* ── View mode ── */
                    <div className="profile-view">
                        {/* Avatar / identity card */}
                        <div className="profile-card">
                            <div className="profile-avatar">
                                {profile.name
                                    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                    : '?'}
                            </div>
                            <div className="profile-identity">
                                <h3>{profile.name || 'No name set'}</h3>
                                <p className="profile-sub">
                                    {age ? `${age} years old` : ''}
                                    {age && profile.gender ? ' · ' : ''}
                                    {profile.gender || ''}
                                </p>
                            </div>
                        </div>

                        {/* Detail rows */}
                        <div className="profile-details">
                            <ProfileRow icon={<Droplet size={20} />} label="Blood Type" value={profile.bloodType} highlight />
                            <ProfileRow icon={<Calendar size={20} />} label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                            <ProfileRow icon={<Phone size={20} />} label="Phone" value={profile.phone} />
                            {profile.emergencyNote && (
                                <ProfileRow icon={<span>📋</span>} label="Emergency Note" value={profile.emergencyNote} />
                            )}
                        </div>

                        {saved && (
                            <div className="profile-saved-toast">
                                <CheckCircle size={18} /> Profile saved!
                            </div>
                        )}

                        {/* Quick nav shortcuts */}
                        <div className="profile-shortcuts">
                            <button className="profile-shortcut-btn" onClick={() => onNavigate('emergency')}>
                                <span>🚨 Emergency Profile</span>
                                <ChevronRight size={18} />
                            </button>
                            <button className="profile-shortcut-btn" onClick={() => onNavigate('medications')}>
                                <span>💊 My Medications</span>
                                <ChevronRight size={18} />
                            </button>
                            <button className="profile-shortcut-btn" onClick={() => onNavigate('emergency-card')}>
                                <span>🪪 Emergency Card</span>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Edit mode ── */
                    <form className="profile-form" onSubmit={handleSave}>
                        <div className="form-group">
                            <label htmlFor="p-name">Full Name <span className="required">*</span></label>
                            <input
                                id="p-name" type="text" className="form-input"
                                placeholder="e.g., Nishtha Agarwal"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="p-dob">Date of Birth</label>
                            <input
                                id="p-dob" type="date" className="form-input"
                                value={form.dob}
                                onChange={e => set('dob', e.target.value)}
                            />
                            <p className="form-hint">Used to calculate your age for the AI assistant</p>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="p-gender">Gender</label>
                                <select id="p-gender" className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                                    <option value="">Select…</option>
                                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="p-blood">Blood Type</label>
                                <select id="p-blood" className="form-select" value={form.bloodType} onChange={e => set('bloodType', e.target.value)}>
                                    <option value="">Select…</option>
                                    {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <p className="form-hint">Auto-filled on Emergency Profile &amp; Card</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="p-phone">Phone Number</label>
                            <input
                                id="p-phone" type="tel" className="form-input"
                                placeholder="e.g., +91 98765 43210"
                                value={form.phone}
                                onChange={e => set('phone', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="p-note">Emergency Note</label>
                            <textarea
                                id="p-note" className="form-textarea" rows={3}
                                placeholder="e.g., Diabetic, uses insulin pump, prefers female doctor"
                                value={form.emergencyNote}
                                onChange={e => set('emergencyNote', e.target.value)}
                            />
                            <p className="form-hint">Shown on your Emergency Card PDF</p>
                        </div>

                        <div className="form-actions">
                            {profile.name && (
                                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                            )}
                            <button type="submit" className="btn-primary">
                                <CheckCircle size={18} /> Save Profile
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function ProfileRow({ icon, label, value, highlight }) {
    if (!value) return null;
    return (
        <div className={`profile-detail-row ${highlight ? 'profile-detail-highlight' : ''}`}>
            <span className="profile-detail-icon">{icon}</span>
            <div>
                <span className="profile-detail-label">{label}</span>
                <span className="profile-detail-value">{value}</span>
            </div>
        </div>
    );
}
