---
title: Enterprise Example
description: Full enterprise deployment with governance
---

# Enterprise Example

Complete enterprise PromptScript deployment with central governance.

## Architecture

```mermaid
flowchart TB
    subgraph Central["Central Registry (GitHub)"]
        org["@acme/base<br/>Organization standards"]
        sec["@acme/security<br/>Security policies"]
        comp["@acme/compliance<br/>Compliance rules"]
    end

    subgraph Teams["Team Registries"]
        fe["@acme/frontend"]
        be["@acme/backend"]
        mobile["@acme/mobile"]
        data["@acme/data"]
    end

    subgraph Projects["100+ Projects"]
        p1["web-app"]
        p2["api-gateway"]
        p3["mobile-app"]
        p4["data-pipeline"]
    end

    org --> fe
    org --> be
    org --> mobile
    org --> data

    sec --> fe
    sec --> be
    sec --> mobile
    sec --> data

    comp --> fe
    comp --> be

    fe --> p1
    be --> p2
    mobile --> p3
    data --> p4
```

## Central Registry

### Repository Structure

```
acme-promptscript-registry/
├── README.md
├── CHANGELOG.md
├── CODEOWNERS
├── @acme/
│   ├── base.prs              # Organization base
│   ├── security.prs          # Security standards
│   └── compliance.prs        # Compliance (SOC2, GDPR)
├── @frontend/
│   ├── base.prs              # Frontend team base
│   ├── react.prs             # React-specific
│   └── vue.prs               # Vue-specific
├── @backend/
│   ├── base.prs              # Backend team base
│   ├── node.prs              # Node.js
│   └── python.prs            # Python
├── @mobile/
│   ├── base.prs
│   ├── ios.prs
│   └── android.prs
├── @data/
│   └── base.prs
└── @fragments/
    ├── testing.prs
    ├── documentation.prs
    └── ci-cd.prs
```

### @acme/base.prs

```promptscript
@meta {
  id: "@acme/base"
  syntax: "1.0.0"
  org: "ACME Corporation"
}

@identity {
  """
  You are an AI coding assistant at ACME Corporation.

  ## Core Values

  - **Quality First**: Write production-ready code
  - **Security Always**: Security is not optional
  - **User Focus**: Consider the end user
  - **Team Player**: Write code others can maintain

  ## Standards

  Follow ACME Engineering Standards v3.0
  (https://wiki.acme.com/engineering-standards)
  """
}

@standards {
  code: [
    "Code review required with minimum 2 approvers"
    "Document all public APIs"
    "Add inline comments for complex logic"
    "Write tests for all code (80% coverage)"
  ]

  git: [
    "Use conventional commits format"
    "Branch naming: type/TICKET-description"
    "Signed commits required"
  ]

  deployment: [
    "Environments: dev, staging, prod"
    "Production requires team-lead and security approval"
  ]
}

@restrictions {
  - "Never commit secrets, credentials, or API keys"
  - "Never bypass code review for production changes"
  - "Never deploy without passing CI/CD"
  - "Never ignore security scanner findings"
  - "Never use deprecated dependencies with known CVEs"
  - "Never store PII in logs"
}

@shortcuts {
  "/standards": "Review against ACME standards"
  "/security": "Security review"
  "/perf": "Performance review"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABDIxIwA9ACMMcGMMGt+-OAE92GQgOEBGCgAYjSlf2bUA5rpABBAMIBZAKL97FtBewQ2pgL7KyiK8nFgQWOr8wMqqSiCmqgCazACu-BjUMOkqtgCS-Cw8EKyW6XBwEHBYGOzpWPwOLm4eXmFsFIFmAMRdzZn8AGoYUCnwnaoAtPwAVNMAiinD4ZEAYhC0WLMCAOrU4Vk0zDwpjG2sE5kYPJGFimZTswDKMIwpexENUADuGOpwW-xnq93pFKvxWMx6sw0GdhjF+A9pgBVBTUfgrZivf7TATuVgVHgwNG4LKcHj8FKo+GIgAqMFI-AAClBfkSAbt9gUjllITgiXACjV+CQMMVqsVxvweoDqqweBkeHBJRioFBmF8Gk5XM4SsUYETiqVHrL5dRFfwAG4AZhMZgAFDgsFg0HBEFIpF8IABrCAUcSSCgsEhSTiWPUGkoTKo1U2KgCU8Li-k6ImjcoVAuiZluAmQ8NiIHchP4mQtEBgGsyAEcUusYOTPbhhcUICQUiR+AAmdJoQ4W-kJVRCEAAEUx7dC6VV-DQKRkUAgjAajNySviZgLth45OKC9YWSDknYArAFi5ZFghH4arDjEHBY5HH4HCqJ7PwygXOLdoAHIYAKRcv21AYJYMAJuuqgALqSmGWC5vmw4ogebD9uwPisMM54kOEb7UCKWD3sOABCIGsIwODgqQhoCBEaDSDSuT2AA0s4NITIScCMHsMIYURwiPBAlj7uSh64SWMA1nWPCDjBrDwoS5DMOoR7wfweYbsOOpltQbCqa6-CEhadBqNUYYlCZhwyZBQ7CIyunHKcGESVJmQChwpATLAVzZOSCjAssPZ9nCNlyQE8msCIblYHsTlsJm1LDgAcjAwHYeEagvJkWBwCZ3H1qEEDDLl5horYK78F6MB-IOUzCClaUyOomDlF+WSluWGqnmiVknGcBQ4DUYFrol9WpUShkwEpkSNjgqT1C1FQlG4uRSPYI61cl41okJEL9P5byBVxNT7mikByoaI33FtaWUlkimZIw2D1pN9FypwjDlgKs2VRCXwqPYAzOFdkw3RNVQWFkK75MU17MJYV3hUEcBzdQWCvDlUSJiAUhprGa42AASqlnXpJYor4vUjSuHjGaDsIuMvIdETCDYQLM5EHUVvTOP0dQYCs8OjJEt1Irke1JPc+ufggH4UEMKE1DqPgRCkOQMBULQIAMMBFRsPgeiy0AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @acme/security.prs

```promptscript
@meta {
  id: "@acme/security"
  syntax: "1.0.0"
}

