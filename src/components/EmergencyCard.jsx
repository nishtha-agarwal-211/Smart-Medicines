import React, { useState, useEffect } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { useEmergencyProfile } from '../context/EmergencyProfileContext';
import { useMedications } from '../context/MedicationContext';
import { generateEmergencyQR } from '../utils/qrCode';
import { generateEmergencyPDF, downloadPDF } from '../utils/emergencyPdf';

export default function EmergencyCard({ onNavigate, patientName = 'Patient' }) {
    const {
        emergencyContacts,
        criticalMedications,
        allergies,
        medicalConditions,
        emergencyInfo
    } = useEmergencyProfile();

    const { medications } = useMedications();
    const [qrCode, setQrCode] = useState('');

    // Get critical medications with details
    const criticalMedsWithDetails = medications.filter(med =>
        criticalMedications.includes(med.id)
    );

    // Generate emergency data for QR code
    const emergencyData = {
        emergencyContacts,
        criticalMedications: criticalMedsWithDetails.map(med => ({
            drugName: med.drugName,
            dosage: med.dosage,
            frequency: med.frequency,
            warnings: med.warnings
        })),
        allergies,
        medicalConditions,
        emergencyInfo,
        generatedAt: new Date().toISOString()
    };

    // Generate QR code on mount
    useEffect(() => {
        generateEmergencyQR(emergencyData).then(setQrCode).catch(console.error);
    }, []);

    const handleDownloadPDF = async () => {
        try {
            const doc = generateEmergencyPDF(emergencyData, qrCode, patientName || 'Patient');
            downloadPDF(doc, `emergency_card_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                // Generate PDF as blob for sharing
                const doc = generateEmergencyPDF(emergencyData, qrCode, patientName || 'Patient');
                const pdfBlob = doc.output('blob');
                const safeName = (patientName || 'patient').toLowerCase().replace(/\s+/g, '_');
                const file = new File([pdfBlob], `emergency_card_${safeName}.pdf`, { type: 'application/pdf' });

                await navigator.share({
                    title: 'Emergency Medical Information',
                    text: 'My emergency medical profile',
                    files: [file]
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            alert('Sharing is not supported on this device. Please use the download button.');
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'severe':
                return '#DC3545';
            case 'moderate':
                return '#FF8C00';
            case 'mild':
                return '#FFC107';
            default:
                return '#6C757D';
        }
    };

    return (
        <div className="emergency-card-container">
            <header className="emergency-card-header">
                <button className="btn-back" onClick={() => onNavigate('emergency')}>
                    <X size={24} /> Close
                </button>
                <div className="emergency-card-actions">
                    <button className="btn-secondary" onClick={handleDownloadPDF}>
                        <Download size={20} /> Download PDF
                    </button>
                    {navigator.share && (
                        <button className="btn-primary" onClick={handleShare}>
                            <Share2 size={20} /> Share
                        </button>
                    )}
                </div>
            </header>

            <div className="emergency-card-wrapper">
                <div className="emergency-card">
                    {/* Header */}
                    <div className="emergency-card-title">
                        <h1>⚠️ EMERGENCY MEDICAL INFO</h1>
                        <p className="patient-name">{patientName ? patientName.toUpperCase() : 'PATIENT'}</p>
                    </div>

                    {/* Critical Medications */}
                    {criticalMedsWithDetails.length > 0 && (
                        <div className="emergency-card-section">
                            <h2 className="section-title critical">🆘 CRITICAL MEDICATIONS</h2>
                            <ul className="emergency-list">
                                {criticalMedsWithDetails.map(med => (
                                    <li key={med.id}>
                                        <strong>{med.drugName}</strong> ({med.dosage})
                                        <div className="med-details">{med.frequency}</div>
                                        {med.warnings && med.warnings.length > 0 && (
                                            <div className="med-warnings">
                                                {med.warnings.map((warning, idx) => (
                                                    <span key={idx} className="warning-pill">⚠️ {warning}</span>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Allergies */}
                    {allergies.length > 0 && (
                        <div className="emergency-card-section">
                            <h2 className="section-title allergies">⚠️ ALLERGIES</h2>
                            <ul className="emergency-list">
                                {allergies.map(allergy => (
                                    <li key={allergy.id}>
                                        <strong>{allergy.allergen}</strong>
                                        <span
                                            className="severity-pill"
                                            style={{ backgroundColor: getSeverityColor(allergy.severity) }}
                                        >
                                            {allergy.severity.toUpperCase()}
                                        </span>
                                        <div className="allergy-reaction">{allergy.reaction}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Medical Conditions */}
                    {medicalConditions.length > 0 && (
                        <div className="emergency-card-section">
                            <h2 className="section-title conditions">🏥 MEDICAL CONDITIONS</h2>
                            <ul className="emergency-list">
                                {medicalConditions.map(condition => (
                                    <li key={condition.id}>
                                        <strong>{condition.name}</strong>
                                        {condition.status && (
                                            <span className="status-pill">{condition.status}</span>
                                        )}
                                        {condition.notes && (
                                            <div className="condition-note">{condition.notes}</div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Blood Type & Organ Donor */}
                    {(emergencyInfo.bloodType || emergencyInfo.organDonor !== undefined) && (
                        <div className="emergency-card-section">
                            {emergencyInfo.bloodType && (
                                <div className="info-item">
                                    <strong>🩸 Blood Type:</strong> {emergencyInfo.bloodType}
                                </div>
                            )}
                            {emergencyInfo.organDonor !== undefined && (
                                <div className="info-item">
                                    <strong>💚 Organ Donor:</strong> {emergencyInfo.organDonor ? 'Yes' : 'No'}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Emergency Notes */}
                    {emergencyInfo.emergencyNotes && (
                        <div className="emergency-card-section">
                            <h2 className="section-title">📋 Emergency Notes</h2>
                            <p className="emergency-notes">{emergencyInfo.emergencyNotes}</p>
                        </div>
                    )}

                    {/* Emergency Contacts */}
                    {emergencyContacts.length > 0 && (
                        <div className="emergency-card-section">
                            <h2 className="section-title">📞 EMERGENCY CONTACTS</h2>
                            <ul className="emergency-list contact-list">
                                {emergencyContacts.map(contact => (
                                    <li key={contact.id}>
                                        <strong>{contact.name}</strong> ({contact.relation})
                                        {contact.isPrimary && <span className="primary-badge">⭐ PRIMARY</span>}
                                        <div className="contact-phone">📱 {contact.phone}</div>
                                        {contact.email && (
                                            <div className="contact-email">✉️ {contact.email}</div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* QR Code */}
                    {qrCode && (
                        <div className="emergency-card-qr">
                            <img src={qrCode} alt="Emergency Profile QR Code" />
                            <p>Scan for full digital profile</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="emergency-card-footer">
                        <p>Generated: {new Date().toLocaleString()}</p>
                        <p>Smart Medicine Companion</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
