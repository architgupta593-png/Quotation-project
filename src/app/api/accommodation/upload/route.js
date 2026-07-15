import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

/**
 * POST /api/accommodation/upload
 * Body: multipart/form-data with `file` (binary)
 * Returns: { url, publicId }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // Convert File → base64 data-URI for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${base64}`;

    const { url, publicId } = await uploadImage(dataUri, {
      folder: "accommodation",
    });

    return NextResponse.json({ url, publicId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/accommodation/upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/accommodation/upload
 * Body JSON: { publicId }
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { publicId } = await request.json();
    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    await deleteImage(publicId).catch(() => {});
    return NextResponse.json({ message: "Image deleted" });
  } catch (err) {
    console.error("[DELETE /api/accommodation/upload]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
