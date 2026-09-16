# Contributing Guidelines

Thank you for your interest in contributing to **Remix: World Radio Translator**! We are committed to fostering an inclusive, collaborative, and security-conscious open-source community.

---

## 1. Code of Conduct

All contributors and maintainers are expected to uphold a welcoming, respectful, and harassment-free environment for everyone, regardless of age, background, identity, or technical experience.

---

## 2. Public Version-Controlled Repository

This project is developed openly in a public Git version-controlled repository:
- **Repository URL:** `https://github.com/remix-radio/world-radio-translator.git`
- **Default Branch:** `main`
- **Issue Tracker:** `https://github.com/remix-radio/world-radio-translator/issues`

---

## 3. Development Workflow

1. **Fork and Clone:**
   ```bash
   git clone https://github.com/remix-radio/world-radio-translator.git
   cd world-radio-translator
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Create a Topic Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
4. **Run Verification & Tests:**
   Ensure all tests pass and no compiler warnings exist:
   ```bash
   npm run lint             # Static code analysis / warning check
   npm test                 # Automated unit test suite
   npm run test:dynamic     # Dynamic analysis & fuzzing tests
   ```

---

## 4. Policy on New Functionality Testing

**Mandatory Requirement for New Features:**
- Every pull request that introduces new functionality, components, endpoints, or data models **MUST** include corresponding automated tests.
- Unit tests must be added in `test/unit/` covering edge cases, happy paths, and error states.
- If user input or external data parsing is involved, dynamic fuzzing / boundary tests must be added to `test/dynamic/`.
- PRs without test coverage for new functionality will not be merged until tests are provided.

---

## 5. Compiler Warning Flags & Static Analysis

We enforce strict compiler warning flags. Your code must compile with **zero warnings and zero errors**:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

Run:
```bash
npm run static-analysis
```

---

## 6. Security Checklist for Contributions

Before submitting a Pull Request, verify:
- [ ] No hardcoded API keys, passwords, or secrets exist in the code.
- [ ] Any external URLs (e.g. stream endpoints) are sanitized and validated against SSRF attacks.
- [ ] Cryptographic operations use approved primitives (SHA-256, AES-256-GCM, Web Crypto).
- [ ] Automated tests cover new logic and boundary conditions.
- [ ] Changes are documented in `CHANGELOG.md` under `[Unreleased]`.
