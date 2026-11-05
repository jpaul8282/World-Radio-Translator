import test from "node:test";
import assert from "node:assert/strict";
import {
  createRfc2822Base64Url,
  formatBroadcastDigestHtml,
} from "../../src/services/gmailService.js";

test("Gmail Service: Message Encoding & Formatting", async (t) => {
  await t.test("createRfc2822Base64Url produces valid base64url string without +, /, or =", () => {
    const rawBase64Url = createRfc2822Base64Url({
      to: "listener@worldradio.fm",
      subject: "BBC Radio 4 Live Translation Digest",
      bodyHtml: "<p>Hello World Radio</p>",
    });

    assert.equal(typeof rawBase64Url, "string");
    assert.ok(rawBase64Url.length > 10);
    assert.ok(!rawBase64Url.includes("+"));
    assert.ok(!rawBase64Url.includes("/"));
    assert.ok(!rawBase64Url.includes("="));
  });

  await t.test("createRfc2822Base64Url correctly handles UTF-8 Unicode characters in subject and body", () => {
    const rawBase64Url = createRfc2822Base64Url({
      to: "tester@example.com",
      subject: "Transmisión en vivo: 世界ラジオ 📻",
      bodyHtml: "<div>El resumen de la emisión en español con caracteres acentuados (á, é, í, ó, ú, ñ).</div>",
      from: "me@gmail.com",
    });

    assert.equal(typeof rawBase64Url, "string");
    // Decoding base64url back to verify valid structure
    const base64 = rawBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    assert.ok(decoded.includes("To: tester@example.com"));
    assert.ok(decoded.includes("From: me@gmail.com"));
    assert.ok(decoded.includes("Content-Type: text/html; charset=utf-8"));
    assert.ok(decoded.includes("El resumen de la emisión"));
  });

  await t.test("formatBroadcastDigestHtml formats broadcast digest with station info and translated turns", () => {
    const html = formatBroadcastDigestHtml({
      stationName: "Cadena SER Madrid",
      stationCountry: "Spain",
      stationLanguage: "Spanish",
      streamUrl: "https://cadenaser.example.com/live",
      targetLanguage: "English",
      turns: [
        {
          timestamp: "12:00:05",
          originalText: "Buenas tardes, comenzamos el boletín informativo.",
          translatedText: "Good afternoon, we begin the news bulletin.",
        },
        {
          timestamp: "12:00:15",
          originalText: "Las temperaturas se mantienen moderadas.",
          translatedText: "Temperatures remain moderate.",
        },
      ],
      summary: "Cadena SER opened with the afternoon news bulletin reporting moderate regional temperatures.",
    });

    assert.ok(html.includes("Cadena SER Madrid"));
    assert.ok(html.includes("Spain"));
    assert.ok(html.includes("English"));
    assert.ok(html.includes("Buenas tardes, comenzamos el boletín informativo."));
    assert.ok(html.includes("Good afternoon, we begin the news bulletin."));
    assert.ok(html.includes("Broadcast Summary"));
    assert.ok(html.includes("Cadena SER opened with the afternoon news bulletin"));
    assert.ok(html.includes("https://cadenaser.example.com/live"));
  });

  await t.test("formatBroadcastDigestHtml handles empty turns and null summary gracefully", () => {
    const html = formatBroadcastDigestHtml({
      stationName: "Tokyo FM",
      targetLanguage: "French",
      turns: [],
      summary: null,
    });

    assert.ok(html.includes("Tokyo FM"));
    assert.ok(html.includes("French"));
    assert.ok(html.includes("No transcript turns recorded in this session."));
    assert.ok(!html.includes("Broadcast Summary"));
  });
});
