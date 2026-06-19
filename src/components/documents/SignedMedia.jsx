import React from "react";
import { Loader2 } from "lucide-react";
import { useSignedUrl } from "@/hooks/useSignedUrl";

/**
 * Renders a Document's media (image / video / iframe) using a signed URL
 * for private files, falling back to the legacy public file_url.
 *
 * variant: 'thumb' | 'full'
 */
export default function SignedMedia({ doc, variant = "full", className, style, colors }) {
  const { url, isLoading } = useSignedUrl({
    entity: "Document",
    id: doc?.id,
    field: "file_uri",
    fallbackUrl: doc?.file_url,
    hasUri: !!doc?.file_uri,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#0C3B2E" }} />
      </div>
    );
  }

  if (!url) {
    return (
      <p className="text-center text-sm" style={{ color: colors?.textSecondary }}>
        No file content found.
      </p>
    );
  }

  if (doc.type === "photo") {
    return <img src={url} alt={doc.label || "photo"} className={className} style={style} />;
  }
  if (doc.type === "video") {
    return <video src={url} controls className={className} style={style} />;
  }
  return (
    <iframe src={url} className={className} style={style} title={doc.label || "document"} />
  );
}