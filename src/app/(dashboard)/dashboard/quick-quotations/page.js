"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Zap, Plus, Search, Loader2, FileText, ArrowLeft,
  Calendar, Users, MapPin, MessageSquare, Copy, Check,
  ExternalLink, Pencil, Trash2, Eye, Sparkles, CheckCircle2, Clock,
  Mail, Phone, Layers, Compass, Heart, Mountain, Waves, Trees, Car, X,
  UserCheck, ShieldCheck, HeartHandshake, Flame
} from "lucide-react";
import QuickWhatsAppShareModal from "@/components/quick-quotations/QuickWhatsAppShareModal";
import QuickEmailShareModal from "@/components/quick-quotations/QuickEmailShareModal";

const STATUS_CONFIG = {
  draft: { label: "Draft", bg: "bg-slate-100 text-slate-700 border-slate-200/80", dot: "bg-slate-400" },
  sent: { label: "Sent", bg: "bg-rose-50 text-rose-700 border-rose-200/80", dot: "bg-rose-500" },
  viewed: { label: "Viewed", bg: "bg-purple-50 text-purple-700 border-purple-200/80", dot: "bg-purple-500" },
  accepted: { label: "Accepted", bg: "bg-emerald-50 text-emerald-800 border-emerald-200/90", dot: "bg-emerald-500" },
  converted: { label: "Converted", bg: "bg-indigo-50 text-indigo-700 border-indigo-200/80", dot: "bg-indigo-500" },
  expired: { label: "Expired", bg: "bg-amber-50 text-amber-800 border-amber-200/80", dot: "bg-amber-500" },
  cancelled: { label: "Cancelled", bg: "bg-slate-100 text-slate-600 border-slate-200/80", dot: "bg-slate-400" },
};

const THEME_TAGS = {
  honeymoon: { label: "Honeymoon Romance", icon: Heart, color: "text-rose-700 bg-rose-50/90 border-rose-200" },
  mountain: { label: "Misty Mountain Retreat", icon: Mountain, color: "text-emerald-700 bg-emerald-50/90 border-emerald-200" },
  beach: { label: "Sunset Beach & Island", icon: Waves, color: "text-sky-700 bg-sky-50/90 border-sky-200" },
  heritage: { label: "Royal Palace Romance", icon: Sparkles, color: "text-purple-700 bg-purple-50/90 border-purple-200" },
  safari: { label: "Wilderness for Two", icon: Trees, color: "text-lime-700 bg-lime-50/90 border-lime-200" },
  adventure: { label: "Adventure Couple Tour", icon: Flame, color: "text-orange-700 bg-orange-50/90 border-orange-200" },
  general: { label: "Couple Getaway", icon: Compass, color: "text-slate-700 bg-slate-100 border-slate-200" },
};

