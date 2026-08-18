"use client";

import { useState, useEffect } from "react";
import {
  X, Copy, Check, MessageSquare, ExternalLink, Sparkles,
  Send, Phone, Heart, Zap, FileText, IndianRupee, RefreshCw,
  Globe, Laptop, Smartphone,
} from "lucide-react";

// Runtime Universal Emoji Builder using String.fromCodePoint
const EMOJI = {
  PALM: String.fromCodePoint(0x1F334),        // 🌴
  SPARKLES: String.fromCodePoint(0x2728),     // ✨
  PIN: String.fromCodePoint(0x1F4CD),          // 📍
  CALENDAR: String.fromCodePoint(0x1F5D3, 0xFE0F), // 🗓️
  PEOPLE: String.fromCodePoint(0x1F465),      // 👥
  CAR: String.fromCodePoint(0x1F697),         // 🚗
  HOTEL: String.fromCodePoint(0x1F3E8),       // 🏨
  MONEY_BAG: String.fromCodePoint(0x1F4B0),   // 💰
  COUPLE: String.fromCodePoint(0x1F46B),      // 👫
  PERSON: String.fromCodePoint(0x1F464),      // 👤
  CASH: String.fromCodePoint(0x1F4B5),        // 💵
  DOC: String.fromCodePoint(0x1F4C4),         // 📄
  POINT_RIGHT: String.fromCodePoint(0x1F449), // 👉
  STAR: String.fromCodePoint(0x1F31F),        // 🌟
  FIRE: String.fromCodePoint(0x1F525),        // 🔥
  HEARTS: String.fromCodePoint(0x1F495),      // 💕
  CHEERS: String.fromCodePoint(0x1F942),      // 🥂
  ROSE: String.fromCodePoint(0x1F339),        // 🌹
  CHECK: String.fromCodePoint(0x2705),        // ✅
  CHART: String.fromCodePoint(0x1F4CA),       // 📊
  PLANE: String.fromCodePoint(0x2708, 0xFE0F),// ✈️
};

