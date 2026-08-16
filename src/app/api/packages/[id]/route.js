import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import { sanitizePackagePayload } from "@/lib/sanitizePackage";
import { deleteImage } from "@/lib/cloudinary";

// ── GET /api/packages/[id] ────────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const pkg = await Package.findById(id).lean();
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ package: pkg });
  } catch (err) {
    console.error("[GET /api/packages/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── PUT /api/packages/[id] ────────────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["superuser", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const sanitizedBody = sanitizePackagePayload(body);

    // Prevent overwriting the creator
    delete sanitizedBody.createdBy;

    const pkg = await Package.findByIdAndUpdate(
      id,
      { $set: sanitizedBody },
      { new: true, runValidators: true }
    ).lean();

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ package: pkg });
  } catch (err) {
    console.error("[PUT /api/packages/[id]]", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 422 });
    }
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// ── DELETE /api/packages/[id] ─────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["superuser", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    // Fetch first so we can collect Cloudinary publicIds before deleting
    const pkg = await Package.findById(id).lean();
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Collect every Cloudinary publicId stored on this package
    const publicIds = [];
    if (pkg.coverImage?.publicId) publicIds.push(pkg.coverImage.publicId);
    for (const day of pkg.itinerary || []) {
      for (const img of day.images || []) {
        if (img.publicId) publicIds.push(img.publicId);
      }
    }

    // Delete images from Cloudinary (best-effort — won't block DB delete if Cloudinary fails)
    if (publicIds.length > 0) {
      await Promise.allSettled(publicIds.map((pid) => deleteImage(pid)));
    }

    // Delete the package document
    await Package.findByIdAndDelete(id);

    return NextResponse.json({ message: "Package deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/packages/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
