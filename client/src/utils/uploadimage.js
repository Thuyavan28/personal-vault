import { API_PATHS } from './apiPath.js';

/**
 * Upload an encrypted file or image to the vault using standard FormData
 * @param {File} file - File object from input
 * @param {Object} metadata - { title, description, tags, type }
 * @param {string} token - JWT bearer token
 * @returns {Promise<Object>} API response object
 */
export async function uploadVaultFile(file, metadata, token) {
  if (!file) throw new Error('No file provided for upload.');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', metadata.title || file.name);
  formData.append('description', metadata.description || '');
  formData.append('tags', metadata.tags || '');
  formData.append('type', metadata.type || 'document');

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(API_PATHS.VAULT.UPLOAD_ITEM, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload item to secure vault.');
  }

  return data;
}

/**
 * Upload or convert user avatar to Base64 data URL
 * @param {File} imageFile
 * @param {number} maxSizeMB
 * @returns {Promise<string>} Base64 data URL
 */
export function convertImageToBase64(imageFile, maxSizeMB = 3) {
  return new Promise((resolve, reject) => {
    if (!imageFile) return reject(new Error('No image file selected.'));
    if (imageFile.size > maxSizeMB * 1024 * 1024) {
      return reject(new Error(`Image must be smaller than ${maxSizeMB}MB.`));
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(imageFile);
  });
}
