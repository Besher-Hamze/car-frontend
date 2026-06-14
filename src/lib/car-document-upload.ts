const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp|pdf)$/i;

export function validateCarDocumentFile(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return `«${file.name}» أكبر من 10 ميجابايت`;
  }
  const mime = (file.type || '').toLowerCase();
  const mimeOk =
    !mime ||
    /^image\/(jpeg|jpg|png|gif|webp|pjpeg|x-png)$/i.test(mime) ||
    mime === 'application/pdf' ||
    mime === 'application/octet-stream';
  const extOk = ALLOWED_EXT.test(file.name);
  if (!mimeOk && !extOk) {
    return `صيغة غير مدعومة: ${file.name} — JPG أو PNG أو PDF`;
  }
  return null;
}
