"use client";

import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";

/**
 * AccommodationImageUploader — Cloudinary image uploader for hotels and rooms.
 *
 * Props:
 *   images      {Array}   - Controlled array of { url, publicId, caption }
 *   onChange    {fn}      - Called with the updated images array
 *   maxImages   {number}  - Max images (default 6)
 *   label       {string}  - Section label
 *   required    {boolean} - Shows "required" indicator
 */
export default function AccommodationImageUploader({
  images = [],
  onChange,
  maxImages = 6,
  label = "Images",
  required = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files) {
    setError("");
    const remaining = maxImages - images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    if (toProcess.length === 0) {
      setError(`Maximum ${maxImages} image${maxImages > 1 ? "s" : ""} allowed.`);
      return;
    }

    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        continue;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/accommodation/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        onChange([...images, { url: data.url, publicId: data.publicId, caption: "" }]);
      } catch (err) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    }
  }

  async function handleDelete(publicId) {
    try {
      await fetch("/api/accommodation/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
    } catch {
      // best-effort Cloudinary delete
    }
    onChange(images.filter((img) => img.publicId !== publicId));
  }

  const canUpload = images.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <p className="text-[12px] font-medium text-gray-500">
          {label}
        </p>
        <span className="text-[11px] text-gray-400">
          ({images.length}/{maxImages})
        </span>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.publicId}
              className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption || "Hotel image"}
                className="w-full h-full object-cover"
              />
              {/* Delete overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleDelete(img.publicId)}
                  aria-label="Remove image"
                  className="w-8 h-8 bg-white/20 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canUpload && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload image"
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!uploading) handleFiles(e.dataTransfer.files);
          }}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
            p-5 cursor-pointer transition-all duration-200 select-none
            ${dragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
            }
            ${uploading ? "pointer-events-none opacity-70" : ""}
          `}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-gray-400" />
          )}
          <div className="text-center">
            <p className="text-[12px] font-medium text-gray-600">
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
        <p className="text-[12px] text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
