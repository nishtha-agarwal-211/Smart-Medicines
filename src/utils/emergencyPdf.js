import jsPDF from 'jspdf';

/**
 * Generate a PDF emergency card
 * @param {Object} emergencyData - Emergency profile data
 * @param {string} qrCodeDataUrl - QR code as data URL
 * @param {string} userName - Patient name
 * @returns {jsPDF} PDF document
 */
export function generateEmergencyPDF(emergencyData, qrCodeDataUrl, userName = 'Patient') {
    const doc = new jsPDF();

    let y = 20;
    const leftMargin = 20;
    const pageWidth = 190; // 210mm - 20mm margins

    // Header
    doc.setFillColor(220, 53, 69);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('⚠️ EMERGENCY MEDICAL INFO', 105, 20, { align: 'center' });

    // Patient name
    doc.setFontSize(16);
    doc.text(userName, 105, 28, { align: 'center' });

    y = 45;
    doc.setTextColor(0, 0, 0);

    // Critical Medications
    if (emergencyData.criticalMedications && emergencyData.criticalMedications.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('🆘 CRITICAL MEDICATIONS', leftMargin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        emergencyData.criticalMedications.forEach(med => {
            doc.text(`• ${med.drugName} (${med.dosage})`, leftMargin + 5, y);
            y += 6;
        });
        y += 5;
    }

    // Allergies
    if (emergencyData.allergies && emergencyData.allergies.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('⚠️ ALLERGIES', leftMargin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        emergencyData.allergies.forEach(allergy => {
            const severityText = allergy.severity.toUpperCase();
            doc.text(`• ${allergy.allergen} (${severityText})`, leftMargin + 5, y);
            y += 5;
            if (allergy.reaction) {
                doc.setFontSize(9);
                doc.text(`  Reaction: ${allergy.reaction}`, leftMargin + 7, y);
                doc.setFontSize(11);
                y += 5;
            }
            y += 2;
        });
        y += 5;
    }

    // Medical Conditions
    if (emergencyData.medicalConditions && emergencyData.medicalConditions.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('🏥 MEDICAL CONDITIONS', leftMargin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        emergencyData.medicalConditions.forEach(condition => {
            doc.text(`• ${condition.name}`, leftMargin + 5, y);
            y += 6;
        });
        y += 5;
    }

    // Blood Type & Organ Donor
    if (emergencyData.emergencyInfo) {
        const { bloodType, organDonor } = emergencyData.emergencyInfo;

        if (bloodType) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`🩸 Blood Type: ${bloodType}`, leftMargin, y);
            y += 8;
        }

        if (organDonor !== undefined && organDonor !== null) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`💚 Organ Donor: ${organDonor ? 'Yes' : 'No'}`, leftMargin, y);
            y += 10;
        }
    }

    // Emergency Contacts
    if (emergencyData.emergencyContacts && emergencyData.emergencyContacts.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('📞 EMERGENCY CONTACTS', leftMargin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        emergencyData.emergencyContacts.forEach(contact => {
            doc.text(`${contact.name} (${contact.relation})`, leftMargin + 5, y);
            y += 5;
            doc.text(`📱 ${contact.phone}`, leftMargin + 5, y);
            y += 8;
        });
    }

    // QR Code
    if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, 'PNG', 80, y + 10, 50, 50);
        y += 60;
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.text('Scan for full digital profile', 105, y, { align: 'center' });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
    doc.text('Smart Medicine Companion', 105, 290, { align: 'center' });

    return doc;
}

/**
 * Download PDF document
 * @param {jsPDF} doc - PDF document
 * @param {string} filename - Filename for download
 */
export function downloadPDF(doc, filename = 'emergency_card.pdf') {
    doc.save(filename);
}
