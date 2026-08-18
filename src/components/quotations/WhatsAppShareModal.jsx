"use client";

import { useState, useEffect } from "react";
import {
  X, Copy, Check, MessageSquare, ExternalLink, Sparkles,
  Send, Phone, Heart, Zap, FileText, IndianRupee, RefreshCw,
} from "lucide-react";

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
  const itinerary = quotation?.itinerary || [];
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

  // Generate Templates
  function generateText(templateType) {
    if (!quotation) return "";

    const discountText = discountAmount > 0
      ? `\n🔥 *Special Offer Discount:* Save ₹${discountAmount.toLocaleString("en-IN")} (Offer Price: ₹${finalPrice.toLocaleString("en-IN")}, Was: ~₹${originalPrice.toLocaleString("en-IN")}~)`
      : "";

    if (templateType === "short") {
      return `*MANDATE HOLIDAYS — TRAVEL QUOTATION* 🌴✨
Ref: *${quotationCode}*
Dear *${client?.name}*,

Here is the quick proposal summary for your *${tripDetails?.title || "Custom Holiday"}*:

🗓 *Dates:* ${startDateStr} to ${endDateStr} (${tripDetails?.nights || 0}N / ${tripDetails?.days || 0}D)
👥 *Guests:* ${numPax} Adults (${passengers?.totalRooms || 1} Room)
🏨 *Category:* ${selectedTier?.label || "Standard / Deluxe"}
🚗 *Transport:* Private AC ${vehicle?.vehicleType || "Cab"} with Chauffeur
💰 *Total Package:* ₹${finalPrice.toLocaleString("en-IN")}${discountText}
💵 *Advance to Confirm (25%):* ₹${advanceToken.toLocaleString("en-IN")}

👉 *View Full Day-by-Day Itinerary, Hotel Photos & Accept Online:*
${publicUrl}

Let us know if you'd like any custom changes! 🌟`;
    }

    if (templateType === "honeymoon") {
      return `*MANDATE HOLIDAYS — HONEYMOON SPECIAL PROPOSAL* 💕🥂
Ref: *${quotationCode}*
Dear *${client?.name}*,

Congratulations on planning your romantic holiday! Here is your private honeymoon itinerary:

🌹 *Tour:* ${tripDetails?.title || "Romantic Honeymoon Getaway"}
🗓 *Duration:* ${tripDetails?.nights || 0} Nights / ${tripDetails?.days || 0} Days (${startDateStr} - ${endDateStr})
🚗 *Chauffeur:* Dedicated AC ${vehicle?.vehicleType || "Sedan"} for Private Couple Transfers
🏨 *Luxury Stays:* ${selectedTier?.label || "Premium Deluxe"}
${(selectedTier?.nights || []).map((n) => `• Night ${n.night} (${n.cityName}): ${n.hotelName || "Quality Certified Hotel"} [${n.mealPlan || "CP"}]`).join("\n")}

✨ *Special Honeymoon Inclusions:*
✓ Scenic Viewpoints & Curated Photo Stops
✓ Breakfast & Dinner Included (As per meal plan)
✓ Fuel, Tolls, Permits & Driver Allowance${discountText}

💰 *Total Package Value:* ₹${finalPrice.toLocaleString("en-IN")}
👫 *Rate Per Couple:* ₹${perCouple.toLocaleString("en-IN")}
💵 *Booking Advance Token (25%):* ₹${advanceToken.toLocaleString("en-IN")}

👉 *View Romantic Itinerary & Photos Online:*
${publicUrl}

Reply to this message for any customization or to confirm your dates! 💖`;
    }

    if (templateType === "commercial") {
      return `*MANDATE HOLIDAYS — COMMERCIAL QUOTATION* 📊✈️
Ref: *${quotationCode}* | Client: *${client?.name}*

📍 *Trip:* ${tripDetails?.title}
🗓 *Dates:* ${startDateStr} to ${endDateStr} (${tripDetails?.nights || 0}N / ${tripDetails?.days || 0}D)
👥 *Party:* ${numPax} Adults | ${passengers?.totalRooms || 1} Room(s)

*COMMERCIAL BREAKDOWN:*${discountText}
💰 Total Proposal Value: *₹${finalPrice.toLocaleString("en-IN")}*
👫 Per Couple Rate: *₹${perCouple.toLocaleString("en-IN")}*
👤 Per Person Rate: *₹${perPerson.toLocaleString("en-IN")}*

*PAYMENT MILESTONES:*
1️⃣ Advance Token to Confirm (25%): *₹${advanceToken.toLocaleString("en-IN")}*
2️⃣ Balance Payment: *₹${(finalPrice - advanceToken).toLocaleString("en-IN")}* (Prior to departure)

🚗 Transport: AC ${vehicle?.vehicleType || "Cab"} with all tolls & permits included
🏨 Category: ${selectedTier?.label || "Standard"}

👉 *Review & Confirm Proposal Online:*
${publicUrl}`;
    }

    // Default Detailed Template
    return `*MANDATE HOLIDAYS — TRAVEL QUOTATION* 🌴✨
Ref: *${quotationCode}*
Dear *${client?.name}*,

Thank you for planning your holiday with us! Here is your customized travel proposal:

📍 *Tour:* ${tripDetails?.title || "Custom Holiday Package"}
🗓 *Dates:* ${startDateStr} to ${endDateStr} (${tripDetails?.nights || 0}N / ${tripDetails?.days || 0}D)
👥 *Guests:* ${numPax} Adults${passengers?.childrenWithBed > 0 ? `, ${passengers.childrenWithBed} Child` : ""} (${passengers?.totalRooms || 1} Room)
🚗 *Transport:* Private AC ${vehicle?.vehicleType || "Sedan"} (${vehicle?.model || "Dedicated Cab"} with all tolls, parking & driver allowance)

🏨 *Hotel Stays (${selectedTier?.label || "Standard"}):*
${(selectedTier?.nights || []).map((n) => `• N${n.night} (${n.cityName}): ${n.hotelName || "Quality Hotel"} [${n.mealPlan || "CP"}]`).join("\n")}
${discountText}
💰 *Total Package Value:* ₹${finalPrice.toLocaleString("en-IN")}
👫 *Rate Per Couple:* ₹${perCouple.toLocaleString("en-IN")}
👤 *Rate Person:* ₹${perPerson.toLocaleString("en-IN")}
💵 *25% Advance Token to Confirm:* ₹${advanceToken.toLocaleString("en-IN")}

📄 *View Detailed Itinerary, Hotel Photos & Accept Quote Online:*
👉 ${publicUrl}

For any customization or booking confirmation, feel free to reply to this message! 🌟`;
  }

  // Update text when template or quotation changes
  useEffect(() => {
    if (quotation) {
      setCustomText(generateText(selectedTemplate));
      setTargetPhone(client?.phone || "");
    }
  }, [quotation, selectedTemplate]);

  if (!isOpen || !quotation) return null;

  function handleCopy() {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleOpenWhatsApp() {
    const cleanPhone = (targetPhone || "").replace(/[^0-9]/g, "");
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone}?text=${encodeURIComponent(customText)}`
      : `https://wa.me/?text=${encodeURIComponent(customText)}`;
    window.open(waUrl, "_blank");
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
            📋 Full Detailed
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
          <button
            type="button"
            onClick={() => setSelectedTemplate("commercial")}
            className={`px-3 py-1 rounded-full text-[11.5px] font-extrabold transition-all whitespace-nowrap ${
              selectedTemplate === "commercial"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            💰 Pricing &amp; Milestones
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]">
          {/* Target Phone Field */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                Recipient WhatsApp Number
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="e.g. 9876543210 or +919876543210"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <div className="flex-shrink-0 pt-5">
              <button
                type="button"
                onClick={() => setCustomText(generateText(selectedTemplate))}
                title="Reset to template"
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[12px] font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Editable Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11.5px] font-bold text-slate-700">
                Message Preview (Directly Editable)
              </label>
              <span className="text-[11px] text-slate-400 font-mono">{customText.length} characters</span>
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={11}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-[12.5px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white resize-none"
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
            <span>{copied ? "Copied Message!" : "Copy Text"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px]"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[13px] transition-all shadow-md shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>Open WhatsApp &amp; Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