@identity {
  """
  Apply ACME security standards to all code.
  Security is everyone's responsibility.
  """
}

@standards {
  authentication: [
    "Use OAuth 2.0 / OIDC"
    "MFA required (TOTP or WebAuthn)"
    "Session timeout: 3600 seconds"
    "Enable refresh token rotation"
  ]

  authorization: [
    "RBAC with ABAC extensions"
    "Apply least privilege principle"
    "Audit logging required"
  ]

  dataProtection: [
    "Encrypt at rest with AES-256"
    "Encrypt in transit with TLS 1.3"
    "Mask PII in all outputs"
    "Follow data classification for retention"
  ]

  dependencies: [
    "Daily vulnerability scanning"
    "Critical vulnerabilities block deployment"
    "High vulnerabilities: fix within 7 days"
    "Medium vulnerabilities: fix within 30 days"
  ]

  secrets: [
    "Store in HashiCorp Vault"
    "Rotate every 90 days"
    "Never store secrets in code"
  ]
}

@restrictions {
  - "Never store passwords in plain text"
  - "Never log sensitive data (passwords, tokens, PII)"
  - "Never use MD5 or SHA1 for security purposes"
  - "Never disable TLS certificate verification"
  - "Never use eval() or similar unsafe functions"
  - "Never trust user input without validation"
  - "Never expose stack traces in production"
  - "Always use parameterized queries (no SQL concatenation)"
  - "Always validate and sanitize file uploads"
  - "Always implement rate limiting for APIs"
}

@knowledge {
  """
  ## Security Resources

  - Security Guidelines: https://wiki.acme.com/security
  - Incident Response: https://wiki.acme.com/incident-response
  - Security Training: https://learn.acme.com/security
  - Bug Bounty: https://hackerone.com/acme

  ## Contacts

  - Security Team: security@acme.com
  - Incident Hotline: +1-800-SEC-ACME
  - Slack: #security-help
  """
}

