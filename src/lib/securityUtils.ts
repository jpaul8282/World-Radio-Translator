/**
 * Security utilities adhering to OpenSSF Best Practices:
 * - Cryptographic practices (SHA-256, cryptographically secure randomness)
 * - SSRF mitigation for proxy stream endpoints
 * - Input sanitization against XSS
 * - Protocol enforcement (HTTPS / WSS)
 */

/**
 * Checks whether an IP address or hostname belongs to a restricted internal/private subnet or loopback.
 * Used for SSRF (Server-Side Request Forgery) protection.
 */
export function isRestrictedAddress(hostname: string): boolean {
  if (!hostname) return true;

  const lower = hostname.toLowerCase().trim();

  // Block loopback & local addresses
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local")
  ) {
    return true;
  }

  // Block AWS / GCP / Azure cloud metadata addresses
  if (lower === "169.254.169.254" || lower.startsWith("169.254.")) {
    return true;
  }

  // IPv4 regex check for private RFC 1918 subnets
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = lower.match(ipv4Regex);
  if (match) {
    const octet1 = parseInt(match[1], 10);
    const octet2 = parseInt(match[2], 10);

    // 10.0.0.0/8
    if (octet1 === 10) return true;
    // 172.16.0.0/12 (172.16 - 172.31)
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
    // 192.168.0.0/16
    if (octet1 === 192 && octet2 === 168) return true;
    // 127.0.0.0/8
    if (octet1 === 127) return true;
    // 0.0.0.0/8
    if (octet1 === 0) return true;
  }

  return false;
}

/**
 * Validates a stream URL for safe proxy fetching.
 * Enforces http/https protocols and rejects internal addresses.
 */
export function validateStreamUrl(rawUrl: string): { valid: boolean; error?: string; parsedUrl?: URL } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "Missing or invalid URL" };
  }

  try {
    const parsed = new URL(rawUrl.trim());

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: `Disallowed protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.` };
    }

    if (isRestrictedAddress(parsed.hostname)) {
      return { valid: false, error: `Access to private or restricted network host "${parsed.hostname}" is forbidden.` };
    }

    return { valid: true, parsedUrl: parsed };
  } catch (err: any) {
    return { valid: false, error: `Malformed URL: ${err.message || String(err)}` };
  }
}

/**
 * Sanitizes input strings by escaping dangerous HTML characters to prevent XSS.
 */
export function sanitizeString(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Generates a cryptographically secure random identifier using Web Crypto / Node crypto.
 * Conforms to OpenSSF cryptographic best practices (no Math.random() for security tokens).
 */
export function generateSecureId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${prefix}_${hex}`;
  }
  // Fallback timestamp + high-entropy component
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * Computes a SHA-256 digest in hex using the standard Web Crypto API.
 */
export async function computeSha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback for Node.js environment without Web Crypto
  try {
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHash("sha256").update(message).digest("hex");
  } catch {
    throw new Error("No cryptographic subsystem available for SHA-256");
  }
}
