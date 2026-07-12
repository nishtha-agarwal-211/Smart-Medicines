import React, { useState, useMemo } from 'react';
import { useUserProfile } from '../context/UserProfileContext';
import { useMedications } from '../context/MedicationContext';
import { ChevronRight, Send, Copy, Check, Share2, Mail, Phone, User, ArrowLeft } from 'lucide-react';
import { formatFrequencyText } from '../utils/schedule';

export default function CaregiverShare({ onNavigate }) {
    const { profile, updateProfile } = useUserProfile();
    const { medications } = useMedications();
    const [editingCaregiver, setEditingCaregiver] = useState(!profile.caregiverName);
    const [cgForm, setCgForm] = useState({
        caregiverName: profile.caregiverName || '',
        caregiverEmail: profile.caregiverEmail || '',
        caregiverPhone: profile.caregiverPhone || '',
    });
    const [copied, setCopied] = useState(false);
    const [selectedMeds, setSelectedMeds] = useState(() => medications.map(m => m.id));

    // Find medications with low stock (≤ 7 pills)
    const lowStockMeds = useMemo(() =>
        medications.filter(med => {
            const remaining = med.pillsRemaining ?? med.quantity ?? null;
            return remaining !== null && remaining <= 7;
        }), [medications]
    );

    const selectedMedications = medications.filter(m => selectedMeds.includes(m.id));

    const toggleMed = (id) => {
        setSelectedMeds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Save caregiver info
    const handleSaveCaregiver = (e) => {
        e.preventDefault();
        updateProfile(cgForm);
        setEditingCaregiver(false);
    };

    // Generate share message
    const generateMessage = (type = 'full') => {
        const patientName = profile.name || 'Patient';
        const lines = [];

        if (type === 'refill') {
            lines.push(`🔔 Medication Refill Alert`);
            lines.push(`Patient: ${patientName}`);
            lines.push('');
            lowStockMeds.forEach(med => {
                const remaining = med.pillsRemaining ?? med.quantity;
                lines.push(`⚠️ ${med.drugName} ${med.dosage} — Only ${remaining} pill${remaining !== 1 ? 's' : ''} left!`);
            });
            lines.push('');
            lines.push('Please help arrange a refill soon. Thank you! 🙏');
        } else {
            lines.push(`💊 Medication Summary for ${patientName}`);
            lines.push(`📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
            lines.push('');

            if (selectedMedications.length > 0) {
                lines.push('📋 Active Medications:');
                selectedMedications.forEach(med => {
                    const remaining = med.pillsRemaining ?? med.quantity ?? null;
                    let line = `• ${med.drugName} ${med.dosage} — ${formatFrequencyText(med)}`;
                    if (remaining !== null) line += ` (${remaining} pills left)`;
                    lines.push(line);
                });
            }

            if (lowStockMeds.length > 0) {
                lines.push('');
                lines.push('⚠️ Low Stock Alerts:');
                lowStockMeds.forEach(med => {
                    const remaining = med.pillsRemaining ?? med.quantity;
                    lines.push(`🔴 ${med.drugName} — Only ${remaining} left!`);
                });
            }

            lines.push('');
            lines.push('Sent via Smart Medicine Companion');
        }

        return lines.join('\n');
    };

    const shareMessage = generateMessage(lowStockMeds.length > 0 && selectedMedications.length === 0 ? 'refill' : 'full');

    // Share handlers
    const handleWhatsApp = () => {
        const phone = profile.caregiverPhone?.replace(/\D/g, '') || '';
        const url = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(shareMessage)}`
            : `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        window.open(url, '_blank');
    };

    const handleEmail = () => {
        const email = profile.caregiverEmail || '';
        const subject = encodeURIComponent(`Medication Update — ${profile.name || 'Patient'}`);
        const body = encodeURIComponent(shareMessage);
        window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareMessage);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = shareMessage;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Medication Update — ${profile.name || 'Patient'}`,
                    text: shareMessage,
                });
            } catch { /* user cancelled */ }
        }
    };

    return (
        <div className="caregiver-container">
            {/* Header */}
            <div className="caregiver-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>← Back</button>
                <h2>👥 Caregiver Sharing</h2>
            </div>

            {/* Caregiver Profile */}
            <div className="caregiver-profile-card">
                <h3 className="caregiver-profile-title">
                    <User size={18} /> Caregiver Contact
                </h3>

                {!editingCaregiver && profile.caregiverName ? (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <strong style={{ fontSize: '15px' }}>{profile.caregiverName}</strong>
                                {profile.caregiverPhone && (
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        📱 {profile.caregiverPhone}
                                    </p>
                                )}
                                {profile.caregiverEmail && (
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        ✉️ {profile.caregiverEmail}
                                    </p>
                                )}
                            </div>
                            <button
                                className="btn-secondary"
                                style={{ flexShrink: 0 }}
                                onClick={() => {
                                    setCgForm({
                                        caregiverName: profile.caregiverName,
                                        caregiverEmail: profile.caregiverEmail,
                                        caregiverPhone: profile.caregiverPhone,
                                    });
                                    setEditingCaregiver(true);
                                }}
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSaveCaregiver}>
                        <div className="caregiver-profile-form">
                            <div className="form-group">
                                <label htmlFor="cg-name">Caregiver Name</label>
                                <input
                                    id="cg-name" type="text" className="form-input"
                                    placeholder="e.g., Priya Sharma"
                                    value={cgForm.caregiverName}
                                    onChange={e => setCgForm(p => ({ ...p, caregiverName: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cg-phone">Phone / WhatsApp</label>
                                <input
                                    id="cg-phone" type="tel" className="form-input"
                                    placeholder="e.g., +91 98765 43210"
                                    value={cgForm.caregiverPhone}
                                    onChange={e => setCgForm(p => ({ ...p, caregiverPhone: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cg-email">Email</label>
                                <input
                                    id="cg-email" type="email" className="form-input"
                                    placeholder="e.g., priya@example.com"
                                    value={cgForm.caregiverEmail}
                                    onChange={e => setCgForm(p => ({ ...p, caregiverEmail: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="caregiver-profile-actions">
                            {profile.caregiverName && (
                                <button type="button" className="btn-secondary" onClick={() => setEditingCaregiver(false)}>
                                    Cancel
                                </button>
                            )}
                            <button type="submit" className="btn-primary">
                                <Check size={16} /> Save
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Refill Alerts */}
            {lowStockMeds.length > 0 && (
                <div className="refill-alerts-section">
                    <div className="refill-alerts-header">
                        <h3 className="refill-alerts-title">
                            ⚠️ Low Stock Alerts
                            <span className="refill-alert-count">{lowStockMeds.length}</span>
                        </h3>
                    </div>
                    {lowStockMeds.map(med => {
                        const remaining = med.pillsRemaining ?? med.quantity;
                        const isCritical = remaining <= 3;
                        return (
                            <div key={med.id} className={`refill-alert-item ${isCritical ? 'refill-critical' : 'refill-low'}`}>
                                <span style={{ fontSize: '24px' }}>💊</span>
                                <div className="refill-alert-info">
                                    <span className="refill-alert-drug">{med.drugName}</span>
                                    <span className="refill-alert-detail">{med.dosage} • {formatFrequencyText(med)}</span>
                                </div>
                                <span className={`refill-alert-pills ${isCritical ? 'pills-critical' : 'pills-low'}`}>
                                    {remaining} left
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Select Medications to Share */}
            {medications.length > 0 ? (
                <div className="share-section">
                    <h3 className="share-section-title">
                        📋 Select Medications to Share
                    </h3>
                    <div className="share-med-checklist">
                        {medications.map(med => (
                            <label key={med.id} className="share-med-item">
                                <input
                                    type="checkbox"
                                    checked={selectedMeds.includes(med.id)}
                                    onChange={() => toggleMed(med.id)}
                                />
                                <span>{med.drugName} {med.dosage} — {formatFrequencyText(med)}</span>
                            </label>
                        ))}
                    </div>

                    {/* Message Preview */}
                    <h3 className="share-section-title" style={{ marginTop: 'var(--space-4)' }}>
                        💬 Message Preview
                    </h3>
                    <div className="share-message-preview">
                        {shareMessage}
                    </div>

                    {/* Share Buttons */}
                    <div className="share-buttons">
                        <button className="share-btn share-btn-whatsapp" onClick={handleWhatsApp}>
                            <span>💬</span> WhatsApp
                        </button>
                        <button className="share-btn share-btn-email" onClick={handleEmail}>
                            <Mail size={18} /> Email
                        </button>
                        <button className="share-btn share-btn-copy" onClick={handleCopy}>
                            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                        </button>
                        {typeof navigator.share === 'function' && (
                            <button className="share-btn share-btn-native" onClick={handleNativeShare}>
                                <Share2 size={18} /> Share
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="caregiver-empty">
                    <div className="caregiver-empty-icon">💊</div>
                    <h3>No Medications Added</h3>
                    <p>Add your medications first to share them with your caregiver</p>
                    <button
                        className="btn-primary"
                        style={{ marginTop: 'var(--space-4)' }}
                        onClick={() => onNavigate('manual')}
                    >
                        Add Medication
                    </button>
                </div>
            )}

            {copied && (
                <div className="share-copied-toast">✓ Message copied to clipboard</div>
            )}
        </div>
    );
}
