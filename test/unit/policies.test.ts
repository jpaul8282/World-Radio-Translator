import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("OpenSSF & Compliance Standards: GitIgnore & Policies", () => {
  const rootDir = process.cwd();

  test(".gitignore exists and contains essential production patterns", () => {
    const gitignorePath = path.join(rootDir, ".gitignore");
    assert.strictEqual(fs.existsSync(gitignorePath), true, ".gitignore must exist in root");
    const content = fs.readFileSync(gitignorePath, "utf-8");

    // Dependency patterns
    assert.ok(content.includes("node_modules/"), ".gitignore must ignore node_modules/");
    
    // Build artifacts
    assert.ok(content.includes("dist/"), ".gitignore must ignore dist/");
    assert.ok(content.includes("build/"), ".gitignore must ignore build/");

    // Coverage & test logs
    assert.ok(content.includes("coverage/"), ".gitignore must ignore coverage/");
    assert.ok(content.includes("*.log"), ".gitignore must ignore log files");

    // Secrets & Environment files
    assert.ok(content.includes(".env"), ".gitignore must ignore .env files");
    assert.ok(content.includes("!.env.example"), ".gitignore must preserve .env.example");

    // OS files
    assert.ok(content.includes(".DS_Store"), ".gitignore must ignore macOS .DS_Store");
    assert.ok(content.includes("Thumbs.db"), ".gitignore must ignore Windows Thumbs.db");
  });

  test("docs/SERVICE_POLICY.md exists and specifies terms and acceptable conduct", () => {
    const servicePolicyPath = path.join(rootDir, "docs", "SERVICE_POLICY.md");
    assert.strictEqual(fs.existsSync(servicePolicyPath), true, "docs/SERVICE_POLICY.md must exist");
    const content = fs.readFileSync(servicePolicyPath, "utf-8");

    assert.ok(content.includes("Service Policy & Terms of Use"), "Must contain title");
    assert.ok(content.includes("Permitted Use & Scope"), "Must define permitted use");
    assert.ok(content.includes("Acceptable Use & Prohibited Conduct"), "Must outline prohibited conduct");
    assert.ok(content.includes("Disclaimer of Warranties"), "Must include warranty disclaimer");
    assert.ok(content.includes("policy@worldradiotranslator.org"), "Must include contact email");
  });

  test("docs/DATA_POLICY.md exists and defines ephemeral buffering & data lifecycles", () => {
    const dataPolicyPath = path.join(rootDir, "docs", "DATA_POLICY.md");
    assert.strictEqual(fs.existsSync(dataPolicyPath), true, "docs/DATA_POLICY.md must exist");
    const content = fs.readFileSync(dataPolicyPath, "utf-8");

    assert.ok(content.includes("Data Policy & Data Retention Specification"), "Must contain title");
    assert.ok(content.includes("Live Audio Buffers"), "Must specify audio buffer lifecycle");
    assert.ok(content.includes("Volatile RAM only"), "Must specify volatile memory processing");
    assert.ok(content.includes("Ephemeral In-Memory Audio Processing"), "Must document ephemeral processing");
    assert.ok(content.includes("Right to Erasure"), "Must provide data deletion / erasure procedures");
  });

  test("docs/PRIVACY_POLICY.md exists and enforces zero tracking and GDPR/CCPA rights", () => {
    const privacyPolicyPath = path.join(rootDir, "docs", "PRIVACY_POLICY.md");
    assert.strictEqual(fs.existsSync(privacyPolicyPath), true, "docs/PRIVACY_POLICY.md must exist");
    const content = fs.readFileSync(privacyPolicyPath, "utf-8");

    assert.ok(content.includes("Privacy Policy"), "Must contain title");
    assert.ok(content.includes("No Tracking Cookies"), "Must declare zero tracking cookies");
    assert.ok(content.includes("Google Gemini API"), "Must disclose AI processor data flow");
    assert.ok(content.includes("User Rights (GDPR & CCPA Compliance)"), "Must document GDPR and CCPA rights");
    assert.ok(content.includes("privacy@worldradiotranslator.org"), "Must include privacy contact email");
  });

  test("docs/RADIO_STREAMING_POLICY.md exists and defines DMCA safe harbor and takedown SLA", () => {
    const radioPolicyPath = path.join(rootDir, "docs", "RADIO_STREAMING_POLICY.md");
    assert.strictEqual(fs.existsSync(radioPolicyPath), true, "docs/RADIO_STREAMING_POLICY.md must exist");
    const content = fs.readFileSync(radioPolicyPath, "utf-8");

    assert.ok(content.includes("Radio Streaming, Copyright & Broadcaster Policy"), "Must contain title");
    assert.ok(content.includes("Audio Proxy Architecture & Bandwidth Ethics"), "Must document proxy ethics");
    assert.ok(content.includes("Fast-Track Takedown SLA (< 24 Hours)"), "Must provide 24-hour takedown SLA");
    assert.ok(content.includes("Digital Millennium Copyright Act (DMCA)"), "Must include DMCA safe harbor clause");
    assert.ok(content.includes("dmca@worldradiotranslator.org"), "Must specify designated DMCA agent");
  });
});
