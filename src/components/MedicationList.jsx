import React from 'react';
import { useMedications } from '../context/MedicationContext';
import { Pill, Edit, Trash2, Clock, AlertTriangle } from 'lucide-react';

export default function MedicationList({ onNavigate }) {
    const { medications, deleteMedication } = useMedications();

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            deleteMedication(id);
        }
    };

    return (
        <div className="medications-container">
            <header className="medications-header">
                <button className="btn-back" onClick={() => onNavigate('dashboard')}>
                    ← Back
                </button>
                <h2>My Medications</h2>
                <button className="btn-add" onClick={() => onNavigate('scan')}>
                    + Add
                </button>
            </header>

            {medications.length === 0 ? (
                <div className="empty-state">
                    <Pill size={48} />
                    <h3>No medications yet</h3>
                    <p>Scan a prescription to get started</p>
                    <button className="btn-primary" onClick={() => onNavigate('scan')}>
                        📸 Scan Prescription
                    </button>
                </div>
            ) : (
                <div className="medications-list">
                    {medications.map(medication => (
                        <MedicationCard
                            key={medication.id}
                            medication={medication}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function MedicationCard({ medication, onDelete }) {
    const [expanded, setExpanded] = React.useState(false);

    return (
        <div className="medication-card">
            <div className="medication-card-header" onClick={() => setExpanded(!expanded)}>
                <div className="medication-icon">💊</div>
                <div className="medication-title">
                    <h3>{medication.drugName}</h3>
                    <p>{medication.dosage} • {medication.frequency}</p>
                </div>
                <button className="expand-btn">
                    {expanded ? '▼' : '▶'}
                </button>
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
                            <div>
                                <strong>Take with food</strong>
                            </div>
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

                    {medication.aiExtracted && (
                        <div className="ai-badge">
                            <span>🤖 AI Extracted</span>
                        </div>
                    )}

                    <div className="medication-actions">
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
