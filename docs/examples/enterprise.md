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

@inherit @acme/base
@use @acme/security
@use @acme/compliance

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAABMNTYdWPAPQAjDHBjDBrfvzgBPdhkIDhAZgoAGEyrX8OpfSABiE9px78AClGxhm1EuYC+q1REIVhwYaggsfhEMRhIYeUVlVhEAVyUomLiZJUYU8KxNQLSYDNj4ljIoCAxWRiTA3k4sCM1+YFV1FRBzdQBNZhT+DGoSjH5xSSd+HhgANxgoZjQwociAQQBhAFkAUQoAiwBiQ-4dwmXqZqUD9QBafi3mGeo1ACkMWYwAZUZwtCwZAAVTTLH5-LAdfj3ABKMBikRgLC0cA4Pgs9wA6jA5PwLp5vDU6vwls0SBAAF7YCBsSH3NaMOpwOAQOTQFr8AAUGI2awA4vwAEwUACM-DWawAlLT+AAReAQADmamRqLgkK6fgOIhYjkIkXaFg13SOJ3sk2krncWHxJH4XywMQA1jcofwAFRu+ykGAAdy8jo9Alh8P4woAHNKPQAZGoKlIYBUwQP8YGg34Qf78ACskbdACEUtAeMmAGoREo59Hut32zRVVgK5OAjDQH3BHgbL5ffgAalKWRmzKVtywzEdnDVVY99uwSbdQbhjEiAEUUmFWn2AFppB3SXOA+DNBul8so3spw-BBX8KMs6jDDeWjCaH3hBU4CFTt0bZhkNhNOBk2iMoZELTk4BwYYYGcQdFWVTQURgEgpVYSFjjFahGBwcslzyeoq1sOEsDw24FCUZxPCgZ4NCwagUlwkZpS2CBfmYW4JkcaQ4HGLx+HcahEyGNA0EnO4HieFJYHGaCwipNgeOoDRIPCBtpTWFwAEl+EYKomn4RNWFk5p5ImW0AHlllYdSNJddCAGkYFaWE4AGTD4Bde45SHNQvgQ1EBA-LARMQGQZFgpUKEyGAKAqaUfz-Qz2BvO8HwCrAgrgELQIgSKyhi39pTNTjnAxCBHQgNKMqyttytyuJ8pIGQOKkHh1W6drVH8VDkhRGoeGGHhuINdQWBmARkEhToQAAVXSYMl1DMM+3Eb0-WoZ1jXUKbUxgMEM0iYIaPCBaSCeZRNq24RbBSWpjNYDAoG0380H-dhuLbXB+BwZgx24vqnr-Zk7p6S6QHmlc12oVp8Q0MJ5kU3qODofht16i0YZ0iAmhB7aWygNtpE7bsPpwft4nC1gRzHCcQYAXRdPEvBIQkYHGyahBADTWAiapHrkG6eCkgAeQVjGMOy8308kM2WVqLqmlwwluCQUg4J6Zg0cgIiPBUcY5qMNhcfgRaFLM4GR2wNJlY3QzFkhzf4DYo27EXTGFOmXRiRlmVZKoCjZiwpu5PlBRFMU1gBrWWb14Q1lV39Z2cDgUSvfgSaGQgYFuFhGPljmthqeNHuTnX+BGABHQsRgo3jDJ9aTsDwtU8+EL4UmErxInHTQ5GYAb+Hu2ZFTktR-rgX4YE4Mu4WeZv2eEHZWDgPCnsWRSdVoxRIn+zxcm45n7sTOJ2A97r1BLq8A62jnpu5yIS-eiJSbLEvOTDYwAFInvhhMYClFvOaOAVPeO6lhDyP0+geFODZkpyHvFDGOIAdgCh2GAlEEDSZuGfK+RUH4FJfQwMJVomBcBzwsPTVgXVAgjBRMdO6Q1pTCAAHJzBWMUbS7gmSR1elgMhYlmGsMUuwmorQCjLDTk-AYkQeDMFyMfB0wMLr3AEfDfgcEvCjAZPAH2bICjT0rhAEY8i+GuhUSsOA5U0B8T7jwK8MgwgSARgo9ySiOYsNUcpHgo0SjTWhFGbivEdSQGvJ8KAa4THKJAO4th6Rgj1hKCiOs8BOTsObK2ds-9Opaggp3XIvC2htRkBUF6iUIRIA5hqQOjsRiziGAPX0-BwbcNKRI3AiB2b3B2ntTMwQODUDADEEoMMaBLFElte4t8IhoN4R0u0o4oa9zHDRLwhQql0i0UyFkujWg6mZM8EeYyjQumEDIb6Y5hA2A2DUtWYw96jltE0s5jpWmkwfuYQpJcLkVI6lUjE+QSgP34GkS+syX6HnwTdKZby1kXmgdeW8cCHz4N6TAYBI9ZkuAkBcfgp1GDlRgSQvpS82qVMKRgYUwpCjlOELCIeDSYZe20Vsv2rQIBMnCe8w0IAZB4i+TSuYWN67DLCDaFmaj2UuM6iAXwtMGBNChvgIgpByDRRoPQEA8NmRsHwMKaVQA" target="_blank" rel="noopener noreferrer">
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

