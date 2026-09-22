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

  // Sanitize vehicle, multi-vehicle fleet & date periods
  const VALID_VEHICLES = ["Sedan", "SUV", "MUV", "Tempo Traveller", "Mini Bus", "Bus", "Other"];

  function sanitizeSingleVehicle(v = {}) {
    const p = Math.max(0, parseFloat(v.vehiclePrice ?? v.price ?? v.dailyRate) || 0);
    return {
      vehicleType: VALID_VEHICLES.includes(v.vehicleType) ? v.vehicleType : "Sedan",
      model: (v.model || "").trim(),
      seats: Math.max(1, parseInt(v.seats, 10) || 4),
      quantity: Math.max(1, parseInt(v.quantity, 10) || 1),
      acType: ["AC", "Non-AC"].includes(v.acType) ? v.acType : "AC",
      price: p,
      vehiclePrice: p,
      notes: (v.notes || "").trim(),
    };
  }

  function sanitizePeriod(period = {}) {
    const pVehicles = Array.isArray(period.vehicles) && period.vehicles.length > 0
      ? period.vehicles.map(sanitizeSingleVehicle)
      : [sanitizeSingleVehicle({})];
    return {
      name: (period.name || "Standard Season").trim(),
      startDate: (period.startDate || "").trim(),
      endDate: (period.endDate || "").trim(),
      vehicles: pVehicles,
    };
  }

  if (Array.isArray(sanitized.vehiclePeriods) && sanitized.vehiclePeriods.length > 0) {
    sanitized.vehiclePeriods = sanitized.vehiclePeriods.map(sanitizePeriod);
    sanitized.vehicles = sanitized.vehiclePeriods[0].vehicles;
    sanitized.vehicle = sanitized.vehicles[0];
  } else if (Array.isArray(sanitized.vehicles) && sanitized.vehicles.length > 0) {
    sanitized.vehicles = sanitized.vehicles.map(sanitizeSingleVehicle);
    sanitized.vehicle = sanitized.vehicles[0];
    sanitized.vehiclePeriods = [{
      name: "Standard Season",
      startDate: "",
      endDate: "",
      vehicles: sanitized.vehicles,
    }];
  } else if (sanitized.vehicle && (sanitized.vehicle.vehicleType || sanitized.vehicle.model)) {
    const single = sanitizeSingleVehicle(sanitized.vehicle);
    sanitized.vehicle = single;
    sanitized.vehicles = [single];
    sanitized.vehiclePeriods = [{
      name: "Standard Season",
      startDate: "",
      endDate: "",
      vehicles: [single],
    }];
  } else {
    const defaultVeh = sanitizeSingleVehicle({});
    sanitized.vehicle = defaultVeh;
    sanitized.vehicles = [defaultVeh];
    sanitized.vehiclePeriods = [{
      name: "Standard Season",
      startDate: "",
      endDate: "",
      vehicles: [defaultVeh],
    }];
  }

  // Sanitize accommodationOptions (Hotel Categories Wise)
  const VALID_CATEGORIES = ["None", "Budget", "Deluxe", "Deluxe Plus", "Premium", "Premium Plus", "Luxury", ""];
  if (Array.isArray(sanitized.accommodationOptions)) {
    sanitized.accommodationOptions = sanitized.accommodationOptions.map((opt, idx) => {
      const nights = Array.isArray(opt.nights)
        ? opt.nights.map((n) => ({
            night: parseInt(n.night, 10) || 1,
            cityId: n.cityId ? n.cityId : null,
            cityName: (n.cityName || "").trim(),
            hotelId: n.hotelId ? n.hotelId : null,
            hotelName: (n.hotelName || "").trim(),
            category: VALID_CATEGORIES.includes(n.category) ? n.category : "None",
            roomId: n.roomId ? n.roomId : null,
            roomType: (n.roomType || "").trim(),
            mealPlan: ["EP", "CP", "MAP", "AP"].includes(n.mealPlan) ? n.mealPlan : "CP",
            availableMealPlans: Array.isArray(n.availableMealPlans) ? n.availableMealPlans : [],
            mealPrices: typeof n.mealPrices === "object" && n.mealPrices !== null ? n.mealPrices : {},
            starRating: n.starRating ? Number(n.starRating) : null,
            pricePerNight: 0, // Not saved in database as per requirement (calculated live on client)
            notes: (n.notes || "").trim(),
          }))
        : [];
      return {
        label: (opt.label || `Option ${idx + 1}`).trim(),
        category: VALID_CATEGORIES.includes(opt.category) ? opt.category : "None",
        nights,
        totalPrice: 0, // Not saved in database
        marginType: ["absolute", "percentage"].includes(opt.marginType) ? opt.marginType : "absolute",
        margin: Math.max(0, parseFloat(opt.margin) || 0),
        gstPercentage: Math.max(0, parseFloat(opt.gstPercentage) || 5),
        calculatedPrice: Math.max(0, parseFloat(opt.calculatedPrice) || 0),
        perPersonPrice: Math.max(0, parseFloat(opt.perPersonPrice) || 0),
        perCouplePrice: Math.max(0, parseFloat(opt.perCouplePrice) || 0),
      };
    });
  } else {
    sanitized.accommodationOptions = [];
  }

  // Sanitize pricing
  const pricing = sanitized.pricing || {};
  sanitized.pricing = {
    selectedOptionIndex: Math.max(0, parseInt(pricing.selectedOptionIndex, 10) || 0),
    accommodationTotal: 0, // Not saved in database
    vehicleTotal: Math.max(0, parseFloat(pricing.vehicleTotal) || 0),
    activitiesTotal: Math.max(0, parseFloat(pricing.activitiesTotal) || 0),
    subtotal: Math.max(0, parseFloat(pricing.subtotal) || 0),
    marginType: ["absolute", "percentage"].includes(pricing.marginType) ? pricing.marginType : "absolute",
    margin: Math.max(0, parseFloat(pricing.margin) || 0),
    includeGst: Boolean(pricing.includeGst),
    gstPercentage: Math.max(0, parseFloat(pricing.gstPercentage) || 5),
    discountType: ["fixed", "percentage"].includes(pricing.discountType) ? pricing.discountType : "fixed",
    discountValue: Math.max(0, parseFloat(pricing.discountValue) || 0),
    discountAmount: Math.max(0, parseFloat(pricing.discountAmount) || 0),
    discountReason: (pricing.discountReason || "").trim(),
    couponCode: (pricing.couponCode || "").trim().toUpperCase(),
    hasTimerDiscount: Boolean(pricing.hasTimerDiscount),
    discountValidUntil: (pricing.discountValidUntil || "").trim(),
    rateBasis: ["per_couple", "per_person"].includes(pricing.rateBasis) ? pricing.rateBasis : "per_couple",
    finalPrice: Math.max(0, parseFloat(pricing.finalPrice) || 0),
    perPersonPrice: Math.max(0, parseFloat(pricing.perPersonPrice) || 0),
    perCouplePrice: Math.max(0, parseFloat(pricing.perCouplePrice) || 0),
    numberOfPersons: Math.max(1, parseInt(pricing.numberOfPersons, 10) || 2),
    numberOfRooms: Math.max(1, parseInt(pricing.numberOfRooms, 10) || Math.ceil((parseInt(pricing.numberOfPersons, 10) || 2) / 2)),
    maxPersonsPerRoom: Math.max(1, Math.min(6, parseInt(pricing.maxPersonsPerRoom, 10) || 2)),
    currency: (pricing.currency || "INR").trim(),
    includes: Array.isArray(pricing.includes) ? pricing.includes.filter(Boolean) : [],
    excludes: Array.isArray(pricing.excludes) ? pricing.excludes.filter(Boolean) : [],
  };

  // Sanitize instructions
  if (Array.isArray(sanitized.instructions)) {
    sanitized.instructions = sanitized.instructions.map((block) => {
      const headingText = typeof block.heading === "string" ? block.heading.trim() : typeof block.title === "string" ? block.title.trim() : String(block.heading || block.title || "").trim();
      return {
        heading: headingText,
        title: headingText,
        format: ["bullet", "numbered", "alphabetic", "paragraph"].includes(block.format) ? block.format : "bullet",
        items: Array.isArray(block.items)
          ? block.items.map((it) => (typeof it === "string" ? it.trim() : typeof it === "object" && it !== null ? (it.text || it.name || it.title || "").trim() : String(it || "").trim())).filter(Boolean)
          : [],
        content: typeof block.content === "string" ? block.content.trim() : String(block.content || "").trim(),
      };
    });
  } else {
    sanitized.instructions = [];
  }

  // Sanitize itinerary
  if (Array.isArray(sanitized.itinerary)) {
    sanitized.itinerary = sanitized.itinerary.map((day, idx) => ({
      day: day.day || idx + 1,
      title: (typeof day.title === "string" ? day.title.trim() : String(day.title || "").trim()) || `Day ${day.day || idx + 1} Schedule`,
      // description is stored as HTML from the rich-text editor — preserve as-is
      description: typeof day.description === "string" ? day.description.trim() : String(day.description || "").trim(),
      activities: Array.isArray(day.activities)
        ? day.activities
            .map((a) => {
              if (!a) return "";
              if (typeof a === "string") return a.trim();
              if (typeof a === "object") return (a.name || a.title || a.activityName || a.activity || a.text || "").trim();
              return String(a).trim();
            })
            .filter(Boolean)
        : [],
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
