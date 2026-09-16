"use client";

import { useState, useEffect } from "react";
import {
  X, Search, Loader2, Package as PackageIcon, MapPin,
  Moon, Sun, Check, Sparkles, ArrowRight, Hotel, Car,
  IndianRupee, Zap, Compass, Star,
} from "lucide-react";

export default function QuickPackageFetchModal({
  isOpen,
  onClose,
  onSelectPackage,
}) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [fetchingId, setFetchingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/packages?status=published")
      .then((r) => r.json())
      .then((data) => {
        setPackages(data.packages || []);
      })
      .catch((err) => console.error("Failed to load packages", err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = packages.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.destination?.toLowerCase().includes(q) ||
      p.destinations?.some((d) => d.cityName?.toLowerCase().includes(q));

    const matchesTheme = selectedTheme === "all" || p.theme === selectedTheme;
    return matchesSearch && matchesTheme;
  });

  async function handleSelect(pkg) {
    setFetchingId(pkg._id);
    try {
      const res = await fetch(`/api/packages/${pkg._id}`);
      const data = await res.json();
      if (data.package) {
        onSelectPackage(data.package);
      } else {
        onSelectPackage(pkg);
      }
      onClose();
    } catch (err) {
      console.error("Error fetching full package", err);
      onSelectPackage(pkg);
      onClose();
    } finally {
      setFetchingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[88vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <PackageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Auto-Fill Studio
                </span>
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  1-Click Fetch
                </span>
              </div>
              <h3 className="text-[18px] font-black text-white leading-tight mt-0.5">
                Fetch Package Data into Quick Quotation
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 px-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by package name, destination..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white font-medium text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["all", "honeymoon", "mountain", "beach", "heritage", "safari", "adventure"].map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => setSelectedTheme(th)}
                className={`px-3 py-1 rounded-xl text-[11.5px] font-bold capitalize whitespace-nowrap transition-all border ${
                  selectedTheme === th
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                }`}
              >
                {th}
              </button>
            ))}
          </div>
        </div>

        {/* Package Grid / List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-[13px] font-bold">Loading travel packages catalogue...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <PackageIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-[14px] font-black text-slate-600">No matching travel packages found</p>
              <p className="text-[12px] text-slate-400">Try changing your search term or filter category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((pkg) => {
                const isFetching = fetchingId === pkg._id;
                const destNights = Array.isArray(pkg.destinations) && pkg.destinations.length > 0
                  ? pkg.destinations.reduce((s, d) => s + (parseInt(d?.nights, 10) || 1), 0)
                  : 0;
                const nights = Number(pkg.nights) || destNights || Number(pkg.duration?.nights) || (Array.isArray(pkg.itinerary) && pkg.itinerary.length > 1 ? pkg.itinerary.length - 1 : 1);
                const days = Number(pkg.days) || Number(pkg.duration?.days) || (nights + 1);
                const dest = pkg.destination || pkg.destinations?.map((d) => d.cityName).filter(Boolean).join(", ") || "Custom";
                const price = pkg.pricing?.finalPrice || pkg.pricing?.totalSellingPrice || pkg.pricing?.grandTotal || pkg.price || 0;

                // Accommodations count
                const staysCount = (pkg.accommodation && pkg.accommodation[0]?.nights?.length) ||
                  (pkg.accommodationOptions && pkg.accommodationOptions[0]?.nights?.length) ||
                  pkg.destinations?.length ||
                  nights;

                return (
                  <div
                    key={pkg._id}
                    onClick={() => handleSelect(pkg)}
                    className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-white hover:from-white hover:to-amber-50/30 border-2 border-slate-200/90 hover:border-amber-400 transition-all cursor-pointer shadow-xs hover:shadow-md space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 font-mono font-black text-[11px] flex items-center gap-1 shadow-xs">
                          <Moon className="w-3 h-3" /> {nights}N / {days}D
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10.5px] font-black capitalize">
                          {pkg.theme || "General"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-[15px] font-black text-slate-900 group-hover:text-amber-700 transition-colors leading-snug line-clamp-1">
                          {pkg.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-semibold mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span className="truncate">{dest}</span>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1">
                          <Hotel className="w-3.5 h-3.5 text-slate-400" />
                          <span>{staysCount} Stays Included</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pkg.vehicle?.vehicleType || "Private Sedan"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Action Button */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-[9.5px] font-black uppercase tracking-widest text-slate-400">Package Value</p>
                        <p className="text-[16px] font-black text-slate-900 font-mono">
                          {price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Custom Pricing"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isFetching}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-500 text-white font-black text-[12px] shadow-sm transition-all group-hover:scale-105"
                      >
                        {isFetching ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
                        )}
                        <span>Fetch Data</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-[12px] text-slate-500 flex-shrink-0">
          <span>Clicking a package instantly fills Title, Destination, Duration, Hotels, Transport, Inclusions &amp; Price.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
