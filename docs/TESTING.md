# Testing Strategy & Verification Guide

This document details the automated test suite, new functionality testing policy, static code analysis, and dynamic analysis procedures implemented in **Remix: World Radio Translator**.

---

## 1. Test Architecture Overview

Our test architecture is split into two complementary verification layers:

1. **Unit & Regression Test Suite (`test/unit/`):**
   - High-speed unit tests covering domain utilities, satellite mesh trigonometry, audio stream validation, bookmarks logic, and cryptographic standards.
2. **Dynamic Analysis & Fuzzing Suite (`test/dynamic/`):**
   - Runtime execution tests that subject input parsers, SSRF validators, and language detectors to edge cases, malformed URLs, and boundary payloads.

---

## 2. Test Execution Commands

| Command | Purpose |
| ------- | ------- |
| `npm test` | Runs the complete automated test suite (unit + dynamic). |
| `npm run test:unit` | Executes isolated unit tests in `test/unit/`. |
| `npm run test:dynamic` | Executes dynamic analysis and fuzzing tests in `test/dynamic/`. |
| `npm run lint` | Runs static type checking and compiler verification. |
| `npm run static-analysis` | Runs strict static code analysis with warning checks. |
| `npm run audit` | Runs dependency vulnerability auditing. |

---

## 3. New Functionality Testing Policy

To guarantee continuous stability and prevent regressions:
- Every newly introduced feature or code path **MUST** include automated test coverage.
- Pull requests modifying business logic (e.g. satellite coordinates, translation turn formatting, stream filtering) must add or update tests in `test/unit/`.
- Pull requests accepting external or user inputs must add dynamic boundary tests in `test/dynamic/`.

---

## 4. Static Code Analysis

Static analysis is performed using the TypeScript compiler with strict flags enabled:
```bash
npm run static-analysis
```
This ensures:
- No implicit `any` types.
- Strict `null` and `undefined` checks.
- Zero unused variables or arguments (`noUnusedLocals`, `noUnusedParameters`).
- Exhaustive `switch` case coverage (`noFallthroughCasesInSwitch`).

---

## 5. Dynamic Code Analysis & Fuzz Testing

Dynamic analysis executes code paths with adversarial and unexpected inputs:
- Fuzzing stream proxy URLs with private IP encodings, hex representations, and invalid protocols.
- Stress-testing string sanitization against XSS payloads and null-byte injections.
- Evaluating memory and state resilience during rapid satellite node updates.
