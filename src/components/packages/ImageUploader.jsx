"use client";

import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

/**
 * ImageUploader — reusable Cloudinary image upload component.
 *
 * Props:
 *   packageId   {string}   - The package MongoDB _id (required when uploading to server)
 *   dayIndex    {number}   - -1 for cover image, 0+ for itinerary day index
 *   existingImages {Array} - Array of { url, publicId, caption } to show pre-uploaded
 *   onUploaded  {fn}       - Called with { url, publicId, caption } after each upload
 *   onDeleted   {fn}       - Called with publicId after deletion
 *   maxImages   {number}   - Max images allowed (default: 5)
 *   label       {string}   - Section label text
 *   localMode   {boolean}  - If true, previews locally without server upload (for new packages)
 *   onLocalFile {fn}       - Called with File object when in localMode
 */
export default function ImageUploader({
  packageId,
  dayIndex = -1,
  existingImages = [],
  onUploaded,
  onDeleted,
  maxImages = 5,
  label = "Images",
  localMode = false,
  onLocalFile,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  // localPreviews: { url (object URL), file, caption }
  const [localPreviews, setLocalPreviews] = useState([]);

  const totalImages = existingImages.length + localPreviews.length;

  async function handleFiles(files) {
    setError("");
    const remaining = maxImages - totalImages;
    const toProcess = Array.from(files).slice(0, remaining);

    if (toProcess.length === 0) {
      setError(`Maximum ${maxImages} image(s) allowed.`);
      return;
    }

    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        continue;
      }

      if (localMode) {
        // Just create a local preview and pass the file up
        const objectUrl = URL.createObjectURL(file);
        const preview = { url: objectUrl, file, caption: "" };
        setLocalPreviews((prev) => [...prev, preview]);
        onLocalFile?.(file);
        continue;
      }

      // Upload to server
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("dayIndex", String(dayIndex));

        const res = await fetch(`/api/packages/${packageId}/images`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        onUploaded?.(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    }
  }

  async function handleDelete(publicId) {
    if (localMode) {
      setLocalPreviews((prev) =>
        prev.filter((p) => {
          if (p.url === publicId) {
            URL.revokeObjectURL(p.url);
            return false;
          }
          return true;
        })
      );
      onDeleted?.(publicId);
      return;
    }

    try {
      const res = await fetch(`/api/packages/${packageId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, dayIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      onDeleted?.(publicId);
    } catch (err) {
      setError(err.message);
    }
  }

  const allImages = [
    ...existingImages,
    ...localPreviews.map((p) => ({ url: p.url, publicId: p.url, caption: p.caption })),
  ];

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-[13px] font-medium text-gray-700">{label}</p>
      )}

      {/* Upload Zone */}
      {totalImages < maxImages && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload image"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`
            relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
            p-6 cursor-pointer transition-all duration-200 select-none
            ${dragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
            }
          `}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-gray-400" />
          )}
          <div className="text-center">
            <p className="text-[13px] font-medium text-gray-600">
              {uploading ? "Uploading…" : "Click or drag to upload"}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              PNG, JPG, WEBP — up to {maxImages} image{maxImages > 1 ? "s" : ""}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={maxImages > 1}
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[12px] text-red-500">{error}</p>
      )}

      {/* Image Previews */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allImages.map((img) => (
            <div key={img.publicId} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption || "Package image"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleDelete(img.publicId)}
                  className="w-8 h-8 bg-white/20 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Delete image"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              {img.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1">
                  <p className="text-[10px] text-white truncate">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {allImages.length === 0 && totalImages === maxImages && (
        <div className="flex items-center justify-center gap-2 py-4 text-gray-400">
          <ImageIcon className="w-4 h-4" />
          <span className="text-[12px]">Max images reached</span>
        </div>
      )}
    </div>
  );
}
