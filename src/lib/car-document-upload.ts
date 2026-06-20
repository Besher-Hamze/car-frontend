const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp|pdf)$/i;

export type CarDocumentUploadErrorKey = 'docTooLarge' | 'unsupportedDocFormat';

export type CarDocumentUploadTranslate = (
  key: CarDocumentUploadErrorKey,
  values?: { name: string },
) => string;

export function validateCarDocumentFile(
  file: File,
  translate?: CarDocumentUploadTranslate,
): string | null {
  if (file.size > MAX_BYTES) {
    return translate
      ? translate('docTooLarge', { name: file.name })
      : 'docTooLarge';
  }
  const mime = (file.type || '').toLowerCase();
  const mimeOk =
    !mime ||
    /^image\/(jpeg|jpg|png|gif|webp|pjpeg|x-png)$/i.test(mime) ||
    mime === 'application/pdf' ||
    mime === 'application/octet-stream';
  const extOk = ALLOWED_EXT.test(file.name);
  if (!mimeOk && !extOk) {
    return translate
      ? translate('unsupportedDocFormat', { name: file.name })
      : 'unsupportedDocFormat';
  }
  return null;
}
