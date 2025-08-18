import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function CsvUpload() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const { id: userId } = user || {}; // Destructure and rename id to userId

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error("User not authenticated");

      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      try {
        const response = await apiRequest("POST", "/api/upload/csv", formData, userId);
        clearInterval(progressInterval);

        setUploadProgress(100);
        return await response.json();
      } catch (error: any) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onError: (error: any) => {
      console.error("Upload error:", error.message);
    },
    onSettled: () => {
      setTimeout(() => setUploadProgress(0), 1000);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
        data-testid="file-input"
      />
      <Button
        onClick={handleButtonClick}
        disabled={!userId || uploadMutation.isPending}
        data-testid="choose-file-button"
      >
        {userId ? "Choose File" : "Loading user..."}
      </Button>
      {uploadMutation.isPending && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
