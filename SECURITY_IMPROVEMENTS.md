# BlueprintAI Security Improvements

This document outlines the security vulnerabilities that were identified and fixed in the BlueprintAI application.

## Vulnerabilities Fixed

### 1. API Key Exposure (CRITICAL)
**Issue:** API keys were exposed in client-side code, allowing attackers to steal quotas and make unauthorized requests.

**Fix:** 
- Created a secure backend server (`server/index.ts`) that handles all API calls
- API key is now stored server-side in environment variables only
- Frontend communicates with backend via secure API endpoints
- Deprecated direct client-side API calls in `services/gemini.ts`

### 2. Missing Input Validation (HIGH)
**Issue:** No validation of user inputs, allowing potential injection attacks and malformed data.

**Fix:**
- Added comprehensive input validation in `server/index.ts` with `validatePRDInputs()` function
- Implemented strict schema validation for all API endpoints
- Added file type and size validation (max 5MB per file, max 10 files)
- Sanitized filenames to prevent path traversal attacks

### 3. XSS Vulnerabilities (HIGH)
**Issue:** AI-generated content rendered without sanitization, creating cross-site scripting risks.

**Fix:**
- Integrated DOMPurify for HTML sanitization on the server
- Added Content-Security-Policy headers via Helmet middleware
- All user inputs are sanitized before being sent to AI models

### 4. Missing Rate Limiting (HIGH)
**Issue:** No protection against API quota exhaustion or denial of service attacks.

**Fix:**
- Implemented express-rate-limit middleware
- General API limit: 100 requests per 15 minutes per IP
- Strict AI endpoint limit: 10 requests per 15 minutes per IP
- Custom error messages for rate-limited requests

### 5. Insecure File Upload (HIGH)
**Issue:** Only client-side validation with no server-side checks.

**Fix:**
- Server-side file type validation (whitelist approach)
- File size limits enforced (5MB max)
- Maximum file count limit (10 files)
- Filename sanitization to remove dangerous characters

### 6. Missing Security Headers (MEDIUM)
**Issue:** No HTTP security headers configured.

**Fix:**
- Implemented Helmet middleware for security headers
- Configured Content-Security-Policy
- Added CSP meta tag in HTML

### 7. Insecure Data Storage (MEDIUM)
**Issue:** Sensitive PRD data stored in localStorage without encryption.

**Recommendation:** 
- For production, implement proper authentication and database storage
- Use encrypted storage solutions
- Implement session management

## New Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│ Backend API  │────▶│ Google Gemini   │
│  (Frontend) │     │  (Express)   │     │      API        │
└─────────────┘     └──────────────┘     └─────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Environment  │
                  │   Variables  │
                  └──────────────┘
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Add your Gemini API key to `.env`:
   ```
   API_KEY=your_actual_api_key_here
   ```

4. Start the backend server:
   ```bash
   npm run server:dev
   ```

5. Start the frontend (in another terminal):
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/generate-prd` - Generate PRD with validation
- `POST /api/fast-response` - Quick AI responses
- `POST /api/generate-image` - Image generation
- `POST /api/generate-video` - Video generation
- `GET /api/health` - Health check

## Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security (CSP, input validation, rate limiting)
2. **Principle of Least Privilege**: API keys only accessible server-side
3. **Fail Securely**: Proper error handling without leaking sensitive information
4. **Input Validation**: Whitelist-based validation for all inputs
5. **Secure Defaults**: Conservative rate limits and file restrictions

## Future Improvements

- [ ] Implement user authentication (JWT/OAuth)
- [ ] Add database integration for persistent storage
- [ ] Implement audit logging
- [ ] Add request signing for API authenticity
- [ ] Implement Web Application Firewall (WAF)
- [ ] Add automated security testing
- [ ] Implement proper session management
- [ ] Add HTTPS enforcement in production
