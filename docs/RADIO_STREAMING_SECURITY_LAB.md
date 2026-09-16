# Radio Streaming Security Lab

**A practical defensive laboratory for SSRF prevention, redirect validation, DNS rebinding, secure proxy design, and secure streaming**

**Version 1.0 — September 2026**

---

## Purpose

Build an isolated, reproducible learning environment around a radio-streaming application. The lab demonstrates how server-side URL fetching, redirects, DNS resolution, and long-lived streaming connections create security boundaries that must be deliberately designed.

---

## Executive Summary

A radio-streaming application is an excellent security-learning platform because playback may require a backend to resolve a station hostname, connect to a remote stream, follow redirects, and maintain a connection. Those same operations can create SSRF, redirect-validation, DNS-rebinding, and resource-exhaustion risks.

- **SSRF prevention** — understand and prevent unintended server-side requests.
- **Redirect validation** — validate every redirect hop.
- **DNS rebinding** — validate the address actually used for a connection.
- **Proxy hardening** — use scheme, host, IP, timeout, and resource policies.
- **Defense in depth** — combine application controls with network isolation.
- **Secure SDLC** — make security controls automated and regression-tested.

---

## 1. Learning Objectives

- Understand standards-based URL parsing and canonicalization.
- Identify restricted IPv4 and IPv6 destinations.
- Understand why automatic redirects can cross trust boundaries.
- Understand DNS time-of-check/time-of-use (TOCTOU) problems.
- Build observable security decisions with safe audit logging.
- Create containerized security regression tests.

---

## 2. Reference Architecture

```
User / Radio UI
       │
       ▼
┌─────────────────────────┐
│       Radio API         │
│   stations / playback   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Stream Security Gateway │
│  URL -> DNS -> policy   │
│   redirects -> stream   │
└────────────┬────────────┘
             │
    isolated lab network
             │
 ┌───────────┼──────────────────┐
 │           │                  │
 ▼           ▼                  ▼
public-radio redirect-server  fake-dns
                                │
                                ▼
                          internal-radio
```

> **Security Boundary Note**: The secure gateway is the application security boundary. Any intentionally vulnerable implementation is training-only, isolated, and never exposed to the public Internet.

---

## 3. Repository Layout

```
radio-security-lab/
├── frontend/
├── api/
│   ├── stations/
│   └── playback/
├── gateway/
│   ├── url_policy/
│   ├── dns_policy/
│   ├── ip_classifier/
│   ├── redirect_policy/
│   ├── stream_proxy/
│   └── audit/
├── lab-services/
│   ├── public-radio/
│   ├── redirect-server/
│   ├── internal-radio/
│   └── dns-server/
├── tests/
│   ├── ssrf/
│   ├── redirects/
│   ├── dns-rebinding/
│   └── regression/
├── docker-compose.yml
└── README.md
```

---

## 4. Threat Model

- **Server network:** SSRF reaches unintended services → destination policy + network isolation.
- **Internal services:** Proxy exposes private endpoints → IP classification + egress controls.
- **DNS:** Hostname resolves to restricted address → validate resulting addresses.
- **HTTP client:** Redirect crosses trust boundary → explicit redirect handling.
- **Resources:** Slow/huge streams exhaust resources → timeouts, limits, concurrency controls.
- **Logs:** Credentials or tokens leak into telemetry → minimize and sanitize logs.

---

## 5. Secure Proxy Design

### 5.1 URL Parsing
- Allow only HTTP/HTTPS when required.
- Reject URL userinfo containing credentials (`user:pass@host`).
- Reject unsupported schemes (`file:`, `ftp:`, `gopher:`, `dict:`, `data:`).
- Normalize hostnames before policy evaluation.
- Use an explicit port policy (e.g. 80, 443, 8000, 8080, 8443).
- Prefer server-controlled station IDs mapped to canonical stream URLs.

### 5.2 Destination Validation
For a radio product, a strong model is a server-controlled station registry or hostname allowlist. If arbitrary public stations are required, resolve the hostname and classify every resulting address before connecting. Consider both IPv4 (A) and IPv6 (AAAA) answers and reject loopback, private/local, link-local, multicast, reserved, or otherwise restricted destinations according to policy:
- `127.0.0.0/8`, `::1/128` (Loopback)
- `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7` (Private / Unique Local)
- `169.254.0.0/16`, `fe80::/10` (Link-Local / Cloud Instance Metadata: `169.254.169.254`)
- `224.0.0.0/4`, `ff00::/8` (Multicast)
- `0.0.0.0/8`, `100.64.0.0/10`, `198.18.0.0/15` (Reserved / Carrier-grade NAT)

