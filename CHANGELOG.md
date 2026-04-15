# Changelog

All notable changes to BlueprintAI will be documented in this file.

## [1.1.0] - 2024-04-15

### 🔒 Security Improvements (MAJOR)

#### Fixed
- **CRITICAL**: Moved all API calls from client-side to server-side to protect API keys
- **HIGH**: Implemented comprehensive input validation with strict schema enforcement
- **HIGH**: Added DOMPurify for XSS prevention on all user inputs
- **HIGH**: Implemented rate limiting (100 req/15min general, 10 req/15min AI endpoints)
- **HIGH**: Enhanced file upload security with type whitelisting and size limits
- **MEDIUM**: Added Content-Security-Policy headers via Helmet middleware
- **MEDIUM**: Configured proper CORS settings with allowed origins

#### Changed
- Updated `VisualsLab.tsx` to use secure API service instead of deprecated gemini.ts
- Replaced direct alert() calls with proper error state management
- Removed insecure window.aistudio key selection from client code

### 📝 Documentation

#### Added
- Comprehensive README.md with full setup instructions
- Security architecture documentation
- API endpoint documentation
- Troubleshooting guide
- Deployment instructions including Docker

### 🐛 Bug Fixes

#### Fixed
- VisualsLab component now properly displays errors instead of using alerts
- File upload validation now correctly enforces 10 file limit
- Error handling improved across all API calls

### ⚡ Improvements

#### Changed
- Better error messages for rate-limited requests
- Improved TypeScript type safety throughout codebase
- Enhanced component error boundaries

---

## [1.0.0] - 2024-04-14

### Initial Release

#### Features
- AI-powered PRD generation using Gemini Pro
- Multi-modal input support (text, images, documents)
- Real-time collaboration with comments
- Visual asset generation (images & videos)
- Template management system
- Interactive roadmap visualization
- Search functionality within PRDs
- Priority management for requirements

#### Tech Stack
- React 19 with TypeScript
- Express.js backend
- Google GenAI SDK
- Tailwind CSS styling
- Vite build system

---

## Security Advisory

**Important**: Version 1.1.0 contains critical security fixes. All users should upgrade immediately to protect API keys and prevent potential security vulnerabilities.

### Migration Guide (v1.0.0 → v1.1.0)

1. Update dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with your API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your API_KEY
   ```

3. Run both servers:
   ```bash
   # Terminal 1
   npm run server:dev
   
   # Terminal 2
   npm run dev
   ```

4. Remove any client-side API key configurations
