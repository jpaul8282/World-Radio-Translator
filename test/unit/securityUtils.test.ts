import { test, describe } from "node:test";
import assert from "node:assert";
import {
  isRestrictedAddress,
  validateStreamUrl,
  sanitizeString,
  generateSecureId,
  computeSha256
} from "../../src/lib/securityUtils";

describe("OpenSSF Security Standards: SSRF Mitigation & Crypto", () => {
  test("isRestrictedAddress blocks loopback, private subnets, and cloud metadata", () => {
    // Loopback
    assert.strictEqual(isRestrictedAddress("localhost"), true);
    assert.strictEqual(isRestrictedAddress("127.0.0.1"), true);
    assert.strictEqual(isRestrictedAddress("0.0.0.0"), true);
    assert.strictEqual(isRestrictedAddress("::1"), true);

    // Private Subnets (RFC 1918)
    assert.strictEqual(isRestrictedAddress("10.0.0.1"), true);
    assert.strictEqual(isRestrictedAddress("10.255.255.254"), true);
    assert.strictEqual(isRestrictedAddress("172.16.0.1"), true);
    assert.strictEqual(isRestrictedAddress("172.31.255.255"), true);
    assert.strictEqual(isRestrictedAddress("192.168.1.1"), true);
    assert.strictEqual(isRestrictedAddress("192.168.100.254"), true);

    // AWS/GCP/Azure instance metadata
    assert.strictEqual(isRestrictedAddress("169.254.169.254"), true);

    // Public Internet hostnames must be allowed
    assert.strictEqual(isRestrictedAddress("icecast.radiofrance.fr"), false);
    assert.strictEqual(isRestrictedAddress("stream.zeno.fm"), false);
    assert.strictEqual(isRestrictedAddress("bbcmedia.ic.llnwd.net"), false);
    assert.strictEqual(isRestrictedAddress("8.8.8.8"), false);
  });

  test("validateStreamUrl permits legitimate audio streams and blocks unsafe targets", () => {
    const validHttp = validateStreamUrl("https://icecast.radiofrance.fr/fip-midfi.mp3");
    assert.strictEqual(validHttp.valid, true);

    const invalidScheme = validateStreamUrl("ftp://files.example.com/audio.mp3");
    assert.strictEqual(invalidScheme.valid, false);

    const ssrfAttempt = validateStreamUrl("http://127.0.0.1:8080/admin/delete");
    assert.strictEqual(ssrfAttempt.valid, false);

    const metadataAttempt = validateStreamUrl("http://169.254.169.254/computeMetadata/v1/");
    assert.strictEqual(metadataAttempt.valid, false);

    const malformed = validateStreamUrl("not a valid url at all");
    assert.strictEqual(malformed.valid, false);
  });

  test("sanitizeString neutralizes XSS vectors", () => {
    const malicious = '<script>alert("XSS")</script>';
    const sanitized = sanitizeString(malicious);
    assert.strictEqual(sanitized.includes("<script>"), false);
    assert.strictEqual(sanitized.includes("&lt;script&gt;"), true);

    const attrBreakout = '" onmouseover="alert(1)';
    const sanitizedAttr = sanitizeString(attrBreakout);
    assert.strictEqual(sanitizedAttr.includes('"'), false);
    assert.strictEqual(sanitizedAttr.includes("&quot;"), true);
  });

  test("generateSecureId uses cryptographic randomness and produces unique IDs", () => {
    const id1 = generateSecureId("test");
    const id2 = generateSecureId("test");
    assert.notStrictEqual(id1, id2);
    assert.strictEqual(id1.startsWith("test_"), true);
  });

  test("computeSha256 produces consistent standard cryptographic hashes", async () => {
    const message = "OpenSSF Best Practices Badge: Remix World Radio Translator";
    const hash = await computeSha256(message);
    assert.strictEqual(typeof hash, "string");
    assert.strictEqual(hash.length, 64); // 256 bits = 64 hex characters

    // Identical input must produce identical digest
    const hash2 = await computeSha256(message);
    assert.strictEqual(hash, hash2);
  });
});
