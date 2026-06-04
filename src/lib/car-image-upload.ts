const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp)$/i;

export function validateCarImageFile(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return `«${file.name}» أكبر من 5 ميجابايت`;
  }
  const mime = (file.type || '').toLowerCase();
  const mimeOk =
    !mime ||
    /^image\/(jpeg|jpg|png|gif|webp|pjpeg|x-png)$/i.test(mime) ||
    mime === 'application/octet-stream';
  const extOk = ALLOWED_EXT.test(file.name);
  if (!mimeOk && !extOk) {
    return `صيغة غير مدعومة: ${file.name} — استخدم JPG أو PNG أو WebP أو GIF`;
  }
  return null;
}
