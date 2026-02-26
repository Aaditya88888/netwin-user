import QRCode from 'qrcode';

export interface UPIPaymentDetails {
  pa: string; // UPI ID
  pn?: string; // Payee name
  tr?: string; // Transaction reference
  tn?: string; // Transaction note
  am?: string; // Amount
  cu?: string; // Currency
}

/**
 * Generate UPI payment URL
 */
export function generateUPIUrl(details: UPIPaymentDetails): string {
  const params = new URLSearchParams();
  
  Object.entries(details).forEach(([key, value]) => {
    if (value) {
      params.append(key, value.toString());
    }
  });
  
  return `upi://pay?${params.toString()}`;
}

/**
 * Generate QR code for UPI payment
 */
export async function generateUPIQRCode(
  upiId: string,
  payeeName?: string,
  amount?: number,
  note?: string
): Promise<string> {
  try {
    const upiDetails: UPIPaymentDetails = {
      pa: upiId,
      pn: payeeName || 'Netwin Gaming',
      tn: note || 'Add money to wallet',
    };
    
    if (amount) {
      upiDetails.am = amount.toString();
      upiDetails.cu = 'INR';
    }
    
    const upiUrl = generateUPIUrl(upiDetails);
    const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating UPI QR code:', error);
    throw error;
  }
}

/**
 * Validate UPI ID format
 */
export function validateUPIId(upiId: string): boolean {
  // UPI ID format: username@bank
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
}

/**
 * Format UPI transaction reference
 */
export function generateUPITransactionRef(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `UPI${timestamp}${random}`;
}
