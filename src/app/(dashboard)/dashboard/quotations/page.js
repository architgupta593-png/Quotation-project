"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus, Search, Filter, Loader2, FileText, AlertCircle, ArrowLeft,
  Calendar, Users, MapPin, IndianRupee, MessageSquare, Copy, Check,
  ExternalLink, Pencil, Trash2, Eye, Sparkles, CheckCircle2, Clock,
  ArrowRight, ShieldCheck, HeartHandshake,
} from "lucide-react";
import WhatsAppShareModal from "@/components/quotations/WhatsAppShareModal";
import EmailShareModal from "@/components/quotations/EmailShareModal";
import { Mail } from "lucide-react";

const STATUS_BADGES = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  viewed: "bg-purple-50 text-purple-700 border-purple-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expired: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function QuotationsPipelinePage() {
  const { data: session } = useSession();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Share modal state
  const [shareQuote, setShareQuote] = useState(null);
  const [emailQuote, setEmailQuote] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/quotations?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load quotations");
      setQuotations(data.quotations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const debounce = setTimeout(fetchQuotations, 300);
    return () => clearTimeout(debounce);
  }, [fetchQuotations]);

  async function handleDelete(quoteId) {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch(`/api/quotations/${quoteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setQuotations((prev) => prev.filter((q) => q._id !== quoteId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  function handleCopyLink(code) {
    const url = `${window.location.origin}/quote/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Pipeline metrics
  const totalValue = quotations.reduce((s, q) => s + (q.pricing?.finalPrice || 0), 0);
  const confirmedQuotes = quotations.filter((q) => q.status === "confirmed");
  const confirmedValue = confirmedQuotes.reduce((s, q) => s + (q.pricing?.finalPrice || 0), 0);
  const activeQuotes = quotations.filter((q) => ["sent", "viewed"].includes(q.status)).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-6 shadow-xs">
        <div className="max-w-6xl mx-auto space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-[24px] font-black text-slate-900 tracking-tight">
                  Quotations &amp; Proposals
                </h1>
              </div>
              <p className="text-[13.5px] text-slate-500 font-medium ml-13">
                Create, customize, and share personalized holiday proposals with live client tracking.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/quotations/new"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-[13.5px] transition-all shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Create New Quotation
              </Link>
            </div>
          </div>

          {/* Metrics Overview Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-[10.5px] font-black uppercase tracking-widest text-slate-400">Total Proposals</p>
              <p className="text-[22px] font-black text-slate-900 mt-0.5">{quotations.length}</p>
              <p className="text-[11px] text-slate-500 font-semibold">Value: ₹{totalValue.toLocaleString("en-IN")}</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
              <p className="text-[10.5px] font-black uppercase tracking-widest text-blue-700">Active / Sent Quotes</p>
              <p className="text-[22px] font-black text-blue-900 mt-0.5">{activeQuotes}</p>
              <p className="text-[11px] text-blue-600 font-semibold">Under client review</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <p className="text-[10.5px] font-black uppercase tracking-widest text-emerald-700">Confirmed Revenue</p>
              <p className="text-[22px] font-black text-emerald-900 mt-0.5">₹{confirmedValue.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">{confirmedQuotes.length} Deals Accepted</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            {["all", "draft", "sent", "viewed", "confirmed", "expired"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-[12.5px] font-bold capitalize transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {tab === "all" ? "All Proposals" : tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, phone, or title…"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-[13.5px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition-all"
            />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[13.5px]">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Quotations List ── */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-[14px] font-bold text-slate-600">Loading quotations…</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-[18px] font-black text-slate-900">No Quotations Found</h3>
            <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== "all"
                ? "No quotations match your current filter criteria."
                : "Create your first customized client quotation to start closing leads."}
            </p>
            <Link
              href="/dashboard/quotations/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-[13px] shadow-sm hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Quotation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {quotations.map((quote) => {
              const startDateStr = quote.tripDetails?.startDate
                ? new Date(quote.tripDetails.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                : "—";
              const endDateStr = quote.tripDetails?.endDate
                ? new Date(quote.tripDetails.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                : "—";

              return (
                <div
                  key={quote._id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Code, Client & Trip */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-[11.5px] font-black px-2.5 py-0.5 rounded-md bg-slate-900 text-white shadow-xs">
                          {quote.quotationCode}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider border ${
                          STATUS_BADGES[quote.status] || STATUS_BADGES.draft
                        }`}>
                          ● {quote.status}
                        </span>
                        <span className="text-[12px] text-slate-400 font-semibold">
                          Created by {quote.createdBy?.name || "Agent"}
                        </span>
                      </div>

                      <h3 className="text-[17px] font-black text-slate-900 truncate">
                        {quote.tripDetails?.title || "Custom Holiday Proposal"}
                      </h3>

                      <div className="flex items-center gap-4 flex-wrap text-[12.5px] text-slate-600 font-semibold">
                        <span className="font-extrabold text-slate-900">
                          👤 {quote.client?.name} ({quote.client?.phone})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {startDateStr} – {endDateStr} ({quote.tripDetails?.nights || 0}N / {quote.tripDetails?.days || 0}D)
                        </span>
                        {quote.tripDetails?.destination && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              {quote.tripDetails.destination}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Pricing & Actions */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-left lg:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quotation Value</p>
                        <p className="text-[20px] font-black text-slate-900">
                          ₹{(quote.pricing?.finalPrice || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] font-bold text-indigo-600">
                          ₹{(quote.pricing?.perCouplePrice || (quote.pricing?.finalPrice || 0)).toLocaleString("en-IN")} / couple
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* WhatsApp Share */}
                        <button
                          type="button"
                          onClick={() => setShareQuote(quote)}
                          title="Share via WhatsApp"
                          className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Email Share */}
                        <button
                          type="button"
                          onClick={() => setEmailQuote(quote)}
                          title="Share via Email"
                          className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(quote.quotationCode)}
                          title="Copy client proposal link"
                          className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                        >
                          {copiedCode === quote.quotationCode ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Open Public View */}
                        <a
                          href={`/quote/${quote.quotationCode}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View public proposal page"
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Edit */}
                        <Link
                          href={`/dashboard/quotations/${quote._id}/edit`}
                          title="Edit Quotation"
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(quote._id)}
                          title="Delete Quotation"
                          className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={Boolean(shareQuote)}
        quotation={shareQuote}
        onClose={() => setShareQuote(null)}
      />

      {/* Email Share Modal */}
      <EmailShareModal
        isOpen={Boolean(emailQuote)}
        quotation={emailQuote}
        onClose={() => setEmailQuote(null)}
      />
    </div>
  );
}
