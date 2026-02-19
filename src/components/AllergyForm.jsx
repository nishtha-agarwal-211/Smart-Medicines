import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function AllergyForm({ allergy, onSave, onCancel }) {
    const [formData, setFormData] = useState(allergy || {
        allergen: '',
        severity: 'moderate',
        reaction: '',
        dateDiscovered: ''
    });

    const [errors, setErrors] = useState({});

    const severityOptions = [
        { value: 'severe', label: 'Severe', color: 'danger' },
        { value: 'moderate', label: 'Moderate', color: 'warning' },
        { value: 'mild', label: 'Mild', color: 'info' }
    ];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};

        if (!formData.allergen.trim()) {
            newErrors.allergen = 'Allergen name is required';
        }

        if (!formData.reaction.trim()) {
            newErrors.reaction = 'Reaction description is required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSave(formData);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content allergy-modal">
                <div className="modal-header">
                    <h2>
                        <AlertTriangle size={24} />
                        {allergy ? 'Edit Allergy' : 'Add Allergy'}
                    </h2>
                    <button className="btn-close" onClick={onCancel}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="allergen">
                            Allergen <span className="required">*</span>
                        </label>
                        <input
                            id="allergen"
                            type="text"
                            className={`form-input ${errors.allergen ? 'error' : ''}`}
                            placeholder="e.g., Penicillin, Peanuts, Latex"
                            value={formData.allergen}
                            onChange={(e) => handleChange('allergen', e.target.value)}
                        />
                        {errors.allergen && <span className="error-message">{errors.allergen}</span>}
                    </div>

                    <div className="form-group">
                        <label>
                            Severity <span className="required">*</span>
                        </label>
                        <div className="severity-selector">
                            {severityOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`severity-btn severity-${option.color} ${formData.severity === option.value ? 'active' : ''
                                        }`}
                                    onClick={() => handleChange('severity', option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="reaction">
                            Reaction <span className="required">*</span>
                        </label>
                        <textarea
                            id="reaction"
                            className={`form-textarea ${errors.reaction ? 'error' : ''}`}
                            placeholder="Describe the reaction (e.g., rash, difficulty breathing, swelling)"
                            rows={4}
                            value={formData.reaction}
                            onChange={(e) => handleChange('reaction', e.target.value)}
                        />
                        {errors.reaction && <span className="error-message">{errors.reaction}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="dateDiscovered">Date First Discovered (optional)</label>
                        <input
                            id="dateDiscovered"
                            type="month"
                            className="form-input"
                            value={formData.dateDiscovered}
                            onChange={(e) => handleChange('dateDiscovered', e.target.value)}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {allergy ? 'Update Allergy' : 'Add Allergy'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
