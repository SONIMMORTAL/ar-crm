import QRCode from 'qrcode'

export async function generateQRCodeDataURL(data: string): Promise<string> {
    try {
        return await QRCode.toDataURL(data, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        })
    } catch (err) {
        console.error('Error generating QR code DataURL:', err)
        throw err
    }
}

export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
    try {
        return await QRCode.toBuffer(data, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H',
        })
    } catch (err) {
        console.error('Error generating QR code Buffer:', err)
        throw err
    }
}
