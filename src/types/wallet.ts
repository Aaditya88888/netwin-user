export interface TransactionMetadata {
  paymentMethod?: string;
  simulatedGateway?: string;
  gatewayReference?: string;
  gatewayResponse?: {
    code: string;
    message: string;
    status: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    ifscCode?: string;
  };
  tournamentId?: string;
  tournamentTitle?: string;
  transactionId?: string;
  withdrawalRequestId?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'prize' | 'entry_fee';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: string;
  description: string;
  metadata?: TransactionMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'razorpay' | 'stripe' | 'paystack' | 'bank_transfer';
