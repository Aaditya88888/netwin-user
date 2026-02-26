import { UserProfile, PaymentMethod, PaymentResponse } from '@/types';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Payment Gateway Service
 * Handles all payment processing operations using Razorpay or Paystack
 * based on the user's locale and currency.
 */
export class PaymentGatewayService {
  /**
   * Process a deposit transaction
   * 
   * @param amount - The amount to deposit
   * @param userId - The user's ID
   * @param paymentMethod - The payment method used
   * @param currency - The currency being used
   * @returns Promise with payment status and transaction details
   */
  static async processDeposit(
    amount: number,
    userId: string,
    paymentMethod: PaymentMethod,
    currency: string = 'INR'
  ): Promise<PaymentResponse> {    try {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));
      const user = userDoc.data();

      // Create a payment intent in Firestore
      const paymentIntent = await addDoc(collection(db, 'paymentIntents'), {
        userId,
        amount,
        currency,
        paymentMethod,
        type: 'deposit',
        status: 'pending',
        createdAt: new Date(),
      });      // Based on currency, use appropriate payment gateway
      // Make sure to configure Razorpay key in your environment variables
      if (currency === 'INR') {
        const razorpayOptions = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: amount * 100, // Razorpay expects amount in paise
          currency: currency,
          name: "Netwin Gaming",
          description: `Wallet deposit for ${userId}`,
          order_id: paymentIntent.id,
          handler: async (response: any) => {
            // Update payment intent with Razorpay response
            await updateDoc(doc(db, 'paymentIntents', paymentIntent.id), {
              status: 'completed',
              gatewayResponse: response,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              completedAt: new Date()
            });

            return {
              success: true,
              gatewayReference: response.razorpay_payment_id,
              gatewayResponse: response,
              transactionId: paymentIntent.id
            };
          },
          prefill: {
            name: user?.displayName || '',
            email: user?.email || '',
          },
          theme: {
            color: "#3B82F6"
          }
        };

        return new Promise((resolve, reject) => {
          const rzp = new (window as any).Razorpay(razorpayOptions);
          rzp.on('payment.failed', (response: any) => {
            reject({
              success: false,
              error: {
                code: response.error.code,
                description: response.error.description,
                source: response.error.source,
                step: response.error.step,
                reason: response.error.reason,
              }
            });
          });
          rzp.open();
        });
      } else {
        throw new Error('Only INR currency is supported at the moment');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }
  
  /**
   * Process a withdrawal transaction
   * 
   * @param amount - The amount to withdraw
   * @param userId - The user's ID
   * @param paymentMethod - The payment method used
   * @param accountDetails - Bank account or payment details
   * @param currency - The currency being used
   * @returns Promise with payment status and transaction details
   */
  static async processWithdrawal(
    amount: number,
    userId: string,
    paymentMethod: PaymentMethod,
    accountDetails: any,
    currency: string = 'INR'
  ): Promise<PaymentResponse> {    try {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));
      const user = userDoc.data();

      // Create a withdrawal request in Firestore
      const withdrawalIntent = await addDoc(collection(db, 'withdrawalRequests'), {
        userId,
        amount,
        currency,
        paymentMethod,
        accountDetails,
        status: 'pending',
        createdAt: new Date(),
      });

      // Based on currency and payment method, process withdrawal
      if (currency === 'INR') {
        // Integrate with Razorpay payout here
        throw new Error('Razorpay payout integration pending');
      } else if (currency === 'NGN') {
        // Integrate with Paystack transfer here
        throw new Error('Paystack transfer integration pending');
      } else {
        // Integrate with Stripe transfer here
        throw new Error('Stripe transfer integration pending');
      }
    } catch (error) {
      console.error('Withdrawal processing error:', error);
      throw error;
    }
  }
  
  /**
   * Verify the status of a payment transaction
   * 
   * @param transactionId - The transaction ID to check
   * @returns Promise with payment status
   */  static async verifyPaymentStatus(transactionId: string): Promise<{
    verified: boolean;
    status: 'pending' | 'completed' | 'failed';
    message: string;
  }> {
    try {
      const db = getFirestore();
      
      // Check payment intents first
      const paymentSnapshot = await getDoc(doc(db, 'paymentIntents', transactionId));
      if (paymentSnapshot.exists()) {
        const payment = paymentSnapshot.data();
        return {
          verified: payment.status === 'completed',
          status: payment.status,
          message: payment.status === 'completed' ? 'Payment verified successfully' : 'Payment pending verification'
        };
      }
      
      // Check withdrawal requests
      const withdrawalSnapshot = await getDoc(doc(db, 'withdrawalRequests', transactionId));
      if (withdrawalSnapshot.exists()) {
        const withdrawal = withdrawalSnapshot.data();
        return {
          verified: withdrawal.status === 'completed',
          status: withdrawal.status,
          message: withdrawal.status === 'completed' ? 'Withdrawal processed successfully' : 'Withdrawal pending'
        };
      }
      
      throw new Error('Transaction not found');
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        verified: false,
        status: 'failed',
        message: 'Unable to verify payment: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }
}

export default PaymentGatewayService;