### 5.3 Redirect Validation

```
Initial URL ──► parse/policy ──► resolve ──► validate addresses ──► connect
                                                                       │
                                                                 3xx response
                                                                       │
                                                                 parse Location
                                                                       │
                                                               apply policy again
                                                                       │
                                                               resolve + validate
                                                                       │
                                                                    connect
```

Do not blindly enable automatic redirects for untrusted destinations. Apply the same destination policy to every redirect and enforce a maximum redirect count (e.g. max 3 hops).

### 5.4 DNS Rebinding
Use a lab-owned hostname and controlled DNS service. The exercise can return one permitted lab address during an initial stage and a restricted lab address during a later stage. The goal is to demonstrate the time-of-check/time-of-use (TOCTOU) problem without interacting with real internal infrastructure.

- Validate DNS results at the point of connection.
- Understand whether the networking library performs another resolution.
- Avoid validating one address and silently connecting to a separately resolved address.
- Use a controlled connection path where the validated destination is the actual destination contacted (e.g. pinning IP socket / custom agent).
- Revalidate after redirects because a new hostname is a new trust decision.

---

## 6. Practical Lab Exercises

### Lab 1 — Safe URL Parsing
Create valid and invalid station URLs.
- **Success criterion:** Supported HTTP(S) is accepted; malformed/unsupported inputs and embedded credentials are rejected.

### Lab 2 — SSRF Destination Policy
Create fake public and internal services on the isolated network.
- **Success criterion:** The secure gateway reaches only permitted destinations.

### Lab 3 — Redirect Validation
Create a redirector from an allowed lab hostname to a restricted lab hostname.
- **Success criterion:** The unsafe redirect is blocked.

### Lab 4 — Redirect Chain Limit
Create a controlled chain of redirects.
- **Success criterion:** The gateway stops at its configured maximum.

### Lab 5 — DNS Rebinding
Use lab-owned DNS to change a hostname answer between controlled stages.
- **Success criterion:** A restricted resulting address cannot bypass policy.

### Lab 6 — IPv4/IPv6
Test both address families.
- **Success criterion:** Equivalent security policy is enforced across IPv4 and IPv6.

### Lab 7 — Resource Controls
Simulate slow and never-ending streams.
- **Success criterion:** Timeouts and limits prevent indefinite resource consumption.

### Lab 8 — Regression Suite
Convert each exercise into automated tests.
- **Success criterion:** CI fails when a security control regresses.

---

## 7. Docker Isolation

Use a dedicated Docker network for lab services. Avoid publishing intentionally vulnerable services to the host unless necessary for an exercise. If public radio stations are needed, give only the secure gateway a controlled egress path.

```yaml
networks:
  labnet:
    internal: true

services:
  secure-gateway:
    build: ./gateway
    networks: [labnet]

  public-radio:
    build: ./lab-services/public-radio
    networks: [labnet]

  redirect-server:
    build: ./lab-services/redirect-server
    networks: [labnet]

  internal-radio:
    build: ./lab-services/internal-radio
    networks: [labnet]

  dns-server:
    build: ./lab-services/dns-server
    networks: [labnet]
```

---

## 8. Security Decision Flow

```
parse URL
  │
unsupported scheme? ──────► BLOCK
userinfo present?   ──────► BLOCK
missing hostname?   ──────► BLOCK
  │
resolve A/AAAA
  │
no usable address?  ──────► BLOCK
  │
classify every address
  │
restricted address? ──────► BLOCK
  │
connect using validated destination
  │
redirect? ──(yes)──► validate new URL again
  │
 (no)
  │
STREAM
```

*This is a design model, not a drop-in security library. Use maintained URL and networking primitives appropriate to the implementation language.*

---

## 9. Audit Logging

```json
{
  "request_id": "generated-id",
  "event": "stream_policy_decision",
  "hostname": "station.example",
  "scheme": "https",
  "resolved_addresses": ["203.0.113.20"],
  "redirect_count": 0,
  "decision": "allow",
  "reason": "destination-policy-allowed"
}
```

- Never log passwords, authorization headers, cookies, API keys, or tokens.
- Minimize query strings and full URLs where sensitive information may occur.
- Record reason codes for blocks.
- Use request IDs for redirect chains.
- Keep security events separate from high-volume stream telemetry.

---

## 10. Automated Test Matrix

