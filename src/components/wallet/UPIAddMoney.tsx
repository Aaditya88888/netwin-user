import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { UPIWalletService } from "@/lib/upiWalletService";
import { generateUPIQRCode } from "@/utils/upiUtils";
import { AdminWalletConfig, PendingDeposit } from "@/types/wallet-requests";
import { IndianRupee, Copy, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const addMoneySchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(10, "Minimum amount is ₹10").max(100000, "Maximum amount is ₹100,000")
  ),
  upiRefId: z.string()
    .regex(/^\d{12}$/, "UPI Transaction ID must be exactly 12 digits")
    .length(12, "UPI Transaction ID must be exactly 12 digits"),
});

type AddMoneyFormValues = z.infer<typeof addMoneySchema>;

interface UPIAddMoneyProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const UPIAddMoney = ({ onClose, onSuccess }: UPIAddMoneyProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [mainUpiQrCode, setMainUpiQrCode] = useState<string>("");
  const [adminWalletConfig, setAdminWalletConfig] = useState<AdminWalletConfig | null>(null);
  const [userRequests, setUserRequests] = useState<PendingDeposit[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const form = useForm<AddMoneyFormValues>({
    resolver: zodResolver(addMoneySchema),
    defaultValues: {
      amount: undefined,
      upiRefId: "",
    },
  });

  // Quick amounts
  const quickAmounts = [100, 200, 500, 1000, 2000];
  // Load admin UPI config and user requests
  useEffect(() => {
    const loadData = async () => {
      try {
        const [config, requests] = await Promise.all([
          UPIWalletService.getAdminUpiConfig(),
          userProfile ? UPIWalletService.getUserDepositRequests(userProfile.uid) : []
        ]);
        setAdminWalletConfig(config);
        setUserRequests(requests);
        // Generate main UPI QR code (without amount)
        if (config?.INR?.upiId) {
          try {
            const qrCode = await generateUPIQRCode(
              config.INR.upiId,
              config.INR.displayName,
              undefined, // No amount for main QR
              'Pay to Netwin Gaming'
            );
            setMainUpiQrCode(qrCode);
          } catch (error) {
            console.error('Error generating main QR code:', error);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [userProfile]);
  // Generate QR code when amount is selected
  const handleShowQR = async (amount: number) => {
    if (!adminWalletConfig?.INR?.upiId) {
      toast({
        title: "UPI Not Available",
        description: "UPI payment is currently not available. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSelectedAmount(amount);
      const qrCodeDataUrl = await generateUPIQRCode(
        adminWalletConfig.INR.upiId,
        adminWalletConfig.INR.displayName,
        amount,
        'Add money to wallet'
      );
      setQrCodeDataUrl(qrCodeDataUrl);
      setShowQR(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      try {
        const upiUrl = `upi://pay?pa=${adminWalletConfig.INR.upiId}&pn=${encodeURIComponent(adminWalletConfig.INR.displayName || '')}&am=${amount}&cu=INR&tn=${encodeURIComponent('Add money to wallet')}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(upiUrl)}`;
        setQrCodeDataUrl(qrCodeUrl);
        setShowQR(true);
      } catch (fallbackError) {
        console.error('Error with fallback QR generation:', fallbackError);
        toast({
          title: "QR Code Error",
          description: "Failed to generate QR code. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Copy UPI ID to clipboard
  const copyUpiId = async () => {
    if (adminWalletConfig?.INR?.upiId) {
      try {
        await navigator.clipboard.writeText(adminWalletConfig.INR.upiId);
        toast({
          title: "Copied!",
          description: "UPI ID copied to clipboard",
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  // Submit deposit request
  const onSubmit = async (data: AddMoneyFormValues) => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await UPIWalletService.createDepositRequest(
        userProfile.uid,
        data.amount,
        data.upiRefId,
        userProfile.currency
      );

      setSuccess(true);
      toast({
        title: "Request Submitted!",
        description: `Your deposit request for ${formatCurrency(data.amount, userProfile.currency)} has been submitted for admin approval. Your balance will update after verification.`,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting deposit request:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your deposit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin wallet config on mount
  useEffect(() => {
    // Fetch wallet config from new endpoint
    fetch('/api/wallet/config')
      .then(res => res.json())
      .then((data: AdminWalletConfig) => setAdminWalletConfig(data));
  }, []);

  if (!userProfile) return null;

  if (success) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-dark-card text-white border-gray-800">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-blue-900 bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
            <DialogTitle className="text-xl">Request Submitted!</DialogTitle>
            <DialogDescription className="text-gray-400">
              Your deposit request has been submitted and is pending admin verification.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-dark-lighter p-4 rounded-lg mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">What happens next?</span>
            </div>
            <ul className="text-sm text-gray-400 space-y-1 ml-6">
              <li>• Admin will verify your UPI transaction</li>
              <li>• You'll receive a notification once verified</li>
              <li>• Money will be added to your wallet automatically</li>
              <li>• Usually takes 5-30 minutes during business hours</li>
            </ul>
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

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="pb-4 px-4 pt-4">
        <CardTitle className="text-lg font-semibold">Add Money via UPI</CardTitle>
        <p className="text-sm text-gray-400">
          Send money to our UPI ID and submit the transaction details
        </p>
      </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">        {/* Admin UPI ID Display */}
        {adminWalletConfig && adminWalletConfig.INR?.isActive ? (
          <div className="bg-dark-lighter p-4 rounded-lg border border-blue-500/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-400">Pay to UPI ID:</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={copyUpiId}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="text-lg font-mono font-bold text-white mb-1">{adminWalletConfig.INR?.upiId}</p>
                <p className="text-sm text-gray-400">{adminWalletConfig.INR?.displayName}</p>
              </div>
              {(mainUpiQrCode || adminWalletConfig.INR?.qrCodeUrl) && (
                <div className="flex-shrink-0">
                  <div className="bg-white p-2 rounded-lg">
                    <img 
                      src={mainUpiQrCode || adminWalletConfig.INR?.qrCodeUrl} 
                      alt="UPI QR Code" 
                      className="w-20 h-20 sm:w-24 sm:h-24"
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-1">Scan to Pay</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Alert className="bg-red-900/20 border-red-700/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-400">UPI Not Available</AlertTitle>
            <AlertDescription className="text-red-300">
              UPI payments are currently not available. Please try again later.
            </AlertDescription>
          </Alert>
        )}        {/* Quick Amount Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Quick Select Amount</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={`quick-amount-${amount}`}
                type="button"
                variant="outline"
                onClick={() => handleShowQR(amount)}
                className="text-xs sm:text-sm h-10 sm:h-11 flex items-center justify-center"
                disabled={!adminWalletConfig?.INR?.isActive}
              >
                <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {amount}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Tap any amount to generate a QR code for that specific amount
          </p>
        </div>{/* QR Code Modal */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="bg-dark-card text-white border-gray-800 max-w-[95vw] sm:max-w-md max-h-[95vh] overflow-y-auto">
            <DialogHeader className="text-center">
              <DialogTitle className="text-lg">Pay via UPI</DialogTitle>
              <DialogDescription className="text-gray-400">
                Amount: {selectedAmount && formatCurrency(selectedAmount, userProfile.currency)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4 py-2">
              {qrCodeDataUrl && (
                <div className="bg-white p-2 sm:p-3 rounded-lg shadow-lg">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="UPI QR Code" 
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48"
                  />
                </div>
              )}
              
              <div className="text-center space-y-2 w-full">
                <div className="bg-dark-lighter p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">UPI ID:</p>
                  <p className="font-mono text-sm break-all">{adminWalletConfig?.INR?.upiId}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={copyUpiId}
                    className="h-6 px-2 text-xs mt-2"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy UPI ID
                  </Button>
                </div>
              </div>
              
              <div className="w-full bg-dark-lighter p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-2 font-medium">Payment Steps:</p>
                <ol className="text-xs text-gray-300 space-y-1">
                  <li>1. Scan QR code or use UPI ID above</li>
                  <li>2. Pay exactly {selectedAmount && formatCurrency(selectedAmount, userProfile.currency)}</li>
                  <li>3. Note down the transaction ID</li>
                  <li>4. Submit the form below with transaction details</li>
                </ol>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => {
                  // Auto-fill the amount field
                  if (selectedAmount) {
                    form.setValue('amount', selectedAmount);
                  }
                  setShowQR(false);
                }} 
                className="flex-1 bg-gradient-to-r from-primary to-secondary"
              >
                I've Made the Payment
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowQR(false)}
                className="px-4"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Deposit Request Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Sent</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        {...field}
                        type="number"
                        placeholder="Enter amount you sent"
                        className="pl-10 text-base"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-gray-400">
                    Minimum amount is ₹10
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="upiRefId"              render={({ field }) => (
                <FormItem>
                  <FormLabel>UPI Transaction ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter 12-digit transaction ID"
                      className="text-base"
                      style={{ fontSize: '16px' }}
                      maxLength={12}
                      pattern="[0-9]{12}"
                      inputMode="numeric"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-400">
                    Enter exactly 12 digits from your UPI payment confirmation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert className="bg-blue-900/20 border-blue-700/30">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertTitle className="text-blue-400">Important</AlertTitle>
              <AlertDescription className="text-blue-300">
                Please ensure the transaction ID is correct. Wrong information may delay verification.
              </AlertDescription>
            </Alert>
          </form>
        </Form>        {/* Recent Requests */}        
        {userRequests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Recent Deposit Requests</label>
              <span className="text-xs text-gray-400">{userRequests.length} total</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {userRequests.slice(0, 5).map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-3 bg-dark-lighter rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">
                        {formatCurrency(request.amount, request.currency)}
                      </p>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">
                        {new Date(request.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">
                      ID: {request.upiRefId}
                    </p>
                    {request.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">
                        Reason: {request.rejectionReason}
                      </p>
                    )}
                    {request.adminNotes && (
                      <p className="text-xs text-blue-400 mt-1">
                        Note: {request.adminNotes}
                      </p>
                    )}
                  </div>
                  <Badge className={`flex items-center gap-1 text-xs px-2 py-1`}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
            {userRequests.length > 5 && (
              <p className="text-xs text-gray-400 text-center">
                Showing 5 of {userRequests.length} requests
              </p>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 pb-4 pt-2 flex flex-col space-y-2">
        <Button
          type="submit"
          disabled={loading || !adminWalletConfig?.INR?.isActive}
          onClick={form.handleSubmit(onSubmit)}
          className="w-full h-11"
        >
          {loading ? "Submitting..." : "Submit Deposit Request"}
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
    </Card>
  );
};

export default UPIAddMoney;
