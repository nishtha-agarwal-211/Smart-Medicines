import React, { useState } from 'react';
import { CheckCircle, X, Plus, Minus } from 'lucide-react';
import { useMedications } from '../context/MedicationContext';

export default function ManualMedicationEntry({ onNavigate }) {
    const { addMedication } = useMedications();
    const [step, setStep] = useState('form'); // 'form', 'success'
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        drugName: '',
        dosage: '',
        frequency: 'once daily',
        timing: [],
        withFood: false,
        duration: '',
        warnings: [],
        prescribedBy: '',
        notes: '',
        quantity: ''
    });

    const [warningInput, setWarningInput] = useState('');

    const frequencyOptions = [
        'once daily',
        'twice daily',
        'three times daily',
        'four times daily',
        'every other day',
        'as needed'
    ];

    const timingOptions = [
        { value: '08:00', label: 'Morning (8:00 AM)' },
        { value: '12:00', label: 'Noon (12:00 PM)' },
        { value: '18:00', label: 'Evening (6:00 PM)' },
        { value: '22:00', label: 'Night (10:00 PM)' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const toggleTiming = (time) => {
        setFormData(prev => ({
            ...prev,
            timing: prev.timing.includes(time)
                ? prev.timing.filter(t => t !== time)
                : [...prev.timing, time]
        }));
    };

    const addWarning = () => {
        if (warningInput.trim()) {
            setFormData(prev => ({
                ...prev,
                warnings: [...prev.warnings, warningInput.trim()]
            }));
            setWarningInput('');
        }
    };

    const removeWarning = (index) => {
        setFormData(prev => ({
            ...prev,
            warnings: prev.warnings.filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.drugName.trim()) {
            newErrors.drugName = 'Medication name is required';
        }

        if (!formData.dosage.trim()) {
            newErrors.dosage = 'Dosage is required';
        }

        if (formData.timing.length === 0) {
            newErrors.timing = 'Please select at least one time';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Create medication with schedule based on timing
        const medication = {
            drugName: formData.drugName,
            dosage: formData.dosage,
            frequency: formData.frequency,
            timing: formData.timing.map(time => {
                const [hours] = time.split(':');
                const hour = parseInt(hours);
                if (hour >= 5 && hour < 12) return 'morning';
                if (hour >= 12 && hour < 17) return 'afternoon';
                if (hour >= 17 && hour < 21) return 'evening';
                return 'night';
            }),
            schedule: formData.timing.sort(),
            withFood: formData.withFood,
            duration: formData.duration || 'ongoing',
            warnings: formData.warnings,
            prescribedBy: formData.prescribedBy,
            notes: formData.notes,
            manuallyAdded: true,
            startDate: new Date().toISOString().split('T')[0],
            pillsRemaining: formData.quantity !== '' ? Number(formData.quantity) : undefined,
        };

        addMedication(medication);
        setStep('success');

        setTimeout(() => {
            onNavigate('dashboard');
        }, 2000);
    };

    if (step === 'success') {
        return (
            <div className="scanner-container">
                <div className="success-screen">
                    <CheckCircle size={64} className="success-icon" />
                    <h2>Medication Added!</h2>
                    <p>{formData.drugName} has been added to your profile</p>
                </div>
            </div>
        );
    }

    return (
        <div className="scanner-container">
            <header className="scanner-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>
                    ← Back
                </button>
                <h2>Add Medication Manually</h2>
            </header>

            <div className="manual-entry-content">
                <p className="manual-entry-instructions">
                    📝 Enter your medication details below
                </p>

                <form onSubmit={handleSubmit} className="medication-form">
                    {/* Drug Name */}
                    <div className="form-group">
                        <label htmlFor="drugName">
                            Medication Name <span className="required">*</span>
                        </label>
                        <input
                            id="drugName"
                            type="text"
                            className={`form-input ${errors.drugName ? 'error' : ''}`}
                            placeholder="e.g., Aspirin, Metformin"
                            value={formData.drugName}
                            onChange={(e) => handleInputChange('drugName', e.target.value)}
                        />
                        {errors.drugName && <span className="error-message">{errors.drugName}</span>}
                    </div>

                    {/* Dosage */}
                    <div className="form-group">
                        <label htmlFor="dosage">
                            Dosage <span className="required">*</span>
                        </label>
                        <input
                            id="dosage"
                            type="text"
                            className={`form-input ${errors.dosage ? 'error' : ''}`}
                            placeholder="e.g., 100mg, 5ml, 1 tablet"
                            value={formData.dosage}
                            onChange={(e) => handleInputChange('dosage', e.target.value)}
                        />
                        {errors.dosage && <span className="error-message">{errors.dosage}</span>}
                    </div>

                    {/* Frequency */}
                    <div className="form-group">
                        <label htmlFor="frequency">Frequency</label>
                        <select
                            id="frequency"
                            className="form-select"
                            value={formData.frequency}
                            onChange={(e) => handleInputChange('frequency', e.target.value)}
                        >
                            {frequencyOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    {/* Timing */}
                    <div className="form-group">
                        <label>
                            When to take <span className="required">*</span>
                        </label>
                        <div className="timing-chips">
                            {timingOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`timing-chip ${formData.timing.includes(option.value) ? 'selected' : ''}`}
                                    onClick={() => toggleTiming(option.value)}
                                >
                                    {formData.timing.includes(option.value) ? '✓ ' : ''}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        {errors.timing && <span className="error-message">{errors.timing}</span>}
                    </div>

                    {/* With Food */}
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.withFood}
                                onChange={(e) => handleInputChange('withFood', e.target.checked)}
                            />
                            <span>Take with food 🍽️</span>
                        </label>
                    </div>

                    {/* Duration */}
                    <div className="form-group">
                        <label htmlFor="duration">Duration (optional)</label>
                        <input
                            id="duration"
                            type="text"
                            className="form-input"
                            placeholder="e.g., 30 days, ongoing, 2 weeks"
                            value={formData.duration}
                            onChange={(e) => handleInputChange('duration', e.target.value)}
                        />
                    </div>

                    {/* Warnings */}
                    <div className="form-group">
                        <label htmlFor="warnings">Warnings / Side Effects (optional)</label>
                        <div className="warnings-input-group">
                            <input
                                id="warnings"
                                type="text"
                                className="form-input"
                                placeholder="e.g., May cause dizziness"
                                value={warningInput}
                                onChange={(e) => setWarningInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addWarning();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="btn-add-warning"
                                onClick={addWarning}
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        {formData.warnings.length > 0 && (
                            <div className="warnings-list">
                                {formData.warnings.map((warning, index) => (
                                    <div key={index} className="warning-tag">
                                        <span>⚠️ {warning}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeWarning(index)}
                                            className="btn-remove-warning"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Prescribed By */}
                    <div className="form-group">
                        <label htmlFor="prescribedBy">Prescribed by (optional)</label>
                        <input
                            id="prescribedBy"
                            type="text"
                            className="form-input"
                            placeholder="e.g., Dr. Smith"
                            value={formData.prescribedBy}
                            onChange={(e) => handleInputChange('prescribedBy', e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label htmlFor="notes">Additional Notes (optional)</label>
                        <textarea
                            id="notes"
                            className="form-textarea"
                            placeholder="Any additional information..."
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                        />
                    </div>

                    {/* Quantity for refill tracker */}
                    <div className="form-group">
                        <label htmlFor="quantity">Pills in Bottle (optional)</label>
                        <input
                            id="quantity"
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="e.g., 30 — used for low supply alerts"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onNavigate('dashboard')}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            ✓ Add Medication
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
