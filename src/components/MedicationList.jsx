import React, { useState, useEffect } from 'react';
import { useMedications } from '../context/MedicationContext';
import { Pill, Edit2, Trash2, Clock, AlertTriangle, Plus, CheckCircle, X, Minus } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function MedicationList({ onNavigate }) {
    const { medications, deleteMedication, updateMedication } = useMedications();
    const [confirm, setConfirm] = useState(null);
    const [editingMed, setEditingMed] = useState(null);

    const handleDelete = (id, name) => {
        setConfirm({
            title: 'Delete Medication?',
            message: `"${name}" will be removed from your profile and all reminders will be cancelled.`,
            onConfirm: () => deleteMedication(id),
        });
    };

    const handleEdit = (medication) => {
        setEditingMed(medication);
    };

    const handleSaveEdit = (updatedData) => {
        updateMedication(editingMed.id, updatedData);
        setEditingMed(null);
    };

    if (editingMed) {
        return (
            <EditMedicationForm
                medication={editingMed}
                onSave={handleSaveEdit}
                onCancel={() => setEditingMed(null)}
            />
        );
    }

    return (
        <div className="medications-container">
            <header className="medications-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>
                    ← Back
                </button>
                <h2>My Medications</h2>
                <div className="header-btn-group">
                    <button className="btn-add" onClick={() => onNavigate('manual')}>📝 Add</button>
                    <button className="btn-add btn-scan" onClick={() => onNavigate('scan')}>📸 Scan</button>
                </div>
            </header>

            {medications.length === 0 ? (
                <div className="empty-state">
                    <Pill size={48} />
                    <h3>No medications yet</h3>
                    <p>Scan a prescription or add one manually to get started</p>
                    <div className="empty-state-actions">
                        <button className="btn-primary" onClick={() => onNavigate('scan')}>
                            📸 Scan Prescription
                        </button>
                        <button className="btn-secondary" onClick={() => onNavigate('manual')}>
                            📝 Add Manually
                        </button>
                    </div>
                </div>
            ) : (
                <div className="medications-list">
                    {medications.map(medication => (
                        <MedicationCard
                            key={medication.id}
                            medication={medication}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}

            {confirm && (
                <ConfirmModal
                    title={confirm.title}
                    message={confirm.message}
                    confirmLabel="Delete"
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
}

function MedicationCard({ medication, onDelete, onEdit }) {
    const [expanded, setExpanded] = useState(false);
    const { updateMedication } = useMedications();
    const [countdown, setCountdown] = useState('');

    // Refill tracker — update pills remaining
    const handleRefillUpdate = (delta) => {
        const current = medication.pillsRemaining ?? medication.quantity ?? 0;
        const updated = Math.max(0, current + delta);
        updateMedication(medication.id, { pillsRemaining: updated });
    };

    const pillsRemaining = medication.pillsRemaining ?? medication.quantity ?? null;
    const isLowSupply = pillsRemaining !== null && pillsRemaining <= 7;

    // Color-code by earliest schedule time
    const getTimeColor = () => {
        if (!medication.schedule || medication.schedule.length === 0) return 'time-default';
        const earliest = medication.schedule.sort()[0];
        const hour = parseInt(earliest.split(':')[0]);
        if (hour < 12) return 'time-morning';
        if (hour < 17) return 'time-afternoon';
        if (hour < 21) return 'time-evening';
        return 'time-night';
    };

    // Supply percentage for progress bar
    const supplyMax = medication.quantity || 30;
    const supplyPct = pillsRemaining !== null
        ? Math.min(100, Math.round((pillsRemaining / supplyMax) * 100))
        : null;

    // Countdown to next dose
    useEffect(() => {
        if (!medication.schedule || medication.schedule.length === 0) return;

        function calcCountdown() {
            const now = new Date();
            let nearest = null;

            for (const t of medication.schedule) {
                const [h, m] = t.split(':').map(Number);
                const dose = new Date();
                dose.setHours(h, m, 0, 0);
                if (dose > now && (nearest === null || dose < nearest)) {
                    nearest = dose;
                }
            }

            // If no dose is left today, show first dose tomorrow
            if (!nearest) {
                const firstTime = medication.schedule.sort()[0];
                const [h, m] = firstTime.split(':').map(Number);
                nearest = new Date();
                nearest.setDate(nearest.getDate() + 1);
                nearest.setHours(h, m, 0, 0);
            }

            const diff = nearest - now;
            const hrs = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);

            if (hrs > 0) {
                setCountdown(`${hrs}h ${mins}m`);
            } else {
                setCountdown(`${mins}m`);
            }
        }

        calcCountdown();
        const interval = setInterval(calcCountdown, 60000);
        return () => clearInterval(interval);
    }, [medication.schedule]);

    const timeColor = getTimeColor();

    return (
        <div className={`medication-card ${isLowSupply ? 'medication-card-low' : ''} ${timeColor}`}>
            <div className="medication-card-header" onClick={() => setExpanded(!expanded)}>
                <div className={`medication-icon medication-icon-${timeColor}`}>💊</div>
                <div className="medication-title">
                    <h3>{medication.drugName}</h3>
                    <p>{medication.dosage} • {medication.frequency}</p>
                    <div className="medication-meta-row">
                        {countdown && (
                            <span className="next-dose-badge">
                                <Clock size={12} /> Next in {countdown}
                            </span>
                        )}
                        {isLowSupply && (
                            <span className="refill-alert">⚠️ {pillsRemaining} pill{pillsRemaining !== 1 ? 's' : ''} left</span>
                        )}
                    </div>
                </div>
                {/* Supply progress bar (compact) */}
                {supplyPct !== null && (
                    <div className="supply-mini">
                        <div className="supply-mini-bar">
                            <div
                                className={`supply-mini-fill ${supplyPct <= 25 ? 'supply-low' : supplyPct <= 50 ? 'supply-mid' : 'supply-ok'}`}
                                style={{ width: `${supplyPct}%` }}
                            />
                        </div>
                        <span className="supply-mini-label">{pillsRemaining}</span>
                    </div>
                )}
                <span className="expand-btn">{expanded ? '▼' : '▶'}</span>
            </div>

            {expanded && (
                <div className="medication-card-body">
                    {medication.schedule && medication.schedule.length > 0 && (
                        <div className="medication-detail">
                            <Clock size={16} />
                            <div>
                                <strong>Schedule:</strong>
                                <p>{medication.schedule.join(', ')}</p>
                            </div>
                        </div>
                    )}

                    {medication.timing && medication.timing.length > 0 && (
                        <div className="medication-detail">
                            <span>🕐</span>
                            <div>
                                <strong>Timing:</strong>
                                <p>{medication.timing.join(', ')}</p>
                            </div>
                        </div>
                    )}

                    {medication.withFood && (
                        <div className="medication-detail">
                            <span>🍽️</span>
                            <div><strong>Take with food</strong></div>
                        </div>
                    )}

                    {medication.warnings && medication.warnings.length > 0 && (
                        <div className="medication-detail medication-warning">
                            <AlertTriangle size={16} />
                            <div>
                                <strong>Warnings:</strong>
                                <ul>
                                    {medication.warnings.map((warning, i) => (
                                        <li key={i}>{warning}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {medication.duration && (
                        <div className="medication-detail">
                            <span>📅</span>
                            <div>
                                <strong>Duration:</strong>
                                <p>{medication.duration}</p>
                            </div>
                        </div>
                    )}

                    {medication.prescribedBy && (
                        <div className="medication-detail">
                            <span>👨‍⚕️</span>
                            <div>
                                <strong>Prescribed by:</strong>
                                <p>{medication.prescribedBy}</p>
                            </div>
                        </div>
                    )}

                    {/* Refill tracker */}
                    <div className="refill-tracker">
                        <div className="refill-tracker-top">
                            <span className="refill-label">💊 Pills remaining</span>
                            {supplyPct !== null && (
                                <div className="supply-bar">
                                    <div
                                        className={`supply-bar-fill ${supplyPct <= 25 ? 'supply-low' : supplyPct <= 50 ? 'supply-mid' : 'supply-ok'}`}
                                        style={{ width: `${supplyPct}%` }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="refill-controls">
                            <button
                                className="refill-btn"
                                onClick={() => handleRefillUpdate(-1)}
                                title="Remove one pill"
                                disabled={pillsRemaining === 0}
                            >
                                <Minus size={14} />
                            </button>
                            <span className={`refill-count ${isLowSupply ? 'refill-low' : ''}`}>
                                {pillsRemaining !== null ? pillsRemaining : '—'}
                            </span>
                            <button
                                className="refill-btn"
                                onClick={() => handleRefillUpdate(1)}
                                title="Add one pill"
                            >
                                <Plus size={14} />
                            </button>
                            <button
                                className="refill-btn refill-btn-refill"
                                onClick={() => handleRefillUpdate(30)}
                                title="Refill (+30)"
                            >
                                +30
                            </button>
                        </div>
                    </div>

                    {medication.aiExtracted && (
                        <div className="ai-badge">
                            <span>🤖 AI Extracted</span>
                        </div>
                    )}

                    <div className="medication-actions">
                        <button
                            className="btn-edit"
                            onClick={() => onEdit(medication)}
                        >
                            <Edit2 size={16} />
                            Edit
                        </button>
                        <button
                            className="btn-delete"
                            onClick={() => onDelete(medication.id, medication.drugName)}
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Inline edit form ────────────────────────────────────────────────────────
function EditMedicationForm({ medication, onSave, onCancel }) {
    const timingOptions = [
        { value: '08:00', label: 'Morning (8:00 AM)' },
        { value: '12:00', label: 'Noon (12:00 PM)' },
        { value: '18:00', label: 'Evening (6:00 PM)' },
        { value: '22:00', label: 'Night (10:00 PM)' },
    ];

    const frequencyOptions = [
        'once daily', 'twice daily', 'three times daily',
        'four times daily', 'every other day', 'as needed',
    ];

    const [form, setForm] = useState({
        drugName:    medication.drugName || '',
        dosage:      medication.dosage || '',
        frequency:   medication.frequency || 'once daily',
        schedule:    medication.schedule || [],
        withFood:    medication.withFood || false,
        duration:    medication.duration || '',
        prescribedBy: medication.prescribedBy || '',
        notes:       medication.notes || '',
        quantity:    medication.pillsRemaining ?? medication.quantity ?? '',
    });

    const [warningInput, setWarningInput] = useState('');
    const [warnings, setWarnings] = useState(medication.warnings || []);
    const [errors, setErrors] = useState({});

    const set = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const toggleTiming = (time) => {
        setForm(prev => ({
            ...prev,
            schedule: prev.schedule.includes(time)
                ? prev.schedule.filter(t => t !== time)
                : [...prev.schedule, time],
        }));
    };

    const addWarning = () => {
        if (warningInput.trim()) {
            setWarnings(prev => [...prev, warningInput.trim()]);
            setWarningInput('');
        }
    };

    const validate = () => {
        const e = {};
        if (!form.drugName.trim()) e.drugName = 'Name is required';
        if (!form.dosage.trim()) e.dosage = 'Dosage is required';
        if (form.schedule.length === 0) e.schedule = 'Select at least one time';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        onSave({
            ...form,
            warnings,
            pillsRemaining: form.quantity !== '' ? Number(form.quantity) : undefined,
        });
    };

    return (
        <div className="scanner-container">
            <header className="scanner-header">
                <button className="btn-back" onClick={onCancel}>← Cancel</button>
                <h2>✏️ Edit Medication</h2>
            </header>

            <div className="manual-entry-content">
                <form onSubmit={handleSubmit} className="medication-form">
                    <div className="form-group">
                        <label htmlFor="edit-drugName">Medication Name <span className="required">*</span></label>
                        <input id="edit-drugName" type="text" className={`form-input ${errors.drugName ? 'error' : ''}`}
                            value={form.drugName} onChange={e => set('drugName', e.target.value)} />
                        {errors.drugName && <span className="error-message">{errors.drugName}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-dosage">Dosage <span className="required">*</span></label>
                        <input id="edit-dosage" type="text" className={`form-input ${errors.dosage ? 'error' : ''}`}
                            value={form.dosage} onChange={e => set('dosage', e.target.value)} />
                        {errors.dosage && <span className="error-message">{errors.dosage}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-frequency">Frequency</label>
                        <select id="edit-frequency" className="form-select"
                            value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                            {frequencyOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>When to take <span className="required">*</span></label>
                        <div className="timing-chips">
                            {timingOptions.map(opt => (
                                <button key={opt.value} type="button"
                                    className={`timing-chip ${form.schedule.includes(opt.value) ? 'selected' : ''}`}
                                    onClick={() => toggleTiming(opt.value)}>
                                    {form.schedule.includes(opt.value) ? '✓ ' : ''}{opt.label}
                                </button>
                            ))}
                        </div>
                        {errors.schedule && <span className="error-message">{errors.schedule}</span>}
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input type="checkbox" checked={form.withFood}
                                onChange={e => set('withFood', e.target.checked)} />
                            <span>Take with food 🍽️</span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-duration">Duration</label>
                        <input id="edit-duration" type="text" className="form-input"
                            placeholder="e.g., 30 days, ongoing"
                            value={form.duration} onChange={e => set('duration', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-quantity">Pills Remaining (for refill tracking)</label>
                        <input id="edit-quantity" type="number" min="0" className="form-input"
                            placeholder="e.g., 30"
                            value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>Warnings / Side Effects</label>
                        <div className="warnings-input-group">
                            <input type="text" className="form-input"
                                placeholder="e.g., May cause dizziness"
                                value={warningInput}
                                onChange={e => setWarningInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addWarning(); } }} />
                            <button type="button" className="btn-add-warning" onClick={addWarning}>
                                <Plus size={20} />
                            </button>
                        </div>
                        {warnings.length > 0 && (
                            <div className="warnings-list">
                                {warnings.map((w, i) => (
                                    <div key={i} className="warning-tag">
                                        <span>⚠️ {w}</span>
                                        <button type="button" className="btn-remove-warning"
                                            onClick={() => setWarnings(prev => prev.filter((_, idx) => idx !== i))}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-prescribedBy">Prescribed by</label>
                        <input id="edit-prescribedBy" type="text" className="form-input"
                            placeholder="e.g., Dr. Smith"
                            value={form.prescribedBy} onChange={e => set('prescribedBy', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-notes">Additional Notes</label>
                        <textarea id="edit-notes" className="form-textarea" rows={3}
                            value={form.notes} onChange={e => set('notes', e.target.value)} />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn-primary">
                            <CheckCircle size={18} /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