export default function WhatsAppShareModal({ quotation, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("detailed");
  const [customText, setCustomText] = useState("");
  const [targetPhone, setTargetPhone] = useState("");

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

  // Generate Multi-Template WhatsApp Proposals with High-Impact Travel Emojis
  function generateText(templateType) {
    if (!quotation) return "";

    const discountText = discountAmount > 0
      ? `\n${EMOJI.FIRE} *Special Offer Discount:* Save ₹${discountAmount.toLocaleString("en-IN")} (Offer: ₹${finalPrice.toLocaleString("en-IN")}, Was: ~₹${originalPrice.toLocaleString("en-IN")}~)`
      : "";

    if (templateType === "short") {
      return `*MANDATE HOLIDAYS — TRAVEL QUOTATION* ${EMOJI.PALM} ${EMOJI.SPARKLES}
Ref: *${quotationCode}*
Dear *${client?.name || "Valued Traveler"}*,

Thank you for connecting with us! Here is the summary proposal for *${tripDetails?.title || "Custom Holiday"}*:

${EMOJI.CALENDAR} *Dates:* ${startDateStr} to ${endDateStr} (${tripDetails?.nights || 0}N / ${tripDetails?.days || 0}D)
${EMOJI.PEOPLE} *Guests:* ${numPax} Adults (${passengers?.totalRooms || 1} Room)
${EMOJI.HOTEL} *Hotel Category:* ${selectedTier?.label || "Standard / Deluxe"}
${EMOJI.CAR} *Private Transport:* AC ${vehicle?.vehicleType || "Cab"} with dedicated chauffeur
${EMOJI.MONEY_BAG} *Total Package:* ₹${finalPrice.toLocaleString("en-IN")}${discountText}
${EMOJI.CASH} *Advance Token to Confirm (25%):* ₹${advanceToken.toLocaleString("en-IN")}

${EMOJI.POINT_RIGHT} *View Full Day-by-Day Itinerary, Hotel Photos & Accept Online:*
${publicUrl}

Let us know if you'd like any custom changes! ${EMOJI.STAR}`;
    }

    if (templateType === "honeymoon") {
      return `*MANDATE HOLIDAYS — HONEYMOON SPECIAL PROPOSAL* ${EMOJI.HEARTS} ${EMOJI.CHEERS}
Ref: *${quotationCode}*
Dear *${client?.name || "Valued Traveler"}*,

Congratulations on planning your romantic getaway! Here is your curated honeymoon itinerary:

${EMOJI.ROSE} *Tour:* ${tripDetails?.title || "Romantic Honeymoon Getaway"}
${EMOJI.CALENDAR} *Duration:* ${tripDetails?.nights || 0} Nights / ${tripDetails?.days || 0} Days (${startDateStr} - ${endDateStr})
${EMOJI.CAR} *Private Transfers:* Dedicated AC ${vehicle?.vehicleType || "Sedan"} for Couple
${EMOJI.HOTEL} *Romantic Hotel Stays (${selectedTier?.label || "Premium Deluxe"}):*
${(selectedTier?.nights || []).map((n) => `• Night ${n.night} (${n.cityName}): ${n.hotelName || "Quality Certified Hotel"} [${n.mealPlan || "CP"}]`).join("\n")}

${EMOJI.SPARKLES} *Special Honeymoon Inclusions:*
${EMOJI.CHECK} Scenic Viewpoints & Photo Stops
${EMOJI.CHECK} Daily Breakfast Included
${EMOJI.CHECK} Chauffeur, Tolls, Fuel & Permits Included${discountText}

${EMOJI.MONEY_BAG} *Total Package Value:* ₹${finalPrice.toLocaleString("en-IN")}
${EMOJI.COUPLE} *Rate Per Couple:* ₹${perCouple.toLocaleString("en-IN")}
${EMOJI.CASH} *Booking Advance Token (25%):* ₹${advanceToken.toLocaleString("en-IN")}

${EMOJI.POINT_RIGHT} *View Romantic Itinerary & Hotel Photos Online:*
${publicUrl}

Reply to this message for any customization or to confirm your dates! ${EMOJI.HEARTS}`;
    }

    if (templateType === "commercial") {
      return `*MANDATE HOLIDAYS — COMMERCIAL QUOTATION* ${EMOJI.CHART} ${EMOJI.PLANE}
Ref: *${quotationCode}* | Client: *${client?.name || "Valued Traveler"}*

${EMOJI.PIN} *Tour:* ${tripDetails?.title}
${EMOJI.CALENDAR} *Dates:* ${startDateStr} to ${endDateStr} (${tripDetails?.nights || 0}N / ${tripDetails?.days || 0}D)
${EMOJI.PEOPLE} *Party:* ${numPax} Adults | ${passengers?.totalRooms || 1} Room(s)

*COMMERCIAL BREAKDOWN:*${discountText}
${EMOJI.MONEY_BAG} Total Proposal Value: *₹${finalPrice.toLocaleString("en-IN")}*
${EMOJI.COUPLE} Rate Per Couple: *₹${perCouple.toLocaleString("en-IN")}*
${EMOJI.PERSON} Rate Per Person: *₹${perPerson.toLocaleString("en-IN")}*

*PAYMENT MILESTONES:*
1. Advance Token to Confirm (25%): *₹${advanceToken.toLocaleString("en-IN")}*
2. Balance Milestone: *₹${(finalPrice - advanceToken).toLocaleString("en-IN")}* (Prior to departure)

${EMOJI.CAR} Transport: AC ${vehicle?.vehicleType || "Cab"} (Tolls, Parking & Driver allowance included)
${EMOJI.HOTEL} Category: ${selectedTier?.label || "Standard"}

${EMOJI.POINT_RIGHT} *Review & Confirm Proposal Online:*
${publicUrl}`;
    }

    // Default Detailed Template
    return `*MANDATE HOLIDAYS — TRAVEL QUOTATION* ${EMOJI.PALM} ${EMOJI.SPARKLES}
Ref: *${quotationCode}*
Dear *${client?.name || "Valued Traveler"}*,

Thank you for planning your holiday with us! Here is your customized travel proposal:

${EMOJI.PIN} *Tour:* ${tripDetails?.title || "Custom Holiday Package"}
${EMOJI.CALENDAR} *Dates:* ${startDateStr} to ${endDateStr} (${tripDetails?.nights || 0}N / ${tripDetails?.days || 0}D)
${EMOJI.PEOPLE} *Guests:* ${numPax} Adults${passengers?.childrenWithBed > 0 ? `, ${passengers.childrenWithBed} Child` : ""} (${passengers?.totalRooms || 1} Room)
${EMOJI.CAR} *Transport:* Private AC ${vehicle?.vehicleType || "Sedan"} (${vehicle?.model || "Dedicated Cab"} with all tolls, parking & driver allowance)

${EMOJI.HOTEL} *Hotel Stays (${selectedTier?.label || "Standard"}):*
${(selectedTier?.nights || []).map((n) => `• N${n.night} (${n.cityName}): ${n.hotelName || "Quality Hotel"} [${n.mealPlan || "CP"}]`).join("\n")}${discountText}

${EMOJI.MONEY_BAG} *Total Package Value:* ₹${finalPrice.toLocaleString("en-IN")}
${EMOJI.COUPLE} *Rate Per Couple:* ₹${perCouple.toLocaleString("en-IN")}
${EMOJI.PERSON} *Rate Person:* ₹${perPerson.toLocaleString("en-IN")}
${EMOJI.CASH} *25% Advance Token to Confirm:* ₹${advanceToken.toLocaleString("en-IN")}

${EMOJI.DOC} *View Detailed Itinerary, Hotel Photos & Accept Quote Online:*
${EMOJI.POINT_RIGHT} ${publicUrl}

For any customization or booking confirmation, feel free to reply to this message! ${EMOJI.STAR}`;
  }

  // Update text when template or quotation changes
  useEffect(() => {
    if (quotation) {
      setCustomText(generateText(selectedTemplate));
      setTargetPhone(client?.phone || "");
    }
  }, [quotation, selectedTemplate]);

  if (!isOpen || !quotation) return null;

  async function handleCopy() {
    let copiedSuccess = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(customText);
        copiedSuccess = true;
      }
    } catch {
      copiedSuccess = false;
    }

    if (!copiedSuccess) {
      const textArea = document.createElement("textarea");
      textArea.value = customText;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        copiedSuccess = true;
      } catch (err) {
        console.error("Copy fallback error", err);
      }
      textArea.remove();
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // Direct WhatsApp Dispatch without lossy intermediate landing pages
  function handleOpenWhatsApp(mode = "auto") {
    const cleanPhone = (targetPhone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone
      ? cleanPhone.startsWith("91")
        ? cleanPhone
        : cleanPhone.length === 10
        ? "91" + cleanPhone
        : cleanPhone
      : "";

    const encodedText = encodeURIComponent(customText);

    if (mode === "app") {
      const appUrl = formattedPhone
        ? `whatsapp://send?phone=${formattedPhone}&text=${encodedText}`
        : `whatsapp://send?text=${encodedText}`;
      window.location.href = appUrl;
      return;
    }

    const isMobile = typeof window !== "undefined" && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    // On Desktop or Web mode: Send directly to web.whatsapp.com (bypasses intermediary api.whatsapp.com preview page)
    if (mode === "web" || (!isMobile && mode === "auto")) {
      const webUrl = formattedPhone
        ? `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
        : `https://web.whatsapp.com/send?text=${encodedText}`;
      window.open(webUrl, "_blank");
      return;
    }

    // On Mobile: Open direct official WhatsApp mobile dispatch
    const apiUrl = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(apiUrl, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">WhatsApp Instant Share</p>
              <h3 className="text-[17px] font-black text-white leading-tight">Send Proposal to Client</h3>
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

        {/* Template Selector Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <span className="text-[10.5px] font-black uppercase text-slate-500 tracking-wider flex-shrink-0">Template:</span>
          <button
            type="button"
            onClick={() => setSelectedTemplate("detailed")}
            className={`px-3 py-1 rounded-full text-[11.5px] font-extrabold transition-all whitespace-nowrap ${
              selectedTemplate === "detailed"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            📋 Full Detailed Proposal
          </button>
          <button
            type="button"
            onClick={() => setSelectedTemplate("short")}
            className={`px-3 py-1 rounded-full text-[11.5px] font-extrabold transition-all whitespace-nowrap ${
              selectedTemplate === "short"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            ⚡ Short Summary
          </button>
          <button
            type="button"
            onClick={() => setSelectedTemplate("honeymoon")}
            className={`px-3 py-1 rounded-full text-[11.5px] font-extrabold transition-all whitespace-nowrap ${
              selectedTemplate === "honeymoon"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            💕 Honeymoon Special
          </button>
          <button
            type="button"
            onClick={() => setSelectedTemplate("commercial")}
            className={`px-3 py-1 rounded-full text-[11.5px] font-extrabold transition-all whitespace-nowrap ${
              selectedTemplate === "commercial"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            💰 Commercial Breakdown
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]">
          {/* Recipient Phone */}
          <div>
            <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
              Client WhatsApp Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="+91 98765 43210 (with country code)"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Editable Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11.5px] font-bold text-slate-700">
                Message Preview &amp; Custom Editor
              </label>
              <button
                type="button"
                onClick={() => setCustomText(generateText(selectedTemplate))}
                className="text-[11.5px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset Template
              </button>
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={11}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-[12.5px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white resize-none"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
              <span>Markdown bold (*) and italic (_) supported</span>
              <span>{customText.length} characters</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-[13px] transition-colors shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? "Copied Message!" : "Copy Text"}</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenWhatsApp("web")}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[12.5px] transition-all shadow-2xs"
            >
              <Laptop className="w-4 h-4 text-slate-600" />
              <span>WhatsApp Web</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenWhatsApp("auto")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[13px] transition-all shadow-md shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>Send to Client</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
