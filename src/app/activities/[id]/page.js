"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Clock, Calendar, Users, IndianRupee, Check, ShieldCheck,
  Loader2, AlertCircle, ArrowLeft, Zap, Sparkles, CheckCircle2, Ticket
} from "lucide-react";
import ActivityBadge from "@/components/activities/ActivityBadge";
import ActivityVoucherModal from "@/components/activities/ActivityVoucherModal";

export default function PublicActivityBookingPage() {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking Form State
  const [travelDate, setTravelDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Customer Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [booking, setBooking] = useState(false);
  const [bookedVoucher, setBookedVoucher] = useState(null);
  const [bookingError, setBookingError] = useState("");

  // Set initial date to tomorrow
  useEffect(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    setTravelDate(tmrw.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/store/activities/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setActivity(data.activity);
        if (data.activity?.availableSlots?.length > 0) {
          setSelectedSlot(data.activity.availableSlots[0].time);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const adultRate = activity?.pricingTiers?.adultPrice || activity?.price || 0;
  const childRate = activity?.pricingTiers?.childPrice || 0;

  const totalAdultPrice = adults * adultRate;
  const totalChildPrice = children * childRate;
  const grandTotal = totalAdultPrice + totalChildPrice;

  async function handleBookTicket(e) {
    e.preventDefault();
    setBookingError("");

    if (!customerName || !customerEmail || !customerPhone || !travelDate) {
      setBookingError("Please fill in all customer details and select a travel date.");
      return;
    }

    setBooking(true);
    try {
      const res = await fetch("/api/bookings/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity._id,
          customerName,
          customerEmail,
          customerPhone,
          travelDate,
          timeSlot: selectedSlot || "Full Day",
          adults,
          children,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setBookedVoucher(data.booking);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-bold">Activity Not Found</h1>
          <p className="text-slate-400 max-w-sm mx-auto">{error || "The requested activity is unavailable."}</p>
          <Link href="/dashboard/activities" className="inline-block px-6 py-2.5 bg-indigo-600 rounded-xl font-bold text-sm">
            Back to Activities
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = activity.images?.[0]?.url;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-24">
      {/* Navbar Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard/activities" className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
          <Ticket className="w-3.5 h-3.5" /> Direct Ticket Booking
        </span>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Activity Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Banner / Cover Photo */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-800 h-64 sm:h-80 border border-slate-700/80 shadow-xl">
              {coverImage ? (
                <img src={coverImage} alt={activity.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center">
                  <Zap className="w-16 h-16 text-indigo-400/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <ActivityBadge category={activity.category} size="md" />
                  {activity.duration && (
                    <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> {activity.duration}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {activity.name}
                </h1>
                {activity.city && (
                  <p className="text-sm text-indigo-300 font-semibold mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {activity.city.name}{activity.city.state ? `, ${activity.city.state}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> About this Experience
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {activity.description || "Experience the best of local sightseeing and culture with guided activities."}
              </p>
            </div>

            {/* Inclusions */}
            {activity.inclusions?.length > 0 && (
              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Ticket Inclusions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activity.inclusions.map((inc, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking & Checkout Panel (5 cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ticket Rate</span>
                  <div className="text-2xl font-black text-white flex items-center gap-1">
                    <IndianRupee className="w-5 h-5 text-emerald-400" />
                    {adultRate.toLocaleString("en-IN")}
                    <span className="text-xs text-slate-400 font-medium">/ adult</span>
                  </div>
                </div>
                {childRate > 0 && (
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Child Rate</span>
                    <p className="text-base font-bold text-emerald-400">
                      ₹{childRate.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleBookTicket} className="space-y-4">
                {bookingError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    {bookingError}
                  </div>
                )}

                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Select Travel Date *
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Slot Selector */}
                {activity.availableSlots?.length > 0 && (
                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> Preferred Slot *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {activity.availableSlots.map((slot, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            selectedSlot === slot.time
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                              : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pax Counter */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Adults</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={adults}
                      onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Children</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={children}
                      onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-bold text-center"
                    />
                  </div>
                </div>

                {/* Guest Contact Details */}
                <div className="pt-2 space-y-3 border-t border-slate-800">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Guest Information</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name *"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email Address *"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone Number *"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Total Price Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-emerald-100">
                    <span>Total Booking Cost</span>
                    <span>({adults} Adults{children > 0 ? `, ${children} Children` : ""})</span>
                  </div>
                  <div className="text-2xl font-black">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={booking}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-sm font-black shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
                >
                  {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ticket className="w-5 h-5" />}
                  {booking ? "Generating Ticket…" : "Book Activity Ticket Now"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Voucher Modal */}
      {bookedVoucher && (
        <ActivityVoucherModal
          booking={bookedVoucher}
          onClose={() => setBookedVoucher(null)}
        />
      )}
    </div>
  );
}
