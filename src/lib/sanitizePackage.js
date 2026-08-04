/**
 * Helper to sanitize Package form payload before passing to Mongoose.
 * Converts empty string ObjectIds ("", empty values) to `null` to avoid CastError.
 */
export function sanitizePackagePayload(body) {
  const sanitized = { ...body };

  // Sanitize destinations
  if (Array.isArray(sanitized.destinations)) {
    sanitized.destinations = sanitized.destinations
      .filter((d) => d.cityId || d.cityName)
      .map((d) => ({
        ...d,
        cityId: d.cityId ? d.cityId : null,
      }));
  }

  // Sanitize accommodation options
  if (Array.isArray(sanitized.accommodationOptions)) {
    sanitized.accommodationOptions = sanitized.accommodationOptions.map((opt) => ({
      ...opt,
      nights: Array.isArray(opt.nights)
        ? opt.nights.map((n) => ({
            ...n,
            cityId: n.cityId ? n.cityId : null,
            hotelId: n.hotelId ? n.hotelId : null,
            roomId: n.roomId ? n.roomId : null,
          }))
        : [],
    }));
  }

  // Sanitize legacy accommodations array if present
  if (Array.isArray(sanitized.accommodations)) {
    sanitized.accommodations = sanitized.accommodations.map((a) => ({
      ...a,
      cityId: a.cityId ? a.cityId : null,
      hotelId: a.hotelId ? a.hotelId : null,
      roomId: a.roomId ? a.roomId : null,
    }));
  }

  return sanitized;
}
