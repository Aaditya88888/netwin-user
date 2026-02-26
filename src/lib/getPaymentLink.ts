// Service to fetch payment links for wallet deposit (main app)
import { getFirestore, doc, getDoc } from "firebase/firestore";

const WALLET_CONFIG_DOC = 'admin_config/wallet_config';

export async function getPaymentLinkForCountry(country: string): Promise<string | undefined> {
  const db = getFirestore();
  const docRef = doc(db, WALLET_CONFIG_DOC);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    // Map country to Firestore key
    let key: string | undefined;
    if (country === 'Nigeria') key = 'NGN';
    else if (country === 'USA' || country === 'United States') key = 'USD';
    else if (country === 'India') key = 'INR';
    else key = undefined;
    
    if (key && data[key] && data[key].paymentLink) {
      return data[key].paymentLink;
    }
  }
  return undefined;
}
