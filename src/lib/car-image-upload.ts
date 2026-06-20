const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp)$/i;

export type CarImageUploadErrorKey = 'fileTooLarge' | 'unsupportedFormat';

export type CarImageUploadTranslate = (
  key: CarImageUploadErrorKey,
  values?: { name: string },
) => string;

export function validateCarImageFile(
  file: File,
  translate?: CarImageUploadTranslate,
): string | null {
  if (file.size > MAX_BYTES) {
    return translate
      ? translate('fileTooLarge', { name: file.name })
      : 'fileTooLarge';
  }
  const mime = (file.type || '').toLowerCase();
  const mimeOk =
    !mime ||
    /^image\/(jpeg|jpg|png|gif|webp|pjpeg|x-png)$/i.test(mime) ||
    mime === 'application/octet-stream';
  const extOk = ALLOWED_EXT.test(file.name);
  if (!mimeOk && !extOk) {
    return translate
      ? translate('unsupportedFormat', { name: file.name })
      : 'unsupportedFormat';
  }
  return null;
}
