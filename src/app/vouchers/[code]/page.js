"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, XCircle, Calendar, Clock, Users, MapPin,
  ShieldCheck, Loader2, ArrowLeft, Download, QrCode, Phone, Mail,
  IndianRupee, Sparkles, Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function PublicVoucherVerificationPage() {
  const { code } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifiedAt, setVerifiedAt] = useState("");

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetch(`/api/vouchers/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBooking(data.booking);
          setVerifiedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
      })
      .catch((err) => setError(err.message || "Failed to verify voucher"))
      .finally(() => setLoading(false));
  }, [code]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 animate-spin" />
        </div>
        <p className="text-[15px] font-black text-slate-200">Verifying Voucher Pass…</p>
        <p className="text-[12px] text-slate-400 mt-1 font-mono tracking-wider">{code?.toUpperCase()}</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl shadow-rose-950/40">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <XCircle className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-black uppercase tracking-wider border border-rose-500/30">
            Verification Failed
          </span>
          <h1 className="text-[22px] font-black text-white">Invalid or Expired Pass</h1>
          <p className="text-[13px] text-slate-400">
            {error || `The voucher code "${code}" could not be found or has been revoked.`}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[13px] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    voucherCode,
    customer,
    activityDetails,
    activity,
    city,
    pricing,
    paymentStatus,
    createdAt,
  } = booking;

  const formattedDate = activityDetails?.travelDate
    ? new Date(activityDetails.travelDate).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const isPaid = paymentStatus === "paid";
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://mandeholidays.com/vouchers/${voucherCode}`;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">

        {/* ── Top Verified Badge ── */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/30 p-5 backdrop-blur-xl flex items-center justify-between shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-400/40">
                Official Verification
              </span>
              <h2 className="text-[17px] font-black text-white leading-tight mt-0.5">
                Valid &amp; Confirmed Ticket
              </h2>
              <p className="text-[11.5px] text-emerald-300 font-medium">
                Scanned &amp; Verified at {verifiedAt || "Just now"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Print Pass"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* ── Main Ticket Card ── */}
        <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white relative">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-white/20 text-[10.5px] font-extrabold tracking-widest uppercase text-indigo-100 border border-white/20">
                Activity Voucher Pass
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-400 text-emerald-950 text-[10.5px] font-black uppercase tracking-wider shadow-sm">
                ● {paymentStatus.toUpperCase()}
              </span>
            </div>

            <h1 className="text-[22px] font-black text-white leading-tight">
              {activityDetails?.activityName || activity?.name}
            </h1>
            {city && (
              <p className="text-[13px] text-indigo-200 font-semibold mt-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-300" />
                {city.name}{city.state ? `, ${city.state}` : ""}
              </p>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">

            {/* QR Code & Code Section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                <QRCodeSVG
                  value={shareUrl}
                  size={120}
                  level="H"
                  includeMargin={false}
                  className="rounded-lg"
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                  Voucher Pass Code
                </span>
                <p className="text-[26px] font-black text-slate-900 tracking-wider font-mono">
                  {voucherCode}
                </p>
                <p className="text-[11.5px] text-emerald-700 font-extrabold flex items-center justify-center sm:justify-start gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready for entry verification
                </p>
              </div>
            </div>

            {/* Travel Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-500" /> Travel Date
                </span>
                <p className="font-extrabold text-slate-900 text-[13.5px]">{formattedDate}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-500" /> Time Slot
                </span>
                <p className="font-extrabold text-slate-900 text-[13.5px]">{activityDetails?.timeSlot || "Full Day"}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Users className="w-3 h-3 text-indigo-500" /> Total Guests
                </span>
                <p className="font-extrabold text-slate-900 text-[13.5px]">
                  {activityDetails?.adults || 1} Adult{activityDetails?.adults > 1 ? "s" : ""}
                  {activityDetails?.children > 0 ? `, ${activityDetails.children} Child` : ""}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                <span className="text-[10.5px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-emerald-600" /> Total Paid
                </span>
                <p className="font-black text-emerald-900 text-[15px]">
                  ₹{pricing?.grandTotal?.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Guest Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                Primary Guest Information
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]">
                <p className="font-extrabold text-slate-900">{customer?.name}</p>
                <div className="flex items-center gap-3 text-slate-500 text-[12px]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {customer?.phone}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {customer?.email}
                  </span>
                </div>
              </div>
              {customer?.notes && (
                <p className="text-[12px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                  Notes: {customer.notes}
                </p>
              )}
            </div>

            {/* Inclusions / Instructions */}
            {activity?.inclusions?.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                  Included in Ticket
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activity.inclusions.map((inc, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 text-[11.5px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-indigo-600" /> {inc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Print Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[14px] transition-all shadow-lg shadow-slate-900/20"
              >
                <Download className="w-4 h-4" /> Download / Print Official Ticket Pass
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11.5px] text-slate-500 font-medium">
          Mande Holidays Ticket Verification Service • All rights reserved
        </p>
      </div>
    </div>
  );
}
