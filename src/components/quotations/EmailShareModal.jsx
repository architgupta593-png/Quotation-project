"use client";

import { useState, useEffect } from "react";
import {
  X, Copy, Check, Mail, ExternalLink, Sparkles, Send,
  RefreshCw, CheckCircle2, User, Phone,
} from "lucide-react";

// Runtime Emoji Builder using String.fromCodePoint
const EMOJI = {
  PLANE: String.fromCodePoint(0x2708, 0xFE0F),// ✈️
  POINT_RIGHT: String.fromCodePoint(0x1F449), // 👉
  PHONE: String.fromCodePoint(0x1F4DE),       // 📞
  MAIL: String.fromCodePoint(0x2709, 0xFE0F), // ✉️
  GLOBE: String.fromCodePoint(0x1F310),      // 🌐
  SPARKLES: String.fromCodePoint(0x2728),    // ✨
  CHECK: String.fromCodePoint(0x2705),       // ✅
};

export default function EmailShareModal({ quotation, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const quotationCode = quotation?.quotationCode;
  const client = quotation?.client;
  const tripDetails = quotation?.tripDetails;
  const passengers = quotation?.passengers;
  const accommodationOptions = quotation?.accommodationOptions || [];
  const selectedOptionIndex = quotation?.selectedOptionIndex || 0;
  const vehicle = quotation?.vehicle;
  const pricing = quotation?.pricing;
  const paymentTerms = quotation?.paymentTerms;

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/quote/${quotationCode}`
    : `https://mandateholidays.com/quote/${quotationCode}`;

  const selectedTier = accommodationOptions[selectedOptionIndex] || accommodationOptions[0];
  const startDateStr = tripDetails?.startDate
    ? new Date(tripDetails.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    : "TBD";
  const endDateStr = tripDetails?.endDate
    ? new Date(tripDetails.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

  const numPax = Math.max(1, passengers?.adults || 2);
  const finalPrice = pricing?.finalPrice || 0;
  const discountAmount = pricing?.discountAmount || 0;
  const originalPrice = discountAmount > 0 ? finalPrice + discountAmount : finalPrice;
  const perCouple = pricing?.perCouplePrice || finalPrice;
  const perPerson = pricing?.perPersonPrice || Math.round(finalPrice / numPax);
  const advanceToken = Math.round((finalPrice * (paymentTerms?.advancePercentage || 25)) / 100);

  function generateDefaultContent() {
    if (!quotation) return;

    const sub = `${EMOJI.PLANE} Exclusive Travel Proposal: ${tripDetails?.title || "Custom Holiday"} | Mandate Holidays (Ref: ${quotationCode})`;
    setSubject(sub);
    setRecipientEmail(client?.email || "");

    const discountBlock = discountAmount > 0
      ? `• Original Price: ₹${originalPrice.toLocaleString("en-IN")}\n• Special Offer Discount: -₹${discountAmount.toLocaleString("en-IN")} SAVED\n• Net Offer Package Value: ₹${finalPrice.toLocaleString("en-IN")} (All inclusive)`
      : `• Total Package Value: ₹${finalPrice.toLocaleString("en-IN")} (All inclusive)`;

    const body = `Dear ${client?.name || "Valued Traveler"},

Greetings from Mandate Holidays!

Thank you for choosing us to curate your upcoming holiday. We are delighted to present your personalized travel itinerary and formal commercial proposal:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRIP SUMMARY & PARAMETERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tour Title: ${tripDetails?.title || "Custom Holiday Itinerary"}
• Travel Dates: ${startDateStr} to ${endDateStr} (${tripDetails?.nights || 0} Nights / ${tripDetails?.days || 0} Days)
• Party Size: ${numPax} Adults${passengers?.childrenWithBed > 0 ? `, ${passengers.childrenWithBed} Child` : ""} (${passengers?.totalRooms || 1} Room)
• Dedicated Transport: Private AC ${vehicle?.vehicleType || "Sedan"} (${vehicle?.model || "Commercial Cab"} with chauffeur, all fuel, toll taxes & state permits included)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOTEL ACCOMMODATION (${selectedTier?.label || "Standard"} Category)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(selectedTier?.nights || []).map((n) => `• Night ${n.night} (${n.cityName}): ${n.hotelName || "Quality Certified Hotel"} [Room: ${n.roomType || "Deluxe AC"} | Meal Plan: ${n.mealPlan || "CP"}]`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMERCIAL QUOTATION & PAYMENT MILESTONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${discountBlock}
• Rate Per Couple: ₹${perCouple.toLocaleString("en-IN")}
• Rate Per Person: ₹${perPerson.toLocaleString("en-IN")}
• Advance Token to Confirm (25%): ₹${advanceToken.toLocaleString("en-IN")}
• Balance Milestone: ₹${(finalPrice - advanceToken).toLocaleString("en-IN")} (Payable prior to departure)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIEW INTERACTIVE PROPOSAL & ACCEPT ONLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You can review the full day-by-day sightseeing timeline, hotel pictures, and confirm your booking by visiting your private client proposal link:

${EMOJI.POINT_RIGHT} ${publicUrl}

Please let us know if you would like any modifications or special additions. We look forward to hosting you!

Warm regards,
Mandate Holidays Travel Operations
${EMOJI.PHONE} +91-9876543210 | ${EMOJI.MAIL} info@mandateholidays.com
${EMOJI.GLOBE} https://mandateholidays.com`;

    setEmailBody(body);
  }

  useEffect(() => {
    if (quotation) {
      generateDefaultContent();
    }
  }, [quotation]);

  if (!isOpen || !quotation) return null;

  async function handleCopy() {
    const fullContent = `Subject: ${subject}\n\n${emailBody}`;
    let copiedSuccess = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullContent);
        copiedSuccess = true;
      }
    } catch {
      copiedSuccess = false;
    }

    if (!copiedSuccess) {
      const textArea = document.createElement("textarea");
      textArea.value = fullContent;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Copy fallback error", err);
      }
      textArea.remove();
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleOpenMailClient() {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail || "")}?cc=${encodeURIComponent(ccEmail || "")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-6 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Email Proposal</p>
              <h3 className="text-[17px] font-black text-white leading-tight">Send Quotation via Email</h3>
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

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]">
          {/* Recipient & CC row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                To (Client Email)
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                CC (Agency / Manager Copy)
              </label>
              <input
                type="email"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                placeholder="operations@mandateholidays.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11.5px] font-bold text-slate-700">
                Email Proposal Message
              </label>
              <button
                type="button"
                onClick={generateDefaultContent}
                className="text-[11.5px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset to Default
              </button>
            </div>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={10}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-[12.5px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-[13px] transition-colors shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? "Copied Email!" : "Copy Email Text"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleOpenMailClient}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-[13px] transition-all shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>Launch Mail Client</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
