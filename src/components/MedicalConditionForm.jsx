import React, { useState } from 'react';
import { X, Heart } from 'lucide-react';

export default function MedicalConditionForm({ condition, onSave, onCancel }) {
    const [formData, setFormData] = useState(condition || {
        name: '',
        diagnosedDate: '',
        status: 'active',
        notes: ''
    });

    const [errors, setErrors] = useState({});

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'managed', label: 'Managed' },
        { value: 'remission', label: 'In Remission' }
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

        if (!formData.name.trim()) {
            newErrors.name = 'Condition name is required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSave(formData);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content condition-modal">
                <div className="modal-header">
                    <h2>
                        <Heart size={24} />
                        {condition ? 'Edit Medical Condition' : 'Add Medical Condition'}
                    </h2>
                    <button className="btn-close" onClick={onCancel}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="name">
                            Condition Name <span className="required">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="e.g., Type 1 Diabetes, Hypertension"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="diagnosedDate">Diagnosed Date (optional)</label>
                        <input
                            id="diagnosedDate"
                            type="month"
                            className="form-input"
                            value={formData.diagnosedDate}
                            onChange={(e) => handleChange('diagnosedDate', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="status">Current Status</label>
                        <select
                            id="status"
                            className="form-select"
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Notes (optional)</label>
                        <textarea
                            id="notes"
                            className="form-textarea"
                            placeholder="Additional information, treatment details, etc."
                            rows={4}
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {condition ? 'Update Condition' : 'Add Condition'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
