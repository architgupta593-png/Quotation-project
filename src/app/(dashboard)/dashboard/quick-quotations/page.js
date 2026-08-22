"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Zap, Plus, Search, Filter, Loader2, FileText, AlertCircle, ArrowLeft,
  Calendar, Users, MapPin, IndianRupee, MessageSquare, Copy, Check,
  ExternalLink, Pencil, Trash2, Eye, Sparkles, CheckCircle2, Clock,
  ArrowRight, ShieldCheck, HeartHandshake, Mail, RefreshCw, Layers,
} from "lucide-react";
import QuickWhatsAppShareModal from "@/components/quick-quotations/QuickWhatsAppShareModal";
import QuickEmailShareModal from "@/components/quick-quotations/QuickEmailShareModal";

const STATUS_BADGES = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  viewed: "bg-purple-50 text-purple-700 border-purple-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  converted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const THEME_TAGS = {
  honeymoon: { label: "Honeymoon", bg: "bg-rose-50 text-rose-700 border-rose-200" },
  mountain: { label: "Mountain", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  beach: { label: "Beach", bg: "bg-sky-50 text-sky-700 border-sky-200" },
  heritage: { label: "Heritage", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  safari: { label: "Safari", bg: "bg-lime-50 text-lime-700 border-lime-200" },
  adventure: { label: "Adventure", bg: "bg-orange-50 text-orange-700 border-orange-200" },
  general: { label: "Tour", bg: "bg-slate-50 text-slate-700 border-slate-200" },
};

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
      
      // Redirect to full quotation editor
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-6 shadow-xs">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/quotations"
                className="px-3.5 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12px] transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" /> Full Detailed Quotations
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <Zap className="w-4 h-4" />
                </span>
                <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
                  Quick Quotations Studio
                </h1>
              </div>
              <p className="text-[13px] text-slate-500 font-medium mt-1">
                Fast 1-minute quoting for incoming phone inquiries, WhatsApp leads, and instant client proposals.
              </p>
            </div>

            <Link
              href="/dashboard/quick-quotations/new"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white text-[13px] font-black shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quick Quote</span>
            </Link>
          </div>

          {/* ── Metric Highlights ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">Total Quick Quotes</p>
              <p className="text-[20px] font-black text-slate-900 mt-0.5">{stats.total}</p>
              <p className="text-[11px] font-bold text-slate-500">₹{stats.totalValue.toLocaleString("en-IN")} Total Value</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <p className="text-[10.5px] font-black uppercase tracking-wider text-emerald-700">Accepted Proposals</p>
              <p className="text-[20px] font-black text-emerald-800 mt-0.5">{stats.accepted}</p>
              <p className="text-[11px] font-bold text-emerald-600">₹{stats.acceptedValue.toLocaleString("en-IN")} Confirmed</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <p className="text-[10.5px] font-black uppercase tracking-wider text-blue-700">Active Sent Quotes</p>
              <p className="text-[20px] font-black text-blue-800 mt-0.5">{stats.sent}</p>
              <p className="text-[11px] font-bold text-blue-600">Awaiting Client Reply</p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200">
              <p className="text-[10.5px] font-black uppercase tracking-wider text-indigo-700">Converted to Full</p>
              <p className="text-[20px] font-black text-indigo-800 mt-0.5">{stats.converted}</p>
              <p className="text-[11px] font-bold text-indigo-600">Upgraded to Itinerary</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, client, destination..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["all", "draft", "sent", "viewed", "accepted", "converted"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold capitalize transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {st === "all" ? "All Proposals" : st}
              </button>
            ))}
          </div>
        </div>

        {/* ── Quotation List ── */}
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-[13px] font-bold text-slate-400">Loading quick quotations...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center">
              <p className="font-bold">{error}</p>
            </div>
          ) : quickQuotations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-[17px] font-black text-slate-900">No Quick Quotations Found</h3>
                <p className="text-[13px] text-slate-500 mt-1 max-w-md mx-auto">
                  Create your first 60-second quick proposal to send fast WhatsApp and email travel offers to your leads.
                </p>
              </div>
              <Link
                href="/dashboard/quick-quotations/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[13px] transition-all"
              >
                <Plus className="w-4 h-4" /> Create Quick Quote
              </Link>
            </div>
          ) : (
            quickQuotations.map((qq) => {
              const theme = THEME_TAGS[qq.tripDetails?.theme] || THEME_TAGS.general;
              const hasDiscount = (qq.pricing?.discountAmount || 0) > 0;
              const isConverting = convertingId === qq._id;

              return (
                <div
                  key={qq._id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 hover:border-amber-400/80 transition-all shadow-xs hover:shadow-md space-y-4 group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Code, Title, Client, Dates */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-black tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {qq.quickQuoteCode}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_BADGES[qq.status] || STATUS_BADGES.draft}`}>
                          {qq.status}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${theme.bg}`}>
                          {theme.label}
                        </span>
                      </div>

                      <h3 className="text-[16px] font-black text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
                        {qq.tripDetails?.title}
                      </h3>

                      <div className="flex items-center gap-4 text-[12.5px] text-slate-500 font-semibold flex-wrap">
                        <span className="flex items-center gap-1 text-slate-800 font-bold">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {qq.client?.name} ({qq.client?.phone})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {qq.tripDetails?.destination}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {qq.tripDetails?.nights}N / {qq.tripDetails?.days}D
                        </span>
                      </div>
                    </div>

                    {/* Right: Commercials & Action buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Price display */}
                      <div className="text-left sm:text-right">
                        {hasDiscount && (
                          <div className="flex items-center sm:justify-end gap-1.5">
                            <span className="text-[11px] text-slate-400 line-through font-bold">
                              ₹{((qq.pricing?.finalPrice || 0) + (qq.pricing?.discountAmount || 0)).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              -₹{qq.pricing.discountAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                        <p className="text-[19px] font-black text-slate-900 leading-tight">
                          ₹{(qq.pricing?.finalPrice || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400">
                          ₹{(qq.pricing?.perPersonPrice || 0).toLocaleString("en-IN")} / Person
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* WhatsApp button */}
                        <button
                          type="button"
                          onClick={() => setShareQuote(qq)}
                          title="Share via WhatsApp"
                          className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Email button */}
                        <button
                          type="button"
                          onClick={() => setEmailQuote(qq)}
                          title="Send via Email"
                          className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all"
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(qq.quickQuoteCode)}
                          title="Copy Public Proposal Link"
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                        >
                          {copiedCode === qq.quickQuoteCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>

                        {/* Live View */}
                        <a
                          href={`/quick-quote/${qq.quickQuoteCode}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Live Proposal"
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </a>

                        {/* Edit */}
                        <Link
                          href={`/dashboard/quick-quotations/${qq._id}/edit`}
                          title="Edit Quick Quote"
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>

                        {/* 1-Click Convert to Full Quotation */}
                        {qq.status !== "converted" ? (
                          <button
                            type="button"
                            onClick={() => handleConvert(qq._id)}
                            disabled={isConverting}
                            title="Upgrade / Convert to Full Detailed Quotation"
                            className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-extrabold text-[12px] transition-all disabled:opacity-50 shadow-2xs"
                          >
                            {isConverting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5 text-purple-600" />}
                            <span>Upgrade</span>
                          </button>
                        ) : (
                          <Link
                            href={`/dashboard/quotations/${qq.convertedQuotationId}/edit`}
                            className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-[12px] transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>View Full Quote</span>
                          </Link>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(qq._id)}
                          title="Delete"
                          className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
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