@shortcuts {
  "/threat-model": "Help create a threat model"
  "/vuln-check": "Check for common vulnerabilities"
  "/secure-code": "Review code for security issues"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABDIxIwA9HBiMArtQhYAnsMGt+-OCvYZCA4QEYKABjPrWAXw0aRvTlmUr+wDVvUhLWgIJpyLj4AwgCyAKLacorO2lgYrDwY1Dxw-FjM-BhQUPwsPDAU7vwAylFKqvwQqTAAbjDUKmwwAOSp1PBobHAQAEbQzoWaQl4jGjasdnBxCUkprkUY8riOEIzYEGwCyEUeIACqsvwA8j5LOPwATGb8UscAkgAiQd5awyEAYj787QCO8hDtHj8AAUABUjqCAAr8ZjUfgAdRgPVOuFYAEoXrtSnBumw0hBJMwlgIAMwANlMpkiLAScExwzCrAwPVg3xgYHacHO6QA1pxvsw4k42C8ALq2IaLXCwiAAL3Wm342yGuwASgAhYL8ADuynOPk1QX4RA4rFxZvpwj8AX4sAwU34NAgNWgMAA5jBHUpWIwIOQYJaQKceMpbcw3W6IKw3Wy-gCYDwxRKtIk4pDqIK5MLWFsdgyfQ00FhMsXOcXdbh+D4wsUALQXACsZMDjMYheLUbS1Hi3XLev4oIAMsV+CYSYGQvaefxIXc7pVNFkckSsGglnSvCrhu9mNlmNr+KmMLkoPbupA1tn+GBYWzTdmkxMhvk0Jx8j6IPBc1vhA8MNAXBqeQoFYepmX6Co4DWVhWCjN1AyCcpViyfggJAsC+igZRP1SFlmEYacXygZgVEkdhAwACQgN1zjQ0Du0w7Cv2vCBCB1PVOwAdkPDAVA3PNhBCBMIHkEhUOA+jwKwpxmMgNiKxwTsSSpRI+MfIpZDbGAsDgb9XmGYp0naBd+Ao+1FKCWE0H4AA1RYoCwQNVUFbBPVqeoXAAThU3j+J-EAADl3LhKZYU9TT2h0ky8gDTctHFawJREMslEYbNUjcIZa2GIK6hCozPUwHFtVhOZO3If9NA4QhHLi-hsuEXL6jDGNZDNbC6h4uIQSKuASuSOA6DSZg+TNIbZzuDE6oawLgv4eRDhCB4GxhOFigonwjGvW9NOiCo12oTpZD8rQZqauEQzgZlWSHEdGHqJwL1c1D6ggJ6H2mnK5oWtyaiyYE0VW7QCWgJJ5rNDAwE9MB5B9dKXjOuasGoBbix+uEozXPtpSWVCsl4BUJk+xq5qII7wriAiu3EeATJoZgeHkNKNiJooZp8KBtV8+bDkwbtJA4JRZQTfg-le2ngVYDJigARUHXI2EvThCamtnhg5rm+LxrDU09eIgSu2CnGFljWXkchmAwFIEfVznuYJf0yNLZ6sJIbDo22uEfFnPzxjsHkpe1WAeA9eYhk8F4AGJI5KMoYlVeAiWoe66SfU7Y4UcoXAAcX+fIsNA3T+BwLBV10qQpF1HkIAocRJAoFgSBkOPVDVu4P3fYsE7gTozRgAQS7LxAK6rmu64KRupCjX1O9rTle9kNXSkzmJQW7KM4IH0u0HLqQ7WoVha4kCfmCb3as7V9V5BjdUiXYFQt6HiucHEPkM1AhvT6kcfk34aP+EsnoNKqcl4txcKCGApABDn2cGIY+n8SBtw7o4UygoC7934AAaiMLWAAHJSWsxQwhBFrMEcIS9TwEQEJHGBqhaw4BgFANARQI6bj9qwEQXJYRYAUFFTKuwpC4HaNgWsJAGaMOEIYEAFFGHWS0s9Y8QjIHFjEfnF4wgpB0VrIwBhBFJHDCCLo6cN44SNzEZoOiGEII4XUSAZumcYDaPEfo4QCcXQwAPDFT21I9ouCqHAeQ8BLBWBAFYUUDBHANHwEQUg-oqC0BAAwPK5p8BGFCUAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @acme/compliance.prs

```promptscript
@meta {
  id: "@acme/compliance"
  syntax: "1.2.0"
}

@identity {
  """
  Ensure code meets ACME compliance requirements.
  We are SOC 2 Type II and GDPR compliant.
  """
}

@standards {
  soc2: [
    "Logging required with 1 year retention"
    "Tamper-proof audit logs"
    "Access control documented and reviewed quarterly"
    "Change management: documented, approved, tested"
  ]

  gdpr: [
    "Apply data minimization"
    "Enforce purpose limitation"
    "Consent management required"
    "Support right to erasure"
    "Enable data portability"
    "Breach notification within 72 hours"
  ]

  pci: [
    "Applies to payment services only"
    "Never store full PAN"
    "Encryption required"
  ]
}

@restrictions {
  - "Never process data beyond stated purpose"
  - "Never retain data longer than necessary"
  - "Always document data processing activities"
  - "Always provide data subject rights mechanisms"
  - "Never transfer data to non-approved regions"
}

@knowledge {
  """
  ## Compliance Resources

  - Compliance Portal: https://compliance.acme.com
  - Data Classification: https://wiki.acme.com/data-classification
  - Privacy Policy: https://acme.com/privacy

  ## Data Classification

  - **Public**: Marketing materials, public docs
  - **Internal**: Internal communications, non-sensitive
  - **Confidential**: Business data, customer info
  - **Restricted**: PII, financial data, credentials

  ## Regional Requirements

  - EU: GDPR compliance required
  - California: CCPA compliance required
  - Healthcare: HIPAA where applicable
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABDIxIwA9CzJQIGVoxjDBrfvzgBPdhkIDhARgoAmCgAZVrAL5q1I3pywQsW-sDUbVIKxoCirHAArtQw-Cw8YZIwWHD8AIIAwgCyfuHMcgpKYaEAjkEQoZLscBSe-ADqYRih-ADKAPKJ-Cb8ACpaaGEAkt38ijz8AOIAIgAKAErpmYpYZepCPktqtqz2cFgDNTxxHgtwzIwmAsjlXiAAMswA5tcQrNf8eQWhgwDuLjj8hvxaMDVPGJOCBsXwaRZtUhdagAWhozGYYH6QR4Ln4UBucDB53ijGUcDiLHY1GYUH4PEOQWKHEGA0BADcIDA3jBBvkahxqFAtNjFokcIprlFFBghdSBBTGFSnKy6P00PD6bL+BwNqywQBdOwLa48GgnM6LeIK7nk7AYfgke4QK0AL2wILWPgW5wCYGY1GU-DQITQzDgYXkVs2zlBzvBfLYAfYlpFYqcgPyhXV4fBwjqQQVHqwTwg1xwOawzH4MGoGGCoV5wgCGAARrAzZtvdm69AXDzU+cAEKhcRfVjMZyQRgOtj8D64e78ADsrRwzBCWNTWrWCzQjAgBpdRpNTLiRe9GC01M0pcZ+P4bG5VZAADkYErqJoi7UwEEoGSxvFbzeAoxqJ0obqM8yY8JqKzaiIoQbNQECMEBuzlDCiz3o+3okvicQ8Oa-C1jAWhsIMGzYKy3q+v6KipshwioaWgKbFO2FNhiDx0bgij8KwMCYTUHZIUaUBvEeWGUieTEWvCmH3I84jOIyzjwGC1EgPEgnCehzCMpEjYWsEtYAFbcTmsH5rElrcQKrAQHAJBLvxNEPmxZaBGAdHiSqxYDqwMIYAqJJKoMoR3FGVirPYADWA5vLAPBCu45TeGCADESX8IkGTkFkXoTPAC6eopq4aMh6UzNk-BjC2UACAWWBoHAiBSDIGXyIoygUOIkgULI-EjDhiRQOWcAQMOo6sNVWC1fVjUfOFEDtRIMBdRkUjiTCjADQSw1waN-FjLB9LiG4FXyIwWjjZNDVSB1i2yFINAQAdp3ahoKX8L1Tb9YNW0jkBz38MhABUANjEE9ZwUDAjJDU4UxNJsacgoUBwHKPpg4w5KHFiCyAwD3TsKWrAYFAEP8HjnKE2SsgkEEVk-Y6yOcWwMLRkNckqNj-BA+lrCQJE7CIyTXZBENXEEjpcpShsGR0fc7r8UDOUwXBNIk2MvRypAhNKIj4vhK8wJE1j5SvTlwUU-wOVJkUThGxzfgAKoCKMkzTJlrU5DAVvqhziRE8NHpWRgAiJIkX6uy1ZUga8-EABL-FAuAjqEAgx90X7xOOOCltUu4jvW7PnIlNggNYGoME4AH4EQUKUDQ9AgI+Q1sPghgl0AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @frontend/base.prs

```promptscript
@meta {
  id: "@frontend/base"
  syntax: "3.0.0"
  team: "Frontend Platform"
}

# In a multi-file setup, you would inherit and use:
# @inherit @acme/base
# @use @acme/security
# @use @acme/compliance

@identity {
  """
  You are a frontend developer at ACME.

  ## Expertise

  - Modern JavaScript/TypeScript
  - React ecosystem
  - Web performance optimization
  - Accessibility (WCAG 2.1 AA)
  - Design systems
  """
}

@context {
  """
  ## Frontend Platform Stack

  - **Framework**: React 18
  - **Language**: TypeScript 5
  - **Build**: Vite 5
  - **Styling**: TailwindCSS + @acme/design-tokens
  - **State**: React Query + Zustand
  - **Testing**: Vitest + Testing Library + Playwright
  - **Components**: @acme/ui (shared design system)

  ## Architecture

  - Feature-based folder structure
  - Micro-frontends for large apps
  - Module federation for sharing
  - API client generation from OpenAPI

  ## Key Resources

  - Design System: https://design.acme.com
  - Component Library: https://ui.acme.com
  - Frontend Wiki: https://wiki.acme.com/frontend
  """
}

@standards {
  code: [
    "Use React 18+ framework"
    "TypeScript in strict mode"
    "Functional components with hooks and composition"
    "React Query for server state, Zustand for client"
    "TailwindCSS with @acme/design-tokens"
  ]

  performance: [
    "Initial bundle < 200KB gzipped"
    "Per-route code splitting"
    "LCP < 2.5s, FID < 100ms, CLS < 0.1"
  ]

  accessibility: [
    "WCAG 2.1 AA compliance"
    "Automated testing with axe-core"
    "Manual testing required for new features"
    "Support keyboard navigation and screen readers"
    "Ensure color contrast and focus management"
  ]

  testing: [
    "Unit tests with Vitest (80% coverage)"
    "Integration tests with Testing Library"
    "E2E tests with Playwright for happy paths"
  ]
}

@restrictions {
  - "Never use class components"
  - "Never use any type without documentation"
  - "Never ignore accessibility requirements"
  - "Never skip loading/error states"
  - "Never hardcode URLs or config values"
  - "Never use inline styles (use Tailwind)"
}

@shortcuts {
  "/component": """
    Create a new React component with:
    - TypeScript interface for props
    - Unit tests
    - Storybook story
    - Accessibility considerations
  """

  "/hook": "Create a custom React hook with tests"

  "/test": """
    Write tests using:
    - Vitest for unit tests
    - Testing Library for integration
    - Proper mocking patterns
  """

  "/a11y": "Review for accessibility issues"

  "/perf": "Review for performance issues"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABMNTYdWPAPQAjDHBjDBrfvzgBPdhkIDhAZgoAGEyrX8OpfSABiE9px78AClGxhm1EuYC+q1QBifgBJNQx+EgBXKCwIAFpIWA0YLCi0On5NZij+AHccqGcIVhwYaggsfgxpfiilRCD+ERKyiqqRDEYSGHlFZVZgkXqYZq6emSVGKPbNJuGlMe7eljIoCBrGAdUWnk44rE1+YFV1FRBzdQBNHOrqUYjxSSd+PYA3GChmNHLqqoBBADCAFkAKIUAIWQLBUGEH7UOJKSHqeL8YHMPbUNQAKQwbwwAGVGBU0FgZAAVTQ-IkkrCnfiogBKMC6VRgLC0cA4PgsqIA6jA5Px4Z5vJtRt84iQIAAvbAQNj01H-RhbOBwCByaCVI4ACj5gP+AHF+AAmCgARn4-3+AEolfwACLwCAAczUnO5cHp5z8kJELEchCqJwsvouUOC9metTcHi8JH4BKwXQA1siGfwAFRZ+ykGAFaipnMCZms-gWgAcDpzABkaq6ohhXTAS-xKdTiRBSfwAKw1rMAISi0B4bYAapVRv3edms8nNOtWK62+SMNA8iUeICCQT+ABqJYTPYa93xLDMVOcb2znPJ7CtrOllmMKoARSi5SOh4AWvUU9IA7kvAcTLhOU5cge7YgSUrr8LWmrUBg1Dfq47iaHkFSujgdK3lmgLMGQbD7HAbadMsMgjvwupwDgyEwM4J5uh6mhcjAJD2qw9LQta1CMDgU6vjM2yzrYLJpPc8QKEozieEUvxctQURCfcDrAhAxLMIkDhSDwcD8KK-DuNQLbVGgaA3iiaIYjEoxgAx5TymwBleBodEVMuDr-C4IT8Iw6z7PwLasI5cTOU8iYAPI-Kw3khBmPEANIwEczJwDkfHwBmqLOqeagEqx3ICDhWAWYgMgyEx7oUOMMAUKsDoEURIXsPBiHIZoxVYKVcDlZREA1cs9WEQ60aOLUfIQKmEBdT1fWbtNg09MNJAyE8408D6Fzbao-hcawIhcjUPDIXpxz0iwewCMg9JnCAACqixlq+FaVoe4j5oW6YRuod0djANLdlUJQaFgFQvSQGLKD9v3CLYUSsK+CqsBgUB+YRaDEew+mbrg-A4Mwl76cd6NERqYVcTDd3Pe+n4oS51ApNQHyM0dHCZH+R21IZ-kQPslywyAa4bluO57rjOBHr0VWsOel7XgLAC6GYigm4rXbdQggGElQbGjcgIzwyQADxmsYxiJYOQUyt2PybVTWsuOU8QSFEHDo3sGjkJUoGugLd21oCLj8Kb5q9nAmS2CEjohxW5skBH-CArWe6m6YFpKxmXRqhqWrrIcGsWHdBrGmalrWv8pPe+K-ta-8buEQ+zgcFysH5JUku6DA8QsKpDvCMCNRNmjLe+-w9wAI4jvcsmuSFeQGeJwnev3IAEukmMIvwV6aHIzCnfwKNvG6TnhLUcDEjAnDjyymIr5rwigqwcDCejXyM4GYOKFUJOeNM+kkBqM2di-MYbK32uoUesFC6-S1vdVglRLAgRxh3fgk5R7UUrMYAApOjFmwD7SrzCBwV0SEKZIK5CgvGwFW7LjanIJCKFa6P1NKCChWAqGSzjBhLCOEGb4wwOZI4mBcD3wsOAvaOx7iKQ0hTfSoYrLCAAHIwBZnURY-lFD6VWJjFqHCBaomUao34IxqisCOIcH47dcA5CqDwZg0weg6ApgYrWKi1HMS8A8VU8Bc7akODfKeEB7hOP0TDQxIB3EKWmmgIy+8eCwRkOUCQrMUwt1cUYtR7keCXVGPdRktZ9KuUDJAOC+IoCfjEYoyJxjGamJKEuUYXJFzwGoqY4WUBNzSEIbtf0tEvBYGmBw86YYQAyB0VjOkSAta+iLkne4D5qiHwLPwGmVdJnWJwI0OZqJ-qAx7CUDg1AwBdDsq5Gg3xLK-VRPAxBo8rlWWTF4XehNUyg2eZrZUPj1San8UcQMGpMSnyueGDMwgZAE0vMIGwgIFnuwiP-C8iY1mQreRLdhYitoyFHtCmZO05l8naKMe56joGfLQRBKohkEZ3OQeSmhY8EIMI6vww5MBSGn3JS4CQ8JIgOOmnQkRRzn5bVmVijAFoLRzGmcIZkx8VmGWzr435+cjgQHVJU8wWKRS4tlaovmC9DKqzFIjUY6qX5ZQjL4EAvhFYMH2ChfARBSDkDqjQegIAWYajYPgC0NqgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Project Configuration

### Example Project

```promptscript
# checkout-app/promptscript/project.prs
@meta {
  id: "checkout-app"
  syntax: "2.1.0"
}

# In a multi-file setup, you would inherit from frontend base:
# @inherit @frontend/base

@context {
  project: "Checkout Application"
  repository: "github.com/acme/checkout-app"
  team: "Commerce"
  productOwner: "Jane Smith"
  techLead: "John Doe"

  """
  ## Overview

  Multi-step checkout flow for ACME e-commerce platform.
  Handles cart review, shipping, payment, and confirmation.

  ## Key Integrations

  - Payment: Stripe Elements
  - Shipping: ShipEngine API
  - Tax: Avalara
  - Analytics: Segment + Mixpanel

  ## Architecture

  - Micro-frontend (Module Federation)
  - Shared shell: @acme/commerce-shell
  - Feature flags: LaunchDarkly
  """
}

@extend standards {
  payment: {
    provider: "Stripe"
    pciCompliance: true
    neverStoreCardData: true
  }
}

@knowledge {
  """
  ## API Endpoints

  ### Cart Service (cart.acme.com)
  - GET /cart - Get current cart
  - PUT /cart/items/:id - Update item
  - DELETE /cart/items/:id - Remove item

  ### Checkout Service (checkout.acme.com)
  - POST /checkout/start - Initialize checkout
  - PUT /checkout/:id/shipping - Set shipping
  - PUT /checkout/:id/payment - Process payment
  - POST /checkout/:id/complete - Complete order

  ## Feature Flags

  - checkout-apple-pay: Apple Pay integration
  - checkout-express: One-click checkout
  - checkout-affirm: Affirm financing

  ## Error Codes

  - CART_EMPTY: Cart has no items
  - SHIPPING_UNAVAILABLE: Cannot ship to address
  - PAYMENT_DECLINED: Payment failed
  - INVENTORY_ERROR: Item out of stock
  """
}

@shortcuts {
  "/checkout-flow": "Help with checkout flow implementation"
  "/payment": "Help with Stripe payment integration"
  "/shipping": "Help with shipping calculation"
  "/cart": "Help with cart management"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaDGjTyxEuAE92GQrPkAmCgEYKABn2sAvmLEBiQQElxQkmqgsCE1IWEE4fjU0OkEjdUEAd3UoKUlWRWoILEEwamYSHLz2TlSAIwwIxA9Bbgh0mEzs7ly2DlYpAHpyiLdWbhZiwmzRcUEaZgArJSwLEABhRRV1bIBBXSgIRmwINicJahg0Zjgs5mojWYBzLJw1UooWEg6MRj4OxkXVDW1dPcEOUizOb5PjURgwP7jKRqRhYADyCVYDVmACkMEjBABlEg3P4cD4AGRgGBkchAKOYOHEABFmBCQL0JPoGQzRu5PHCAG4NTkQGAJRmCACyASCmjgHDQgg+Si+2TAUGYCRyZ0EKzmQoAooIYJpHqDwWMoNgwGcSBQDIIABLoqSwODSjDUbIHXn8mJwHAQXR1S4xTBGPjsGK26VsSDUEjbNgW1iW9mCADSMCM3mKl2o0dYcEFmkEAAUMIHODMsVhMmgYIJNbAg1gc6M85ivT7WJdZM3vZq23Uqyt815LXmACpmWQrTkYY2Zodq1hToxBRhwDswS51wQAamFEEImCRUEFCZWYK9+KwagOuZ3jDyISKbVSAAohcxoWEAGIwKQNLMASlnZsnW-cJFCgKBZG4F43n1BpwXFMDD0bQQv2wS8qwVDBLhXQQCQwNRWA+aknWUKAjEtZknFcOM+iIR9wgEdonSkB0RgkAM61kNiJDGPJeR-ahZkxctvXpS12MYCBgTIDZ0XBWRyzUCFRgkJFuWoYSzhgOZmOIgQFOoJTLWo6ixG4ZRWCVWApEuKtuMo1kJGPAdq3aI46nrI8Ex050sR5TYqyfLZnQoaCYAefIAOQgBxTVh0Ed4nWyPNov4aVLwOdhHWdWd8wAVXixLnQ6LIYBIOAOkQaRBDzPK0CkbAq1KkhZ2pTUCTi7UiqwEqOHKyrqrzAAlMrmG5SQ+q8zwFllZY-OoXlDSCz5llC15wseKKJDzfM4UxQqZSWDQOglJKarTLIICnCAAC8q0OuVcoKhKHuWAbOk9b00F9c7MTSz7W0uJ6DpW46qs6DiS3O-M8nBOAHUh9hcr2kHZrB6R3nych+CrPNpOxjhBDOASvJQ4kLwOFDjWw69Xu+HRsc0ANx3WKtC1TDy10zIJdmQumtCIGh4BwuEkT1DYVGlUGsFnfntDACMSHHBWIEjHI6jk31Sc1ag8moQRgR-BtZzmFYhuHAB9TUhXzYcAE1ZB87IcAqQRLImsqG22rErS8fMBwAOWii28oDlYADUVi8AkVgAIQ6x30Us7IAf+ZhBBJKQDnh3KVjtrUA8ttq5gJLwA81alZHZjcwAwaBv1nMvw81Qu4SGu2raGoa29kLw+qJjQibABjmBUCiWSo3puE9M4sEYDRWPH95pZCRUBSQMkrRgKApQSG4pbR+U18kGSypLLM-nkDpEZljf5C3nfEn34SKyrG+0g4DML8cskTpbb62zyFmA-Xe+8AYAMuI6KA89jQ8zjD-K+wVb7AO3qA3A2VshRnnLZOsVEQDOAALoMBLOcfARBSDYyoLQEADB1InDYPgGw+CgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Project Config

```yaml
# checkout-app/promptscript.yaml
input:
  entry: promptscript/project.prs

registry:
  url: https://github.com/acme/promptscript-registry
  auth:
    token: ${GITHUB_TOKEN}

targets:
  github:
    enabled: true
    output: .github/copilot-instructions.md
  claude:
    enabled: true
    output: CLAUDE.md
  cursor:
    enabled: true
    output: .cursor/rules/project.mdc

validation:
  strict: true
  rules:
    require-knowledge: warning

watch:
  debounce: 300
```

## Governance

### CODEOWNERS

```
# Registry CODEOWNERS
* @acme/platform-team

# Organization base requires security review
@acme/base.prs @acme/security-team @acme/platform-team
@acme/security.prs @acme/security-team
@acme/compliance.prs @acme/compliance-team @acme/legal

# Team bases require team lead approval
@frontend/ @acme/frontend-leads
@backend/ @acme/backend-leads
@mobile/ @acme/mobile-leads
```

### PR Template

```markdown
## PromptScript Registry Change

### Type

- [ ] Organization policy update
- [ ] Team configuration update
- [ ] New fragment
- [ ] Bug fix

### Breaking Change?

- [ ] Yes - includes migration guide
- [ ] No

### Checklist

- [ ] Updated version in @meta
- [ ] Added CHANGELOG entry
- [ ] Tested with sample project
- [ ] Notified affected teams
```

## CI/CD

### Registry CI

```yaml
# .github/workflows/registry-ci.yml
name: Registry CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PromptScript
        run: npm install -g @promptscript/cli

      - name: Validate all files
        run: |
          for file in $(find . -name "*.prs"); do
            echo "Validating $file..."
            prs validate "$file" --strict
          done

      - name: Check for circular dependencies
        run: ./scripts/check-circular-deps.sh

  test-projects:
    runs-on: ubuntu-latest
    needs: validate
    strategy:
      matrix:
        project: [sample-frontend, sample-backend, sample-mobile]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/checkout@v4
        with:
          repository: acme/${{ matrix.project }}
          path: test-project

      - name: Install PromptScript
        run: npm install -g @promptscript/cli

      - name: Compile test project
        working-directory: test-project
        run: prs compile
        env:
          PROMPTSCRIPT_REGISTRY: ${{ github.workspace }}
```

### Project CI

```yaml
# Project .github/workflows/promptscript.yml
name: PromptScript

on:
  push:
    paths:
      - 'promptscript/**'
      - 'promptscript.yaml'
  pull_request:
    paths:
      - 'promptscript/**'
      - 'promptscript.yaml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PromptScript
        run: npm install -g @promptscript/cli

      - name: Validate
        run: prs validate --strict
        env:
          GITHUB_TOKEN: ${{ secrets.REGISTRY_TOKEN }}

      - name: Ensure compiled files are up to date
        run: |
          prs compile
          if ! git diff --exit-code; then
            echo "::error::Generated files are out of date"
            echo "Run 'prs compile' and commit the changes"
            exit 1
          fi
        env:
          GITHUB_TOKEN: ${{ secrets.REGISTRY_TOKEN }}
```

## Metrics & Monitoring

### Adoption Dashboard

Track across the organization:

```yaml
# metrics-config.yaml
metrics:
  - name: projects_with_promptscript
    query: count(repos with promptscript.yaml)

  - name: registry_update_frequency
    query: commits per week to registry

  - name: validation_error_rate
    query: CI failures due to promptscript validation

  - name: average_inheritance_depth
    query: avg(@inherit chain length)
```

## Best Practices Summary

!!! tip "Organization Base"
Keep `@acme/base` focused on universal policies that apply everywhere.

!!! tip "Security Integration"
Always `@use @acme/security` in team bases, never skip security.

!!! tip "Version Management"
Tag registry releases and pin versions in production projects.

!!! warning "Breaking Changes"
Major version bumps require migration guides and team notification.

!!! warning "Review Process"
All registry changes need appropriate CODEOWNER approval.

## Rollout Timeline

| Phase          | Duration | Goals                          |
| -------------- | -------- | ------------------------------ |
| Pilot          | 4 weeks  | 3 teams, feedback collection   |
| Team Rollout   | 8 weeks  | All teams onboarded            |
| Mandatory      | Ongoing  | Required for new projects      |
| Full Migration | 6 months | All existing projects migrated |
