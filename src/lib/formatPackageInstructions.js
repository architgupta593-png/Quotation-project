/**
 * Helper to convert Package instructions / policies (structured block schema or strings)
 * into Quick Quotation formatted HTML strings (compatible with specialInstructions & InstructionsEditorModal).
 */

export function convertPackageInstructionsToSpecialInstructions(pkg) {
  if (!pkg) return null;

  // 1. Check structured pkg.instructions
  if (Array.isArray(pkg.instructions) && pkg.instructions.length > 0) {
    const formatted = pkg.instructions
      .map((block) => {
        if (!block) return null;

        // If string
        if (typeof block === "string") {
          const trimmed = block.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith("<p") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol") || trimmed.startsWith("<div")) {
            return trimmed;
          }
          return `<p>${trimmed}</p>`;
        }

        // If object (InstructionBlockSchema)
        if (typeof block === "object") {
          const heading = (block.heading || block.title || "").trim();
          const format = block.format || "bullet";
          const items = Array.isArray(block.items)
            ? block.items.map((it) => (typeof it === "string" ? it.trim() : "")).filter(Boolean)
            : [];
          const content = (block.content || "").trim();

          const headerHtml = heading ? `<p><strong>${heading}:</strong></p>` : "";

          if (format === "paragraph") {
            if (!content && !heading) return null;
            return `${headerHtml}<p>${content || ""}</p>`;
          }

          if (items.length === 0) {
            if (content) {
              return `${headerHtml}<p>${content}</p>`;
            }
            if (heading) {
              return `<p><strong>${heading}</strong></p>`;
            }
            return null;
          }

          if (format === "numbered") {
            return `${headerHtml}<ol>${items.map((it) => `<li>${it}</li>`).join("")}</ol>`;
          }

          if (format === "alphabetic") {
            return `${headerHtml}<ol type="a">${items.map((it) => `<li>${it}</li>`).join("")}</ol>`;
          }

          // Default: bullet list
          return `${headerHtml}<ul>${items.map((it) => `<li>${it}</li>`).join("")}</ul>`;
        }

        return null;
      })
      .filter(Boolean);

    if (formatted.length > 0) {
      return formatted;
    }
  }

  // 2. Check pkg.specialInstructions
  if (Array.isArray(pkg.specialInstructions) && pkg.specialInstructions.length > 0) {
    const valid = pkg.specialInstructions
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);
    if (valid.length > 0) return valid;
  }

  // 3. Check pkg.policies
  if (Array.isArray(pkg.policies) && pkg.policies.length > 0) {
    const valid = pkg.policies
      .map((p) => {
        if (typeof p === "string") return p.trim();
        if (p && typeof p === "object") {
          return p.content || p.title || "";
        }
        return "";
      })
      .filter(Boolean);
    if (valid.length > 0) return valid;
  }

  return null;
}
