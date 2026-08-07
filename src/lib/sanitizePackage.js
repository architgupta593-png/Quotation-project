/**
 * Helper to sanitize Package form payload before passing to Mongoose.
 * Converts empty string ObjectIds ("", empty values) to `null` to avoid CastError
 * and ensures enum values match schema constraints.
 */
export function sanitizePackagePayload(body) {
  const sanitized = { ...body };

  // Sanitize title
  sanitized.title = (sanitized.title || "").trim();

  // Sanitize nights & days
  const nights = Math.max(1, parseInt(sanitized.nights, 10) || 1);
  sanitized.nights = nights;
  sanitized.days = Math.max(1, parseInt(sanitized.days, 10) || nights);

  // Sanitize coverImage
  if (!sanitized.coverImage || !sanitized.coverImage.url) {
    sanitized.coverImage = null;
  }

  // Sanitize destinations
  if (Array.isArray(sanitized.destinations)) {
    sanitized.destinations = sanitized.destinations
      .filter((d) => d && (d.cityId || d.cityName))
      .map((d) => ({
        ...d,
        cityId: d.cityId ? d.cityId : null,
        cityName: (d.cityName || "").trim(),
        state: (d.state || "").trim(),
        nights: Math.max(1, parseInt(d.nights, 10) || 1),
      }));
  } else {
    sanitized.destinations = [];
  }

  // Auto-generate destination summary string if empty
  if (!sanitized.destination && sanitized.destinations.length > 0) {
    sanitized.destination = sanitized.destinations
      .map((d) => `${d.cityName} (${d.nights}N)`)
      .join(" → ");
  }

  // Sanitize accommodation options
  if (Array.isArray(sanitized.accommodationOptions)) {
    sanitized.accommodationOptions = sanitized.accommodationOptions.map((opt) => ({
      label: (opt.label || "Option").trim(),
      totalPrice: Math.max(0, parseFloat(opt.totalPrice) || 0),
      nights: Array.isArray(opt.nights)
        ? opt.nights.map((n) => ({
            night: Math.max(1, parseInt(n.night, 10) || 1),
            cityId: n.cityId ? n.cityId : null,
            cityName: (n.cityName || "").trim(),
            hotelId: n.hotelId ? n.hotelId : null,
            hotelName: (n.hotelName || "").trim(),
            roomId: n.roomId ? n.roomId : null,
            roomType: (n.roomType || "").trim(),
            mealPlan: ["EP", "CP", "MAP", "AP"].includes(n.mealPlan) ? n.mealPlan : "",
            starRating: n.starRating ? Math.min(5, Math.max(1, parseInt(n.starRating, 10))) : null,
            pricePerNight: Math.max(0, parseFloat(n.pricePerNight) || 0),
            notes: (n.notes || "").trim(),
          }))
        : [],
    }));
  } else {
    sanitized.accommodationOptions = [];
  }

  // Sanitize vehicle
  const VALID_VEHICLES = ["Sedan", "SUV", "MUV", "Tempo Traveller", "Mini Bus", "Bus", "Other"];
  const vehicle = sanitized.vehicle || {};
  sanitized.vehicle = {
    vehicleType: VALID_VEHICLES.includes(vehicle.vehicleType) ? vehicle.vehicleType : "Sedan",
    model: (vehicle.model || "").trim(),
    seats: Math.max(1, parseInt(vehicle.seats, 10) || 4),
    acType: ["AC", "Non-AC"].includes(vehicle.acType) ? vehicle.acType : "AC",
    vehiclePrice: Math.max(0, parseFloat(vehicle.vehiclePrice) || 0),
    notes: (vehicle.notes || "").trim(),
  };

  // Sanitize pricing
  const pricing = sanitized.pricing || {};
  sanitized.pricing = {
    selectedOptionIndex: Math.max(0, parseInt(pricing.selectedOptionIndex, 10) || 0),
    accommodationTotal: Math.max(0, parseFloat(pricing.accommodationTotal) || 0),
    vehicleTotal: Math.max(0, parseFloat(pricing.vehicleTotal) || 0),
    subtotal: Math.max(0, parseFloat(pricing.subtotal) || 0),
    marginType: ["absolute", "percentage"].includes(pricing.marginType) ? pricing.marginType : "absolute",
    margin: Math.max(0, parseFloat(pricing.margin) || 0),
    includeGst: Boolean(pricing.includeGst),
    gstPercentage: Math.max(0, parseFloat(pricing.gstPercentage) || 5),
    rateBasis: ["per_couple", "per_person"].includes(pricing.rateBasis) ? pricing.rateBasis : "per_couple",
    finalPrice: Math.max(0, parseFloat(pricing.finalPrice) || 0),
    perPersonPrice: Math.max(0, parseFloat(pricing.perPersonPrice) || 0),
    perCouplePrice: Math.max(0, parseFloat(pricing.perCouplePrice) || 0),
    numberOfPersons: Math.max(1, parseInt(pricing.numberOfPersons, 10) || 2),
    maxPersonsPerRoom: Math.max(1, Math.min(6, parseInt(pricing.maxPersonsPerRoom, 10) || 2)),
    currency: (pricing.currency || "INR").trim(),
    includes: Array.isArray(pricing.includes) ? pricing.includes.filter(Boolean) : [],
    excludes: Array.isArray(pricing.excludes) ? pricing.excludes.filter(Boolean) : [],
  };

  // Sanitize instructions
  if (Array.isArray(sanitized.instructions)) {
    sanitized.instructions = sanitized.instructions.map((block) => ({
      heading: (block.heading || "").trim(),
      format: ["bullet", "numbered", "alphabetic", "paragraph"].includes(block.format) ? block.format : "bullet",
      items: Array.isArray(block.items) ? block.items.filter(Boolean) : [],
      content: (block.content || "").trim(),
    }));
  } else {
    sanitized.instructions = [];
  }

  // Sanitize itinerary
  if (Array.isArray(sanitized.itinerary)) {
    sanitized.itinerary = sanitized.itinerary.map((day, idx) => ({
      day: day.day || idx + 1,
      title: (day.title || "").trim() || `Day ${day.day || idx + 1} Schedule`,
      description: (day.description || "").trim(),
      activities: Array.isArray(day.activities) ? day.activities.map((a) => (a || "").trim()).filter(Boolean) : [],
      meals: {
        breakfast: Boolean(day.meals?.breakfast),
        lunch: Boolean(day.meals?.lunch),
        dinner: Boolean(day.meals?.dinner),
      },
      images: Array.isArray(day.images) ? day.images.filter((img) => img && img.url) : [],
    }));
  } else {
    sanitized.itinerary = [];
  }

  // Sanitize status
  sanitized.status = ["draft", "published"].includes(sanitized.status) ? sanitized.status : "draft";

  return sanitized;
}
