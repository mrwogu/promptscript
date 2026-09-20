# GitHub Copilot Instructions

## Context

### Authentication Module

- OAuth 2.0 with PKCE
- JWT tokens with refresh rotation
- SSO via SAML 2.0

## code-standards

### auth

- Store tokens in httpOnly cookies
- Session timeout: 3600 seconds
- Enable refresh token rotation

## Auth API Endpoints

- POST /auth/login - User login
- POST /auth/logout - User logout
- POST /auth/refresh - Refresh token
- GET /auth/me - Current user info
