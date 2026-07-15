"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

/**
 * SearchBar — debounced search input with clear button.
 *
 * Props:
 *   placeholder {string}   - Input placeholder text
 *   value       {string}   - Controlled value
 *   onChange    {fn}       - Called with the new value (debounced if delay > 0)
 *   delay       {number}   - Debounce delay in ms (default 300)
 *   id          {string}   - Unique id for the input
 */
export default function SearchBar({
  placeholder = "Search…",
  value,
  onChange,
  delay = 300,
  id = "search-bar",
}) {
  const [local, setLocal] = useState(value ?? "");
  const timer = useRef(null);

  // Sync controlled value
  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  function handleChange(e) {
    const v = e.target.value;
    setLocal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), delay);
  }

  function handleClear() {
    setLocal("");
    onChange("");
  }

  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        id={id}
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all shadow-sm"
      />
      {local && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
