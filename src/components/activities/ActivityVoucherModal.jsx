"use client";

import { useState } from "react";
import {
  CheckCircle2, Calendar, Clock, Users, MapPin, X, Download,
  ShieldCheck, Copy, Check, ExternalLink, QrCode, Sparkles
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

/**
 * ActivityVoucherModal — Displays printable Ticket Voucher Pass with scannable QR code
 */
export default function ActivityVoucherModal({ booking, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!booking) return null;

  const {
    voucherCode,
    customer,
    activityDetails,
    activity,
    city,
    pricing,
    createdAt,
  } = booking;

  const formattedDate = activityDetails?.travelDate
    ? new Date(activityDetails.travelDate).toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/vouchers/${voucherCode}`
    : `https://mandeholidays.com/vouchers/${voucherCode}`;

  function handlePrint() {
    window.print();
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      {/* Ticket Pass Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-8">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-extrabold tracking-widest uppercase text-emerald-100 border border-white/20">
            Official Ticket Pass
          </span>
          <h2 className="text-[20px] font-black mt-2 leading-tight">
            {activityDetails?.activityName || activity?.name}
          </h2>
          {city && (
            <p className="text-[12.5px] text-teal-100 font-semibold mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {city.name}{city.state ? `, ${city.state}` : ""}
            </p>
          )}
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-5">
          {/* QR Code & Voucher Pass Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50/50 border-2 border-dashed border-emerald-300 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {/* Scannable QR Code */}
            <div className="p-3 bg-white rounded-2xl border border-emerald-200/80 shadow-sm flex-shrink-0 flex items-center justify-center">
              <QRCodeSVG
                value={verificationUrl}
                size={110}
                level="H"
                includeMargin={false}
                className="rounded-md"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 flex items-center justify-center sm:justify-start gap-1">
                <QrCode className="w-3 h-3 text-emerald-600" />
                Scan to Verify Pass
              </span>
              <p className="text-[24px] font-black text-emerald-950 tracking-wider font-mono">
                {voucherCode}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold">
                Scan with phone camera or gate scanner to instantly verify authenticity
              </p>
            </div>
          </div>

          {/* Booking Specs Grid */}
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Date
              </div>
              <p className="font-extrabold text-slate-900">{formattedDate}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Slot Time
              </div>
              <p className="font-extrabold text-slate-900">{activityDetails?.timeSlot || "Full Day"}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> Passengers
              </div>
              <p className="font-extrabold text-slate-900">
                {activityDetails?.adults || 1} Adult(s)
                {activityDetails?.children > 0 ? `, ${activityDetails.children} Child` : ""}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase mb-1">
                Amount Paid
              </div>
              <p className="font-black text-emerald-600 text-[15px]">
                ₹{pricing?.grandTotal?.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Customer info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[12.5px] space-y-1">
            <p className="font-extrabold text-slate-900">Guest: {customer?.name}</p>
            <p className="text-slate-500">Contact: {customer?.phone} • {customer?.email}</p>
          </div>

          {/* Quick share links */}
          <div className="flex items-center justify-between text-[11.5px] px-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Link Copied!" : "Copy Verification URL"}
            </button>
            <a
              href={verificationUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold"
            >
              Open Page <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[13px] transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              Download / Print Pass
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-extrabold text-[13px] hover:bg-slate-100 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
