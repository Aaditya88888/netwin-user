import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScreenshotUploadSimpleProps {
  onUpload: (screenshot: string) => void;
  preview?: string | null;
  isUploading?: boolean;
  disabled?: boolean;
}

const ScreenshotUploadSimple = ({ onUpload, preview, isUploading = false, disabled = false }: ScreenshotUploadSimpleProps) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset error
    setError(null);
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB.');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onUpload(result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleUploadClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {!preview ? (
        <div 
          className={`border-2 border-dashed border-gray-700 rounded-lg p-8 text-center transition-colors ${
            disabled || isUploading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer hover:border-primary'
          }`}
          onClick={handleUploadClick}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary bg-opacity-10 p-3 rounded-full">
              {isUploading ? (
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              ) : (
                <Upload className="h-6 w-6 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-medium">
              {isUploading ? 'Uploading...' : 'Upload Screenshot'}
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {isUploading 
                ? 'Please wait while your screenshot is being uploaded'
                : 'Click to upload a screenshot of your match result screen'
              }
            </p>
            {!isUploading && (
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG or JPEG (max. 5MB)
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <img 
              src={preview} 
              alt="Screenshot Preview" 
              className="w-full h-auto object-contain max-h-48"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
            className="border-gray-700 w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Image className="h-4 w-4 mr-2" />
                Change Image
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScreenshotUploadSimple;
