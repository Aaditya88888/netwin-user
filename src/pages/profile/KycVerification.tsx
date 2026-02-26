import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/contexts/FirebaseContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, ShieldCheck, UploadCloud, Clock, AlertTriangle, CheckCircle, X, HelpCircle, Image, Camera, Loader2, Wallet, Trophy } from 'lucide-react';
import { KycDocument } from "@/types";

// Form schema
const kycSchema = z.object({
  documentType: z.string({
    required_error: "Please select document type",
  }),
  documentNumber: z.string().min(5, {
    message: "Document number must be at least 5 characters",
  }),
  frontImage: z.string({
    required_error: "Front image is required",
  }),
  backImage: z.string({
    required_error: "Back image is required",
  }),
  selfie: z.string({
    required_error: "Selfie is required",
  }),
});

type KycFormValues = z.infer<typeof kycSchema>;

export default function KycVerification() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { refreshUserProfile } = useFirebase(); // Get refreshUserProfile from FirebaseContext
  const { submitKycDocument, kycDocuments, getRequiredDocuments } = useUser();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("upload");
  const [uploading, setUploading] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const frontFileRef = useRef<HTMLInputElement>(null);
  const backFileRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);

  // Form
  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      documentType: "",
      documentNumber: "",
      frontImage: "",
      backImage: "",
      selfie: "",
    },
  });
    if (!userProfile) return null;

  // Get available document types based on user's country and filter out "selfie" type
  const allDocuments = getRequiredDocuments();
  // Filter out any document type containing "selfie" or "id-selfie"
  const availableDocuments = allDocuments.filter((doc: { type: string; name: string }) => 
    !doc.type.toLowerCase().includes('selfie') && 
    !doc.name.toLowerCase().includes('selfie'));
  const pendingDocument = kycDocuments.find((doc: KycDocument) => doc.status === "PENDING");
  const rejectedDocument = kycDocuments.find((doc: KycDocument) => doc.status === "REJECTED");
  const verifiedDocument = kycDocuments.find((doc: KycDocument) => doc.status === "VERIFIED");
  
  // Function to get the most appropriate document based on status
  const getDocumentForStatus = (status: string) => {
    if (status === "APPROVED") {
      return verifiedDocument || pendingDocument || kycDocuments[0] || null;
    } else if (status === "PENDING") {
      return pendingDocument || kycDocuments[0] || null;
    } else if (status === "REJECTED") {
      return rejectedDocument || null;
    }
    return null;
  };

  // Determine the actual KYC status based on document statuses instead of just user profile
  const getActualKycStatus = (): string => {
    // If there are no documents, return NOT_SUBMITTED
    if (!kycDocuments || kycDocuments.length === 0) {
      return "NOT_SUBMITTED";
    }
    
    // Check document statuses in priority order
    if (verifiedDocument && !pendingDocument && !rejectedDocument) {
      return "APPROVED";
    } else if (pendingDocument) {
      return "PENDING";
    } else if (rejectedDocument && !pendingDocument) {
      return "REJECTED";
    }
    
    // Fallback to user profile status if document status is unclear
    return userProfile.kycStatus;
  };

  const actualKycStatus = getActualKycStatus();

  // Monitor KYC status changes
  React.useEffect(() => {
    // This effect monitors changes to KYC status and documents
    // The dependencies ensure component re-renders when status changes
  }, [userProfile?.kycStatus, actualKycStatus, kycDocuments]);
  
  // Document status is now handled by the getDocumentForStatus function
  
  // Determine if user can access upload tab - only for NOT_SUBMITTED or REJECTED status
  const noKycDocs = !kycDocuments || kycDocuments.length === 0;
  // User can access upload only if they haven&apos;t submitted docs or if their docs were rejected
  const canAccessUpload = actualKycStatus === "NOT_SUBMITTED" || actualKycStatus === "REJECTED" || noKycDocs;
  
  // Auto-redirect to status tab if user has submitted documents and trying to access upload
  React.useEffect(() => {
    if (!canAccessUpload && selectedTab === "upload") {
      setSelectedTab("status");
    }
  }, [canAccessUpload, selectedTab]);

  // Refresh the profile data when the status tab is selected (only once)
  const [hasRefreshedOnStatus, setHasRefreshedOnStatus] = React.useState(false);
  React.useEffect(() => {
    if (selectedTab === "status" && refreshUserProfile && !hasRefreshedOnStatus) {
      setHasRefreshedOnStatus(true);
      refreshUserProfile().then(() => {
        });
    } else if (selectedTab !== "status") {
      // Reset the refresh flag when switching away from status tab
      setHasRefreshedOnStatus(false);
    }
  }, [selectedTab, refreshUserProfile, hasRefreshedOnStatus]);
  
  // Monitor KYC status and documents for any updates
  React.useEffect(() => {
    // This effect tracks changes to KYC status and documents
    // Used for component reactivity to status changes
  }, [userProfile.kycStatus, kycDocuments]);
  
  // Handle form submission
  const onSubmit = async (values: KycFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await submitKycDocument({
        type: values.documentType as 'id-proof' | 'address-proof' | 'pan-card',
        documentNumber: values.documentNumber,
        frontImageUrl: '', // will be set by upload
        backImageUrl: '',
        frontImageFile: values.frontImage,
        backImageFile: values.backImage,
        selfieFile: values.selfie,
      });
      
      if (success) {
        // Reset the refresh flag so status tab will refresh again
        setHasRefreshedOnStatus(false);
        
        // Refresh the user profile to get the updated KYC status
        await refreshUserProfile();
        
        // Log the user's KYC status after submission
        toast({
          title: "KYC submitted successfully",
          description: "Your documents have been submitted for verification.",
        });
        setSelectedTab("status");
      } else {
        toast({
          variant: "destructive",
          title: "Submission failed",
          description: "Failed to submit KYC documents. Please try again.",
        });
      }
    } catch (error) {
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };    // Handle image upload with base64 conversion for form submission
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "frontImage" | "backImage" | "selfie") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload an image file.",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image size should be less than 5MB.",
      });
      return;
    }
    
    setUploading(fieldName);
    try {
      // Convert to base64 for form submission
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Set the base64 data URL in the form
          form.setValue(fieldName, reader.result);
          
          toast({
            title: "Image uploaded",
            description: "Document image uploaded successfully.",
          });
          setUploading(null);
        }
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "Failed to read image file. Please try again.",
        });
        setUploading(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
      });
      setUploading(null);
    }
  };
  
  // Trigger file input click
  const triggerFileUpload = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };
    // Go back to profile
  const goBack = () => {
    navigate("/profile");
  };
  
  return (
    <div className="container-responsive py-4 sm:py-6 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4 sm:mb-6 text-gray-400 p-2 sm:p-3"
        onClick={goBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Back to Profile</span>
        <span className="sm:hidden">Back</span>
      </Button>
      
      <div className="mb-4 sm:mb-6">
        <h1 className="text-responsive-lg font-bold font-poppins">
          KYC Verification
        </h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">
          Verify your identity to unlock all features
        </p>
      </div>

      {/* Debug info removed for production */}
        <Tabs 
        defaultValue={canAccessUpload ? "upload" : "status"} 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="w-full"
      >        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-auto">
          <TabsTrigger 
            value="upload" 
            disabled={!canAccessUpload}
            className="py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            <span className="hidden sm:inline">
              {canAccessUpload ? "Upload Documents" : "Upload Complete"}
            </span>
            <span className="sm:hidden">
              {canAccessUpload ? "Upload" : "Done"}
            </span>
            {!canAccessUpload && (
              <CheckCircle className="h-3 w-3 ml-1 text-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="status" className="py-2 sm:py-3 text-xs sm:text-sm">
            <span className="hidden sm:inline">Verification Status</span>
            <span className="sm:hidden">Status</span>
          </TabsTrigger>
        </TabsList>
          <TabsContent value="upload">          {!canAccessUpload ? (
            <Card className="bg-dark-card border-gray-800 p-4 sm:p-6">
              <div className="text-center py-8">
                <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Documents Already Submitted</h3>
                <p className="text-gray-400 mb-4">
                  {actualKycStatus === "APPROVED" && "Your KYC verification is complete. All platform features are now available."}
                  {actualKycStatus === "PENDING" && "Your documents are under review. Please wait for admin approval."}
                  {actualKycStatus === "REJECTED" && "Your documents were rejected. Please resubmit with correct information."}
                </p>
                <div className="bg-dark-lighter p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-300">
                    <strong>Note:</strong> You can only resubmit documents if your previous submission was rejected by the admin.
                  </p>
                </div>
                <Button 
                  onClick={() => setSelectedTab("status")}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  View Status Details
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="bg-dark-card border-gray-800 p-4 sm:p-6"><h2 className="text-lg sm:text-xl font-semibold mb-2">Document Verification</h2>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              Upload your identity documents for verification. This is required for withdrawals and high-stakes tournaments.
            </p>
            
            <Alert className="mb-4 sm:mb-6 bg-primary/10 border-primary/30">
              <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <AlertTitle className="text-primary text-sm sm:text-base">Secure Verification</AlertTitle>
                <AlertDescription className="text-gray-300 text-xs sm:text-sm">
                  Your documents are encrypted and used only for verification purposes. We never share your data with third parties. For all document types, both front and back photos are now required.
                </AlertDescription>
              </div>
            </Alert>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 form-mobile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Document Type</FormLabel>
                        <p className="text-xs text-gray-400 mb-1">Select your identity document type (a separate selfie upload is required below)</p>
                        <FormControl>
                          <Select
                            onValueChange={val => field.onChange(val as 'id-proof' | 'address-proof' | 'pan-card')}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="bg-dark-lighter border-gray-700 h-10 sm:h-12">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent className="bg-dark-card border-gray-700">
                              {availableDocuments.map((doc: { type: string; name: string; required: boolean }) => (
                                <SelectItem key={doc.type} value={doc.type}>
                                  {doc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Document Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter document number"
                            className="bg-dark-lighter border-gray-700 h-10 sm:h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="bg-gray-800 my-3 sm:my-4" />
                
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-sm sm:text-base font-medium">Document Images</h3>                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="frontImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">Front Side</FormLabel>
                          <FormControl>
                            <div>
                              <input
                                type="file"
                                ref={frontFileRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, "frontImage")}
                              />
                              
                              {field.value ? (
                                <div className="relative">
                                  <img
                                    src={field.value}
                                    alt="Front side"
                                    className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-700"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="absolute bottom-2 right-2 bg-dark-card border-gray-700 h-auto py-1 px-2 text-xs sm:text-sm"
                                    onClick={() => triggerFileUpload(frontFileRef)}
                                  >
                                    <Image className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Change
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className="flex flex-col items-center justify-center h-32 sm:h-40 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary transition-colors"
                                  onClick={() => triggerFileUpload(frontFileRef)}
                                >
                                  {uploading === "frontImage" ? (
                                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500 animate-spin" />
                                  ) : (
                                    <>
                                      <UploadCloud className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500 mb-2" />
                                      <p className="text-xs sm:text-sm text-gray-400 text-center px-2">
                                        Click to upload front side
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1 text-center">
                                        PNG, JPG or JPEG (max 5MB)
                                      </p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="backImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base">Back Side</FormLabel>
                          <FormControl>
                            <div>
                              <input
                                type="file"
                                ref={backFileRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, "backImage")}
                              />
                              
                              {field.value ? (
                                <div className="relative">
                                  <img
                                    src={field.value}
                                    alt="Back side"
                                    className="w-full h-32 sm:h-40 object-cover rounded-lg border border-gray-700"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="absolute bottom-2 right-2 bg-dark-card border-gray-700 h-auto py-1 px-2 text-xs sm:text-sm"
                                    onClick={() => triggerFileUpload(backFileRef)}
                                  >
                                    <Image className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Change
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className="flex flex-col items-center justify-center h-32 sm:h-40 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary transition-colors"
                                  onClick={() => triggerFileUpload(backFileRef)}
                                >
                                  {uploading === "backImage" ? (
                                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500 animate-spin" />
                                  ) : (
                                    <>
                                      <UploadCloud className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500 mb-2" />                                        <p className="text-xs sm:text-sm text-gray-400 text-center px-2">
                                          Click to upload back side
                                        </p>
                                      <p className="text-xs text-gray-500 mt-1 text-center">
                                        PNG, JPG or JPEG (max 5MB)
                                      </p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="selfie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selfie with Document</FormLabel>
                        <FormControl>
                          <div>
                            <input
                              type="file"
                              ref={selfieFileRef}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, "selfie")}
                            />
                            
                            {field.value ? (
                              <div className="relative">
                                <img
                                  src={field.value}
                                  alt="Selfie with document"
                                  className="w-full h-60 object-cover rounded-lg border border-gray-700"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="absolute bottom-2 right-2 bg-dark-card border-gray-700"
                                  onClick={() => triggerFileUpload(selfieFileRef)}
                                >
                                  <Camera className="h-4 w-4 mr-1" />
                                  Change
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary transition-colors"
                                onClick={() => triggerFileUpload(selfieFileRef)}
                              >
                                {uploading === "selfie" ? (
                                  <Loader2 className="h-10 w-10 text-gray-500 animate-spin" />
                                ) : (
                                  <>
                                    <Camera className="h-10 w-10 text-gray-500 mb-2" />
                                    <p className="text-sm text-gray-400">
                                      Take a selfie holding your document
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      PNG, JPG or JPEG (max 5MB)
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Alert className="bg-dark-lighter border-gray-700">
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>Requirements</AlertTitle>
                    <AlertDescription className="text-gray-300">
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                        <li>All document details must be clearly visible</li>
                        <li>Upload both front and back sides of document (both are required)</li>
                        <li>Take the selfie with your face and document clearly visible</li>
                        <li>Ensure good lighting when taking photos</li>
                        <li>Documents must be valid and not expired</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-primary to-secondary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit for Verification"
                    )}
                  </Button>
                </div>              </form>
            </Form>
          </Card>
          )}
        </TabsContent>
        
        <TabsContent value="status">
          <Card className="bg-dark-card border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-6">Verification Status</h2>
            
            {noKycDocs && actualKycStatus === "NOT_SUBMITTED" && (
              <div className="space-y-6">
                <div className="p-4 bg-dark-lighter border border-gray-700 rounded-lg text-center">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-2">
                    Not Verified
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-4">
                    You haven&apos;t submitted your documents for verification yet. Complete KYC to unlock all platform features.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-primary to-secondary"
                    onClick={() => setSelectedTab("upload")}
                  >
                    Start Verification
                  </Button>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-3">Benefits of KYC Verification</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-dark-lighter rounded-lg flex items-center">
                      <div className="w-8 h-8 bg-primary/20 flex items-center justify-center rounded-full mr-3">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Unlimited Withdrawals</div>
                        <div className="text-xs text-gray-400">
                          Withdraw your winnings without limitations
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-dark-lighter rounded-lg flex items-center">
                      <div className="w-8 h-8 bg-primary/20 flex items-center justify-center rounded-full mr-3">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">High-Stakes Tournaments</div>
                        <div className="text-xs text-gray-400">
                          Participate in tournaments with bigger prize pools
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-dark-lighter rounded-lg flex items-center">
                      <div className="w-8 h-8 bg-primary/20 flex items-center justify-center rounded-full mr-3">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Account Security</div>
                        <div className="text-xs text-gray-400">
                          Added protection for your account and funds
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Only show "Verification Complete" for APPROVED - prioritizing user profile status */}
            {actualKycStatus === "APPROVED" && (
              <div className="space-y-6">
                <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-medium text-green-500">
                        Verification Complete
                      </h3>
                      <p className="text-gray-300 mt-1">
                        Your identity has been verified successfully. You now have access to all platform features.
                      </p>
                    </div>
                  </div>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium mb-3">Document Information</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                        <div className="text-sm text-gray-400">Document Type</div>
                        <div className="font-medium">
                          {getDocumentForStatus("APPROVED")?.type?.replace(/_/g, ' ') || "Identity Document"}
                        </div>
                      </div>
                      <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                        <div className="text-sm text-gray-400">Document Number</div>                        <div className="font-medium">
                          {(() => {
                            const doc = getDocumentForStatus("APPROVED");
                            return doc?.documentNumber 
                              ? `${doc.documentNumber.substring(0, 4)}****${doc.documentNumber.substring(doc.documentNumber.length - 4)}`
                              : 'N/A';
                          })()}
                        </div>
                      </div>
                      <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                        <div className="text-sm text-gray-400">Verified On</div>                        <div className="font-medium">
                          {(() => {
                            const doc = getDocumentForStatus("APPROVED");
                            return doc?.createdAt 
                              ? new Date(doc.createdAt).toLocaleDateString()
                              : 'N/A';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-3">Unlocked Features</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-dark-lighter rounded-lg flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <div className="font-medium">Unlimited Withdrawals</div>
                      </div>
                      <div className="p-3 bg-dark-lighter rounded-lg flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <div className="font-medium">High-Stakes Tournaments</div>
                      </div>
                      <div className="p-3 bg-dark-lighter rounded-lg flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <div className="font-medium">Priority Customer Support</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show "Verification in Progress" for PENDING - Always prioritize the actualKycStatus */}
            {actualKycStatus === "PENDING" && (
              <div className="space-y-6">
                <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                  <div className="flex items-start">
                    <Clock className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-medium text-yellow-500">
                        Verification in Progress
                      </h3>
                      <p className="text-gray-300 mt-1">
                        Your documents are being reviewed. This process usually takes 24-48 hours. We&apos;ll notify you once verification is complete.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-3">Document Information</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                      <div className="text-sm text-gray-400">Document Type</div>
                      <div className="font-medium">
                        {getDocumentForStatus("PENDING")?.type?.replace(/_/g, ' ') || 'Identity Document'}
                      </div>
                    </div>
                    <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                      <div className="text-sm text-gray-400">Document Number</div>
                      <div className="font-medium">
                        {(() => {
                          const doc = getDocumentForStatus("PENDING");
                          return doc?.documentNumber 
                            ? `${doc.documentNumber.substring(0, 4)}****${doc.documentNumber.substring(doc.documentNumber.length - 4)}`
                            : '****';
                        })()}
                      </div>
                    </div>
                    <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                      <div className="text-sm text-gray-400">Submitted On</div>
                      <div className="font-medium">
                        {(() => {
                          const doc = getDocumentForStatus("PENDING");
                          return doc?.createdAt 
                            ? new Date(doc.createdAt).toLocaleDateString()
                            : new Date().toLocaleDateString();
                        })()}
                      </div>
                    </div>
                    <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                      <div className="text-sm text-gray-400">Status</div>
                      <Badge className="bg-yellow-500/20 text-yellow-500 gap-1">
                        <Clock className="h-3 w-3" />
                        Pending Review
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Alert className="bg-dark-lighter border-gray-700">
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>What happens next?</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    <p className="mb-2">Our team will review your documents and verify your identity.</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>You&apos;ll receive a notification once verification is complete</li>
                      <li>If there are any issues, we&apos;ll contact you for additional information</li>
                      <li>You can check this page for status updates</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {actualKycStatus === "REJECTED" && (
              <div className="space-y-6">
                <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <div className="flex items-start">
                    <X className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-medium text-red-500">
                        Verification Failed
                      </h3>
                      <p className="text-gray-300 mt-1">
                        Your document verification was unsuccessful. Please review the reason below and submit again.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-3">Document Information</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                      <div className="text-sm text-gray-400">Document Type</div>
                      <div className="font-medium">
                        {getDocumentForStatus("REJECTED")?.type?.replace(/_/g, ' ') || 'Identity Document'}
                      </div>
                    </div>
                    <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                      <div className="text-sm text-gray-400">Document Number</div>
                      <div className="font-medium">
                        {(() => {
                          const doc = getDocumentForStatus("REJECTED");
                          return doc?.documentNumber 
                            ? `${doc.documentNumber.substring(0, 4)}****${doc.documentNumber.substring(doc.documentNumber.length - 4)}`
                            : '****';
                        })()}
                      </div>
                    </div>
                    <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                      <div className="text-sm text-gray-400">Submitted On</div>
                      <div className="font-medium">
                        {(() => {
                          const doc = getDocumentForStatus("REJECTED");
                          return doc?.createdAt 
                            ? new Date(doc.createdAt).toLocaleDateString()
                            : new Date().toLocaleDateString();
                        })()}
                      </div>
                    </div>
                    <div className="p-3 bg-dark-lighter rounded-lg flex justify-between">
                      <div className="text-sm text-gray-400">Status</div>
                      <Badge className="bg-red-500/20 text-red-500 gap-1">
                        <X className="h-3 w-3" />
                        Rejected
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-dark-lighter border-l-4 border-red-500 rounded-lg">
                  <h3 className="text-md font-medium mb-2">Rejection Reason</h3>
                  <p className="text-gray-300">
                    {getDocumentForStatus("REJECTED")?.rejectionReason || "Document was unclear or information could not be verified. Please ensure all details are clearly visible and try again."}
                  </p>
                </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedTab("status")}
                    className="border-gray-700"
                  >
                    Review Rejection
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-primary to-secondary"
                    onClick={() => setSelectedTab("upload")}
                  >
                    Resubmit Documents
                  </Button>
                </div>
              </div>
            )}
            
            {/* Removed duplicate fallback for NOT_SUBMITTED status. Already handled above with noKycDocs && actualKycStatus === "NOT_SUBMITTED". */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
