"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Search, Filter, Loader2, PackageOpen, AlertCircle } from "lucide-react";
import PackageCard from "@/components/packages/PackageCard";

export default function PackagesListPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "draft" | "published"

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("destination", search);

      const res = await fetch(`/api/packages?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPackages(data.packages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const debounce = setTimeout(fetchPackages, 300);
    return () => clearTimeout(debounce);
  }, [fetchPackages]);

  async function handleDelete(pkgId) {
    try {
      const res = await fetch(`/api/packages/${pkgId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setPackages((prev) => prev.filter((p) => p._id !== pkgId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Link href="/dashboard" className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors mb-1 block">
                ← Dashboard
              </Link>
              <h1 className="text-[24px] font-bold text-gray-900">Travel Packages</h1>
              <p className="text-[14px] text-gray-500 mt-1">
                {packages.length} package{packages.length !== 1 ? "s" : ""} total
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/dashboard/packages/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Package
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by destination…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {[
                { value: "", label: "All" },
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    statusFilter === opt.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && packages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">No packages yet</h3>
            <p className="text-[14px] text-gray-500 mb-6 max-w-xs">
              {isAdmin
                ? "Create your first travel package to get started."
                : "No packages have been published yet."}
            </p>
            {isAdmin && (
              <Link
                href="/dashboard/packages/new"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Package
              </Link>
            )}
          </div>
        )}

        {/* Package Grid */}
        {!loading && packages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg._id}
                pkg={pkg}
                isAdmin={isAdmin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
