export const MAX_TEMP_FILE_BYTES = 3 * 1024 * 1024;
export const TEMP_FILE_TTL_MS = 5 * 60 * 1000;
export const TEMP_UPLOAD_WINDOW_MS = 60 * 1000;

export const BLOCKED_TEMP_EXTENSIONS = [
  'html',
  'htm',
  'xhtml',
  'svg',
  'js',
  'mjs',
  'mhtml',
  'hta',
];

export const BLOCKED_TEMP_MIMES = [
  'text/html',
  'image/svg+xml',
  'application/javascript',
  'text/javascript',
  'application/xhtml+xml',
  'application/x-mshta',
];

export function tempFileExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function isBlockedTempFile(name: string, mime: string): boolean {
  return (
    BLOCKED_TEMP_EXTENSIONS.includes(tempFileExt(name)) ||
    BLOCKED_TEMP_MIMES.includes(mime.toLowerCase())
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
