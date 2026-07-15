"use client";

import { useState, useEffect } from "react";
import {
  X, Star, Plus, Trash2, Loader2, AlertCircle, Building2,
  BedDouble, Utensils, ChevronDown, Activity, Phone, CalendarDays,
  Sparkles, ImageIcon, Tag, Users,
} from "lucide-react";
import AccommodationImageUploader from "@/components/accommodation/AccommodationImageUploader";
import SeasonCalendar from "@/components/accommodation/SeasonCalendar";

// ── Constants ─────────────────────────────────────────────────────────────────
const HOTEL_TYPES = ["hotel","resort","hostel","guesthouse","villa","apartment","other"];
const MEAL_PLANS  = [
  { value: "EP",  label: "EP — Room Only",           desc: "European Plan"         },
  { value: "CP",  label: "CP — Bed & Breakfast",     desc: "Continental Plan"      },
  { value: "MAP", label: "MAP — Breakfast + Dinner", desc: "Modified American Plan" },
  { value: "AP",  label: "AP — All Meals",           desc: "American Plan"         },
];
const SEASON_COLORS = [
  { id: "amber",   label: "Peak",    strip: "#f59e0b", light: "#fef3c7", text: "#78350f" },
  { id: "blue",    label: "Summer",  strip: "#3b82f6", light: "#dbeafe", text: "#1e3a8a" },
  { id: "emerald", label: "Season",  strip: "#10b981", light: "#d1fae5", text: "#064e3b" },
  { id: "rose",    label: "Special", strip: "#f43f5e", light: "#ffe4e6", text: "#881337" },
  { id: "violet",  label: "Off",     strip: "#8b5cf6", light: "#ede9fe", text: "#3b0764" },
  { id: "teal",    label: "Monsoon", strip: "#14b8a6", light: "#ccfbf1", text: "#134e4a" },
];

const DEFAULT_HOTEL = { name:"", type:"hotel", starRating:null, email:"", contactNo:"", address:"", features:[], activities:[], images:[] };
const DEFAULT_ROOM  = { roomType:"", maxOccupancy:2, features:[], seasonalPricing:[], images:[] };
const TODAY_STR     = new Date().toISOString().split("T")[0];

