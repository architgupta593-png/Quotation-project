import { v2 as cloudinary } from "cloudinary";

// Configure once — this module is only ever imported on the server.
// (Never import this file in a Client Component.)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file buffer or data-URI to Cloudinary.
 *
 * @param {string} source  - A file path, URL, data-URI, or base64 string.
 * @param {object} options - Any Cloudinary upload options (folder, public_id, …)
 * @returns {Promise<{ url: string; publicId: string }>}
 *
 * @example
 * const { url, publicId } = await uploadImage(base64String, { folder: "avatars" });
 */
export async function uploadImage(source, options = {}) {
  const result = await cloudinary.uploader.upload(source, {
    resource_type: "auto",
    ...options,
  });
  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Delete an asset from Cloudinary by its public ID.
 *
 * @param {string} publicId
 * @returns {Promise<object>} Cloudinary deletion result
 */
export async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
