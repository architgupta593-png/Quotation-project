"use client";

import { CheckCircle2, Calendar, Clock, Users, MapPin, X, Download, ShieldCheck } from "lucide-react";

/**
 * ActivityVoucherModal — Displays printable Ticket Voucher Pass
 */
export default function ActivityVoucherModal({ booking, onClose }) {
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

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      {/* Ticket Pass Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
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
          {/* Voucher Pass Code Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 text-center space-y-1">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-emerald-700">
              Voucher Pass Code
            </span>
            <p className="text-[26px] font-black text-emerald-950 tracking-wider font-mono">
              {voucherCode}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold">
              Show this code or QR code at entry gate
            </p>
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

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[13px] transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              Download / Print Ticket
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
