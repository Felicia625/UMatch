import { AppError } from './auth';

/**
 * Profile photo upload to Cloudinary using an unsigned upload preset, the same way ProfileEditActivity did.
 * The image is sent as a base64 data URI in a plain text form field. That works with every fetch implementation,
 * unlike React Native's {uri, name, type} file objects, which break on some Expo / React Native versions.
 * Returns the https URL that gets stored in users/{uid}.photoUrl.
 */
export async function uploadProfilePhoto(base64: string): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    throw new AppError(
      'upload-not-configured',
      'Cloudinary is not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env, then restart with: npx expo start -c',
    );
  }

  const form = new FormData();
  form.append('file', `data:image/jpeg;base64,${base64}`);
  form.append('upload_preset', preset);
  form.append('folder', 'dating_app');

  const settings = `cloud "${cloudName}", preset "${preset}"`;
  let res: Response;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
  } catch (e) {
    console.warn('Cloudinary request failed', e);
    throw new AppError('upload-network', `Could not reach Cloudinary (${(e as Error).message}). Using ${settings}.`);
  }

  const json = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !json.secure_url) {
    console.warn('Cloudinary rejected the upload', res.status, json);
    throw new AppError('upload-failed', `Cloudinary said: ${json.error?.message ?? `HTTP ${res.status}`}. Using ${settings}.`);
  }
  return json.secure_url;
}
