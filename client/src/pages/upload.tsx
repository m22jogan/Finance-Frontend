import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  HelpCircle 
} from "lucide-react";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadResult {
  success: boolean;
  count?: number;
  message?: string;
  errors?: string[];
}

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
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
      }, 200);

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
      setUploadResult({
        success: true,
        count: data.count,
        message: data.message
      });
      
      toast({
        title: "CSV uploaded successfully!",
        description: `${data.count} transactions processed`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/spending-by-category"] });
    },
    onError: (error: any) => {
      setUploadResult({
        success: false,
        message: error.message || "Failed to process CSV file"
      });
      
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
    setUploadResult(null);
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

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadResult(null);
  };

  const downloadTemplate = () => {
    const csvContent = "date,description,amount,type\n2024-01-15,Starbucks Coffee,4.85,expense\n2024-01-15,Salary Deposit,3200.00,income";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6" data-testid="upload-page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upload CSV</h1>
        <Button 
          variant="outline" 
          onClick={downloadTemplate}
          data-testid="download-template"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Upload Bank Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
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
                
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  {uploadResult?.success ? (
                    <CheckCircle className="text-green-600 text-2xl" />
                  ) : uploadResult && !uploadResult.success ? (
                    <AlertCircle className="text-red-600 text-2xl" />
                  ) : (
                    <UploadCloud className="text-primary text-2xl" />
                  )}
                </div>
                
                <h3 className="text-xl font-semibold mb-2" data-testid="upload-title">
                  {uploadResult?.success 
                    ? "Upload Complete!" 
                    : uploadResult && !uploadResult.success
                    ? "Upload Failed"
                    : "Drop your CSV file here"
                  }
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6" data-testid="upload-description">
                  {uploadResult?.success 
                    ? `${uploadResult.count} transactions have been processed`
                    : uploadResult && !uploadResult.success
                    ? uploadResult.message
                    : "or click to browse files"
                  }
                </p>
                
                {!uploadResult && (
                  <>
                    <Button 
                      size="lg"
                      onClick={handleButtonClick}
                      data-testid="choose-file-button"
                    >
                      Choose File
                    </Button>
                    <p className="text-sm text-gray-500 mt-4">
                      Supports CSV files up to 10MB
                    </p>
                  </>
                )}

                {uploadResult && (
                  <Button 
                    onClick={resetUpload}
                    data-testid="upload-another-button"
                  >
                    Upload Another File
                  </Button>
                )}
              </div>
              
              {uploadedFile && uploadMutation.isPending && (
                <div className="mt-6 space-y-2" data-testid="upload-progress">
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

              {uploadResult && (
                <Alert className={`mt-6 ${uploadResult.success ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'}`}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="upload-result">
                    {uploadResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                CSV Format Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Required Columns:</h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• <strong>date:</strong> Transaction date (YYYY-MM-DD)</li>
                  <li>• <strong>description:</strong> Transaction description</li>
                  <li>• <strong>amount:</strong> Transaction amount</li>
                  <li>• <strong>type:</strong> "income" or "expense"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Example:</h4>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs font-mono">
                  date,description,amount,type<br/>
                  2024-01-15,Starbucks,4.85,expense<br/>
                  2024-01-15,Salary,3200.00,income
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Auto-Categorization:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transactions are automatically categorized based on keywords in the description.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Supported Banks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Most bank CSV exports are supported. Common formats include:
              </p>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Chase Bank</li>
                <li>• Bank of America</li>
                <li>• Wells Fargo</li>
                <li>• Citibank</li>
                <li>• Capital One</li>
                <li>• And many more...</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
