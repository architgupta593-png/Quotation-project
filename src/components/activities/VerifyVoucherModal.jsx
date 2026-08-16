"use client";

import { useState } from "react";
import {
  ShieldCheck, Search, Loader2, X, CheckCircle2, XCircle,
  Calendar, Clock, Users, MapPin, IndianRupee, QrCode, ArrowRight, ExternalLink
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function VerifyVoucherModal({ isOpen, onClose }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleVerify(e) {
    e?.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/vouchers/${code.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voucher not found");
      setResult(data.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Entry Verification</p>
              <h3 className="text-[17px] font-black text-white leading-tight">Verify Ticket Pass</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Search form */}
          <form onSubmit={handleVerify} className="space-y-3">
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider">
              Enter Voucher Pass Code (e.g. PASS-849201)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="PASS-XXXXXX"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-[15px] font-black text-slate-900 uppercase placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-[13px] flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Verify
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-center gap-2.5">
              <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-[13.5px]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Valid Ticket Confirmed</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase">
                  {result.paymentStatus}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-[16px] font-black text-slate-900">
                  {result.activityDetails?.activityName || result.activity?.name}
                </h4>
                <p className="text-[12.5px] text-slate-600 font-bold">
                  Guest: <span className="text-slate-900">{result.customer?.name}</span> ({result.customer?.phone})
                </p>
                <p className="text-[12px] text-slate-500">
                  Date: {new Date(result.activityDetails?.travelDate).toLocaleDateString("en-IN")} • Slot: {result.activityDetails?.timeSlot || "Full Day"}
                </p>
                <p className="text-[12px] text-slate-500">
                  Pax: {result.activityDetails?.adults || 1} Adult(s) {result.activityDetails?.children > 0 ? `, ${result.activityDetails.children} Child` : ""}
                </p>
                <p className="text-[13px] font-black text-emerald-700 pt-1">
                  Amount: ₹{result.pricing?.grandTotal?.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                <a
                  href={`/vouchers/${result.voucherCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-indigo-600 hover:text-indigo-800"
                >
                  Open Full Pass <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
