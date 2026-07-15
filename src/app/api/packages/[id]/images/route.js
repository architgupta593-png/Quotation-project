import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

/**
 * POST /api/packages/[id]/images
 * Body: multipart/form-data with `file` (binary) and `dayIndex` (optional number, -1 = cover)
 *
 * dayIndex:
 *   -1  → replace package coverImage
 *   0+  → push to itinerary[dayIndex].images
 */
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const pkg = await Package.findById(id);
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const dayIndex = parseInt(formData.get("dayIndex") ?? "-1", 10);
    const caption = formData.get("caption") || "";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File → base64 data-URI for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${base64}`;

    const { url, publicId } = await uploadImage(dataUri, {
      folder: `packages/${id}`,
    });

    if (dayIndex === -1) {
      // Replace cover image — delete old one if present
      if (pkg.coverImage?.publicId) {
        await deleteImage(pkg.coverImage.publicId).catch(() => {});
      }
      pkg.coverImage = { url, publicId, caption };
    } else {
      const day = pkg.itinerary[dayIndex];
      if (!day) {
        return NextResponse.json(
          { error: `No itinerary day at index ${dayIndex}` },
          { status: 400 }
        );
      }
      day.images.push({ url, publicId, caption });
    }

    await pkg.save();

    return NextResponse.json({ url, publicId, caption }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/packages/[id]/images]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/packages/[id]/images
 * Body JSON: { publicId, dayIndex }
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const { publicId, dayIndex } = await request.json();

    const pkg = await Package.findById(id);
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    await deleteImage(publicId).catch(() => {});

    if (dayIndex === -1) {
      pkg.coverImage = null;
    } else {
      const day = pkg.itinerary[dayIndex];
      if (day) {
        day.images = day.images.filter((img) => img.publicId !== publicId);
      }
    }

    await pkg.save();
    return NextResponse.json({ message: "Image deleted" });
  } catch (err) {
    console.error("[DELETE /api/packages/[id]/images]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