// ── Date helpers ──────────────────────────────────────────────────────────────
function toInputDate(v) {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d)) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}
function toDisplayDate(iso) {
  if (!iso || iso.length < 10) return "";
  const [y,m,d] = iso.split("-");
  return `${d}-${m}-${y}`;
}
function normaliseSeasons(raw = []) {
  return raw.map(s => {
    const meals = Array.isArray(s.meals) ? s.meals.map(m => ({ plan: m.plan, price: m.price ?? "" })) : [];
    if (Array.isArray(s.dateRanges)) return {
      label: s.label||"",
      dateRanges: s.dateRanges.map(r => ({ startDate:toInputDate(r.startDate), endDate:toInputDate(r.endDate) })),
      meals,
    };
    if (s.startDate||s.endDate) return {
      label: s.label||"",
      dateRanges: [{ startDate:toInputDate(s.startDate), endDate:toInputDate(s.endDate) }],
      meals,
    };
    return { label:s.label||"", dateRanges:[], meals };
  });
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, color, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div>
          <p className="text-[12px] font-bold text-gray-800 leading-none">{title}</p>
          {subtitle && <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ── Meal row ───────────────────────────────────────────────────────────────────
function MealRow({ meal, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
      style={{ background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)", borderColor:"#bbf7d0" }}>
      <Utensils className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
      <select value={meal.plan} onChange={e => onUpdate({ plan:e.target.value })}
        className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-emerald-200 text-[12px] bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all">
        {MEAL_PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[11px] text-emerald-700 font-semibold">+₹</span>
        <input type="number" min={0} value={meal.price}
          onChange={e => onUpdate({ price:e.target.value })}
          placeholder="0"
          className="w-20 px-2 py-1 rounded-lg border border-emerald-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all" />
        <span className="text-[10px] text-gray-400">/pax</span>
      </div>
      <button type="button" onClick={onRemove}
        className="p-1 rounded-lg text-emerald-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Room Form ──────────────────────────────────────────────────────────────────
function RoomInlineForm({ room, index, onChange, onRemove }) {
  const [newFeat,   setNewFeat]   = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const [calOpen,   setCalOpen]   = useState(false);

  function update(p) { onChange({ ...room, ...p }); }

  function addFeat() {
    const f = newFeat.trim();
    if (!f || room.features.includes(f)) return;
    update({ features:[...room.features, f] }); setNewFeat("");
  }
  function addSeason() {
    update({ seasonalPricing:[...room.seasonalPricing,
      { label:"", dateRanges:[{ startDate:"", endDate:"" }], meals:[] }] });
  }
  function updSeason(si, p) {
    update({ seasonalPricing: room.seasonalPricing.map((s,i) => i===si ? {...s,...p} : s) });
  }
  function rmSeason(si) {
    update({ seasonalPricing: room.seasonalPricing.filter((_,i) => i!==si) });
  }
  // ── Per-season meal helpers ────────────────────────────────────────────────
  function addSeasonMeal(si) {
    const s = room.seasonalPricing[si];
    const used = (s.meals||[]).map(m => m.plan);
    const next = MEAL_PLANS.find(p => !used.includes(p.value));
    if (!next) return;
    updSeason(si, { meals:[...(s.meals||[]), { plan:next.value, price:"" }] });
  }
  function updSeasonMeal(si, mi, patch) {
    const s = room.seasonalPricing[si];
    updSeason(si, { meals: s.meals.map((m,j) => j===mi ? {...m,...patch} : m) });
  }
  function rmSeasonMeal(si, mi) {
    const s = room.seasonalPricing[si];
    updSeason(si, { meals: s.meals.filter((_,j) => j!==mi) });
  }
  function addRange(si) {
    update({ seasonalPricing: room.seasonalPricing.map((s,i) =>
      i!==si ? s : {...s, dateRanges:[...(s.dateRanges||[]), { startDate:"", endDate:"" }]}
    )});
  }
  function updRange(si, ri, p) {
    update({ seasonalPricing: room.seasonalPricing.map((s,i) =>
      i!==si ? s : {...s, dateRanges: s.dateRanges.map((r,j) => j===ri ? {...r,...p} : r)}
    )});
  }
  function rmRange(si, ri) {
    update({ seasonalPricing: room.seasonalPricing.map((s,i) =>
      i!==si ? s : {...s, dateRanges: s.dateRanges.filter((_,j) => j!==ri)}
    )});
  }

  const totalRanges = room.seasonalPricing.reduce((a,s) => a+(s.dateRanges?.length||0), 0);
  const ic = "w-full px-3 py-2 rounded-xl border border-gray-200 text-[12px] bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all";

  return (
    <div className="rounded-2xl overflow-hidden border border-violet-200/80 shadow-sm"
      style={{ background:"linear-gradient(160deg, #faf5ff 0%, #f5f3ff 50%, #fafafa 100%)" }}>

      {/* ── Card header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-200/60"
        style={{ background:"linear-gradient(135deg,#ede9fe,#ddd6fe)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-white/70 shadow-sm flex items-center justify-center flex-shrink-0">
            <BedDouble className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-violet-900 truncate">
              {room.roomType || `Room Type ${index+1}`}
            </p>
            {(room.seasonalPricing.length>0 || totalRanges>0) && (
              <p className="text-[10px] text-violet-500 leading-none mt-0.5">
                {room.seasonalPricing.length} season{room.seasonalPricing.length!==1?"s":""} · {totalRanges} date range{totalRanges!==1?"s":""}
              </p>
            )}
          </div>
        </div>
        <button type="button" onClick={() => onRemove(index)} aria-label="Remove room"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-5">

        {/* ── Type + Occupancy ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Room Type *</label>
            <input type="text" required value={room.roomType}
              onChange={e => update({ roomType:e.target.value })}
              placeholder="e.g. Deluxe Double" className={ic} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Users className="w-3 h-3" /> Max Guests
            </label>
            <input type="number" min={1} max={20} value={room.maxOccupancy}
              onChange={e => update({ maxOccupancy:e.target.value })} className={ic} />
          </div>
        </div>

        {/* ── Seasonal Pricing ──────────────────────────────────────────── */}
        <div>
          <SectionHead icon={CalendarDays} color="#f59e0b" title="Seasonal Pricing"
            subtitle="Each season can span multiple date windows"
            action={
              <button type="button" onClick={addSeason}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-amber-700 transition-all"
                style={{ background:"linear-gradient(135deg,#fef3c7,#fde68a)", border:"1px solid #fbbf2450" }}>
                <Plus className="w-3.5 h-3.5" /> Add Season
              </button>
            } />

          {room.seasonalPricing.length === 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-[11px] text-amber-700">
                No seasons yet. Pricing is <strong>entirely seasonal</strong> — add at least one.
              </p>
            </div>
          )}

          <div className="space-y-3 mt-2">
            {room.seasonalPricing.map((s, si) => {
              const pal = SEASON_COLORS[si % SEASON_COLORS.length];
              const usedMealPlans = (s.meals||[]).map(m => m.plan);
              const canAddMeal = usedMealPlans.length < MEAL_PLANS.length;
              return (
                <div key={si} className="rounded-2xl overflow-hidden border"
                  style={{ borderColor:`${pal.strip}40`, background:"white",
                    boxShadow:`0 2px 12px ${pal.strip}12` }}>

                  {/* Season header — label + remove */}
                  <div className="px-3 py-2.5 flex items-center gap-2.5"
                    style={{ background:`linear-gradient(135deg,${pal.light},${pal.strip}15)` }}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background:pal.strip }} />
                    <input type="text" value={s.label}
                      onChange={e => updSeason(si, { label:e.target.value })}
                      placeholder={`${pal.label} Season`}
                      className="flex-1 min-w-0 bg-transparent text-[13px] font-bold placeholder:font-normal focus:outline-none"
                      style={{ color:pal.text }} />
                    <button type="button" onClick={() => rmSeason(si)}
                      className="p-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                      style={{ color:pal.strip }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Date ranges */}
                  <div className="px-3 py-2.5 space-y-2">
                    {(s.dateRanges||[]).map((r, ri) => (
                      <div key={ri} className="grid gap-2"
                        style={{ gridTemplateColumns:"1fr auto 1fr auto" }}>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color:pal.strip }}>From</label>
                          <div className="relative">
                            <input type="date" value={r.startDate||""} min={TODAY_STR}
                              onChange={e => updRange(si, ri, { startDate:e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg text-[11px] bg-white focus:outline-none focus:ring-2 transition-all"
                              style={{ border:`1.5px solid ${pal.strip}30`, color:"#374151" }} />
                            {r.startDate && (
                              <p className="text-[9px] mt-0.5 font-semibold" style={{ color:pal.strip }}>
                                {toDisplayDate(r.startDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start pt-4">
                          <span className="text-[12px] font-bold text-gray-400 px-1">→</span>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color:pal.strip }}>To</label>
                          <input type="date" value={r.endDate||""} min={r.startDate||TODAY_STR}
                            onChange={e => updRange(si, ri, { endDate:e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg text-[11px] bg-white focus:outline-none focus:ring-2 transition-all"
                            style={{ border:`1.5px solid ${pal.strip}30`, color:"#374151" }} />
                          {r.endDate && (
                            <p className="text-[9px] mt-0.5 font-semibold" style={{ color:pal.strip }}>
                              {toDisplayDate(r.endDate)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-start pt-4">
                          {(s.dateRanges||[]).length > 1 ? (
                            <button type="button" onClick={() => rmRange(si, ri)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          ) : <div className="w-6" />}
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={() => addRange(si)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold mt-1 px-2 py-1 rounded-lg transition-all hover:bg-opacity-80"
                      style={{ color:pal.strip, background:`${pal.light}`, border:`1px solid ${pal.strip}20` }}>
                      <Plus className="w-3 h-3" />
                      Add another date range
                    </button>
                  </div>

                  {/* ── Meal plans for this season ─────────────────────────── */}
                  <div className="px-3 pb-3 space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1" style={{ color:pal.strip }}>
                        <Utensils className="w-3 h-3" /> Meal Plans & Rates
                      </p>
                      <button type="button" onClick={() => addSeasonMeal(si)} disabled={!canAddMeal}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
                        style={{ background:pal.light, color:pal.text, border:`1px solid ${pal.strip}30` }}>
                        <Plus className="w-2.5 h-2.5" /> Add Meal
                      </button>
                    </div>
                    {(s.meals||[]).length === 0 && (
                      <p className="text-[10px] text-gray-400 italic">No meal plans — price shown on booking based on plan selected.</p>
                    )}
                    {(s.meals||[]).map((m, mi) => (
                      <div key={mi} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border"
                        style={{ background:`${pal.light}80`, borderColor:`${pal.strip}20` }}>
                        <Utensils className="w-3 h-3 flex-shrink-0" style={{ color:pal.strip }} />
                        <select value={m.plan} onChange={e => updSeasonMeal(si, mi, { plan:e.target.value })}
                          className="flex-1 min-w-0 px-1.5 py-1 rounded-md border text-[11px] bg-white focus:outline-none focus:ring-1 transition-all"
                          style={{ borderColor:`${pal.strip}30`, color:"#374151" }}>
                          {MEAL_PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[11px] font-bold" style={{ color:pal.strip }}>₹</span>
                          <input type="number" min={0} value={m.price}
                            onChange={e => updSeasonMeal(si, mi, { price:e.target.value })}
                            placeholder="0"
                            className="w-20 px-1.5 py-1 rounded-md text-[11px] font-bold bg-white focus:outline-none focus:ring-1 transition-all"
                            style={{ border:`1px solid ${pal.strip}30`, color:pal.strip }} />
                          <span className="text-[9px] text-gray-400">/pax</span>
                        </div>
                        <button type="button" onClick={() => rmSeasonMeal(si, mi)}
                          className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live calendar preview toggle */}
          {room.seasonalPricing.length > 0 && (
            <div className="mt-3">
              <button type="button" onClick={() => setCalOpen(o => !o)}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all border"
                style={{
                  background: calOpen
                    ? "linear-gradient(135deg,#4f46e5,#6366f1)"
                    : "linear-gradient(135deg,#eef2ff,#e0e7ff)",
                  color: calOpen ? "white" : "#4338ca",
                  borderColor: "#c7d2fe",
                  boxShadow: calOpen ? "0 4px 12px #6366f130" : "none",
                }}>
                <CalendarDays className="w-4 h-4" />
                {calOpen ? "Hide" : "Preview"} Price Calendar
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${calOpen ? "rotate-180" : ""}`} />
              </button>
              {calOpen && (
                <div className="mt-2">
                  <SeasonCalendar seasonalPricing={room.seasonalPricing} roomType={room.roomType||"Room"} compact />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Room Features ─────────────────────────────────────────────── */}
        <div>
          <SectionHead icon={Tag} color="#8b5cf6" title="Room Features" />
          {room.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {room.features.map((f,i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background:"linear-gradient(135deg,#ede9fe,#ddd6fe)", color:"#5b21b6", border:"1px solid #c4b5fd50" }}>
                  {f}
                  <button type="button"
                    onClick={() => update({ features:room.features.filter((_,idx) => idx!==i) })}
                    className="ml-0.5 text-violet-400 hover:text-red-500 transition-colors">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input type="text" value={newFeat}
              onChange={e => setNewFeat(e.target.value)}
              onKeyDown={e => e.key==="Enter" && (e.preventDefault(), addFeat())}
              placeholder="e.g. AC, Mountain View, King Bed…"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-[11px] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all" />
            <button type="button" onClick={addFeat}
              className="px-3 py-2 rounded-xl text-violet-600 hover:shadow-sm transition-all"
              style={{ background:"linear-gradient(135deg,#ede9fe,#ddd6fe)", border:"1px solid #c4b5fd50" }}>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Room Images ───────────────────────────────────────────────── */}
        <div>
          <button type="button" onClick={() => setImageOpen(o => !o)}
            className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors mb-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Room Images ({room.images?.length||0})
            <ChevronDown className={`w-3 h-3 transition-transform ${imageOpen?"rotate-180":""}`} />
          </button>
          {imageOpen && (
            <AccommodationImageUploader images={room.images||[]}
              onChange={imgs => update({ images:imgs })} maxImages={4} label="" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function HotelFormModal({ cityId, hotel, rooms: initialRooms=[], onClose, onSaved }) {
  const isEdit = Boolean(hotel);
  const [tab,        setTab]        = useState("details");
  const [form,       setForm]       = useState(DEFAULT_HOTEL);
  const [newFeature, setNewFeature] = useState("");
  const [rooms,      setRooms]      = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (hotel) {
      setForm({ name:hotel.name||"", type:hotel.type||"hotel", starRating:hotel.starRating??null,
        email:hotel.email||"", contactNo:hotel.contactNo||"", address:hotel.address||"",
        features:hotel.features||[], activities:hotel.activities||[], images:hotel.images||[] });
    } else { setForm(DEFAULT_HOTEL); }
    setRooms((initialRooms||[]).map(r => ({
      _id:r._id, roomType:r.roomType||"", maxOccupancy:r.maxOccupancy??2,
      features:r.features||[],
      seasonalPricing:normaliseSeasons(r.seasonalPricing), images:r.images||[],
    })));
  }, [hotel, initialRooms]);

  const updateForm = p => setForm(prev => ({ ...prev, ...p }));
  const addFeature = () => {
    const f = newFeature.trim();
    if (!f || form.features.includes(f)) return;
    updateForm({ features:[...form.features, f] }); setNewFeature("");
  };
  const addActivity  = () => updateForm({ activities:[...form.activities, { name:"", price:"" }] });
  const updActivity  = (i,p) => updateForm({ activities:form.activities.map((a,idx) => idx===i ? {...a,...p} : a) });
  const addRoom      = () => { setRooms(p => [...p, {...DEFAULT_ROOM}]); setTab("rooms"); };
  const updateRoom   = (i,u) => setRooms(p => p.map((r,idx) => idx===i ? u : r));
  const removeRoom   = async i => {
    const r = rooms[i];
    if (r._id) try { await fetch(`/api/accommodation/rooms/${r._id}`, { method:"DELETE" }); } catch {}
    setRooms(p => p.filter((_,idx) => idx!==i));
  };

  async function handleSubmit() {
    setError("");
    if (!form.contactNo.trim()) { setTab("details"); setError("Contact number is required."); return; }
    setSaving(true);
    try {
      const hotelPayload = { ...form, city:cityId,
        activities:form.activities.filter(a=>a.name.trim()).map(a=>({ name:a.name.trim(), price:parseFloat(a.price)||0 })) };
      const hRes  = await fetch(isEdit ? `/api/accommodation/hotels/${hotel._id}` : "/api/accommodation/hotels",
        { method:isEdit?"PUT":"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(hotelPayload) });
      const hData = await hRes.json();
      if (!hRes.ok) throw new Error(hData.error||"Failed to save hotel");
      const hotelId = hData.hotel._id;
      for (const room of rooms) {
        if (!room.roomType.trim()) continue;
        const rPayload = {
          hotel:hotelId, roomType:room.roomType, maxOccupancy:parseInt(room.maxOccupancy,10)||2,
          features:room.features,
          seasonalPricing:room.seasonalPricing
            .filter(s => (s.dateRanges||[]).some(r=>r.startDate&&r.endDate))
            .map(s => ({
              label:s.label||"",
              dateRanges:(s.dateRanges||[]).filter(r=>r.startDate&&r.endDate)
                .map(r=>({ startDate:r.startDate, endDate:r.endDate })),
              meals:(s.meals||[]).filter(m=>m.plan).map(m=>({ plan:m.plan, price:parseFloat(m.price)||0 })),
            })),
          images:room.images,
        };
        const rRes  = await fetch(room._id ? `/api/accommodation/rooms/${room._id}` : "/api/accommodation/rooms",
          { method:room._id?"PUT":"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(rPayload) });
        const rData = await rRes.json();
        if (!rRes.ok) throw new Error(rData.error||`Room "${room.roomType}" failed`);
      }
      onSaved(hData.hotel);
    } catch(err) { setError(err.message); }
    finally { setSaving(false); }
  }

  // Input / label classes
  const ic = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all";
  const lc = "block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5";

  const TABS = [
    { id:"details", label:"Details",                      dot:false },
    { id:"images",  label:`Images (${form.images.length})`, dot:false },
    { id:"rooms",   label:`Rooms (${rooms.length})`,        dot:false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background:"rgba(15,20,40,0.55)", backdropFilter:"blur(6px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>

      <div className="relative w-full sm:max-w-2xl bg-white flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight:"92dvh", boxShadow:"0 32px 80px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.15)" }}>

        {/* ── Gradient header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background:"linear-gradient(135deg,#4f46e5 0%,#6366f1 50%,#818cf8 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-black text-white tracking-tight">
                {isEdit ? "Edit Hotel" : "New Hotel"}
              </h2>
              {isEdit && hotel?.name && (
                <p className="text-[11px] text-indigo-200 leading-none mt-0.5">{hotel.name}</p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} id="close-hotel-modal" aria-label="Close"
            className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Pill tabs ───────────────────────────────────────────────── */}
        <div className="flex gap-1.5 px-6 py-3 border-b border-gray-100/80 flex-shrink-0"
          style={{ background:"linear-gradient(180deg,#f8faff,#ffffff)" }}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
              style={tab===t.id ? {
                background:"linear-gradient(135deg,#4f46e5,#6366f1)",
                color:"white", boxShadow:"0 4px 12px #6366f140",
              } : { color:"#6b7280", background:"transparent" }}>
              {t.label}
              {t.dot && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>
          ))}
        </div>

        {/* ── Error ───────────────────────────────────────────────────── */}
        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[12px] flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ═══ DETAILS ══════════════════════════════════════════════ */}
          {tab==="details" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hotel-name" className={lc}>Hotel Name *</label>
                  <input id="hotel-name" type="text" required value={form.name}
                    onChange={e => updateForm({ name:e.target.value })}
                    placeholder="e.g. The Grand Palace" className={ic} />
                </div>
                <div>
                  <label htmlFor="hotel-type" className={lc}>Property Type</label>
                  <select id="hotel-type" value={form.type}
                    onChange={e => updateForm({ type:e.target.value })} className={ic}>
                    {HOTEL_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* Star rating */}
              <div>
                <label className={lc}>Star Rating</label>
                <div className="flex gap-1.5 items-center">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" aria-label={`${star} star`}
                      onClick={() => updateForm({ starRating:form.starRating===star ? null : star })}>
                      <Star className={`w-6 h-6 transition-all ${(form.starRating??0)>=star ? "fill-amber-400 text-amber-400 scale-110" : "text-gray-300 hover:text-amber-300"}`} />
                    </button>
                  ))}
                  {form.starRating && (
                    <button type="button" onClick={() => updateForm({ starRating:null })}
                      className="text-[11px] text-gray-400 hover:text-gray-600 ml-1">Clear</button>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div>
                <label htmlFor="hotel-contact" className={lc}>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />Contact No.
                    <span className="text-red-500 normal-case font-black">*</span>
                  </span>
                </label>
                <input id="hotel-contact" type="tel" required value={form.contactNo}
                  onChange={e => updateForm({ contactNo:e.target.value })}
                  placeholder="+91 98765 43210"
                  className={`${ic} ${!form.contactNo.trim() ? "border-red-300 focus:border-red-400 focus:ring-red-400/30" : ""}`} />
                {!form.contactNo.trim() && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />Required
                  </p>
                )}
              </div>

              {/* Email + Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hotel-email" className={lc}>Email</label>
                  <input id="hotel-email" type="email" value={form.email}
                    onChange={e => updateForm({ email:e.target.value })}
                    placeholder="hotel@example.com" className={ic} />
                </div>
                <div>
                  <label htmlFor="hotel-address" className={lc}>Address</label>
                  <input id="hotel-address" type="text" value={form.address}
                    onChange={e => updateForm({ address:e.target.value })}
                    placeholder="Street, Area, Pincode" className={ic} />
                </div>
              </div>

              {/* Hotel features */}
              <div>
                <label className={lc}>Hotel Features / Amenities</label>
                {form.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.features.map((f,i) => (
                      <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold"
                        style={{ background:"linear-gradient(135deg,#e0e7ff,#c7d2fe)", color:"#3730a3", border:"1px solid #a5b4fc40" }}>
                        {f}
                        <button type="button"
                          onClick={() => updateForm({ features:form.features.filter((_,idx)=>idx!==i) })}
                          className="ml-0.5 text-indigo-400 hover:text-red-500 transition-colors">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" id="new-hotel-feature" value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && (e.preventDefault(), addFeature())}
                    placeholder="e.g. Swimming Pool, Free WiFi, Spa…"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all" />
                  <button type="button" id="add-hotel-feature-btn" onClick={addFeature}
                    className="px-3 py-2 rounded-xl text-white transition-all"
                    style={{ background:"linear-gradient(135deg,#4f46e5,#6366f1)" }}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Activities */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`${lc} mb-0 flex items-center gap-1.5`}>
                    <Activity className="w-3.5 h-3.5 text-violet-500" />Activities &amp; Add-ons
                  </label>
                  <button type="button" id="add-activity-btn" onClick={addActivity}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-violet-700 transition-all"
                    style={{ background:"linear-gradient(135deg,#ede9fe,#ddd6fe)", border:"1px solid #c4b5fd50" }}>
                    <Plus className="w-3.5 h-3.5" />Add
                  </button>
                </div>
                {form.activities.length === 0 ? (
                  <p className="text-[12px] text-gray-400 italic">e.g. Room Decoration, Candlelight Dinner…</p>
                ) : (
                  <div className="space-y-2">
                    {form.activities.map((a,i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                        style={{ background:"linear-gradient(135deg,#faf5ff,#ede9fe)", borderColor:"#ddd6fe" }}>
                        <input type="text" value={a.name}
                          onChange={e => updActivity(i, { name:e.target.value })}
                          placeholder="Activity name"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-violet-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all" />
                        <span className="text-[12px] text-gray-500 flex-shrink-0">₹</span>
                        <input type="number" min={0} value={a.price}
                          onChange={e => updActivity(i, { price:e.target.value })}
                          placeholder="0"
                          className="w-24 px-2 py-1.5 rounded-lg border border-violet-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all" />
                        <button type="button"
                          onClick={() => updateForm({ activities:form.activities.filter((_,idx)=>idx!==i) })}
                          className="p-1 rounded-lg text-violet-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ IMAGES ═══════════════════════════════════════════════ */}
          {tab==="images" && (
            <div className="space-y-4">
              <AccommodationImageUploader images={form.images}
                onChange={imgs => updateForm({ images:imgs })} maxImages={8} label="Hotel Images (optional)" />
            </div>
          )}

          {/* ═══ ROOMS ════════════════════════════════════════════════ */}
          {tab==="rooms" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-black text-gray-900">Room Types</p>
                  <p className="text-[12px] text-gray-400">
                    {rooms.length} configured · seasons support multiple date ranges
                  </p>
                </div>
                <button type="button" id="add-room-inline-btn" onClick={addRoom}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[12px] font-bold transition-all"
                  style={{ background:"linear-gradient(135deg,#7c3aed,#8b5cf6)", boxShadow:"0 4px 12px #8b5cf640" }}>
                  <Plus className="w-4 h-4" />Add Room Type
                </button>
              </div>

              {rooms.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-violet-200 rounded-2xl text-center"
                  style={{ background:"linear-gradient(135deg,#faf5ff,#f5f3ff)" }}>
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
                    <BedDouble className="w-6 h-6 text-violet-400" />
                  </div>
                  <p className="text-[14px] font-bold text-gray-600">No room types yet</p>
                  <p className="text-[12px] text-gray-400 mt-1">Add room types with seasonal pricing and amenities.</p>
                </div>
              )}

              <div className="space-y-5">
                {rooms.map((room,i) => (
                  <RoomInlineForm key={i} room={room} index={i}
                    onChange={u => updateRoom(i,u)} onRemove={removeRoom} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0"
          style={{ background:"linear-gradient(180deg,#ffffff,#f8faff)" }}>
          <div className="text-[11px]">
            {!form.contactNo.trim() && (
              <span className="text-red-500 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3" />Contact no. required
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} id="cancel-hotel-modal"
              className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="button" id="save-hotel-btn" onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all disabled:opacity-50"
              style={{ background:"linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow:saving?"none":"0 4px 16px #6366f140" }}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Hotel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
