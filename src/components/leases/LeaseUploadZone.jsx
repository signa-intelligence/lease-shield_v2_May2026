import React from "react";
import { Upload, FileText, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeaseUploadZone({ onFileSelect, dragActive, onDrag }) {
  const fileInputRef = React.useRef(null);

  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onFileSelect}
      className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
        dragActive 
          ? "border-ls-forest bg-emerald-50" 
          : "border-slate-300 hover:border-ls-forest bg-white"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={onFileSelect}
        className="hidden"
      />
      
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-ls-forest to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
          <Upload className="w-10 h-10 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-ls-charcoal mb-3">
          Upload Your Lease Agreement
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Drag and drop your lease document here, or click to browse
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-ls-forest hover:bg-emerald-800 text-white shadow-lg font-semibold"
          >
            <FileText className="w-5 h-5 mr-2" />
            Browse Files
          </Button>
          <Button
            size="lg"
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-ls-forest text-ls-forest hover:bg-ls-forest hover:text-white font-semibold shadow-sm"
          >
            <Camera className="w-5 h-5 mr-2" />
            Take Photo
          </Button>
        </div>
        
        <p className="text-xs text-slate-400 mt-6">
          Supported formats: PDF, PNG, JPEG • Max size: 10MB
        </p>
      </div>
    </div>
  );
}