"use client";

import { useState, useRef } from "react";
import {
  Upload, Link as LinkIcon, Image as ImageIcon, X, Loader2,
  Check, Sparkles, AlertCircle, RefreshCw
} from "lucide-react";

export default function PackageCoverImageUploader({
  coverImage = null,
  onChange,
  packageId = null,
}) {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "url"
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  // Handle file upload to Cloudinary
  async function handleFileUpload(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      let uploadUrl = "/api/accommodation/upload";
      if (packageId) {
        uploadUrl = `/api/packages/${packageId}/images`;
        formData.append("dayIndex", "-1");
      }

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image");

      onChange?.({
        url: data.url,
        publicId: data.publicId || "",
        caption: coverImage?.caption || "",
      });
    } catch (err) {
      console.error("Cover image upload error:", err);
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  // Handle direct URL apply
  function handleApplyUrl(e) {
    e?.preventDefault();
    if (!imageUrlInput.trim()) return;

    setError("");
    onChange?.({
      url: imageUrlInput.trim(),
      publicId: "",
      caption: coverImage?.caption || "",
    });
    setImageUrlInput("");
  }

  // Handle remove cover image
  function handleRemoveImage() {
    onChange?.(null);
    setError("");
  }

  // Handle caption change
  function handleCaptionChange(caption) {
    if (!coverImage) return;
    onChange?.({
      ...coverImage,
      caption,
    });
  }

  return (
    <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <span>Package Cover & Banner Image</span>
          </label>
          <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
            Hero image shown on quotation proposals, package cards, and client itinerary views.
          </p>
        </div>

        {coverImage?.url && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="text-[11.5px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200/80 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Remove Cover
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11.5px] font-semibold text-rose-700 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {coverImage?.url ? (
        /* ── Image Preview & Caption Mode ── */
        <div className="space-y-2.5">
          <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-slate-200 group bg-slate-950">
            {/* Background image */}
            <img
              src={coverImage.url}
              alt={coverImage.caption || "Package Cover Image"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80";
              }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-3.5" />

            {/* Top actions */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-bold text-[11px] shadow-sm backdrop-blur-xs transition-all flex items-center gap-1"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 text-slate-600" />}
                <span>Change Image</span>
              </button>
            </div>

            {/* Bottom Caption Overlay */}
            <div className="absolute bottom-3 left-3 right-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded">
                Active Cover Image
              </span>
              {coverImage.caption && (
                <p className="text-white text-[12px] font-semibold mt-1 drop-shadow-sm truncate">
                  {coverImage.caption}
                </p>
              )}
            </div>
          </div>

          {/* Caption input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={coverImage.caption || ""}
              onChange={(e) => handleCaptionChange(e.target.value)}
              placeholder="Add an optional image caption (e.g. Scenic Sunset over Kashmir Valley)..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>
        </div>
      ) : (
        /* ── Image Upload & URL Tabs ── */
        <div className="space-y-3">
          {/* Tab selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all ${
                activeTab === "upload"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Upload className="w-3 h-3" /> Upload File
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all ${
                activeTab === "url"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LinkIcon className="w-3 h-3" /> Image URL
            </button>
          </div>

          {activeTab === "upload" ? (
            /* Dropzone / File Upload */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-amber-500 bg-amber-50/50"
                  : "border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {uploading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  <p className="text-[12px] font-bold text-slate-700">Uploading package cover image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-[12.5px] font-bold text-slate-900 mt-1">
                    Click to browse or drag & drop cover image
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Supports high-resolution PNG, JPG, WebP (Landscape recommended)
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Direct Image URL */
            <form onSubmit={handleApplyUrl} className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Paste direct image link (e.g. https://images.unsplash.com/...)"
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!imageUrlInput.trim()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-[12px] transition-all flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Apply
              </button>
            </form>
          )}
        </div>
      )}

      {/* Hidden file input for changing existing image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />
    </div>
  );
}
