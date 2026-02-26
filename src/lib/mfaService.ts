// Firebase Multi-Factor Authentication Service
import {
  Auth,
  MultiFactorError,
  MultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  User,
  getMultiFactorResolver,
  multiFactor
} from 'firebase/auth';
import { auth } from './firebase';

export interface MFAEnrollOptions {
  phoneNumber: string;
  displayName?: string;
}

export interface MFAVerifyOptions {
  verificationCode: string;
  verificationId: string;
}

export interface MFAState {
  enrolled: boolean;
  enrolledFactors: { factorId: string; displayName?: string; phoneNumber?: string }[];
  isResolving: boolean;
  resolver?: MultiFactorResolver;
  verificationId?: string;
  selectedIndex?: number;
}

class MultiFactorAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private verificationId: string | null = null;

  // Initialize reCAPTCHA
  private async getRecaptchaVerifier(): Promise<RecaptchaVerifier> {
    if (this.recaptchaVerifier) {
      // Clear and reinitialize recaptcha to ensure freshness
      try {
        this.recaptchaVerifier.clear();
      } catch (error) {
        console.warn('Error clearing reCAPTCHA:', error);
      }
    }

    // Create a container for reCAPTCHA if it doesn't exist
    let recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) {
      recaptchaContainer = document.createElement('div');
      recaptchaContainer.id = 'recaptcha-container';
      recaptchaContainer.style.display = 'none';
      document.body.appendChild(recaptchaContainer);
    }

    this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        },
      'expired-callback': () => {
        this.recaptchaVerifier = null;
      }
    });

    await this.recaptchaVerifier.render();
    return this.recaptchaVerifier;
  }

  // Clean up reCAPTCHA
  public clearRecaptcha() {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      } catch (error) {
        console.warn('Error clearing reCAPTCHA:', error);
      }
    }

    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  // Get multi-factor state for user
  public async getMFAState(user?: User): Promise<MFAState> {
    if (!user) {
      return {
        enrolled: false,
        enrolledFactors: [],
        isResolving: false
      };
    }

    try {
      const multiFactorUser = multiFactor(user);      const enrolledFactors = multiFactorUser.enrolledFactors.map(factor => ({
        factorId: factor.factorId,
        displayName: factor.displayName || undefined,
        phoneNumber: factor.uid.startsWith('+') ? factor.uid : undefined
      }));

      return {
        enrolled: enrolledFactors.length > 0,
        enrolledFactors,
        isResolving: false
      };
    } catch (error) {
      console.error('Error getting MFA state:', error);
      return {
        enrolled: false,
        enrolledFactors: [],
        isResolving: false
      };
    }
  }

  // Start enrollment process
  public async startEnrollment(
    user: User, 
    enrollOptions: MFAEnrollOptions
  ): Promise<{ verificationId: string }> {
    try {
      // Get multi-factor session
      const multiFactorUser = multiFactor(user);
      const multiFactorSession = await multiFactorUser.getSession();

      // Initialize reCAPTCHA
      const recaptchaVerifier = await this.getRecaptchaVerifier();

      // Setup phone options
      const phoneInfoOptions = {
        phoneNumber: enrollOptions.phoneNumber,
        session: multiFactorSession
      };

      // Get phone provider
      const phoneAuthProvider = new PhoneAuthProvider(auth);

      // Send verification code
      this.verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions, 
        recaptchaVerifier
      );

      return { verificationId: this.verificationId };
    } catch (error) {
      console.error('❌ Error starting MFA enrollment:', error);
      this.clearRecaptcha();
      throw error;
    }
  }

  // Complete enrollment with verification code
  public async completeEnrollment(
    user: User,
    mfaVerifyOptions: MFAVerifyOptions,
    displayName?: string
  ): Promise<void> {
    try {
      // Create credential
      const credential = PhoneAuthProvider.credential(
        mfaVerifyOptions.verificationId,
        mfaVerifyOptions.verificationCode
      );

      // Create assertion
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      
      // Enroll with optional display name
      const multiFactorUser = multiFactor(user);
      await multiFactorUser.enroll(multiFactorAssertion, displayName || "My phone number");
      
      this.clearRecaptcha();
    } catch (error) {
      console.error('❌ Failed to complete MFA enrollment:', error);
      this.clearRecaptcha();
      throw error;
    }
  }

  // Handle MFA requirement during sign-in
  public async handleMultiFactorError(
    error: MultiFactorError
  ): Promise<MFAState> {
    try {
      // If this isn't an MFA error, rethrow
      if (error.code !== 'auth/multi-factor-auth-required') {
        throw error;
      }

      // Get MFA resolver
      const resolver = getMultiFactorResolver(auth, error);
        // Return factors info and resolver for UI to handle
      return {
        enrolled: true,
        enrolledFactors: resolver.hints.map((hint) => ({
          factorId: hint.factorId,
          displayName: hint.displayName || undefined,
          // For phone hints, we can safely access phoneNumber with type casting
          phoneNumber: hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID 
            ? (hint as any).phoneNumber 
            : undefined
        })),
        isResolving: true,
        resolver
      };
    } catch (error) {
      console.error('❌ Error handling MFA requirement:', error);
      throw error;
    }
  }

  // Start verification process for sign-in
  public async startVerification(
    resolver: MultiFactorResolver,
    selectedIndex: number
  ): Promise<{ verificationId: string }> {
    try {
      // Initialize reCAPTCHA
      const recaptchaVerifier = await this.getRecaptchaVerifier();
      
      // Setup phone info options
      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[selectedIndex],
        session: resolver.session
      };
      
      // Get phone provider
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      
      // Send verification code
      this.verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions, 
        recaptchaVerifier
      );
      
      return { 
        verificationId: this.verificationId
      };
    } catch (error) {
      console.error('❌ Error starting MFA verification:', error);
      this.clearRecaptcha();
      throw error;
    }
  }

  // Complete verification for sign-in
  public async completeVerification(
    resolver: MultiFactorResolver,
    mfaVerifyOptions: MFAVerifyOptions
  ) {
    try {
      // Create credential
      const credential = PhoneAuthProvider.credential(
        mfaVerifyOptions.verificationId,
        mfaVerifyOptions.verificationCode
      );
      
      // Create assertion
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      
      // Resolve sign-in
      const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
      
      this.clearRecaptcha();
      
      return userCredential;
    } catch (error) {
      console.error('❌ Failed to complete MFA verification:', error);
      this.clearRecaptcha();
      throw error;
    }
  }
  // Unenroll a second factor
  public async unenrollFactor(user: User, factorUid: string): Promise<void> {
    try {
      const multiFactorUser = multiFactor(user);
      
      // Find the factor with matching uid
      const factorToRemove = multiFactorUser.enrolledFactors.find(
        factor => factor.uid === factorUid
      );
      
      if (!factorToRemove) {
        throw new Error('Factor not found');
      }
      
      // Unenroll the factor
      await multiFactorUser.unenroll(factorToRemove);
      } catch (error) {
      console.error('❌ Failed to unenroll MFA factor:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const mfaService = new MultiFactorAuthService();
export default mfaService;
