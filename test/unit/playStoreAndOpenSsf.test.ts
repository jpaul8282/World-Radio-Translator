import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Google Play Store & OpenSSF Standards Verification", async (t) => {
  const rootDir = process.cwd();

  await t.test("proguard-rules.pro contains required native symbols and line number preservations", () => {
    const proguardPath = path.join(rootDir, "proguard-rules.pro");
    assert.ok(fs.existsSync(proguardPath), "proguard-rules.pro must exist in root");

    const content = fs.readFileSync(proguardPath, "utf-8");
    // Line number preservation
    assert.ok(content.includes("-keepattributes SourceFile,LineNumberTable"));
    // Native JNI preservation
    assert.ok(content.includes("native <methods>;"));
    // Audio codecs and media engines
    assert.ok(content.includes("com.google.android.exoplayer2"));
    assert.ok(content.includes("org.webrtc"));
    // Firebase & WebSocket preservation
    assert.ok(content.includes("com.google.firebase"));
    assert.ok(content.includes("okhttp3.WebSocketListener"));
  });

  await t.test("docs/OPENSSF_BEST_PRACTICES.md formalizes 19/19 OpenSSF criteria passing", () => {
    const docPath = path.join(rootDir, "docs/OPENSSF_BEST_PRACTICES.md");
    assert.ok(fs.existsSync(docPath), "OPENSSF_BEST_PRACTICES.md must exist in docs");

    const content = fs.readFileSync(docPath, "utf-8");
    assert.ok(content.includes("19 / 19 Criteria Passing"));
    assert.ok(content.includes("OpenSSF Best Practices"));
    assert.ok(content.includes("MIT License"));
    assert.ok(content.includes("HSTS"));
  });

  await t.test("docs/USER_MANUAL.md exists and contains all 5 visual chapters with generated images", () => {
    const manualPath = path.join(rootDir, "docs/USER_MANUAL.md");
    assert.ok(fs.existsSync(manualPath), "USER_MANUAL.md must exist in docs");

    const content = fs.readFileSync(manualPath, "utf-8");
    assert.ok(content.includes("Chapter 1: Global Airwaves Exploration & Interactive Map"));
    assert.ok(content.includes("Chapter 2: Real-Time Speech Translation & Live Subtitles"));
    assert.ok(content.includes("Chapter 3: Background Airwaves Scanner & Custom Language Alerts"));
    assert.ok(content.includes("Chapter 4: Google Workspace Gmail Digest & AI Intelligence"));
    assert.ok(content.includes("Chapter 5: Play Store Diagnostics, Offline Export & Security"));
    assert.ok(content.includes("manual_world_map"));
    assert.ok(content.includes("manual_translation"));
    assert.ok(content.includes("manual_scanner_alerts"));
    assert.ok(content.includes("manual_gmail_digest"));
    assert.ok(content.includes("manual_diagnostics_playstore"));
  });

  await t.test("public/manifest.json is Play Store ready with package ID, categories and screenshots", () => {
    const manifestPath = path.join(rootDir, "public/manifest.json");
    assert.ok(fs.existsSync(manifestPath), "manifest.json must exist in public/");

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    assert.equal(manifest.name, "Remix: World Radio Translator");
    assert.equal(manifest.id, "com.remixradio.worldradiotranslator");
    assert.ok(Array.isArray(manifest.categories));
    assert.ok(manifest.categories.includes("music"));
    assert.ok(manifest.categories.includes("news"));
    assert.ok(Array.isArray(manifest.screenshots));
    assert.equal(manifest.screenshots.length, 5);
  });

  await t.test("LICENSE contains official MIT license text and copyright notice", () => {
    const licensePath = path.join(rootDir, "LICENSE");
    assert.ok(fs.existsSync(licensePath));
    const content = fs.readFileSync(licensePath, "utf-8");
    assert.ok(content.includes("MIT License"));
    assert.ok(content.includes("Copyright (c) 2026 Remix: World Radio Translator Contributors"));
  });
});
