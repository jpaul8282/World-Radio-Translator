import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("OpenSSF Standards: Versioning, Licensing & Documentation", () => {
  const rootDir = process.cwd();

  test("package.json contains unique SemVer 2.0.0 version number", () => {
    const pkgPath = path.join(rootDir, "package.json");
    assert.strictEqual(fs.existsSync(pkgPath), true, "package.json must exist");
    
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    assert.ok(pkg.version, "version field must be present");
    
    // Strict SemVer regex: MAJOR.MINOR.PATCH(-prerelease)?
    const semVerRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    assert.strictEqual(semVerRegex.test(pkg.version), true, `Version "${pkg.version}" must be valid SemVer`);
    assert.strictEqual(pkg.license, "MIT", "FLOSS License must be MIT");
  });

  test("FLOSS LICENSE file exists and specifies MIT License", () => {
    const licensePath = path.join(rootDir, "LICENSE");
    assert.strictEqual(fs.existsSync(licensePath), true, "LICENSE file must exist");
    const content = fs.readFileSync(licensePath, "utf-8");
    assert.strictEqual(content.includes("MIT License"), true);
    assert.strictEqual(content.includes("Permission is hereby granted"), true);
  });

  test("CHANGELOG.md provides release notes for current and historical versions", () => {
    const changelogPath = path.join(rootDir, "CHANGELOG.md");
    assert.strictEqual(fs.existsSync(changelogPath), true, "CHANGELOG.md must exist");
    const content = fs.readFileSync(changelogPath, "utf-8");
    assert.strictEqual(content.includes("[1.2.0]"), true, "Must include 1.2.0 release notes");
    assert.strictEqual(content.includes("[1.1.0]"), true, "Must include 1.1.0 release notes");
    assert.strictEqual(content.includes("Security"), true, "Must document security updates");
  });

  test("SECURITY.md documents vulnerability reporting process & response SLA", () => {
    const secPath = path.join(rootDir, "SECURITY.md");
    assert.strictEqual(fs.existsSync(secPath), true, "SECURITY.md must exist");
    const content = fs.readFileSync(secPath, "utf-8");
    assert.strictEqual(content.includes("Vulnerability Reporting Process"), true);
    assert.strictEqual(content.includes("Response SLA"), true);
    assert.strictEqual(content.includes("Cryptographic Standards"), true);
    assert.strictEqual(content.includes("Man-In-The-Middle"), true);
  });

  test("Bug-reporting process documentation exists", () => {
    const bugDocPath = path.join(rootDir, "docs", "BUG_REPORTING.md");
    const issueTemplatePath = path.join(rootDir, ".github", "ISSUE_TEMPLATE", "bug_report.md");
    assert.strictEqual(fs.existsSync(bugDocPath), true, "docs/BUG_REPORTING.md must exist");
    assert.strictEqual(fs.existsSync(issueTemplatePath), true, ".github bug_report.md must exist");
  });
});
