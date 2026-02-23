const QRCode = require('qrcode');

const generateQRCode = async (data) => {
    try {
        const qrDataURL = await QRCode.toDataURL(JSON.stringify(data), {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        return qrDataURL;
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw error;
    }
};

module.exports = generateQRCode;
