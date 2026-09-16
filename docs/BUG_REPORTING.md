# Bug Reporting Process

We welcome bug reports, reproduction cases, and defect analysis from the community! A clear and structured bug report helps us diagnose and fix issues rapidly.

---

## 1. Before Submitting a Bug Report

1. **Check Existing Issues:** Search the public issue tracker to verify if the issue has already been reported.
2. **Verify on Latest Version:** Verify whether the bug persists in the latest release (`v1.2.0` or higher).
3. **Is it a Security Vulnerability?** If your report involves a sensitive security vulnerability, please refer to our [Security Policy (SECURITY.md)](../SECURITY.md) instead of creating a public issue.

---

## 2. How to Report a Bug

### Preferred Method: GitHub Issues
Submit an issue via the repository's [Issue Tracker](https://github.com/remix-radio/world-radio-translator/issues) using the **Bug Report Template**.

### What to Include

Please provide the following information:
- **Summary:** A concise title and clear summary describing the bug.
- **Steps to Reproduce:** Numbered step-by-step instructions.
  1. Open station search for "Radio France"
  2. Click Play on station X
  3. Observe that audio fails to connect
- **Expected Behavior:** What you expected to happen.
- **Actual Behavior:** What actually happened (include error messages or console logs).
- **Environment Details:**
  - Application Version (e.g. `v1.2.0`)
  - Web Browser & Version (e.g. Chrome 124, Safari 17, Firefox 125)
  - Operating System (e.g. Windows 11, macOS 14 Sonoma, Ubuntu 24.04)
  - Audio output device (e.g. Headphones, Bluetooth, Integrated speakers)
- **Station / Stream URL (if applicable):** The specific radio station ID or stream URL being played.
- **Screenshots or Recordings:** If visual rendering or UI layout is affected.

---

## 3. Bug Triage & Resolution Process

| Phase | Timeline | Action Taken |
| ----- | -------- | ------------ |
| **Initial Review** | Within 48 hours | Maintainer reviews report for completeness and assigns labels (`bug`, `triage`, `confirmed`). |
| **Reproduction** | Within 3 days | Bug is reproduced in a sandbox/local test environment. Automated regression test written. |
| **Fix Implementation** | 3 to 10 days | Pull request with fix and accompanying unit/integration tests submitted. |
| **Verification & Release** | Next Patch Release | Fix verified by reporter or CI test suite; included in next SemVer patch release. |
