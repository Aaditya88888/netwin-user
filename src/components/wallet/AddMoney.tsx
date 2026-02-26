import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, IndianRupee, DollarSign, Wallet, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UPIWalletService } from "@/lib/upiWalletService";
import type { Currency } from "@/types";

// Define type for adminWalletConfig
interface AdminWalletConfig {
  [currency: string]: {
    paymentLink?: string;
    // ...other config fields if needed
  };
}

declare global {
  interface Window {
    adminWalletConfig?: AdminWalletConfig;
  }
}

const addMoneySchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(10, "Minimum amount is 10").max(100000, "Maximum amount is 100,000")
  ),
  paymentMethod: z.string().min(1, "Please select a payment method"),
});

type AddMoneyFormValues = z.infer<typeof addMoneySchema>;

interface AddMoneyProps {
  onClose: () => void;
  onSuccess?: () => void;
  manualDeposit?: boolean;
  paymentLink?: string;
  currency?: string; // Add currency prop for manual deposit override
}

const AddMoney = ({ onClose, onSuccess, manualDeposit, paymentLink, currency }: AddMoneyProps) => {
  const { userProfile } = useAuth();
  const { addMoney } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [addedAmount, setAddedAmount] = useState(0);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [effectivePaymentLink, setEffectivePaymentLink] = useState<string | undefined>(paymentLink);
  
  // Use override currency for manual deposit, else userProfile.currency
  const effectiveCurrency = currency || userProfile?.currency;
  
  const form = useForm<AddMoneyFormValues>({
    resolver: zodResolver(addMoneySchema),
    defaultValues: {
      amount: undefined,
      paymentMethod: "",
    },
  });
  
  const onSubmit = async (data: AddMoneyFormValues) => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    if (manualDeposit && (userProfile.country === "Nigeria" || userProfile.country === "USA")) {
      if (!screenshotFile) {
        toast({
          title: "Screenshot Required",
          description: "Please upload a payment screenshot.",
          variant: "destructive",
        });
        return;
      }
    }
    setLoading(true);
    try {
      let screenshotUrl = undefined;
      if (manualDeposit && (userProfile.country === "Nigeria" || userProfile.country === "USA") && screenshotFile) {
        const storageRef = ref(storage, `deposit_screenshots/${userProfile.uid}_${Date.now()}_${screenshotFile.name}`);
        await uploadBytes(storageRef, screenshotFile);
        screenshotUrl = await getDownloadURL(storageRef);
      }
      // Create user object for wallet operations
      const userForWallet = {
        uid: userProfile.uid,
        email: userProfile.email,
        displayName: userProfile.displayName,
        gameId: userProfile.gameId || '',
        currency: effectiveCurrency as Currency, // We'll validate below
        country: userProfile.country,
        kycStatus: userProfile.kycStatus,
        walletBalance: userProfile.walletBalance,
        role: userProfile.role,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      };
      // Validate currency type
      const validCurrencies: Currency[] = ['INR', 'USD', 'NGN', 'EUR', 'GBP'];
      if (!effectiveCurrency || !validCurrencies.includes(effectiveCurrency as Currency)) {
        toast({
          title: "Currency Error",
          description: "Invalid or missing currency. Please contact support.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      userForWallet.currency = effectiveCurrency as Currency;
      // If manual deposit, call UPIWalletService directly with screenshotUrl
      if (manualDeposit && (userProfile.country === "Nigeria" || userProfile.country === "USA")) {
        await UPIWalletService.createDepositRequest(
          userProfile.uid,
          data.amount,
          data.paymentMethod, // this is transaction/reference ID
          userProfile.currency,
          screenshotUrl
        );
        setAddedAmount(data.amount);
        setSuccess(true);
        toast({
          title: "Request Submitted!",
          description: `Your deposit request for ${formatCurrency(data.amount, userProfile.currency)} has been submitted for admin approval. Your balance will update after verification.`,
        });
        if (onSuccess) onSuccess();
        setLoading(false);
        return;
      }
      // All payments are now manual and require admin approval
      // No automatic balance updates - everything goes through admin approval
      const result = await addMoney(data.amount, userForWallet, data.paymentMethod);
      
      if (result) {
        setAddedAmount(data.amount);
        setSuccess(true);
        toast({
          title: "Request Submitted!",
          description: `Your deposit request for ${formatCurrency(data.amount, userProfile.currency)} has been submitted for admin approval. Your balance will update after verification.`,
        });
        if (onSuccess) onSuccess();
      } else {
        throw new Error("Failed to submit deposit request");
      }
    } catch (error) {
      console.error("Error in AddMoney:", error);        toast({
          title: "Transaction Failed",
          description: "Failed to submit deposit request. Please try again.",
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };
  
  // Effect: update payment link from admin config if needed
  useEffect(() => {
    if (manualDeposit && !paymentLink && userProfile) {
      const updatePaymentLink = () => {
        const adminConfig = window.adminWalletConfig;
        const currencyKey = effectiveCurrency;
        if (adminConfig && currencyKey) {
          const config = adminConfig[currencyKey];
          if (config && config.paymentLink) {
            setEffectivePaymentLink(config.paymentLink);
          }
        }
      };
      updatePaymentLink();
      // Poll for admin config if not available yet
      const interval = setInterval(() => {
        const adminConfig = window.adminWalletConfig;
        const currencyKey = effectiveCurrency;
        if (adminConfig && currencyKey) {
          const config = adminConfig[currencyKey];
          if (config && config.paymentLink) {
            setEffectivePaymentLink(config.paymentLink);
            clearInterval(interval);
          }
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      setEffectivePaymentLink(paymentLink);
    }
  }, [manualDeposit, paymentLink, userProfile, effectiveCurrency]);

  if (!userProfile) return null;

  // Payment methods based on currency
  const paymentMethods = 
    effectiveCurrency === "INR" 
      ? [
          { id: "upi", value: "UPI", label: "UPI (PhonePe, GPay, Paytm)", icon: <IndianRupee className="h-4 w-4" /> },
          { id: "card", value: "Card", label: "Credit/Debit Card", icon: <CreditCard className="h-4 w-4" /> },
          { id: "netbanking", value: "NetBanking", label: "Net Banking", icon: <Wallet className="h-4 w-4" /> },
        ]
      : effectiveCurrency === "NGN"
      ? [
          { id: "card", value: "Card", label: "Debit/Credit Card", icon: <CreditCard className="h-4 w-4" /> },
          { id: "banktransfer", value: "BankTransfer", label: "Bank Transfer", icon: <Wallet className="h-4 w-4" /> },
        ]
      : [
          { id: "card", value: "Card", label: "Credit/Debit Card", icon: <CreditCard className="h-4 w-4" /> },
          { id: "paypal", value: "PayPal", label: "PayPal", icon: <Wallet className="h-4 w-4" /> },
        ];
  
  // Quick amounts based on currency
  const quickAmounts = 
    effectiveCurrency === "INR" ? [100, 200, 500, 1000, 2000] : 
    effectiveCurrency === "NGN" ? [500, 1000, 2000, 5000, 10000] : 
    [5, 10, 25, 50, 100];
  
  // Currency icon based on user's currency
  const CurrencyIcon = effectiveCurrency === "INR" ? IndianRupee : DollarSign;
  
  if (success) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-dark-card text-white border-gray-800">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl">Request Submitted!</DialogTitle>
            <DialogDescription className="text-gray-400">
              Your deposit request for {formatCurrency(addedAmount, userProfile.currency)} has been submitted.<br />
              <span className="text-yellow-400">Your balance will update after admin approval and verification.</span>
            </DialogDescription>
            <div className="mx-auto bg-green-900 bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </DialogHeader>
          <div className="bg-dark-lighter p-4 rounded-lg mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Amount Added</span>
              <span className="font-semibold">{formatCurrency(addedAmount, userProfile.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">New Balance</span>
              <span className="font-semibold text-green-400">
                {formatCurrency(userProfile.walletBalance + addedAmount, userProfile.currency)}
              </span>
            </div>
          </div>
          <Button 
            className="w-full mt-4 bg-gradient-to-r from-primary to-secondary"
            onClick={onClose}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // For manual deposit, use the correct payment link from admin config for the selected currency
  // let effectivePaymentLink = paymentLink;
  // if (manualDeposit && !paymentLink && userProfile) {
  //   // Try to get payment link from admin config (USD/NGN)
  //   const adminConfig = (window as any).adminWalletConfig;
  //   if (adminConfig) {
  //     const currencyKey = effectiveCurrency;
  //     if (adminConfig[currencyKey] && adminConfig[currencyKey].paymentLink) {
  //       effectivePaymentLink = adminConfig[currencyKey].paymentLink;
  //     }
  //   }
  // }

  // Only show quick select and payment method for non-manual deposit
  if (manualDeposit) {
    return (
      <Card className="w-full border-0 shadow-none">
        <CardHeader className="pb-4 px-4 pt-4">
          <CardTitle className="text-lg font-semibold">Add Money (Manual Deposit)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">To add money, pay to the link below and upload your payment details.</p>
            {effectivePaymentLink ? (
              <a
                href={effectivePaymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-blue-700 text-white rounded px-4 py-2 text-center font-semibold mb-2 hover:bg-blue-800"
              >
                Go to Payment Link
              </a>
            ) : (
              <div className="text-yellow-400">Payment link not available. Please contact support.</div>
            )}
            <p className="text-xs text-gray-400">After payment, fill the form below.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="Enter amount paid" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter transaction/reference ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Upload Payment Screenshot</FormLabel>
                <FormControl>
                  <Input type="file" accept="image/*" onChange={e => setScreenshotFile(e.target.files?.[0] || null)} required />
                </FormControl>
                <FormMessage />
              </FormItem>
              <CardFooter className="px-0 pb-0 pt-4 flex flex-col space-y-2">
                <Button type="submit" disabled={loading} className="w-full h-11">
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose} className="w-full h-11">
                  Cancel
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="pb-4 px-4 pt-4">
        <CardTitle className="text-lg font-semibold">Add Money</CardTitle>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="px-4 pb-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Quick Amount Selection */}
            <div className="space-y-3">
              <FormLabel className="text-sm font-medium">Quick Select</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue("amount", amount)}
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  >
                    <CurrencyIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CurrencyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        {...field}
                        type="number"
                        placeholder="Enter amount"
                        className="pl-10 text-base"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method Selection */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.value}>
                          <div className="flex items-center gap-2">
                            {method.icon}
                            {method.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="px-4 pb-4 pt-2 flex flex-col space-y-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11"
            >
              {loading ? "Processing..." : "Add Money"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full h-11"
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default AddMoney;
