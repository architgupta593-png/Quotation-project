"use client";

import { useState, useEffect } from "react";
import {
  X, Copy, Check, MessageSquare, ExternalLink, Sparkles,
  Send, Phone, Heart, Zap, FileText, IndianRupee, RefreshCw,
  Laptop,
} from "lucide-react";

// Universal Runtime Emojis
const EMOJI = {
  ZAP: String.fromCodePoint(0x26A1),         // ⚡
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
  CHECK: String.fromCodePoint(0x2705),        // ✅
};

export default function QuickWhatsAppShareModal({ quickQuote, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("detailed");
  const [customText, setCustomText] = useState("");
  const [targetPhone, setTargetPhone] = useState("");

  const quickQuoteCode = quickQuote?.quickQuoteCode;
  const client = quickQuote?.client;
  const tripDetails = quickQuote?.tripDetails;
  const passengers = quickQuote?.passengers;
  const hotelStays = quickQuote?.hotelStays || [];
  const vehicle = quickQuote?.vehicle;
  const pricing = quickQuote?.pricing;

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/quick-quote/${quickQuoteCode}`
    : `https://mandateholidays.com/quick-quote/${quickQuoteCode}`;

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
  const perPerson = pricing?.perPersonPrice || Math.round(finalPrice / numPax);
  const perCouple = Math.round(perPerson * 2);
  const includeGst = Boolean(pricing?.includeGst);
  const advanceType = pricing?.advanceType || "absolute";
  const advanceAmount = pricing?.advanceAmount !== undefined ? pricing?.advanceAmount : (pricing?.advancePayment || 0);
  const advancePercentage = pricing?.advancePercentage || 25;
  let advancePayment = 0;
  if (pricing?.advancePayment !== undefined && pricing?.advancePayment > 0) {
    advancePayment = pricing.advancePayment;
  } else if (advanceType === "percentage") {
    advancePayment = Math.round((finalPrice * advancePercentage) / 100);
  } else if (advanceAmount > 0) {
    advancePayment = Math.min(finalPrice, advanceAmount);
  } else {
    advancePayment = Math.round(finalPrice * 0.25);
  }
  const advanceToken = advancePayment;
  const advancePct = finalPrice > 0 ? Math.round((advancePayment / finalPrice) * 100) : 0;

  function generateText(templateType) {
    if (!quickQuote) return "";

    const gstNote = includeGst ? " (Includes 5% GST)" : " (Excl. 5% GST)";
    const discountText = discountAmount > 0
      ? `\n${EMOJI.FIRE} *Special Offer Deal:* Save ₹${discountAmount.toLocaleString("en-IN")} (Offer: ₹${finalPrice.toLocaleString("en-IN")}, Original: ~₹${originalPrice.toLocaleString("en-IN")}~)`
      : "";

    if (templateType === "short") {
      return `*MANDATE HOLIDAYS — QUICK TRAVEL QUOTE* ${EMOJI.ZAP} ${EMOJI.SPARKLES}
Ref: *${quickQuoteCode}*
Dear *${client?.name || "Valued Traveler"}*,

Here is your rapid holiday quotation for *${tripDetails?.title || "Holiday Package"}*:

${EMOJI.PIN} *Destination:* ${tripDetails?.destination}
${EMOJI.CALENDAR} *Duration:* ${startDateStr} - ${endDateStr} (${tripDetails?.nights}N / ${tripDetails?.days}D)
${EMOJI.PEOPLE} *Party:* ${numPax} Adults (${passengers?.totalRooms || 1} Room)
${EMOJI.CAR} *Private Transport:* Dedicated AC ${vehicle?.vehicleType || "Cab"} with Driver
${EMOJI.MONEY_BAG} *Total Package Value:* ₹${finalPrice.toLocaleString("en-IN")}${gstNote}${discountText}
${EMOJI.CASH} *Advance Token to Confirm (${advancePct}%):* ₹${advanceToken.toLocaleString("en-IN")}

${EMOJI.POINT_RIGHT} *View Complete Proposal & Accept Online:*
${publicUrl}

Feel free to reply for any customization! ${EMOJI.STAR}`;
    }

    const options = (quickQuote?.accommodationOptions && quickQuote.accommodationOptions.length > 0)
      ? quickQuote.accommodationOptions
      : [{ label: "Standard Accommodation", hotelStays: hotelStays }];

    const formattedHotelSection = options.length > 1
      ? options.map((opt, i) =>
          `*${opt.label || `Option ${i + 1}`}*\n` +
          (opt.hotelStays || []).map((s) => `  • ${s.cityName || "Destination"}: ${s.hotelName || "Quality Hotel"} (${s.nights || 1}N, ${s.roomType || "Deluxe AC"}, ${s.mealPlan || "CP"})`).join("\n")
        ).join("\n\n")
      : hotelStays.map((s) => `• ${s.cityName || "Destination"}: ${s.hotelName || "Quality Hotel"} [${s.roomType || "Deluxe AC"} - ${s.mealPlan || "CP"}]`).join("\n");

    if (templateType === "honeymoon") {
      return `*MANDATE HOLIDAYS — ROMANTIC HONEYMOON PROPOSAL* ${EMOJI.HEARTS} ${EMOJI.CHEERS}
Ref: *${quickQuoteCode}*
Dear *${client?.name || "Valued Traveler"}*,

Congratulations on planning your romantic holiday! Here is your private honeymoon proposal:

${EMOJI.PIN} *Destination:* ${tripDetails?.destination} (${tripDetails?.nights}N / ${tripDetails?.days}D)
${EMOJI.CALENDAR} *Travel Dates:* ${startDateStr} to ${endDateStr}
${EMOJI.CAR} *Private Cab:* Dedicated AC ${vehicle?.vehicleType || "Sedan"} with Chauffeur

${EMOJI.HOTEL} *Curated Stays:*
${formattedHotelSection}

${EMOJI.SPARKLES} *Inclusions:* Daily Breakfast, Sightseeing Transfers, Tolls, Fuel & Chauffeur Allowance.${discountText}

${EMOJI.MONEY_BAG} *Total Package Value:* ₹${finalPrice.toLocaleString("en-IN")}${gstNote}
${EMOJI.COUPLE} *Rate Per Couple (2 Adults):* ₹${perCouple.toLocaleString("en-IN")}
${EMOJI.CASH} *Advance Token to Confirm (${advancePct}%):* ₹${advanceToken.toLocaleString("en-IN")}

${EMOJI.POINT_RIGHT} *Review Itinerary & Accept Online:*
${publicUrl}

Reply to this message for any customization or date confirmation! ${EMOJI.HEARTS}`;
    }

    const childrenText = (passengers?.childrenCount > 0 || (passengers?.childrenAges && passengers.childrenAges.length > 0))
      ? `, ${passengers.childrenCount || passengers.childrenAges.length} Child (${(passengers.childrenAges || []).join(", ")} yrs)`
      : "";

    // Default Detailed Template
    return `*MANDATE HOLIDAYS — QUICK TRAVEL PROPOSAL* ${EMOJI.PALM} ${EMOJI.SPARKLES}
Ref: *${quickQuoteCode}*
Dear *${client?.name || "Valued Traveler"}*,

Thank you for contacting Mandate Holidays! Here is your customized travel proposal:

${EMOJI.PIN} *Tour:* ${tripDetails?.title || "Custom Holiday"}
${EMOJI.CALENDAR} *Dates:* ${startDateStr} to ${endDateStr} (${tripDetails?.nights}N / ${tripDetails?.days}D)
${EMOJI.PEOPLE} *Party:* ${numPax} Adults${childrenText} (${passengers?.totalRooms || 1} Room)
${EMOJI.CAR} *Private Transport:* AC ${vehicle?.vehicleType || "Sedan"} (${vehicle?.model || "Commercial Cab"} with chauffeur, tolls & parking)

${EMOJI.HOTEL} *Hotel Accommodation:*
${formattedHotelSection}${discountText}

${EMOJI.MONEY_BAG} *Total Package Value:* ₹${finalPrice.toLocaleString("en-IN")}${gstNote}
${EMOJI.COUPLE} *Rate Per Couple (2 Adults):* ₹${perCouple.toLocaleString("en-IN")}
${EMOJI.PERSON} *Rate Per Adult (${numPax} Pax):* ₹${perPerson.toLocaleString("en-IN")}
${EMOJI.CASH} *${advancePct}% Advance Token to Confirm:* ₹${advanceToken.toLocaleString("en-IN")}

${EMOJI.DOC} *View Live Proposal & Confirm Online:*
${EMOJI.POINT_RIGHT} ${publicUrl}

For any customization or instant booking, please reply to this message! ${EMOJI.STAR}`;
  }

  useEffect(() => {
    if (quickQuote) {
      setCustomText(generateText(selectedTemplate));
      setTargetPhone(client?.phone || "");
    }
  }, [quickQuote, selectedTemplate]);

  if (!isOpen || !quickQuote) return null;

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

    const isMobile = typeof window !== "undefined" && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    if (mode === "web" || (!isMobile && mode === "auto")) {
      const webUrl = formattedPhone
        ? `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
        : `https://web.whatsapp.com/send?text=${encodedText}`;
      window.open(webUrl, "_blank");
      return;
    }

    const apiUrl = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(apiUrl, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">⚡ Quick WhatsApp Proposal</p>
              <h3 className="text-[17px] font-black text-white leading-tight">Send to {client?.name || "Client"}</h3>
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

        {/* Template Selector */}
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
            📋 Standard Proposal
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
            💕 Honeymoon Romance
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]">
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
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11.5px] font-bold text-slate-700">
                Message Preview &amp; Editor
              </label>
              <button
                type="button"
                onClick={() => setCustomText(generateText(selectedTemplate))}
                className="text-[11.5px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={11}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-[12.5px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-[13px] transition-colors shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
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
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
