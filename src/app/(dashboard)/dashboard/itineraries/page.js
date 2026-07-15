"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search, Plus, Loader2, AlertCircle, Route, MapPin, Calendar,
  Clock, IndianRupee, ChevronDown, ChevronUp, ArrowUpDown, SortAsc,
  SortDesc, X, Eye, Pencil, Trash2, Check, Copy, Filter,
  Sunrise, Utensils, Sparkles, Tag, ArrowLeft, BookOpen,
  LayoutGrid, List, TrendingUp, Car, Users, Fuel,
} from "lucide-react";

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_META = {
  draft:    { label: "Draft",    bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
  active:   { label: "Active",   bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
  archived: { label: "Archived", bg: "#fff7ed", color: "#ea580c", dot: "#f97316" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: m.bg, color: m.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

// ── Day pill ──────────────────────────────────────────────────────────────────
function DayBadge({ days }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold"
      style={{ background: "linear-gradient(135deg,#eef2ff,#e0e7ff)", color: "#4338ca" }}>
      <Calendar className="w-3 h-3" />
      {days}D / {Math.max(0, days - 1)}N
    </span>
  );
}

// ── Itinerary card (grid view) ────────────────────────────────────────────────
function ItineraryCard({ itin, isAdmin, onView, onEdit, onDelete, onCopyCode }) {
  const [delConfirm, setDelConfirm] = useState(false);
  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
      onClick={() => onView(itin)}
    >
      {/* Colour accent bar */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)" }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Top row: code + status */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            title="Copy code"
            onClick={e => { e.stopPropagation(); onCopyCode(itin.code); }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black tracking-wider text-indigo-700 hover:bg-indigo-50 transition-colors"
            style={{ background: "linear-gradient(135deg,#eef2ff,#e0e7ff)" }}>
            <Tag className="w-3 h-3" />
            {itin.code}
            <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <StatusBadge status={itin.status} />
        </div>

        {/* Title */}
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">
            {itin.title}
          </h3>
        </div>

        {/* City + days */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[12px] text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            {itin.city}
          </span>
          <DayBadge days={itin.days} />
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-0.5 mt-auto pt-1 border-t border-gray-50">
          <span className="text-[11px] text-gray-400 mr-0.5">₹</span>
          <span className="text-[22px] font-black text-gray-900 leading-none">
            {(itin.grandTotal || itin.itineraryTotal || 0).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-gray-400 ml-0.5">total</span>
          {itin.noOfPersons > 1 && (
            <span className="text-[10px] text-gray-400 ml-1">· {itin.noOfPersons} pax</span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      {isAdmin && (
        <div className="flex items-center border-t border-gray-100 bg-gray-50/60">
          <button type="button" onClick={e => { e.stopPropagation(); onEdit(itin); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <div className="w-px h-6 bg-gray-200" />
          {delConfirm ? (
            <div className="flex items-center flex-1" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={() => { onDelete(itin._id); setDelConfirm(false); }}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors">
                <Check className="w-3 h-3" /> Yes
              </button>
              <button type="button" onClick={() => setDelConfirm(false)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] text-gray-500 hover:bg-gray-100 transition-colors">
                <X className="w-3 h-3" /> No
              </button>
            </div>
          ) : (
            <button type="button" onClick={e => { e.stopPropagation(); setDelConfirm(true); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── List row ──────────────────────────────────────────────────────────────────
function ItineraryRow({ itin, isAdmin, onView, onEdit, onDelete, onCopyCode }) {
  const [delConfirm, setDelConfirm] = useState(false);
  return (
    <div className="group flex items-center gap-4 px-4 py-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-150 cursor-pointer"
      onClick={() => onView(itin)}>
      {/* Accent dot */}
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }} />

      {/* Code */}
      <button type="button" onClick={e => { e.stopPropagation(); onCopyCode(itin.code); }}
        className="flex items-center gap-1 text-[11px] font-black text-indigo-700 tracking-wider hover:text-indigo-900 flex-shrink-0 w-28 truncate"
        title="Copy code">
        <Tag className="w-3 h-3 flex-shrink-0" />{itin.code}
      </button>

      {/* Title + city */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">{itin.title}</p>
        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-rose-400" />{itin.city}
        </p>
      </div>

      <DayBadge days={itin.days} />
      <StatusBadge status={itin.status} />

      {/* Price */}
      <div className="flex items-baseline gap-0.5 w-28 justify-end flex-shrink-0">
        <span className="text-[11px] text-gray-400">₹</span>
        <span className="text-[15px] font-black text-gray-900">{(itin.pricePerPerson||0).toLocaleString("en-IN")}</span>
        <span className="text-[10px] text-gray-400">/pp</span>
      </div>

      {/* Actions */}
      {isAdmin && (
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => onEdit(itin)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {delConfirm ? (
            <>
              <button type="button" onClick={() => { onDelete(itin._id); setDelConfirm(false); }}
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setDelConfirm(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setDelConfirm(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ itin, onClose, onEdit, isAdmin }) {
  const [full, setFull]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itin) return;
    setLoading(true);
    fetch(`/api/itineraries/${itin._id}`)
      .then(r => r.json())
      .then(d => { setFull(d.itinerary); setLoading(false); })
      .catch(() => setLoading(false));
  }, [itin]);

  if (!itin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(15,20,40,0.6)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full sm:max-w-2xl bg-white flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: "92dvh", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#0891b2 100%)" }}>
          <div className="min-w-0 flex-1 mr-3">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-black text-indigo-200 tracking-widest uppercase">{itin.code}</span>
              <StatusBadge status={itin.status} />
            </div>
            <h2 className="text-[18px] font-black text-white leading-tight">{itin.title}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[12px] text-indigo-200">
                <MapPin className="w-3.5 h-3.5" />{itin.city}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-indigo-200">
                <Calendar className="w-3.5 h-3.5" />{itin.days} Days / {Math.max(0, itin.days-1)} Nights
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <button type="button" onClick={() => { onClose(); onEdit(itin); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[12px] font-semibold transition-colors">
                <Pencil className="w-3.5 h-3.5" />Edit
              </button>
            )}
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Price banner */}
        <div className="flex items-center gap-6 px-6 py-3 border-b border-gray-100 flex-wrap"
          style={{ background: "linear-gradient(135deg,#f8faff,#f0f4ff)" }}>
          {itin.itineraryPerPerson > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Itinerary / Person</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[12px] text-gray-500">₹</span>
                <span className="text-[22px] font-black text-gray-900 leading-none">{(itin.itineraryPerPerson||0).toLocaleString("en-IN")}</span>
                {itin.noOfPersons > 1 && <span className="text-[11px] text-gray-400 ml-1">× {itin.noOfPersons} pax</span>}
              </div>
            </div>
          )}
          {itin.vehicleTotal > 0 && (
            <div className="border-l border-gray-200 pl-6">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Vehicle</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[12px] text-gray-500">₹</span>
                <span className="text-[22px] font-black text-indigo-700 leading-none">{(itin.vehicleTotal||0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
          {itin.grandTotal > 0 && (
            <div className="border-l border-gray-200 pl-6">
              <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider">Grand Total</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[12px] text-indigo-500">₹</span>
                <span className="text-[28px] font-black leading-none" style={{ color:"#4f46e5" }}>{(itin.grandTotal||0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Highlights */}
          {itin.highlights?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />Highlights
              </p>
              <div className="flex flex-wrap gap-2">
                {itin.highlights.map((h, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[12px] font-medium"
                    style={{ background: "#fef3c7", color: "#78350f" }}>{h}</span>
                ))}
              </div>
            </div>
          )}

          {/* Vehicles */}
          {itin.vehicles?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-indigo-400" />Vehicles
              </p>
              <div className="space-y-2">
                {itin.vehicles.map((v, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl gap-3"
                    style={{ background:"#eef2ff", border:"1px solid #c7d2fe" }}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Real vehicle photo */}
                      <VehicleThumb type={v.vehicleType}
                        className="flex-shrink-0 w-16 h-8 rounded-md"
                        style={{ border:"1px solid #c7d2fe" }} />
                      <div className="min-w-0">
                        <span className="block text-[12px] font-bold text-indigo-900 truncate">{v.vehicleType}{v.model ? ` — ${v.model}` : ""}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ background:v.acType==="AC"?"#dbeafe":"#fef9c3", color:v.acType==="AC"?"#1e40af":"#713f12" }}>
                            {v.acType}
                          </span>
                          {v.seats && <span className="text-[10px] text-gray-500">{v.seats} seats</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-[13px] font-black text-indigo-700 flex-shrink-0">₹{(v.vehiclePrice||0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Includes / Excludes */}
          {(itin.includes?.length > 0 || itin.excludes?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {itin.includes?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2">✓ Includes</p>
                  <ul className="space-y-1">
                    {itin.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {itin.excludes?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-2">✗ Excludes</p>
                  <ul className="space-y-1">
                    {itin.excludes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                        <X className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Day-by-day */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />Day-by-Day Itinerary
            </p>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            ) : (full?.dayByDay?.length > 0) ? (
              <div className="space-y-3">
                {full.dayByDay.map((d) => (
                  <div key={d.day} className="flex gap-3">
                    {/* Day number */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-black text-white"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                        {d.day}
                      </div>
                      <div className="w-px flex-1 bg-indigo-100 mt-1" />
                    </div>
                    {/* Content */}
                    <div className="pb-4 min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-gray-900">{d.title}</p>
                      {d.description && (
                        <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{d.description}</p>
                      )}
                      {d.activities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {d.activities.map((a, ai) => (
                            <span key={ai} className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-indigo-700"
                              style={{ background: "#eef2ff" }}>{a}</span>
                          ))}
                        </div>
                      )}
                      {(d.meals?.breakfast || d.meals?.lunch || d.meals?.dinner) && (
                        <div className="flex items-center gap-2 mt-2">
                          <Utensils className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          {["breakfast","lunch","dinner"].filter(m => d.meals[m]).map(m => (
                            <span key={m} className="text-[10px] font-semibold capitalize text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{m}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-gray-400 italic">No day-by-day schedule added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// \u2500\u2500 Itinerary Form Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// \u2500\u2500 Real vehicle photos (served from /public) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const VEHICLE_IMG = {
  "Sedan":           "/vehicle-sedan.png",
  "SUV":             "/vehicle-suv.png",
  "MUV":             "/vehicle-muv.png",
  "Tempo Traveller": "/vehicle-tempo.png",
  "Mini Bus":        "/vehicle-minibus.png",
  "Bus":             "/vehicle-bus.png",
  "Other":           "/vehicle-suv.png",
};

function VehicleThumb({ type, className = "" }) {
  return (
    <div className={`overflow-hidden bg-white flex items-center justify-center ${className}`}>
      <img
        src={VEHICLE_IMG[type] || VEHICLE_IMG["Other"]}
        alt={type}
        style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}
      />
    </div>
  );
}

const VEHICLE_TYPES = ["Sedan","SUV","MUV","Tempo Traveller","Mini Bus","Bus","Other"];
const BLANK_VEHICLE = { vehicleType:"SUV", model:"", acType:"AC", seats:4, vehiclePrice:"", notes:"" };

const BLANK_ITIN = {
  code:"", title:"", city:"", region:"", days:3, nights:2,
  highlights:[], includes:[], excludes:[],
  dayByDay:[], vehicles:[],
  noOfPersons:1, itineraryPerPerson:"", itineraryTotal:0,
  vehicleTotal:0, grandTotal:0,
  status:"draft",
};

function ItineraryFormModal({ itin, onClose, onSaved }) {
  const [form,    setForm]    = useState(BLANK_ITIN);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState("basic"); // basic | schedule | vehicle
  const [newHL,   setNewHL]   = useState("");
  const [newInc,  setNewInc]  = useState("");
  const [newExc,  setNewExc]  = useState("");
  const isEdit = Boolean(itin);

  useEffect(() => {
    if (itin) setForm({
      code:               itin.code               || "",
      title:              itin.title              || "",
      city:               itin.city               || "",
      region:             itin.region             || "",
      days:               itin.days               ?? 3,
      nights:             itin.nights             ?? 2,
      highlights:         itin.highlights         || [],
      includes:           itin.includes           || [],
      excludes:           itin.excludes           || [],
      dayByDay:           itin.dayByDay           || [],
      vehicles:           (itin.vehicles          || []).map(v => ({ ...v, vehiclePrice: v.vehiclePrice ?? "" })),
      noOfPersons:        itin.noOfPersons        ?? 1,
      itineraryPerPerson: itin.itineraryPerPerson ?? "",
      itineraryTotal:     itin.itineraryTotal     ?? 0,
      vehicleTotal:       itin.vehicleTotal       ?? 0,
      grandTotal:         itin.grandTotal         ?? 0,
      status:             itin.status             || "draft",
    });
    else setForm(BLANK_ITIN);
  }, [itin]);

  const up = p => setForm(prev => ({ ...prev, ...p }));

  // Day builder
  function ensureDays(numDays) {
    const cur = form.dayByDay;
    if (numDays > cur.length) {
      const extra = Array.from({ length: numDays - cur.length }, (_, i) => ({
        day: cur.length + i + 1, title: "", description: "", activities: [],
        meals: { breakfast: false, lunch: false, dinner: false },
      }));
      return [...cur, ...extra];
    }
    return cur.slice(0, numDays);
  }
  function setDays(n) {
    const d = Math.max(1, Number(n) || 1);
    up({ days: d, nights: Math.max(0, d - 1), dayByDay: ensureDays(d) });
  }
  function updateDay(idx, patch) {
    up({ dayByDay: form.dayByDay.map((d, i) => i === idx ? { ...d, ...patch } : d) });
  }
  function updateDayMeal(idx, meal, val) {
    up({ dayByDay: form.dayByDay.map((d, i) => i === idx ? { ...d, meals: { ...d.meals, [meal]: val } } : d) });
  }

  // ── Vehicle helpers ─────────────────────────────────────────
  function addVehicle() { up({ vehicles:[...form.vehicles, { ...BLANK_VEHICLE }] }); }
  function updVehicle(i, p) { up({ vehicles: form.vehicles.map((v,idx) => idx===i ? {...v,...p} : v) }); }
  function rmVehicle(i) { up({ vehicles: form.vehicles.filter((_,idx) => idx!==i) }); }

  // ── Auto-recalculate totals whenever prices change ────────────────────
  function calcTotals(patch) {
    const next = { ...form, ...patch };
    const itTotal = (parseFloat(next.itineraryPerPerson)||0) * (parseInt(next.noOfPersons)||0);
    const vTotal  = next.vehicles.reduce((a,v) => a+(parseFloat(v.vehiclePrice)||0), 0);
    return { ...next, itineraryTotal: itTotal, vehicleTotal: vTotal, grandTotal: itTotal + vTotal };
  }
  function upCalc(patch) { setForm(calcTotals(patch)); }

  async function save() {
    setError("");
    if (!form.code.trim() || !form.title.trim() || !form.city.trim()) {
      setError("Code, title and city are required."); setTab("basic"); return;
    }
    setSaving(true);
    try {
      const computed = calcTotals(form);
      const payload = {
        ...computed,
        noOfPersons:        parseInt(computed.noOfPersons)||1,
        itineraryPerPerson: parseFloat(computed.itineraryPerPerson)||0,
        vehicles: computed.vehicles.map(v => ({
          ...v,
          seats:        parseInt(v.seats)||4,
          vehiclePrice: parseFloat(v.vehiclePrice)||0,
        })),
        code: computed.code.toUpperCase().trim(),
      };
      const res = await fetch(
        isEdit ? `/api/itineraries/${itin._id}` : "/api/itineraries",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved(data.itinerary);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const ic = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all";
  const lc = "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";
  const TABS = [
    { id: "basic",    label: "Basic Info" },
    { id: "schedule", label: `Schedule (${form.dayByDay.length}d)` },
    { id: "vehicle",  label: "Vehicle & Price" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(15,20,40,0.6)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full sm:max-w-2xl bg-white flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: "92dvh", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1,#818cf8)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Route className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-white">{isEdit ? "Edit Itinerary" : "New Itinerary"}</h2>
              {isEdit && <p className="text-[11px] text-indigo-200">{itin.code}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2.5 border-b border-gray-100 flex-shrink-0"
          style={{ background: "linear-gradient(180deg,#f8faff,#fff)" }}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className="px-4 py-1.5 rounded-xl text-[12px] font-bold transition-all"
              style={tab === t.id ? { background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", boxShadow: "0 4px 12px #6366f140" }
                : { color: "#9ca3af" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[12px] flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── Basic ── */}
          {tab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Code *</label>
                  <input type="text" value={form.code}
                    onChange={e => up({ code: e.target.value.toUpperCase() })}
                    placeholder="GOA-5D-001" maxLength={30} className={ic} />
                  <p className="text-[10px] text-gray-400 mt-1">Unique code, auto-uppercased</p>
                </div>
                <div>
                  <label className={lc}>Status</label>
                  <select value={form.status} onChange={e => up({ status: e.target.value })} className={ic}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={lc}>Title *</label>
                <input type="text" value={form.title} onChange={e => up({ title: e.target.value })}
                  placeholder="e.g. Golden Triangle — 5 Days Delhi Agra Jaipur" className={ic} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>City / Destination *</label>
                  <input type="text" value={form.city} onChange={e => up({ city: e.target.value })}
                    placeholder="e.g. Goa" className={ic} />
                </div>
                <div>
                  <label className={lc}>Region / State</label>
                  <input type="text" value={form.region} onChange={e => up({ region: e.target.value })}
                    placeholder="e.g. Maharashtra" className={ic} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>No. of Days *</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={61} value={form.days}
                      onChange={e => setDays(e.target.value)}
                      className={ic + " text-center font-black text-[16px]"} />
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{form.nights} nights</span>
                  </div>
                </div>
                <div />
              </div>

              {/* Highlights */}
              <div>
                <label className={lc}>Highlights</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.highlights.map((h, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-800"
                      style={{ background: "#fef3c7" }}>
                      {h}
                      <button type="button" onClick={() => up({ highlights: form.highlights.filter((_, idx) => idx !== i) })}
                        className="text-amber-500 hover:text-red-500 ml-0.5 transition-colors">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newHL} onChange={e => setNewHL(e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter") { e.preventDefault(); if(newHL.trim()){ up({highlights:[...form.highlights,newHL.trim()]}); setNewHL(""); }}}}
                    placeholder="Add a highlight & press Enter"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all" />
                  <button type="button" onClick={() => { if(newHL.trim()){ up({highlights:[...form.highlights,newHL.trim()]}); setNewHL(""); }}}
                    className="px-3 py-2 rounded-xl text-amber-700 transition-all" style={{ background: "#fef3c7" }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Schedule ── */}
          {tab === "schedule" && (
            <div className="space-y-3">
              {form.days < 1 && (
                <p className="text-[12px] text-gray-400 italic">Set the number of days in Basic Info tab first.</p>
              )}
              {form.dayByDay.map((day, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  {/* Day header */}
                  <div className="flex items-center gap-3 px-4 py-2.5"
                    style={{ background: "linear-gradient(135deg,#eef2ff,#e0e7ff)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}>
                      {day.day}
                    </div>
                    <input type="text" value={day.title}
                      onChange={e => updateDay(idx, { title: e.target.value })}
                      placeholder={`Day ${day.day} title (e.g. Arrival & City Tour)`}
                      className="flex-1 min-w-0 bg-transparent text-[13px] font-bold text-indigo-900 placeholder:font-normal placeholder:text-indigo-400 focus:outline-none" />
                  </div>
                  {/* Day body */}
                  <div className="px-4 py-3 space-y-2.5 bg-white">
                    <textarea rows={2} value={day.description}
                      onChange={e => updateDay(idx, { description: e.target.value })}
                      placeholder="Brief description of the day…"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[12px] bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all" />
                    {/* Activities */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Activities</p>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {(day.activities||[]).map((a, ai) => (
                          <span key={ai} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] text-indigo-700 font-medium"
                            style={{ background: "#eef2ff" }}>
                            {a}
                            <button type="button" onClick={() => updateDay(idx, { activities: day.activities.filter((_,ii) => ii!==ai) })}
                              className="text-indigo-400 hover:text-red-500 transition-colors">×</button>
                          </span>
                        ))}
                      </div>
                      <input type="text" placeholder="Add activity & press Enter"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all"
                        onKeyDown={e => {
                          if (e.key === "Enter" && e.target.value.trim()) {
                            e.preventDefault();
                            updateDay(idx, { activities: [...(day.activities||[]), e.target.value.trim()] });
                            e.target.value = "";
                          }
                        }} />
                    </div>
                    {/* Meals */}
                    <div className="flex items-center gap-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex-shrink-0 flex items-center gap-1">
                        <Utensils className="w-3 h-3" /> Meals
                      </p>
                      {["breakfast","lunch","dinner"].map(m => (
                        <label key={m} className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input type="checkbox" checked={day.meals?.[m]||false}
                            onChange={e => updateDayMeal(idx, m, e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-indigo-600" />
                          <span className="text-[11px] font-medium text-gray-600 capitalize">{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Vehicle & Price ── */}
          {tab === "vehicle" && (
            <div className="space-y-6">

              {/* ── Vehicle List ────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background:"#eef2ff" }}>
                      <Car className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-gray-800">Vehicle Options</p>
                      <p className="text-[10px] text-gray-400">Add one or more vehicle types with pricing</p>
                    </div>
                  </div>
                  <button type="button" onClick={addVehicle}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-indigo-700 transition-all"
                    style={{ background:"linear-gradient(135deg,#eef2ff,#e0e7ff)", border:"1px solid #c7d2fe" }}>
                    <Plus className="w-3.5 h-3.5" /> Add Vehicle
                  </button>
                </div>

                {form.vehicles.length === 0 && (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40">
                    <Car className="w-5 h-5 text-indigo-300 flex-shrink-0" />
                    <p className="text-[11px] text-indigo-600">No vehicles added. Click <strong>Add Vehicle</strong> to configure transport options.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {form.vehicles.map((v, vi) => (
                    <div key={vi} className="rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
                      {/* Vehicle header with illustration */}
                      <div className="flex items-center justify-between px-4 py-2.5"
                        style={{ background:"linear-gradient(135deg,#eef2ff,#e0e7ff)" }}>
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Real vehicle photo — fixed box, no overflow */}
                          <VehicleThumb type={v.vehicleType}
                            className="flex-shrink-0 w-20 h-10 rounded-lg"
                            style={{ border:"1px solid #c7d2fe" }} />
                          <div className="min-w-0">
                            <span className="block text-[13px] font-bold text-indigo-900 truncate">
                              {v.vehicleType}{v.model ? ` — ${v.model}` : ""}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block mt-0.5"
                              style={{ background:v.acType==="AC"?"#dbeafe":"#fef9c3", color:v.acType==="AC"?"#1e40af":"#713f12" }}>
                              {v.acType}
                            </span>
                          </div>
                        </div>
                        <button type="button" onClick={() => rmVehicle(vi)}
                          className="p-1 rounded-lg text-indigo-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Vehicle body */}
                      <div className="px-4 py-3 grid grid-cols-2 gap-3 bg-white">
                        <div>
                          <label className={lc}>Vehicle Type</label>
                          <select value={v.vehicleType} onChange={e => updVehicle(vi, { vehicleType:e.target.value })} className={ic}>
                            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={lc}>Model / Description</label>
                          <input type="text" value={v.model} onChange={e => updVehicle(vi, { model:e.target.value })}
                            placeholder="e.g. Innova Crysta" className={ic} />
                        </div>
                        <div>
                          <label className={lc}>AC Type</label>
                          <div className="flex gap-2">
                            {["AC","Non-AC"].map(t => (
                              <button key={t} type="button" onClick={() => updVehicle(vi, { acType:t })}
                                className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all border"
                                style={v.acType===t
                                  ? { background:"linear-gradient(135deg,#4f46e5,#6366f1)", color:"white", borderColor:"#4f46e5", boxShadow:"0 2px 8px #6366f130" }
                                  : { background:"white", color:"#6b7280", borderColor:"#e5e7eb" }}>
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={lc}>No. of Seats / Persons</label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="number" min={1} max={60} value={v.seats}
                              onChange={e => updVehicle(vi, { seats:e.target.value })}
                              placeholder="4" className={ic + " pl-8"} />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className={lc}>Vehicle Price (₹) — for full itinerary</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">₹</span>
                            <input type="number" min={0} value={v.vehiclePrice}
                              onChange={e => { updVehicle(vi, { vehiclePrice:e.target.value }); upCalc({ vehicles: form.vehicles.map((vv,ii) => ii===vi ? {...vv, vehiclePrice:e.target.value} : vv) }); }}
                              placeholder="0" className={ic + " pl-7 font-bold text-indigo-700"} />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className={lc}>Notes (optional)</label>
                          <input type="text" value={v.notes} onChange={e => updVehicle(vi, { notes:e.target.value })}
                            placeholder="e.g. Driver included, fuel extra…" className={ic} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Pricing Calculator ──────────────────────────────────── */}
              <div className="rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 flex items-center gap-2"
                  style={{ background:"linear-gradient(135deg,#d1fae5,#a7f3d0)" }}>
                  <IndianRupee className="w-4 h-4 text-emerald-700" />
                  <p className="text-[13px] font-black text-emerald-900">Pricing Summary</p>
                </div>
                <div className="px-4 py-4 bg-white space-y-4">

                  {/* Itinerary Price input */}
                  <div>
                    <label className={lc}>Itinerary Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <input type="number" min={0} value={form.itineraryTotal !== undefined ? form.itineraryTotal : ""}
                        onChange={e => {
                          const val = e.target.value;
                          const vTotal = form.vehicles.reduce((a,v) => a+(parseFloat(v.vehiclePrice)||0), 0);
                          setForm(prev => ({ ...prev, itineraryTotal: val, grandTotal: (parseFloat(val)||0) + vTotal }));
                        }}
                        placeholder="0" className={ic + " pl-7 font-bold text-emerald-700"} />
                    </div>
                  </div>

                  {/* Vehicle total */}
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style={{ background:"#eef2ff", border:"1px solid #c7d2fe" }}>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-indigo-500" />
                      <span className="text-[12px] font-semibold text-indigo-800">
                        Vehicle Total ({form.vehicles.length} vehicle{form.vehicles.length!==1?"s":""})
                      </span>
                    </div>
                    <span className="text-[15px] font-black text-indigo-700">
                      ₹{form.vehicles.reduce((a,v) => a+(parseFloat(v.vehiclePrice)||0), 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Grand total */}
                  <div className="flex items-center justify-between py-3 px-4 rounded-2xl"
                    style={{ background:"linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow:"0 4px 16px #6366f130" }}>
                    <span className="text-[14px] font-black text-white">Grand Total</span>
                    <span className="text-[22px] font-black text-white">
                      ₹{(
                        (parseFloat(form.itineraryTotal)||0) +
                        form.vehicles.reduce((a,v) => a+(parseFloat(v.vehiclePrice)||0), 0)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Includes / Excludes */}
                  {[
                    { key:"includes", label:"Includes", bg:"#d1fae5", tc:"#065f46", newState:newInc, setNew:setNewInc },
                    { key:"excludes", label:"Excludes", bg:"#ffe4e6", tc:"#881337", newState:newExc, setNew:setNewExc },
                  ].map(({ key, label, bg, tc, newState, setNew }) => (
                    <div key={key}>
                      <label className={lc}>{label}</label>
                      <div className="flex flex-col gap-1.5 mb-2">
                        {form[key].map((item,i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-medium"
                            style={{ background:bg, color:tc }}>
                            <span className="flex-1">{item}</span>
                            <button type="button" onClick={() => up({ [key]:form[key].filter((_,idx) => idx!==i) })}
                              className="text-current opacity-50 hover:opacity-100 transition-opacity">×</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={newState} onChange={e => setNew(e.target.value)}
                          onKeyDown={e => { if(e.key==="Enter"){ e.preventDefault(); if(newState.trim()){ up({[key]:[...form[key],newState.trim()]}); setNew(""); }}}}
                          placeholder={`Add ${label.toLowerCase()} item & press Enter`}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-gray-300/50 transition-all" />
                        <button type="button" onClick={() => { if(newState.trim()){ up({[key]:[...form[key],newState.trim()]}); setNew(""); }}}
                          className="px-3 py-2 rounded-xl transition-all" style={{ background:bg, color:tc }}>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0"
          style={{ background: "linear-gradient(180deg,#fff,#f8faff)" }}>
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {tab !== "vehicle" && (
              <button type="button" onClick={() => setTab(tab === "basic" ? "schedule" : "vehicle")}
                className="px-4 py-2 rounded-xl border border-indigo-200 text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                Next →
              </button>
            )}
            <button type="button" onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 4px 16px #6366f140" }}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Itinerary"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sort / Filter bar ──────────────────────────────────────────────────────────
const SORT_OPTS = [
  { value: "newest",     label: "Newest",      icon: TrendingUp },
  { value: "oldest",     label: "Oldest",      icon: Clock },
  { value: "az",         label: "A → Z",       icon: SortAsc },
  { value: "za",         label: "Z → A",       icon: SortDesc },
  { value: "price_asc",  label: "Price ↑",     icon: IndianRupee },
  { value: "price_desc", label: "Price ↓",     icon: IndianRupee },
  { value: "days_asc",   label: "Days ↑",      icon: Calendar },
  { value: "days_desc",  label: "Days ↓",      icon: Calendar },
];

const STATUS_FILTER_OPTS = [
  { value: "", label: "All" },
  { value: "active",   label: "Active" },
  { value: "draft",    label: "Draft" },
  { value: "archived", label: "Archived" },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ItineraryPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [items,     setItems]    = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState("");
  const [search,    setSearch]   = useState("");
  const [cityF,     setCityF]    = useState("");
  const [statusF,   setStatusF]  = useState("");
  const [sort,      setSort]     = useState("newest");
  const [viewMode,  setViewMode] = useState("grid"); // grid | list
  const [sortOpen,  setSortOpen] = useState(false);
  const [preview,   setPreview]  = useState(null);
  const [editItem,  setEditItem] = useState(null);
  const [formOpen,  setFormOpen] = useState(false);
  const [copied,    setCopied]   = useState("");
  const sortRef = useRef(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handler(e) { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const p = new URLSearchParams();
      if (search)  p.set("search", search);
      if (cityF)   p.set("city",   cityF);
      if (statusF) p.set("status", statusF);
      if (sort)    p.set("sort",   sort);
      const res  = await fetch(`/api/itineraries?${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(data.itineraries || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [search, cityF, statusF, sort]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 280);
    return () => clearTimeout(t);
  }, [fetchItems]);

  function handleDelete(id) {
    fetch(`/api/itineraries/${id}`, { method: "DELETE" })
      .then(() => setItems(prev => prev.filter(i => i._id !== id)))
      .catch(err => alert(err.message));
  }

  function handleSaved(saved) {
    setFormOpen(false); setEditItem(null);
    fetchItems();
    setPreview(saved);
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  }

  const currentSort = SORT_OPTS.find(o => o.value === sort) || SORT_OPTS[0];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#f8faff 0%,#f1f5f9 100%)" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20"
        style={{ boxShadow: "0 1px 20px rgba(0,0,0,0.04)" }}>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Link href="/dashboard" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-1">
                <ArrowLeft className="w-3 h-3" /> Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                  <Route className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-[22px] font-black text-gray-900 tracking-tight leading-none">Itineraries</h1>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {loading ? "Loading…" : `${items.length} itinerar${items.length !== 1 ? "ies" : "y"}`}
                  </p>
                </div>
              </div>
            </div>
            {isAdmin && (
              <button type="button" onClick={() => { setEditItem(null); setFormOpen(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all"
                style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 4px 16px #6366f135" }}>
                <Plus className="w-4 h-4" /> New Itinerary
              </button>
            )}
          </div>

          {/* ── Search + Filters ── */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, code or city…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all" />
              {search && (
                <button type="button" onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* City filter */}
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-400" />
              <input type="text" value={cityF} onChange={e => setCityF(e.target.value)}
                placeholder="City…"
                className="pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-300 transition-all w-36" />
            </div>

            {/* Status filter chips */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {STATUS_FILTER_OPTS.map(o => (
                <button key={o.value} type="button" onClick={() => setStatusF(o.value)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={statusF === o.value
                    ? { background: "white", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                    : { color: "#6b7280" }}>
                  {o.label}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button type="button" onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-[12px] font-semibold text-gray-700 hover:border-indigo-300 transition-all">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                {currentSort.label}
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30"
                  style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.12)" }}>
                  {SORT_OPTS.map(o => {
                    const Icon = o.icon;
                    return (
                      <button key={o.value} type="button"
                        onClick={() => { setSort(o.value); setSortOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-semibold hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        style={{ color: sort === o.value ? "#4f46e5" : "#374151" }}>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {o.label}
                        {sort === o.value && <Check className="w-3 h-3 ml-auto text-indigo-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              <button type="button" onClick={() => setViewMode("grid")}
                className="p-1.5 rounded-lg transition-all"
                style={viewMode === "grid" ? { background: "white", color: "#4f46e5", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                  : { color: "#9ca3af" }}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setViewMode("list")}
                className="p-1.5 rounded-lg transition-all"
                style={viewMode === "list" ? { background: "white", color: "#4f46e5", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                  : { color: "#9ca3af" }}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Copied toast ── */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-[12px] font-semibold shadow-xl"
          style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}>
          <Check className="w-3.5 h-3.5" /> Code "{copied}" copied!
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-28">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              <p className="text-[13px] text-gray-400">Loading itineraries…</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg,#eef2ff,#e0e7ff)" }}>
              <Route className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">No itineraries found</h3>
            <p className="text-[14px] text-gray-400 mb-6 max-w-sm">
              {search || cityF || statusF
                ? "Try adjusting your search or filters."
                : isAdmin ? "Create your first itinerary to get started." : "No itineraries published yet."}
            </p>
            {isAdmin && !search && !cityF && !statusF && (
              <button type="button" onClick={() => { setEditItem(null); setFormOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-bold"
                style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}>
                <Plus className="w-4 h-4" /> Create Itinerary
              </button>
            )}
          </div>
        )}

        {/* Grid view */}
        {!loading && items.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(itin => (
              <ItineraryCard key={itin._id} itin={itin} isAdmin={isAdmin}
                onView={setPreview}
                onEdit={i => { setEditItem(i); setFormOpen(true); }}
                onDelete={handleDelete}
                onCopyCode={copyCode} />
            ))}
          </div>
        )}

        {/* List view */}
        {!loading && items.length > 0 && viewMode === "list" && (
          <div className="space-y-2.5">
            {/* List header */}
            <div className="grid items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pb-1"
              style={{ gridTemplateColumns: "8px 7rem 1fr auto auto 7rem auto" }}>
              <span />
              <span>Code</span>
              <span>Title / City</span>
              <span>Duration</span>
              <span>Status</span>
              <span className="text-right">Price</span>
              {isAdmin && <span />}
            </div>
            {items.map(itin => (
              <ItineraryRow key={itin._id} itin={itin} isAdmin={isAdmin}
                onView={setPreview}
                onEdit={i => { setEditItem(i); setFormOpen(true); }}
                onDelete={handleDelete}
                onCopyCode={copyCode} />
            ))}
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {preview && (
        <PreviewModal itin={preview} onClose={() => setPreview(null)}
          onEdit={i => { setPreview(null); setEditItem(i); setFormOpen(true); }}
          isAdmin={isAdmin} />
      )}

      {/* ── Form Modal ── */}
      {formOpen && (
        <ItineraryFormModal
          itin={editItem}
          onClose={() => { setFormOpen(false); setEditItem(null); }}
          onSaved={handleSaved} />
      )}
    </div>
  );
}
