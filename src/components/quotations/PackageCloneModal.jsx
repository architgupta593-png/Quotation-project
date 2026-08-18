"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2, Package, MapPin, Moon, Sun, Check, Sparkles, ArrowRight } from "lucide-react";

export default function PackageCloneModal({ isOpen, onClose, onSelectPackage }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cloningId, setCloningId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/packages?status=published")
      .then((r) => r.json())
      .then((data) => setPackages(data.packages || []))
      .catch((err) => console.error("Failed to load packages", err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = packages.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.destination?.toLowerCase().includes(q) ||
      p.destinations?.some((d) => d.cityName?.toLowerCase().includes(q))
    );
  });

  async function handleSelect(pkg) {
    setCloningId(pkg._id);
    try {
      const res = await fetch(`/api/packages/${pkg._id}`);
      const data = await res.json();
      if (data.package) {
        onSelectPackage(data.package);
      } else {
        onSelectPackage(pkg);
      }
    } catch (err) {
      console.error("Error fetching full package for clone", err);
      onSelectPackage(pkg);
    } finally {
      setCloningId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">1-Click Clone</p>
              <h3 className="text-[18px] font-black text-white leading-tight">Select Template Package</h3>
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

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by package name or destination (e.g. Kerala, Manali, Goa)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Package Grid */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-[13px] font-bold text-slate-500">Loading package library…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-[14px] font-black text-slate-700">No packages found</p>
              <p className="text-[12px] text-slate-400">Try adjusting your search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((pkg) => (
                <div
                  key={pkg._id}
                  onClick={() => handleSelect(pkg)}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {pkg.coverImage?.url ? (
                      <img
                        src={pkg.coverImage.url}
                        alt={pkg.title}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[12px] font-black flex-shrink-0">
                        {pkg.nights}N/{pkg.days}D
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <h4 className="text-[14.5px] font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {pkg.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap text-[11.5px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Moon className="w-3 h-3 text-indigo-500" /> {pkg.nights}N / <Sun className="w-3 h-3 text-amber-500" /> {pkg.days}D
                        </span>
                        {pkg.destination && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-700">
                              <MapPin className="w-3 h-3 text-rose-500" /> {pkg.destination}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={cloningId === pkg._id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-extrabold text-[12.5px] transition-all flex-shrink-0 ml-3"
                  >
                    {cloningId === pkg._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Clone Quote</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