| Scenario | Expected Outcome |
| :--- | :--- |
| HTTPS public station | ALLOW |
| HTTP public station | ALLOW |
| Unsupported scheme | BLOCK |
| URL containing userinfo | BLOCK |
| Loopback destination | BLOCK |
| Private IPv4 destination | BLOCK |
| Link-local destination | BLOCK |
| Restricted IPv6 destination | BLOCK |
| Allowed URL → restricted redirect | BLOCK |
| Redirect chain over limit | BLOCK |
| Controlled DNS answer changes to restricted address | BLOCK |
| Slow response over timeout | TIMEOUT / BLOCK |
| Excessive resource use | THROTTLE / BLOCK |
| Malformed Location | BLOCK |

---

## 11. Secure Development Checklist

- Prefer server-controlled station identifiers.
- Disable uncontrolled automatic redirects.
- Validate every redirect.
- Apply policy to IPv4 and IPv6.
- Validate DNS results before connection.
- Ensure the actual connection cannot bypass validated destination policy.
- Use network egress restrictions as defense in depth.
- Apply DNS/connection/read/operation timeouts as appropriate.
- Limit redirect depth and concurrent connections.
- Limit stream duration/size where product requirements permit.
- Do not forward arbitrary sensitive headers.
- Log security decisions without secrets.
- Make controls regression-testable.
- Keep vulnerable training services isolated.

---

## 12. Suggested Technology Stack

- **Frontend:** React, Vue, Flutter, or an existing radio UI.
- **API:** Node.js/TypeScript, Python/FastAPI, Go, or .NET.
- **Proxy:** Native HTTP client with explicit redirect control.
- **Lab:** Docker Compose.
- **DNS exercise:** Dedicated lab-only DNS service.
- **Testing:** Unit, integration, and containerized security tests.
- **CI/CD:** GitHub Actions or Azure DevOps.
- **Observability:** Structured JSON logs plus a lightweight dashboard.

---

## 13. CI/CD Security Gate

```
Pull request
     │
     ▼
unit + URL + IP + redirect + DNS + resource tests
     │
     ▼
container build
     │
     ▼
security regression gate
     ├─ PASS ──► candidate
     └─ FAIL ──► stop
```

*Treat security controls as functional requirements. A regression should fail the pipeline.*

---

## 14. Safe Lab Rules

- Use only lab-owned or explicitly authorized infrastructure.
- Keep intentionally vulnerable services isolated.
- Use fake internal services instead of probing real private systems.
- Use lab-owned DNS names for rebinding exercises.
- Never expose vulnerable proxy or rebinding DNS services to the public Internet.
- Use synthetic credentials and radio streams.
- Reset the lab between experiments when practical.

---

## 15. World Radio Translator Integration

Place the security gateway between station discovery and playback. Station records contain server-controlled canonical URLs; playback asks the gateway to authorize and retrieve them.

```
Station discovery
       │
       ▼
Station registry
       │
       ▼
Security gateway
  ├─ URL policy
  ├─ DNS/IP policy
  ├─ redirect policy
  └─ resource policy
       │
       ▼
Audio stream
       │
       ▼
Translator / player
```

---

## 16. Project Milestones

- **M1** — Working radio playback through a server-controlled station registry.
- **M2** — Secure URL and destination policy.
- **M3** — Redirect-aware proxy.
- **M4** — Isolated fake internal service.
- **M5** — Controlled DNS rebinding exercise.
- **M6** — Security dashboard and audit events.
- **M7** — Automated integration/regression suite.
- **M8** — CI security gate.
- **M9** — Threat-model review and final hardening.

---

## 17. Completion Criteria

- Normal radio streams play through the secure gateway.
- Unsafe destinations cannot be reached.
- Redirect targets are independently validated.
- DNS changes cannot bypass destination policy.
- IPv4 and IPv6 are tested.
- Resource limits prevent indefinite proxy consumption.
- The lab is isolated.
- Security events are observable without leaking secrets.
- CI detects security regressions.

---

## 18. Further Reading

- [OWASP Server-Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Unvalidated Redirects and Forwards Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)

---

## Appendix A — Threat-Driven Test Cases

1. **Allowed HTTPS lab station** → Gateway permits it.
2. **Restricted destination** → Gateway rejects it.
3. **Allowed URL → restricted redirect** → Gateway rejects target.
4. **Controlled DNS hostname changes to restricted address** → Reject.
5. **Stream exceeds resource policy** → Terminate or limit.
6. **Malformed/unsupported URL** → Fail closed.

---
*End of document.*
