import React, { useState } from 'react';
import { X, User, Phone, Mail, AlertCircle } from 'lucide-react';

export default function EmergencyContactForm({ contact, onSave, onCancel }) {
    const [formData, setFormData] = useState(contact || {
        name: '',
        relation: 'Family',
        phone: '',
        email: '',
        isPrimary: false,
        notes: ''
    });

    const [errors, setErrors] = useState({});

    const relationOptions = [
        'Family',
        'Spouse',
        'Parent',
        'Sibling',
        'Child',
        'Doctor',
        'Friend',
        'Caregiver',
        'Other'
    ];

    const validatePhone = (phone) => {
        // Basic phone validation - accepts various formats
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    };

    const validateEmail = (email) => {
        if (!email) return true; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (formData.email && !validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSave(formData);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content emergency-contact-modal">
                <div className="modal-header">
                    <h2>
                        <User size={24} />
                        {contact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                    </h2>
                    <button className="btn-close" onClick={onCancel}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="name">
                            Name <span className="required">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="relation">Relation</label>
                        <select
                            id="relation"
                            className="form-select"
                            value={formData.relation}
                            onChange={(e) => handleChange('relation', e.target.value)}
                        >
                            {relationOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">
                            Phone Number <span className="required">*</span>
                        </label>
                        <div className="input-with-icon">
                            <Phone size={20} />
                            <input
                                id="phone"
                                type="tel"
                                className={`form-input ${errors.phone ? 'error' : ''}`}
                                placeholder="+1 (555) 123-4567"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email (optional)</label>
                        <div className="input-with-icon">
                            <Mail size={20} />
                            <input
                                id="email"
                                type="email"
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.isPrimary}
                                onChange={(e) => handleChange('isPrimary', e.target.checked)}
                            />
                            <span>Set as primary contact ⭐</span>
                        </label>
                        <small className="help-text">Primary contact will be called first in emergencies</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Notes (optional)</label>
                        <textarea
                            id="notes"
                            className="form-textarea"
                            placeholder="Additional information..."
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {contact ? 'Update Contact' : 'Add Contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
