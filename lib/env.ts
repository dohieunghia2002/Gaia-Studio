import 'server-only';

// Đọc biến môi trường phía server. Supabase mới đặt tên khoá là
// "publishable"/"secret", bản cũ là "anon"/"service_role": chấp nhận cả hai.

export function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || undefined;
}

export function supabasePublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    undefined
  );
}

export function supabaseSecretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabasePublicKey() && supabaseSecretKey());
}

export function isPayosConfigured(): boolean {
  return Boolean(
    process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY,
  );
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

/** Biến môi trường dạng số (không đặt hoặc không hợp lệ thì dùng `fallback`). */
export function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw === undefined || raw === '' ? NaN : Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

/** Địa chỉ công khai của site, dùng cho returnUrl/cancelUrl của PayOS. */
export function siteUrl(fallbackOrigin?: string): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin || 'http://localhost:3000').replace(/\/$/, '');
}
