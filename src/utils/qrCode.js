import QRCode from 'qrcode';

/**
 * Generate a QR code containing emergency profile data
 * @param {Object} emergencyData - Complete emergency profile data
 * @returns {Promise<string>} Data URL of the generated QR code
 */
export async function generateEmergencyQR(emergencyData) {
    try {
        const dataString = JSON.stringify(emergencyData);

        const qrDataUrl = await QRCode.toDataURL(dataString, {
            errorCorrectionLevel: 'H', // High error correction
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Parse emergency data from QR code
 * @param {string} qrData - Data scanned from QR code
 * @returns {Object} Parsed emergency profile data
 */
export function parseEmergencyQR(qrData) {
    try {
        return JSON.parse(qrData);
    } catch (error) {
        console.error('Error parsing QR data:', error);
        throw new Error('Invalid QR code data');
    }
}
