# Versioning Policy

**Remix: World Radio Translator** strictly adheres to [Semantic Versioning 2.0.0 (SemVer)](https://semver.org/).

---

## 1. Unique Version Format

Versions follow the format:

$$\text{MAJOR}.\text{MINOR}.\text{PATCH}$$

- **MAJOR version:** Increment when you make incompatible API changes, major architectural overhauls, or breaking changes to public endpoints/data schemas.
- **MINOR version:** Increment when you add functionality in a backwards-compatible manner (e.g., adding satellite constellation telemetry, jump-to-context navigation, or new language options).
- **PATCH version:** Increment when you make backwards-compatible bug fixes, security patches, or documentation updates.

Pre-release tags may be suffixed with a hyphen (e.g. `1.2.0-rc.1`, `1.2.0-beta.2`).

---

## 2. Git Tagging & Release Verification

Every release is tagged uniquely in the public version control repository using an annotated Git tag:
```bash
git tag -a v1.2.0 -m "Release v1.2.0: OpenSSF Best Practices, Jump to Context, and Satellite Space-Mesh"
git push origin v1.2.0
```

- Each tag is cryptographically signed using a maintainer GPG key.
- No two releases share the same version number.
- Releases are mirrored to the [Releases Page](https://github.com/remix-radio/world-radio-translator/releases) and documented in `CHANGELOG.md`.

---

## 3. Package Manifest & Runtime Synchronization

The version is defined as the single source of truth in `package.json` under the `"version"` field and exposed dynamically in runtime health checks (`/api/health`) and the user interface.