// ── Timestamp Formatter Helpers ──────────────────────────────────────────────
function formatDateTime(isoString) {
  if (!isoString) return "N/A";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "N/A";

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Couple Initials Helper ───────────────────────────────────────────────────
function getClientInitials(name) {
  if (!name || typeof name !== "string") return "❤️";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function QuickQuotationsPipelinePage() {
  const { data: session } = useSession();
  const [quickQuotations, setQuickQuotations] = useState([]);
  const [stats, setStats] = useState({ total: 0, totalValue: 0, accepted: 0, acceptedValue: 0, converted: 0, sent: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [convertingId, setConvertingId] = useState(null);

  // Share modal state
  const [shareQuote, setShareQuote] = useState(null);
  const [emailQuote, setEmailQuote] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchQuickQuotations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/quick-quotations?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load quick quotations");
      setQuickQuotations(data.quickQuotations || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const debounce = setTimeout(fetchQuickQuotations, 300);
    return () => clearTimeout(debounce);
  }, [fetchQuickQuotations]);

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this quick quotation?")) return;
    try {
      const res = await fetch(`/api/quick-quotations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setQuickQuotations((prev) => prev.filter((q) => q._id !== id));
      fetchQuickQuotations();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  async function handleConvert(id) {
    if (!confirm("Convert this Quick Quote into a Full Detailed Quotation?")) return;
    setConvertingId(id);
    try {
      const res = await fetch(`/api/quick-quotations/${id}/convert`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");

      window.location.href = `/dashboard/quotations/${data.quotationId}/edit`;
    } catch (err) {
      alert(`Conversion error: ${err.message}`);
      setConvertingId(null);
    }
  }

  function handleCopyLink(code) {
    const url = `${window.location.origin}/quick-quote/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffdfd] via-[#fff5f7]/60 to-[#fbf7fa] text-slate-900 font-sans pb-28 selection:bg-rose-100 selection:text-rose-900">
      {/* ── Romantic Studio Header ── */}
      <div className="bg-white/90 backdrop-blur-md border-b border-rose-100 px-4 sm:px-8 py-5 sm:py-6 shadow-2xs">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-rose-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/quotations"
                className="px-3.5 py-1.5 rounded-xl bg-rose-50/70 hover:bg-rose-100/80 text-rose-800 font-medium text-[11.5px] border border-rose-200/60 transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" /> Full Detailed Quotations
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-rose-200">
                  <Heart className="w-4.5 h-4.5 fill-white text-white" />
                </span>
                <div>
                  <h1 className="text-[20px] sm:text-[23px] font-black text-slate-900 tracking-tight leading-none">
                    Plan My Honeymoon <span className="font-normal text-rose-600 text-[18px]">Studio</span>
                  </h1>
                </div>
              </div>
              <p className="text-[12.5px] text-slate-500 font-medium mt-1.5 flex items-center gap-1.5">
                <span>Curate enchanting honeymoon packages & romantic couple getaways in 60 seconds.</span>
              </p>
            </div>

            <Link
              href="/dashboard/quick-quotations/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-[12.5px] font-bold shadow-md shadow-rose-200 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto border border-rose-400/30"
            >
              <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>Create Couple Quote</span>
            </Link>
          </div>

          {/* ── Romantic Metric Highlights ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/80 border border-rose-100 hover:border-rose-200 transition-all shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Proposals</p>
              <p className="text-[18px] sm:text-[20px] font-black text-slate-900 mt-0.5">{stats.total}</p>
              <p className="text-[11px] font-semibold text-slate-500 truncate">₹{stats.totalValue.toLocaleString("en-IN")} Total Pipeline</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 hover:border-rose-300 transition-all shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Confirmed Honeymoons</p>
              <p className="text-[18px] sm:text-[20px] font-black text-rose-950 mt-0.5">{stats.accepted}</p>
              <p className="text-[11px] font-bold text-rose-700 truncate">₹{stats.acceptedValue.toLocaleString("en-IN")} Booked</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 hover:border-amber-300 transition-all shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Active Sent Deals</p>
              <p className="text-[18px] sm:text-[20px] font-black text-amber-950 mt-0.5">{stats.sent}</p>
              <p className="text-[11px] font-semibold text-amber-700 truncate">Awaiting Couple Reply</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/80 hover:border-purple-300 transition-all shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Full Itineraries</p>
              <p className="text-[18px] sm:text-[20px] font-black text-purple-950 mt-0.5">{stats.converted}</p>
              <p className="text-[11px] font-semibold text-purple-700 truncate">Upgraded Packages</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-rose-100/90 shadow-xs">
          {/* Search input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search couples, codes, destinations..."
              className="w-full pl-8 pr-8 py-2 bg-rose-50/30 border border-rose-100 rounded-xl text-[12px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Proposals" },
              { id: "draft", label: "Draft" },
              { id: "sent", label: "Sent" },
              { id: "viewed", label: "Viewed" },
              { id: "accepted", label: "Accepted" },
              { id: "converted", label: "Converted" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all whitespace-nowrap ${
                  statusFilter === st.id
                    ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs shadow-rose-200"
                    : "text-slate-600 hover:bg-rose-50/70 hover:text-rose-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Quotation List ── */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-rose-100">
              <Loader2 className="w-7 h-7 text-rose-500 animate-spin" />
              <p className="text-[12px] font-semibold text-slate-400">Loading romantic proposals...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center space-y-1">
              <p className="font-bold text-[13px]">{error}</p>
              <button
                type="button"
                onClick={fetchQuickQuotations}
                className="text-[11.5px] font-bold text-rose-700 underline hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          ) : quickQuotations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-50 to-pink-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h3 className="text-[16px] font-black text-slate-900">No Honeymoon Quotes Found</h3>
                <p className="text-[12px] text-slate-500 mt-1 max-w-md mx-auto">
                  Create your first couple proposal to share unforgettable travel memories with your clients.
                </p>
              </div>
              <Link
                href="/dashboard/quick-quotations/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-[12px] shadow-sm shadow-rose-200 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-white" /> Create Couple Quote
              </Link>
            </div>
          ) : (
            quickQuotations.map((qq) => {
              const statusCfg = STATUS_CONFIG[qq.status] || STATUS_CONFIG.draft;
              const theme = THEME_TAGS[qq.tripDetails?.theme] || THEME_TAGS.general;
              const ThemeIcon = theme.icon;
              const hasDiscount = (qq.pricing?.discountAmount || 0) > 0;
              const isConverting = convertingId === qq._id;

              const isModified =
                qq.updatedAt &&
                qq.createdAt &&
                Math.abs(new Date(qq.updatedAt).getTime() - new Date(qq.createdAt).getTime()) > 5000;

              const clientInitials = getClientInitials(qq.client?.name);
              const creatorName = qq.createdBy?.name || "Team";
              const creatorRole = qq.createdBy?.role || "Agent";
              const isCouple = (qq.client?.adults || 2) === 2 && (!qq.client?.children || qq.client?.children === 0);

              return (
                <div
                  key={qq._id}
                  className="bg-white rounded-2xl border border-rose-100/90 p-4 sm:p-4.5 hover:border-rose-300 hover:shadow-md hover:shadow-rose-100/60 transition-all space-y-3 group relative"
                >
                  {/* Top Metadata Bar: Code, Status, Theme, Creator Agent, Timestamps */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-rose-50">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Quote Code */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(qq.quickQuoteCode)}
                        title="Click to copy proposal link"
                        className="font-mono text-[11px] font-bold text-slate-800 bg-rose-50/60 hover:bg-rose-100/80 hover:text-rose-950 px-2 py-0.5 rounded-md border border-rose-100 transition-colors flex items-center gap-1"
                      >
                        <span>{qq.quickQuoteCode}</span>
                        {copiedCode === qq.quickQuoteCode ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </button>

                      {/* Status pill */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${statusCfg.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <span>{statusCfg.label}</span>
                      </span>

                      {/* Theme */}
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${theme.color}`}>
                        <ThemeIcon className="w-3 h-3" />
                        <span>{theme.label}</span>
                      </span>

                      {/* Creator / Staff Badge */}
                      <span
                        className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60"
                        title={`Created by ${creatorName} (${creatorRole})`}
                      >
                        <UserCheck className="w-3 h-3 text-rose-500" />
                        <span>Curated by: <strong className="font-bold text-slate-800">{creatorName}</strong></span>
                      </span>
                    </div>

                    {/* Timestamps (Created & Modified) */}
                    <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-400 font-medium flex-wrap">
                      <span className="inline-flex items-center gap-1" title={`Created on ${formatDateTime(qq.createdAt)}`}>
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Created: <strong className="font-semibold text-slate-600">{formatDateTime(qq.createdAt)}</strong></span>
                      </span>

                      {isModified && (
                        <span
                          className="inline-flex items-center gap-1 text-rose-700 bg-rose-50/70 px-1.5 py-0.5 rounded border border-rose-200/60"
                          title={`Last modified on ${formatDateTime(qq.updatedAt)}`}
                        >
                          <Clock className="w-3 h-3 text-rose-500" />
                          <span>Updated: <strong className="font-bold text-rose-900">{formatDateTime(qq.updatedAt)}</strong> ({formatRelativeTime(qq.updatedAt)})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Section: Person Identity & Trip Core (Left) + Commercials & Actions (Right) */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Romantic Couple Identity & Trip Parameters */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Couple Avatar Circle with Sunset Gradient */}
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 text-white font-black text-[12.5px] flex items-center justify-center flex-shrink-0 tracking-wider shadow-sm shadow-rose-200">
                        {clientInitials}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        {/* Hero Client & Couple Identification */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-[15px] font-bold text-slate-900 leading-none truncate group-hover:text-rose-600 transition-colors">
                            {qq.client?.name || "Valued Couple"}
                          </h2>

                          {isCouple && (
                            <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/80">
                              <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> Couple Escape
                            </span>
                          )}

                          {/* Direct Contact Badges */}
                          {qq.client?.phone && (
                            <a
                              href={`tel:${qq.client.phone}`}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-700 bg-slate-50 hover:bg-rose-50/60 px-1.5 py-0.5 rounded border border-slate-200/60 transition-colors"
                              title="Call Client"
                            >
                              <Phone className="w-2.5 h-2.5 text-rose-400" />
                              <span>{qq.client.phone}</span>
                            </a>
                          )}

                          {qq.client?.email && (
                            <a
                              href={`mailto:${qq.client.email}`}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-700 bg-slate-50 hover:bg-rose-50/60 px-1.5 py-0.5 rounded border border-slate-200/60 transition-colors hidden sm:inline-flex"
                              title="Email Client"
                            >
                              <Mail className="w-2.5 h-2.5 text-rose-400" />
                              <span className="truncate max-w-[140px]">{qq.client.email}</span>
                            </a>
                          )}
                        </div>

                        {/* Trip Destination & Title */}
                        <div className="flex items-center gap-2 text-[12px] text-slate-600 font-medium flex-wrap">
                          {qq.tripDetails?.destination && (
                            <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              <span>{qq.tripDetails.destination}</span>
                            </span>
                          )}

                          {qq.tripDetails?.title && (
                            <span className="text-slate-400 truncate max-w-sm">
                              • {qq.tripDetails.title}
                            </span>
                          )}
                        </div>

                        {/* Trip Specs: Duration, Pax, Vehicle */}
                        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-medium pt-0.5 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-rose-400" />
                            <span>{qq.tripDetails?.nights || 1}N / {qq.tripDetails?.days || 2}D</span>
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3 text-rose-400" />
                            <span>
                              {qq.client?.adults || 2} Adults
                              {qq.client?.children ? `, ${qq.client.children} Kids` : ""}
                            </span>
                          </span>

                          {qq.vehicle?.vehicleType && (
                            <span className="inline-flex items-center gap-1 text-slate-600 hidden md:inline-flex">
                              <Car className="w-3 h-3 text-slate-400" />
                              <span>{qq.vehicle.vehicleType}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Commercials & Minimalist Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-rose-50 flex-shrink-0">
                      {/* Price Display */}
                      <div className="text-left sm:text-right">
                        {hasDiscount && (
                          <div className="flex items-center sm:justify-end gap-1">
                            <span className="text-[10px] text-slate-400 line-through font-medium">
                              ₹{((qq.pricing?.finalPrice || 0) + (qq.pricing?.discountAmount || 0)).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                              -₹{qq.pricing.discountAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                        <p className="text-[17px] font-black text-slate-900 leading-tight">
                          ₹{(qq.pricing?.finalPrice || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10.5px] font-bold text-rose-600">
                          {isCouple ? "Couple Package Total" : `₹${(qq.pricing?.perPersonPrice || 0).toLocaleString("en-IN")} / Person`}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* WhatsApp button */}
                        <button
                          type="button"
                          onClick={() => setShareQuote(qq)}
                          title="Share Honeymoon Offer via WhatsApp"
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Email button */}
                        <button
                          type="button"
                          onClick={() => setEmailQuote(qq)}
                          title="Send Proposal via Email"
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 transition-all active:scale-95"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(qq.quickQuoteCode)}
                          title="Copy Public Proposal Link"
                          className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition-colors active:scale-95"
                        >
                          {copiedCode === qq.quickQuoteCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Live View */}
                        <a
                          href={`/quick-quote/${qq.quickQuoteCode}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Live Honeymoon Proposal"
                          className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition-colors active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>

                        {/* Edit */}
                        <Link
                          href={`/dashboard/quick-quotations/${qq._id}/edit`}
                          title="Edit Couple Quote"
                          className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition-colors active:scale-95"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>

                        {/* 1-Click Convert to Full Quotation */}
                        {qq.status !== "converted" ? (
                          <button
                            type="button"
                            onClick={() => handleConvert(qq._id)}
                            disabled={isConverting}
                            title="Upgrade / Convert to Full Detailed Quotation"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-[11px] transition-colors disabled:opacity-50 active:scale-95"
                          >
                            {isConverting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3 text-purple-600" />}
                            <span>Upgrade</span>
                          </button>
                        ) : (
                          <Link
                            href={`/dashboard/quotations/${qq.convertedQuotationId}/edit`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px] transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                            <span>Full Quote</span>
                          </Link>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(qq._id)}
                          title="Delete Quick Quote"
                          className="p-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200/80 hover:border-rose-200 transition-colors active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {shareQuote && (
        <QuickWhatsAppShareModal
          quickQuote={shareQuote}
          isOpen={Boolean(shareQuote)}
          onClose={() => setShareQuote(null)}
        />
      )}

      {/* Email Share Modal */}
      {emailQuote && (
        <QuickEmailShareModal
          quickQuote={emailQuote}
          isOpen={Boolean(emailQuote)}
          onClose={() => setEmailQuote(null)}
        />
      )}
    </div>
  );
}
