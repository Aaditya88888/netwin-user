import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { KYC_DOCUMENT_TYPES } from "@/utils/constants";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { FileUploader } from "../common/FileUploader";
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const kycSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  documentNumber: z.string().min(4, "Document number is required"),
  frontImage: z.string().min(1, "Front image is required"),
  backImage: z.string().optional(),
});

type KycFormValues = z.infer<typeof kycSchema>;

const KycDocuments = () => {
  const { profile, kycDocuments, submitKycDocument, getKycStatus } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      documentType: "",
      documentNumber: "",
      frontImage: "",
      backImage: ""
    },
  });

  const onSubmit = async (data: KycFormValues) => {
    if (!profile) return;
    setLoading(true);
    try {
      const success = await submitKycDocument({
        type: data.documentType as 'id-proof' | 'address-proof' | 'pan-card',
        documentNumber: data.documentNumber,
        frontImageUrl: data.frontImage,
        backImageUrl: data.backImage,
      });
      if (success) {
        toast({
          title: "KYC Submitted",
          description: "Your KYC documents have been submitted for verification.",
        });
        form.reset();
      } else {
        throw new Error("Failed to submit KYC");
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit KYC documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!profile) return null;
  
  // 1. Explicitly type kycStatus to match possible string values
  const kycStatus = getKycStatus() as "approved" | "pending" | "rejected" | "not_submitted" | undefined;
  // Fix: Safe country key lookup for KYC document types
  const countryKey = Object.keys(KYC_DOCUMENT_TYPES).includes(profile.country) ? profile.country : 'default';
  const documentTypes = KYC_DOCUMENT_TYPES[countryKey as keyof typeof KYC_DOCUMENT_TYPES];
  const documentTypeLabels: Record<string, string> = {
    'id-proof': 'ID Proof',
    'address-proof': 'Address Proof',
    'pan-card': 'PAN Card',
  };
  
  // If KYC is already submitted or approved, show status
  // 1. Fix all status comparisons by casting to string
  if ((kycStatus as string) === "approved" || (kycStatus as string) === "pending") {
    return (
      <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">KYC Verification</h3>
        {(kycStatus as string) === "approved" ? (
          <Alert className="bg-green-900 bg-opacity-20 border-green-800">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-500">Verified</AlertTitle>
            <AlertDescription className="text-green-400">
              Your KYC verification has been approved. You can now withdraw funds.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-900 bg-opacity-20 border-yellow-800">
            <Clock className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">Pending Verification</AlertTitle>
            <AlertDescription className="text-yellow-400">
              Your KYC documents are being reviewed. This process usually takes 24-48 hours.
            </AlertDescription>
          </Alert>
        )}
        {/* Show submitted documents */}
        {kycDocuments.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Submitted Documents</h4>
            {kycDocuments.map((doc, index) => (
              <div key={index} className="p-3 bg-dark-lighter rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{documentTypeLabels[doc.type] || doc.type}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    (doc.status as string) === "approved" ? "bg-green-600 text-white" :
                    (doc.status as string) === "pending" ? "bg-yellow-600 text-white" :
                    "bg-red-600 text-white"
                  }`}>
                    {(doc.status as string).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-400">Document ID: {doc.documentNumber}</p>
                <p className="text-sm text-gray-400">Submitted on: {new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // If KYC was rejected, show rejection reason and form
  // 2. Fix rejectedDoc status check
  const rejectedDoc = kycDocuments.find(doc => (doc.status as string) === "rejected");
  
  return (
    <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
      <h3 className="text-lg font-semibold mb-4">KYC Verification</h3>
      
      {rejectedDoc && (
        <Alert className="bg-red-900 bg-opacity-20 border-red-800 mb-6">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-500">Verification Failed</AlertTitle>
          <AlertDescription className="text-red-400">
            {rejectedDoc.rejectionReason || "Your KYC verification was rejected. Please resubmit with valid documents."}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <h4 className="font-medium mb-2">Required Documents for {profile.country}</h4>
        <ul className="list-disc pl-5 space-y-1 text-gray-400">
          {documentTypes.map((type: string) => (
            <li key={type}>{documentTypeLabels[type] || type}</li>
          ))}
        </ul>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-dark-lighter border-0 focus:ring-2 focus:ring-primary">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-dark-lighter border-gray-700">
                    {documentTypes.map((type: string) => (
                      <SelectItem key={type} value={type} className="hover:bg-gray-700">
                        {documentTypeLabels[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="documentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Number</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Enter document number"
                    className="bg-dark-lighter border-0 focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </FormControl>
                <FormDescription>
                  Enter the identification number on your document.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="frontImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Front Image</FormLabel>
                <FormControl>
                  <FileUploader
                    onFileSelect={async (file: File) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          field.onChange(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    accept="image/*"
                    maxSize={5}
                  />
                </FormControl>
                <FormDescription>
                  Upload front side of your document. Max 5MB.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="backImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Back Image (Optional)</FormLabel>
                <FormControl>
                  <FileUploader
                    onFileSelect={async (file: File) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          field.onChange(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    accept="image/*"
                    maxSize={5}
                  />
                </FormControl>
                <FormDescription>
                  Upload back side of your document if applicable. Max 5MB.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="mt-6">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit for Verification"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default KycDocuments;
