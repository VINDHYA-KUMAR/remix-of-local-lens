import { useState, useRef } from "react";
import { Upload, Loader2, Check, Image as ImageIcon, X } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onUploadComplete: () => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  uploadedCount: number;
}

const ImageUploader = ({ onUploadComplete, isUploading, setIsUploading, uploadedCount }: ImageUploaderProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f =>
      f.type.startsWith("image/")
    );
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setProgress(0);

    let uploaded = 0;
    for (const file of selectedFiles) {
      const ext = file.name.split(".").pop();
      const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(storagePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(storagePath);

      // Insert record
      const { data: imageRecord, error: insertError } = await supabase
        .from("images")
        .insert({ filename: file.name, storage_path: storagePath })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }

      // Trigger AI description (fire and forget for speed)
      supabase.functions.invoke("describe-image", {
        body: { imageId: imageRecord.id, storageUrl: urlData.publicUrl },
      }).catch(err => console.error("Describe error:", err));

      uploaded++;
      setProgress(Math.round((uploaded / selectedFiles.length) * 100));
    }

    toast({
      title: "Upload complete",
      description: `${uploaded} of ${selectedFiles.length} images uploaded. AI is analyzing them...`,
    });

    setSelectedFiles([]);
    setIsUploading(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onUploadComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="h-4 w-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm text-foreground">Upload Images</h3>
        {uploadedCount > 0 && (
          <span className="ml-auto text-xs font-mono text-primary">{uploadedCount} in gallery</span>
        )}
      </div>

      {/* @ts-ignore webkitdirectory is non-standard */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        // @ts-ignore
        webkitdirectory=""
        // @ts-ignore
        directory=""
        onChange={handleFilesSelected}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer disabled:opacity-40"
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Click to select a folder</p>
        <p className="text-xs text-muted-foreground/60 mt-1">All images (JPG, PNG, WebP) in the folder will be uploaded</p>
      </button>

      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{selectedFiles.length} files selected</p>
            <button
              onClick={() => { setSelectedFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading... {progress}%
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Upload & Analyze
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ImageUploader;
