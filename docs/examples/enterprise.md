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
    "Code review required with minimum 2 approvers",
    "Document all public APIs",
    "Add inline comments for complex logic",
    "Write tests for all code (80% coverage)"
  ]

  git: [
    "Use conventional commits format",
    "Branch naming: type/TICKET-description",
    "Signed commits required"
  ]

  deployment: [
    "Environments: dev, staging, prod",
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuGRnwD0AIwxwY8sRLgBPdhkKz5ARgoAGKzvGDm1AOamQAQQDCAWQCig9w7QHbAg2WwBfMTFuaU4sCCx9YV05EB1UuwBNZgBXQQxqGDzxVwBJQRYpCFZHPLg4CDgBdjysQQ8fPwCguLYKSLsAYgHOgsEANQwobPh+iQBaQQAqRYBFbMn4xIAxCFosZdkAdWp4wppmKWzGHtY5gowpRIrtOwXlgGUYRmyThLaoADuGH0cAOgk+31+iQaglYzFazDQN0myTeiwAqlpqIItsxvqDFrJ-Kx6lIYNjcIVOFJBNksailosACowUiCAAKUGB5LBx1O5QuhXhOHJcHKGHEJAwVQEVVmgiG4KaUnyUjg8txUCgzABbS8vm81SqMHJVRq72VqrFADcAMw2OwAChwWCwaDgiBUKgBEAA1hAKEo+BQWCQVJxHMbTdU5o0JSrqGqAJTJNLhfrcOOsBNqpJ2Z6yZDJCTyfxkwQFa0QGC6goAR2yuxgNJ9uEEJCqEBI2RIggATHk0OdraL5HRiykACJ4nuxPJawRobJqKAQRhtdkldUgcd2EtuKQ0qqr1iFUN8dhisAOAVkWCEQTayOMMcT+R8jiCDiNK83yZQAVy0dAAOSwAFIBRHagMEcGAU3SCQAF15UjLBCzfEBMTPNgR3YEJWEmW8OywX9qClLBXz3FIACFoNYRgcFhUgzVkBI0BgFQmRKdwAGlvCZOYyTgRgTiRfDKIkfd3ggRxTxpc94jFetGwKKRbCQ+UyXIZh9AvNDBCLKj5ENKtqDYPSPUEMlrToQQ40japbPONSdww9kzMua58IrGAGybMUOFIOZYAeIoaS0SFNkHYcUQQwRkNYCJWCiApGhOLy2DFURXhSAA5GAoKI+I7K+AoSNskTm1iCBJjgWyb1cTdBF9GAQXUwQFnkfLCrUfRMDqQDCkratdWvbFnKuG5yhwCVYO3BkuoK8krJgbTElbHAclafr6mqPwShUdxJ3azqQG65aZLhUYIp+KLhIlU9sUgbMzXmnLFsKulCi0gpGGwZsVvY7NOEYasxQ25q4QBcR3DGbw3vmPKluxRoHEKTcyiqR9mEcN6kqiOBNuoLBvhIvN9xULMc23FwACUCpGvJHGlElWnaXwqatdr5Epr5boSeQXAhfnEmGmtuZAFR2OoMBBZSdlyTGqV6KGhnxfSMIQDCRCGFiah9HwIhSHIGAqFoHcQCg+o2HwMwtaAA" target="_blank" rel="noopener noreferrer">
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
    "Use OAuth 2.0 / OIDC",
    "MFA required (TOTP or WebAuthn)",
    "Session timeout: 3600 seconds",
    "Enable refresh token rotation"
  ]

  authorization: [
    "RBAC with ABAC extensions",
    "Apply least privilege principle",
    "Audit logging required"
  ]

  dataProtection: [
    "Encrypt at rest with AES-256",
    "Encrypt in transit with TLS 1.3",
    "Mask PII in all outputs",
    "Follow data classification for retention"
  ]

  dependencies: [
    "Daily vulnerability scanning",
    "Critical vulnerabilities block deployment",
    "High vulnerabilities: fix within 7 days",
    "Medium vulnerabilities: fix within 30 days"
  ]

  secrets: [
    "Store in HashiCorp Vault",
    "Rotate every 90 days",
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuGRnwD0cGIwCu1CFgCe8sRLh72GQrPkBGCgAY7h1gF8xY7tM5Zde4UbkhDAPFBAEE0ch8QgGEAWQBRQXUtHX1EgVYpDGopOEEsZkEMKChBFikYCj8AZQ1tb0lcmAA3GGo9NhgAclzqeDQ2OAgAI2hvSuDAxxdWNzh0zOzc0WCMTVxPCEZsCDZZZD8JeQBVdUEAeRC1nEEAJjtBFXOASQARKPk6A-8YgDEQwV6AEdNBBelJBAAKAAqZyhAAVBMxqIIAOowIaXXCsACUHy+8hqcEGbDyED4zDWsgAzAA2Wy2RIaNg5PHBQ4gOKsDBDWAAmBgXpwa75ADWnABzAEXjYjgkAF1XCsrkiIAAvba7QT7Nn+ABKACFooIAO66a4hQ1RQREDisYl21kSdlhCKCWAYOaCGgQJrQGAAcxgXp0rEYEHIMEdTvklykujdzH9-ogrH9fOBoJgUllggVM2CmQEcOoko00tYe3xHNDbTQWEK9cF9dNuFCcSqAFobgBWGlR9mcxi1+spvLUDB2+Mt65QgAyVUENip-e+HpFgjhTyeknERRKFKwaDWcBX8h+zGKzGNgkLQkYUA9g0gW3LgjASL5tvLObzfnKaE4cpQwgeBKx1eQXgwaAfCaTQoFYVpuVGVI4C2VhWBTf1TxAKIUk2IpBFg+DEJGKBdBA3IeWYRh13-KBmD0Ph2GwgAJCB-WuIiEPHUjyNAt8IEIE0zVHAB2G8MD0E8QE+cCQBiLMIE0EhCLg7ikLIrx+MgITp1HKkGUyKSf0VYwNF6LA4DAp1-CqfJeh3QQWI9HAICiJE0EEAA1VYoCwbDdUlbAg2aVofAATkMyTpNkmz5AAOVC5E5iRIMkgs3JRzKSMgnlMRpjcJsdEYcslj8Dt-ESlpkvsoNMCJY0kRyRzyCg8QOEIfzcsECqEqShM03UScvBaCSBEheq4EaxY6DyZgxTtWbNyeXFut6kAqtaQRNFOGIXm7RFkSqFiQisN8PySOpUiPah+nUaTysq-q4zgbleTnBdGFaLxn2CwjWggX7vzWp7qu205miKCFsUOxIyWgLJtrtDAwCDMBNFDUqc3WzbkSwagdvrHatpTI9mzNA9CKKaQNRmEG+rBog7rSgQaLHJR4BakspE0Eqdjpx6YygY1ovBuqslIfgAdVLNBGBAHOYhVgCiqABFWdSjYF9OFp1bBZAEJhdFppqcLIMJ3BV6MK8GWBN5TRyGYDAWXpg2jakyQyFgJjGz+siSHI1NzuREJNwe5xFW4EVleNWApEDXwJgCZO-AAYlTwQamSepdXgClqC+k98wkCqs6unwAHEQXKMiEKswQcCwQ8rJUFRTRFCAKCUPgKBYEg1FqFIDGCCqnmAoD61zuB+jtGBZEb5vEFb9vO+7io+5UFMwwnjtBRn9RHrLofBChccU0w+em7QFuVHdahWC75R1+YfvLqHx79U0NN9Qpdg9EvxerccBKDFCWBCvcX4qDXqZQQ6dBDuTMCVIuh9B71ChDAUgsg37eEUE-CBJBHpj23p4Jykpa5z0EAAaisB2AAHPSDsVQ4hRA7NEeIh8Hw0VkKnbB+gOw4BgFANAfhJhBAKqwbgQokRYC0JZRO7IVC4F6NgDsJBmA13kJYEALFBGeSHBgjghQ8g4GUfWNRGjuryBUFxDsjABE0U0f4KI9j1zvmRH3NR4guIkWQhRHMVi34wFseonKWjc6+hgNebKwdGTZ1SBAIkmh4BTBAE4OUDBPBtHwEQUgEYqC0BkiAaq9p8BWFSUAA" target="_blank" rel="noopener noreferrer">
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
    "Logging required with 1 year retention",
    "Tamper-proof audit logs",
    "Access control documented and reviewed quarterly",
    "Change management: documented, approved, tested"
  ]

  gdpr: [
    "Apply data minimization",
    "Enforce purpose limitation",
    "Consent management required",
    "Support right to erasure",
    "Enable data portability",
    "Breach notification within 72 hours"
  ]

  pci: [
    "Applies to payment services only",
    "Never store full PAN",
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuGRnwD0LMlAgZWjGPLES4AT3YZCs+QEYKAJgoAGfawC+Ysd2mcsELEeEG5EH0g8UEAUVY4AFdqGEEWKTi+fjhBAEEAYQBZMPjmDS0dONiARyiIWL52OAoAgHU4jFjBAGUAeQzBG0EAFSM0OIBJQcFtKUEAcQARAAUAJTyC7Sxa0OCnV1Z3OAFWKSapVNFQuGZGG1lkAIl5ABlmAHMHiFYHwVLy2PGAdx8cQUsgiMMCa734XggbHkdGugR6pAG1AAtDRmMwwKMolIfIIoI84NDYfI0oxdHBUix2NRmFBBFIzlEqhxxmMwQA3CAwb4wcZlJocahQIyE0I3EAZHDaB5JbQYaVM2T0xiMrw8uijNCotlqwQcHY8pwSAC6blCDykNEuRJAaU1Qrp2CEJBeEGdAC9sJCtiAYaLAhEwMxqLpBGgYmhmHA4ppnQJvFCfdaMmwo+xBCRZfKvGCyhUDYm-fIWlFNUGsO8IA8cOWsMxBDBqBhorERRIxREMAAjWAOgShstd6A+YUFtuBABCsSU-1YzG8kEYnrYgl+uBeggA7N0cMwYgSQsbTRI0IwIFbCza7ZzUrXQxgjEzBFHqByyYI2ELW235AA5GDa6gn1rZowCiKBaRmNIfy-dsdGofp43ED48ykQ1BBNFxTW4WIdmoCBGEQo4AiRQI-wA0NqTJVJ9j7TsYCMNhxh2bAeVDcNIz0A9BBI39-wbMEBHXGihDxV5+NwbRBFYGAqKaEdiMCNIoG+e9qIZR9hIos54DgF43iUbwOW8eA0J4m1lNUrSOUSXshGiTsACsZPLPCqywVI+EYSVWAgOASH3BTePIrBG0iMB+M029Z1YJEME1altXGWJnhTDYsIAa1nb5YCkaV-DWIJCoCABiYrBGTJYikEOZ4F3YMTK2UISIq8hChDGYBygWRqywNA4EQFQ1HyVrtF0CglD4Ch1AUqZHXKqAm10hcl1YbqsF6-rBt+dKIHG5QYCm-IVGEpFGAW8kIGWxCFJmPC2SUPwOs0RgjDWjaBpUCaDvUFQaAge6XqPQRSsEWa+wyc6lvwlagZIgAqOGZiibt8IR2QsiadL+D09MWLwjAoDgdUwxRxg6TOAkmsEBHBnYBtWAJtHBFpgUGdpdQSCiHzF0I9VoqRVNdMMvQqYR5NWEgRJ2C0KAmfHKJdOk8lbPVZUdnyfiXkDBSEZq3D8OZJmZmGdVIAZnQZZV+IvghAnKZKsqapStnqpgXNKi8e2qbCABVWRpnmRYRqq5CvgUjICcuoMfIwWQMgySCg80Ubijdz4DSpgAJEEoFwRdYlkTPBkgtIVxwBtGivRduxFsV1hcEBnCNBgvHg-AiARSgaHoEAAN0th8EsRugA" target="_blank" rel="noopener noreferrer">
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
    "Use React 18+ framework",
    "TypeScript in strict mode",
    "Functional components with hooks and composition",
    "React Query for server state, Zustand for client",
    "TailwindCSS with @acme/design-tokens"
  ]

  performance: [
    "Initial bundle < 200KB gzipped",
    "Per-route code splitting",
    "LCP < 2.5s, FID < 100ms, CLS < 0.1"
  ]

  accessibility: [
    "WCAG 2.1 AA compliance",
    "Automated testing with axe-core",
    "Manual testing required for new features",
    "Support keyboard navigation and screen readers",
    "Ensure color contrast and focus management"
  ]

  testing: [
    "Unit tests with Vitest (80% coverage)",
    "Integration tests with Testing Library",
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuYamw6spAegBGGODHliJcAJ7sMhWfIDMFAAy394wR1IWQAMWXtOUwQAUo2GDM1CQOAL5iYgDEggCS4kIkAK5QWBAAtJCwgrpYSWh0gkbMSYIA7iVQPhCsODDUEFiCGGqCSbqI0YLcNXUNTdwYjHxaOjASMQAU1DAA5hBwWNRGgumCUgsYmrA+QdSC5BhGs8pJagCUXdzt44PDMOq6jEn9K4JTM-OLy6vrm9swXbBA4BY6nC5XG7dIYjFhkKAQFqMcbvQTTOYLJYrNYbOBbHaCPYgo4nEoQ1g9KScNJYFaiRz6EAOCQATRKzRmzUJnlUPipADcYFBmGh6s0mgBBADCAFkAKIUSKOKIxOWEUXUNK6JUSNYy5hU6jiABSGH5GAAyowGmgsOoACpGUVWm1YAy-ABKMCGTRgLGMixgoUcawA6jBNAd6nsSEjxiK0iQIAAvbAQNjutYSxjIuBwCCaaCNFaTUNSiUAcUEACYKABGQQSiWXEOCAAi8Ags3EAY4JDg7sZ4SV3BYXkITXpEiHTOVMQ8Km8fgCWBjggtAkYAGsdb8AFR7jykGAVahbg+yL0+wR1gAcmcEB4AMi1ZkkMLMYBfBI7ndaILaggAKwPgeABCSTQFI34AGqNOMIGtgeG5GAirCzN+9oYNAZQ1FIUoWhaggANTQvc6hUvm3bpFgzBbpwA5IXuG7YF+e6Xt6jBNAAikk9QrKRABa7QCGooF7va8BpOhsHwYsJE-lJNSzIIT4FtQGA-KR-hHGUDSzDgbpMVKzBkGw1JwN+dwjJBaJwDgmmAusnbdjkRiBiQLbuiqjbUIwODwVxLx6KwD5uN6eQzOk2i6ECVRit8SRBTMD4yhA1rMJkPLeHAhLAgE1Cfs0aBoIxuqCPqUgpOMYCAvUaZsHl+z2ZpykPhKvixIIjAItSgifqw9VpI1SimYIADyoqsB1sS7j5ADSMArF6cAlH58C7msHZUeIFruX2siGVgpWIOoFEuawFAwjAFBwg+JlmYN7CqepmlGIdWDHXAp3qJBV33LdplhdlrShhAW4QB9X0-bhEP-XwgMkOoo1eGJDJMhjYgRKFFKLC0UiaVIuVTt1BowLIyDutOIAAKq6IIV5cTet6kUox6njuIB0FTcggL+MAugBTQ1DkSzpU0JBk-I3OONTbhnFx6asBgUCk49FnlI0OCCDgzB0bl+Nq2gzD5sNoVczz8iMzxfE-ESujUIKzUCBwhTCXjrREj1EDUtLlt89hUC4WoBFEbhuBkSMlFdqwNF0QxzKCAAuruGoxnGFP+-EjSIqrmhnFI2QADw1jYNjzWB-XJgBopSH7su8749TpKcHCk1SOTkI00mzPXEjU0+Uq+IIJe1kBcCFG4sRtiPN5l-2hRSk+REl3YdaJynOMSEMub5oWCK0pnDfyGWlY1vWjYSkbCJxn3-fyBKSS0bGHA+BwizKZrEdmDA6QsClFtj4gBlC0d8qt3490EDMAAjpBGYQJ9iDTKISCKwUByAP7rzC0+RjaakEPRIwmhmCE0EMrfkXYGoJFaHAa0MBOBQO9IadBMtMHyDlKwOAwVSbCn2GOJYOgmiGyCM8XKsZlafj4OwDeu4IHKSPqw2mrBGhOCkrlcO2s4IQLRLeGwABSUmTsPwwEuBg++IB4gcBOJQlRiw1Fa0Uh-dCL1NAaWWHfamcpqxyhsVgOxEcdJGD0l2QyTUdYYBKisTAuB0Huk3tjMQ3AZjfHFkrYmD55AADkYBOzaPTHqOhcpwmNk9Xxic1iZOyWKKELQVi0lFF-XWT91jMGeJIl2Ssym8yyTkmOwRxg73gHvIstIGGwIgDMNpMTWwVJyXACGaBBDCgwBsdC6h6jKGdqxKZ5UZligctQKQLAO40w9E+XKwIxyQBUuaKAfFtm-F2fsKENQ0LjEWKheAaIoRYRwnhExWMRz2WCFgZ4vjhCDhAOoIp5kpFIF5kOBuUoZisS5EghmnEmjQpKQ0zoDc1j80FoBGoHBqBgCGDVYENARRlX7msGmSimgQJpeVDcwRCF6y3KLNlPMsw5kGQWYZKwxz5kNJQmlM5dzyHULrOi8hXBIoiv07qIkxrWx1hyhpPipkQvUBAuV8LMYN1DP0cYTLclyJ5YITRUlQlnGUUyy1klHEqTUi4t6oTiVzA0mbS1vhlAakEJLbcn8okko4RChFOqMB1jrEYfVVtsk+2QUSAZeYBUHxWAsThG1Zw6rTvGkAXpyEnlCWnYIYjkSSDzHc8IIAwhJwYNSZY+AiCkHIDdGg9AQBO3zGwfAdY61AA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEjOGIwDWzAK5YAtBjRoA9DWZkscRtQhosC6swBWQrFVoAdVgAESMLBl7BTvXhAAmiXsaaCR4qTLTv7vHAAnuwYhK7uAEwUAIwUAAz+rAC+pqZ8AJKsvDYkYlBYEJKQsIFWYmh0vEHivADu4lBOjqyC6li8YDoknTrsnM0ARhhwMIjpvGYQrTDtk11sHKxOcsOjDnwAFNQwAOYQcFjUQbySvE4HGIOwzWDM1LzkGEG7OmLLAJSmZiz9hB12bKPHT6RhYCIgADCnlEEl4AEFZFAIIxsBA2EkHDs0Mw4BAsPcghD9rgxIMKCwSHIMIxLHIBEJYT5ZJjeBxSBDIUpLNRGDBWYonGIwQB5OqsWYQgBSGAlvAAyiR8ThWRwBAAZGAYFxuEBS5g4bIAEWY-JAaSB-nN5qB3D4IoAbrMHRAYHULQ4ALL5QqSQ4wND8GHeTpQZh1Tr3BGQz0AUV4MEklJ5fMeUGwd2oJAoAQAErKnLA4PwMNQOjsXW6qnAcBo0NNdlVMEFLOwqgX+GxIFm0Wwc6wAnbeABpGAnLIcV691hwD2nXgABWerfBCqOGhgvFjsBXs6BZ3ltdkDdch40sdY+zl8IXGQCZwAKmFXPCHRh09QMPeEax30FCowcCnnsK68AA1LwnoQIQmASlAc5DvCvK1mqWBiDsc5nFBajMMUfRLM0myeswQqlAAYjATizNOXz7gqOClpRgSCFAUCuGYNJ0smsx8n6LHwXRFHYOhm5gOmuxAbw6oYO8AhGqWwhQEEARWkkqQDuYRAEYE1jLKWTjFoCDjNiurhGQ4wLMC6VHUBC8rrmgZoBMZjAQFyZDIrKfKuEcYj8kCDgSk61D2fcMCQvp8nWD51B+QE6nqd8wisOGNy7Ju5mqTaGx8DeGRbssOLTCoCFDhFZYKs6KKbpsqJlhQnEwBSSi0Q4ZwAOKxg+vD0qWHQdVY-DoTs7AlmW34LgAqt1vVlnI+IwCQcByIgzjzpNaBONgm4LSQ35GrG6pdfGs1aLty2rc0ZwAEqLVZO0cHtGk5Xw0KMiG8pVamtXBhIDW0k1lKtfOC4ivKM0Ml4EhyIcfXzlk+IQO+EAAF6bpDTITdNPUY94K3ODDR71pe86fR0NZ1g2WMQ79WiXQoy6cP1i46HycDFiZTMTWDNPvdD9OUuQVibmc7lCxwvD3DZpW8EJaE7LL4l7t+uMSNISKJs2L4a4uzwtJOn6FBidGq1IRA0PAkkihKSbIiIQZ81gKu09IYDdiQL5uxAWadNMXlU89vBDrG1A6A8XJUcrdGQvC10PgA+rGnoLg+ACarjlR0DHFiljiPXubUKrmGQLreABy7Xx5NZfwgAavCGTqvCABCR0Z7KKXk0ebLMDkThODs7MTfCqdxmXCcHZC6oZGXsZGq4S4tkznQYNAlHfjPtexuPIrXanifXddu+uBkj2S3CzBgDpzAiCp1pqRaZg1vcWCMBIhl3-SLtieG7gQrmMAoCBjqMqB2UMOg-wjBADyi0mbTlZO4BmS92B-11AAoB9RQH2XUI5R4jNRrFT2IbdEA5sq6kJpTS8qD3DoOAaAimx4SaoigG-dMRtSGfzqk7JAaDAF0NwGNDoJBZQYHSiuNSIBkgAF0GBM2OPgIgpAhZGHoCAYKeI2D4BiJIoAA" target="_blank" rel="noopener noreferrer">
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
