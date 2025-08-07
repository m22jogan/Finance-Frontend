import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CsvUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      try {
        const response = await apiRequest('POST', '/api/upload/csv', formData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "CSV uploaded successfully!",
        description: `${data.count} transactions processed`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/spending-by-category"] });
      
      // Reset after success
      setTimeout(() => {
        setUploadedFile(null);
        setUploadProgress(0);
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process CSV file",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileSelect(csvFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setUploadProgress(0);
    uploadMutation.mutate(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const getUploadStatus = () => {
    if (uploadMutation.isPending) return "uploading";
    if (uploadMutation.isSuccess && uploadProgress === 100) return "success";
    if (uploadMutation.isError) return "error";
    return "idle";
  };

  const status = getUploadStatus();

  return (
    <Card className="bg-white dark:bg-gray-800" data-testid="csv-upload">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quick Upload</CardTitle>
        <Link href="/upload">
          <a className="text-primary text-sm font-medium hover:underline" data-testid="full-upload-page">
            Full Upload Page
          </a>
        </Link>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 dark:border-gray-600 hover:border-primary"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          data-testid="file-drop-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
            data-testid="file-input"
          />
          
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            {status === "success" ? (
              <CheckCircle className="text-green-600 text-xl" />
            ) : status === "error" ? (
              <AlertCircle className="text-red-600 text-xl" />
            ) : (
              <UploadCloud className="text-primary text-xl" />
            )}
          </div>
          
          <h4 className="text-lg font-medium mb-2" data-testid="upload-title">
            {status === "success" ? "Upload Complete!" : "Drop your CSV file here"}
          </h4>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4" data-testid="upload-description">
            {status === "success" 
              ? "Your transactions have been processed"
              : "or click to browse files"
            }
          </p>
          
          {status === "idle" && (
            <>
              <Button 
                onClick={handleButtonClick}
                data-testid="choose-file-button"
              >
                Choose File
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supports CSV files up to 10MB
              </p>
            </>
          )}
        </div>
        
        {uploadedFile && (status === "uploading" || status === "success") && (
          <div className="mt-4 space-y-2" data-testid="upload-progress">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                {uploadedFile.name}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {uploadProgress}%
              </span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
