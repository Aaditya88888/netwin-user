// New types for UPI-based wallet system
export interface PendingDeposit {
  id?: string;
  userId: string;
  amount: number;
  currency: string;
  upiRefId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt?: Date | null;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  screenshotUrl?: string | null; // Add screenshotUrl for admin UI
  userUpiId?: string;
  userDetails?: {
    name: string;
    email: string;
    username?: string;
  };
}

export interface PendingWithdrawal {
  id?: string;
  userId: string;
  amount: number;
  currency: string;
  upiId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt?: Date | null;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  userDetails?: {
    name: string;
    email: string;
    username?: string;
  };
}

export interface AdminWalletConfig {
  INR?: {
    upiId?: string;
    qrCodeUrl?: string;
    displayName?: string;
    isActive: boolean;
    updatedAt?: Date;
    updatedBy?: string;
  };
  NGN?: {
    paymentLink?: string;
    displayName?: string;
    isActive: boolean;
    updatedAt?: Date;
    updatedBy?: string;
  };
  USD?: {
    paymentLink?: string;
    displayName?: string;
    isActive: boolean;
    updatedAt?: Date;
    updatedBy?: string;
  };
}

export interface DepositRequest {
  amount: number;
  upiRefId: string;
  currency: string;
}

export interface WithdrawalRequest {
  amount: number;
  upiId: string;
  currency: string;
}
