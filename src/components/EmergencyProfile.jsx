import React, { useState } from 'react';
import { Phone, Mail, Edit2, Trash2, Plus, AlertTriangle, Heart, Droplet, Share2, Download } from 'lucide-react';
import { useEmergencyProfile } from '../context/EmergencyProfileContext';
import { useMedications } from '../context/MedicationContext';
import { useUserProfile } from '../context/UserProfileContext';
import EmergencyContactForm from './EmergencyContactForm';
import AllergyForm from './AllergyForm';
import MedicalConditionForm from './MedicalConditionForm';
import ConfirmModal from './ConfirmModal';

export default function EmergencyProfile({ onNavigate }) {
    const {
        emergencyContacts, allergies, medicalConditions,
        criticalMedications, markCriticalMedication,
        addEmergencyContact, updateEmergencyContact, removeEmergencyContact,
        addAllergy, updateAllergy, removeAllergy,
        addMedicalCondition, updateMedicalCondition, removeMedicalCondition,
        emergencyInfo, updateEmergencyInfo
    } = useEmergencyProfile();
    const { medications } = useMedications();
    const { profile } = useUserProfile();

    // Pre-fill blood type from user profile if not already set in emergency info
    const effectiveBloodType = emergencyInfo.bloodType || profile.bloodType || '';

    const [showContactForm, setShowContactForm] = useState(false);
    const [showAllergyForm, setShowAllergyForm] = useState(false);
    const [showConditionForm, setShowConditionForm] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [editingAllergy, setEditingAllergy] = useState(null);
    const [editingCondition, setEditingCondition] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    // Get critical medications with details
    const criticalMedsWithDetails = medications.filter(med =>
        criticalMedications.includes(med.id)
    );

    // Handlers for Emergency Contacts
    const handleSaveContact = (contactData) => {
        if (editingContact) {
            updateEmergencyContact(editingContact.id, contactData);
        } else {
            const newContact = addEmergencyContact(contactData);
            if (contactData.isPrimary) {
                setPrimaryContact(newContact.id);
            }
        }
        setShowContactForm(false);
        setEditingContact(null);
    };

    const handleEditContact = (contact) => {
        setEditingContact(contact);
        setShowContactForm(true);
    };

    const handleDeleteContact = (id, name) => {
        setConfirmModal({
            title: 'Remove Contact?',
            message: `"${name}" will be removed from your emergency contacts.`,
            onConfirm: () => removeEmergencyContact(id),
        });
    };

    // Handlers for Allergies
    const handleSaveAllergy = (allergyData) => {
        if (editingAllergy) {
            updateAllergy(editingAllergy.id, allergyData);
        } else {
            addAllergy(allergyData);
        }
        setShowAllergyForm(false);
        setEditingAllergy(null);
    };

    const handleEditAllergy = (allergy) => {
        setEditingAllergy(allergy);
        setShowAllergyForm(true);
    };

    const handleDeleteAllergy = (id, name) => {
        setConfirmModal({
            title: 'Remove Allergy?',
            message: `"${name}" will be removed from your allergy list.`,
            onConfirm: () => removeAllergy(id),
        });
    };

    // Handlers for Medical Conditions
    const handleSaveCondition = (conditionData) => {
        if (editingCondition) {
            updateMedicalCondition(editingCondition.id, conditionData);
        } else {
            addMedicalCondition(conditionData);
        }
        setShowConditionForm(false);
        setEditingCondition(null);
    };

    const handleEditCondition = (condition) => {
        setEditingCondition(condition);
        setShowConditionForm(true);
    };

    const handleDeleteCondition = (id, name) => {
        setConfirmModal({
            title: 'Remove Condition?',
            message: `"${name}" will be removed from your medical conditions.`,
            onConfirm: () => removeMedicalCondition(id),
        });
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'severe':
                return 'severity-severe';
            case 'moderate':
                return 'severity-moderate';
            case 'mild':
                return 'severity-mild';
            default:
                return '';
        }
    };

    return (
        <div className="scanner-container emergency-profile-container">
            <header className="scanner-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>
                    ← Back
                </button>
                <h2>🚨 Emergency Profile</h2>
                <button
                    className="btn-primary"
                    onClick={() => onNavigate('emergency-card')}
                >
                    View Card
                </button>
            </header>

            <div className="emergency-profile-content">
                <p className="emergency-instructions">
                    ⚠️ This information will be available to first responders in emergencies
                </p>

                {/* Emergency Contacts Section */}
                <section className="emergency-section">
                    <div className="section-header">
                        <h3>📞 Emergency Contacts</h3>
                        <button
                            className="btn-primary btn-sm"
                            onClick={() => {
                                setEditingContact(null);
                                setShowContactForm(true);
                            }}
                        >
                            <Plus size={18} /> Add Contact
                        </button>
                    </div>

                    {emergencyContacts.length === 0 ? (
                        <div className="empty-state-small">
                            <p>No emergency contacts added yet</p>
                        </div>
                    ) : (
                        <div className="contact-list">
                            {emergencyContacts.map(contact => (
                                <div key={contact.id} className="contact-card">
                                    <div className="contact-info">
                                        <div className="contact-header">
                                            <h4>{contact.name} {contact.isPrimary && '⭐'}</h4>
                                            <span className="contact-relation">{contact.relation}</span>
                                        </div>
                                        <div className="contact-details">
                                            <div className="detail-item">
                                                <Phone size={16} />
                                                <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                                            </div>
                                            {contact.email && (
                                                <div className="detail-item">
                                                    <Mail size={16} />
                                                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                                                </div>
                                            )}
                                        </div>
                                        {contact.notes && (
                                            <p className="contact-notes">{contact.notes}</p>
                                        )}
                                    </div>
                                    <div className="contact-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleEditContact(contact)}
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            className="btn-icon btn-danger"
                                            onClick={() => handleDeleteContact(contact.id, contact.name)}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Critical Medications Section */}
                <section className="emergency-section">
                    <div className="section-header">
                        <h3>💊 Critical Medications</h3>
                    </div>

                    {medications.length === 0 ? (
                        <div className="empty-state-small">
                            <p>No medications added yet</p>
                            <button className="btn-secondary btn-sm" onClick={() => onNavigate('manual')}>
                                Add Medication
                            </button>
                        </div>
                    ) : (
                        <div className="medication-checklist">
                            {medications.map(med => (
                                <label key={med.id} className="checkbox-card">
                                    <input
                                        type="checkbox"
                                        checked={criticalMedications.includes(med.id)}
                                        onChange={(e) => markCriticalMedication(med.id, e.target.checked)}
                                    />
                                    <div className="checkbox-card-content">
                                        <h4>{med.drugName}</h4>
                                        <p>{med.dosage} • {med.frequency}</p>
                                        {med.warnings && med.warnings.length > 0 && (
                                            <span className="warning-badge">⚠️ Has Warnings</span>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </section>

                {/* Allergies Section */}
                <section className="emergency-section">
                    <div className="section-header">
                        <h3>⚠️ Allergies</h3>
                        <button
                            className="btn-primary btn-sm"
                            onClick={() => {
                                setEditingAllergy(null);
                                setShowAllergyForm(true);
                            }}
                        >
                            <Plus size={18} /> Add Allergy
                        </button>
                    </div>

                    {allergies.length === 0 ? (
                        <div className="empty-state-small">
                            <p>No allergies recorded</p>
                        </div>
                    ) : (
                        <div className="allergy-list">
                            {allergies.map(allergy => (
                                <div key={allergy.id} className={`allergy-card ${getSeverityColor(allergy.severity)}`}>
                                    <div className="allergy-header">
                                        <h4>{allergy.allergen}</h4>
                                        <span className="severity-badge">{allergy.severity.toUpperCase()}</span>
                                    </div>
                                    <p className="allergy-reaction">{allergy.reaction}</p>
                                    {allergy.dateDiscovered && (
                                        <p className="allergy-date">
                                            Discovered: {new Date(allergy.dateDiscovered + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </p>
                                    )}
                                    <div className="allergy-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleEditAllergy(allergy)}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn-icon btn-danger"
                                            onClick={() => handleDeleteAllergy(allergy.id, allergy.allergen)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Medical Conditions Section */}
                <section className="emergency-section">
                    <div className="section-header">
                        <h3>🏥 Medical Conditions</h3>
                        <button
                            className="btn-primary btn-sm"
                            onClick={() => {
                                setEditingCondition(null);
                                setShowConditionForm(true);
                            }}
                        >
                            <Plus size={18} /> Add Condition
                        </button>
                    </div>

                    {medicalConditions.length === 0 ? (
                        <div className="empty-state-small">
                            <p>No medical conditions recorded</p>
                        </div>
                    ) : (
                        <div className="condition-list">
                            {medicalConditions.map(condition => (
                                <div key={condition.id} className="condition-card">
                                    <div className="condition-header">
                                        <h4>{condition.name}</h4>
                                        <span className={`status-badge status-${condition.status}`}>
                                            {condition.status}
                                        </span>
                                    </div>
                                    {condition.diagnosedDate && (
                                        <p className="condition-date">
                                            Diagnosed: {new Date(condition.diagnosedDate + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </p>
                                    )}
                                    {condition.notes && (
                                        <p className="condition-notes">{condition.notes}</p>
                                    )}
                                    <div className="condition-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleEditCondition(condition)}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn-icon btn-danger"
                                            onClick={() => handleDeleteCondition(condition.id, condition.name)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Additional Information Section */}
                <section className="emergency-section">
                    <div className="section-header">
                        <h3>📋 Additional Information</h3>
                    </div>

                    <div className="emergency-info-form">
                        <div className="form-group">
                            <label htmlFor="bloodType">
                                <Droplet size={18} /> Blood Type
                            </label>
                            <select
                                id="bloodType"
                                className="form-select"
                                value={effectiveBloodType}
                                onChange={(e) => updateEmergencyInfo({ bloodType: e.target.value })}
                            >
                                <option value="">Select blood type</option>
                                {bloodTypeOptions.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={emergencyInfo.organDonor || false}
                                    onChange={(e) => updateEmergencyInfo({ organDonor: e.target.checked })}
                                />
                                <span>💚 Registered Organ Donor</span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label htmlFor="emergencyNotes">Emergency Notes</label>
                            <textarea
                                id="emergencyNotes"
                                className="form-textarea"
                                placeholder="Any additional information first responders should know..."
                                rows={4}
                                value={emergencyInfo.emergencyNotes || ''}
                                onChange={(e) => updateEmergencyInfo({ emergencyNotes: e.target.value })}
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Modals */}
            {showContactForm && (
                <EmergencyContactForm
                    contact={editingContact}
                    onSave={handleSaveContact}
                    onCancel={() => {
                        setShowContactForm(false);
                        setEditingContact(null);
                    }}
                />
            )}

            {showAllergyForm && (
                <AllergyForm
                    allergy={editingAllergy}
                    onSave={handleSaveAllergy}
                    onCancel={() => {
                        setShowAllergyForm(false);
                        setEditingAllergy(null);
                    }}
                />
            )}

            {showConditionForm && (
                <MedicalConditionForm
                    condition={editingCondition}
                    onSave={handleSaveCondition}
                    onCancel={() => {
                        setShowConditionForm(false);
                        setEditingCondition(null);
                    }}
                />
            )}

            {confirmModal && (
                <ConfirmModal
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmLabel="Remove"
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                />
            )}
        </div>
    );
}