@inherit @frontend/base

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaDGjTyxEuAE92GQrPkAmCgEYKABn2sAvmLHcIrRdQhZB3MGo2DlYpAHoAIww4GDdWbhZ2Ij9RcUEaZgArJSwLEABhRRV1PwBBXSgIRmwINicJahg0ZjhfZmojPIBzXxw1CIoWEjCMRj4wxiLVDW1desEOUjz85hI+akZYkAN0oKk1RiwAeQB3VhhqPIApDHPBAGUSXvmOSYAZGAwZORAr5hxxAARZhbOISfTbbZpADE0MERwAbhcERAYCcwYIALJqKBYCCaOAcNCCSZKaZ+MBQZgnQRgdqCUr5TEAUUEME0Q3Wm3SUGwdOoJAoOwAErcpLA4CSMNQ-I0UWi6II4DgILpPF1FZgjHx2IqxSS2JABTU2ELWDtYYIANIwIyCACSSS61BNrDgGM0ggAChhtZxcg8sD40DBBMzYDqsO60p77iq1awurI46rmYnPKHSl77TtPQAVMyyUoIjC8l25hmsUtGPGMODJmBdSOCADUWIghEw5ygGMtpQ2KteWDUjQ97cYQU0gWCnCkggAFJjmPtYIIAGIwKQXV0ASgrcelm6ViigUFk3FG405F02BJPPZj68+w8atN5XXrgjeGDUrEmgOlZQoCMHYIScVxzXiZJZyVARQmlKRJVSCQtUjWRkIkXZmBRLdLh+e4g1VUE0hQxgIBWMhKluTZZCDNRYhIwRziRagCPaGB8gQgCBFo6h6J2CCIPcZRWGpWApC6UMMLAqEJD7bMw1CZpPCjXtLU4mUHmRKpQ3naoZQoS8YEGVY90fABxZk80ECZpT8T1zP4EkR0adgpRlCsvQAVWs2yZTCXwYBIOAwkQaRBE9Ly0CkbBQ0CkgK0BZk3is1k-KwAKOGC0Lws9AAlILsLirK1LhQoyRKLTqBRbk9KmEpDLGYyhjMiRPS9I57l80lig0MJCTsiKHVYXwIFLCAAC9Qx68lPJ8myZpKHLwmVVU0HVIb7ic1aEy6ObuvqvqwvCVD-SGr0gk2OBJVO9hPM6g6KqO6QJlWch+FDT0KPejhBHaXC1KfbAR1DNd32jCtFpmHR3s0LUiwqUMfTtFTGxdPE6kfKGtCIGh4E-I5zg5SoVBJQ6sEh8ntDAI0SCLGmIAFWlPGo9VAeZaggmoQQVi3CHH3yUo8rzAB9ZlMS9PMAE1ZA0vwcGiJjmEkLLozah5hXtL1swAOXMkWvJ10oADVSntN5SgAIRS2XblEvwdoWZWvikRprs80opZZHXRaS-I3ntHXmUBWRkebMAMGgTcK0D43mR9o48qlsW8ryxPZHtLK-o0P6wFg5gVFAyFwLibhlXaLBGA0JCi4mKnKWpeQ8mFGAoGJE5ejJp6KSpGkIEooL-VdeZ5DCW6KaQH4W7bwQO9wQNg1DcfJCddHanNWSfn6+N1sTJup9b9vO523euilKAq95DGN9r-SJ+bw-Z87u-BBIW4MEkyNwJAZwAF0GH9B0fARBSDvSoLQEADAWKtDYPgGwP8gA" target="_blank" rel="noopener noreferrer">
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
