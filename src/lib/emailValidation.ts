import { z } from "zod";

// Disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
  'throwaway.email', 'maildrop.cc', 'yopmail.com', 'temp-mail.org',
  'getnada.com', 'mohmal.com', 'sharklasers.com', 'grr.la',
  'dispostable.com', 'tempail.com', 'mailtemp.info', 'fake-mail.ml',
  'tempmail.net', 'tempinbox.com', '10minutesemail.net', 'tempr.email',
  'tmailor.com', 'qwerty.email', 'trashmail.com', 'tempmail24.com',
  'fake-mail.top', 'fakemailgenerator.com', 'tempmail.ninja'
];

// Trusted business email domains
const TRUSTED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'protonmail.com', 'zoho.com', 'aol.com', 'live.com', 'msn.com',
  'yahoo.co.in', 'yahoo.co.uk', 'outlook.in', 'rediffmail.com',
  'me.com', 'mac.com', 'fastmail.com', 'tutanota.com'
];

// Enhanced email validation schema
export const emailValidationSchema = z.string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .refine((email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return !DISPOSABLE_EMAIL_DOMAINS.includes(domain);
  }, "Temporary or disposable email addresses are not allowed")
  .refine((email) => {
    // Basic email format validation with more strict regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }, "Please enter a valid email format");

export interface EmailValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
  confidence?: number;
  isDisposable?: boolean;
  isBusiness?: boolean;
}

// Email validation service
export class EmailValidationService {
  private static readonly API_KEY = import.meta.env.VITE_EMAIL_VALIDATION_API_KEY;
  private static readonly VALIDATION_LEVEL = import.meta.env.VITE_EMAIL_VALIDATION_LEVEL || 'basic';

  static async validateEmail(email: string): Promise<EmailValidationResult> {
    const result: EmailValidationResult = {
      isValid: false,
      errors: [],
      suggestions: [],
      confidence: 0
    };

    // Basic format validation
    try {
      emailValidationSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        result.errors = error.errors.map(err => err.message);
        result.suggestions = this.generateSuggestions(email);
        return result;
      }
    }

    const domain = email.split('@')[1]?.toLowerCase();
    
    // Check for disposable emails
    result.isDisposable = DISPOSABLE_EMAIL_DOMAINS.includes(domain);
    if (result.isDisposable) {
      result.errors.push("Disposable email addresses are not allowed");
    }

    // Check if it's a business email
    result.isBusiness = TRUSTED_DOMAINS.includes(domain) || !this.isCommonProvider(domain);

    // Enhanced validation with external API (if configured)
    if (this.VALIDATION_LEVEL === 'enhanced' && this.API_KEY) {
      try {
        const apiResult = await this.validateWithAPI(email);
        result.isValid = apiResult.isValid && !result.isDisposable;
        result.confidence = apiResult.confidence;
        if (!apiResult.isValid) {
          result.errors.push(...apiResult.errors);
        }
        if (apiResult.suggestions) {
          result.suggestions = apiResult.suggestions;
        }
      } catch (error) {
        console.warn('Email validation API failed, falling back to basic validation');
        result.isValid = result.errors.length === 0;
        result.confidence = result.isValid ? 0.8 : 0.2;
      }
    } else {
      // Basic validation
      result.isValid = result.errors.length === 0;
      result.confidence = result.isValid ? 0.7 : 0.2;
    }

    // Generate suggestions for invalid emails
    if (!result.isValid || result.errors.length > 0) {
      result.suggestions = this.generateSuggestions(email);
    }

    // Strict mode validation
    if (this.VALIDATION_LEVEL === 'strict' && !result.isBusiness) {
      result.errors.push("Please use a business or well-known email provider");
      result.isValid = false;
    }

    return result;
  }

  // Generate email suggestions for common typos
  private static generateSuggestions(email: string): string[] {
    const suggestions: string[] = [];
    const [localPart, domain] = email.split('@');
    
    if (!domain || !localPart) return suggestions;
    
    const commonDomainTypos: Record<string, string[]> = {
      'gmail.com': ['gmai.com', 'gmial.com', 'gmaill.com', 'gmail.co', 'gmail.con'],
      'yahoo.com': ['yaho.com', 'yahoo.co', 'yahoo.con', 'yahooo.com'],
      'outlook.com': ['outlook.co', 'outlook.con', 'outloook.com'],
      'hotmail.com': ['hotmai.com', 'hotmial.com', 'hotmaill.com'],
      'icloud.com': ['iclou.com', 'icloud.co', 'iclound.com']
    };

    // Check for common typos
    for (const [correctDomain, typos] of Object.entries(commonDomainTypos)) {
      if (typos.includes(domain.toLowerCase())) {
        suggestions.push(`${localPart}@${correctDomain}`);
      }
    }

    // Suggest similar domains
    const domainLower = domain.toLowerCase();
    if (domainLower.includes('gmail') && domainLower !== 'gmail.com') {
      suggestions.push(`${localPart}@gmail.com`);
    }
    if (domainLower.includes('yahoo') && domainLower !== 'yahoo.com') {
      suggestions.push(`${localPart}@yahoo.com`);
    }
    if (domainLower.includes('outlook') && domainLower !== 'outlook.com') {
      suggestions.push(`${localPart}@outlook.com`);
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private static async validateWithAPI(email: string): Promise<EmailValidationResult> {
    try {
      const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${this.API_KEY}&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      return {
        isValid: data.deliverability === 'DELIVERABLE',
        errors: data.deliverability !== 'DELIVERABLE' ? [data.quality_score_reason || 'Invalid email'] : [],
        confidence: data.quality_score / 100,
        isDisposable: data.is_disposable_email?.value || false,
        isBusiness: !data.is_free_email?.value || false
      };
    } catch (error) {
      throw new Error('Email validation API failed');
    }
  }

  private static isCommonProvider(domain: string): boolean {
    const commonProviders = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'live.com', 'msn.com', 'protonmail.com'
    ];
    return commonProviders.includes(domain.toLowerCase());
  }

  static getEmailSuggestions(email: string): string[] {
    return this.generateSuggestions(email);
  }
}
