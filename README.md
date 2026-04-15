# BlueprintAI - Professional PRD Generator

<div align="center">
  <img width="1200" height="475" alt="BlueprintAI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <br/>
  <strong>Enterprise-grade AI-powered Product Requirements Document generator with security-first architecture</strong>
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Security Architecture](#security-architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Usage Guide](#usage-guide)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

BlueprintAI is a professional-grade Product Requirements Document (PRD) generator powered by Google's Gemini AI. It helps product managers, engineers, and teams create comprehensive, structured PRDs in minutes instead of hours. The application features a secure backend architecture, real-time collaboration tools, and AI-generated visual assets.

### Key Capabilities

- **AI-Powered PRD Generation**: Create detailed PRDs from simple product descriptions
- **Multi-modal Input**: Upload images, documents, and text files as context
- **Visual Asset Generation**: Generate product mockups and videos using AI
- **Real-time Collaboration**: Comment and collaborate on PRD sections
- **Template Management**: Save and reuse PRD templates
- **Roadmap Visualization**: Interactive timeline with milestones

---

## ✨ Features

### Core Features

- **Smart PRD Generation**
  - Comprehensive vision & strategy sections
  - Detailed user stories following industry standards
  - Functional requirements with sub-tasks and acceptance criteria
  - Risk analysis with mitigation strategies
  - Technical constraints identification
  - Multi-phase roadmap planning

- **Security First**
  - Server-side API key management (keys never exposed to client)
  - Input validation and sanitization
  - XSS protection with DOMPurify
  - Rate limiting on all endpoints
  - Content Security Policy headers
  - Secure file upload handling

- **Collaboration Tools**
  - Section-specific comments
  - Real-time synchronization across tabs
  - Priority management for requirements
  - Search functionality within PRDs

- **Visual Labs**
  - AI image generation for mockups
  - Video generation capabilities
  - Multiple aspect ratios and quality options
  - Download generated assets

- **Template System**
  - Save successful PRDs as templates
  - Quick-start from predefined templates
  - Template sharing and management

---

## 🔒 Security Architecture

### Implemented Security Measures

1. **API Key Protection (CRITICAL)**
   - All API keys stored server-side only
   - Environment variable configuration
   - No client-side exposure of sensitive credentials

2. **Input Validation**
   - Strict schema validation on all inputs
   - Character limits enforced
   - File type whitelisting
   - File size limits (5MB max)
   - Maximum file count (10 files)

3. **XSS Prevention**
   - DOMPurify integration for HTML sanitization
   - Content-Security-Policy headers via Helmet
   - Server-side input sanitization before AI processing

4. **Rate Limiting**
   - General API: 100 requests per 15 minutes per IP
   - AI endpoints: 10 requests per 15 minutes per IP
   - Custom error messages for rate-limited requests

5. **Security Headers**
   - Helmet middleware configured
   - CSP directives properly set
   - CORS configuration with allowed origins

6. **File Upload Security**
   - Whitelist validation (images, .txt, .md, .json)
   - Server-side file size enforcement
   - Filename sanitization
   - Path traversal prevention

---

## 🛠 Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

### Backend
- **Express.js** - Web server
- **Node.js** - Runtime environment
- **Google GenAI SDK** - AI integration

### Security
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **DOMPurify** - HTML sanitization
- **CORS** - Cross-origin resource sharing

### Development
- **tsx** - TypeScript execution
- **dotenv** - Environment variables
- **JSDOM** - Server-side DOM for sanitization

---

## 📦 Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd blueprintai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Your Gemini API Key (get from https://aistudio.google.com/)
API_KEY=your_gemini_api_key_here

# Server port
PORT=3001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Environment
NODE_ENV=development
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_KEY` | Gemini API key | - | ✅ Yes |
| `PORT` | Server port | `3001` | ❌ No |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` | ❌ No |
| `NODE_ENV` | Environment mode | `development` | ❌ No |

### Supported File Types for Upload

- **Images**: PNG, JPEG, GIF, WebP
- **Text**: TXT, MD (Markdown)
- **Data**: JSON

---

## 🏃 Running the Application

### Development Mode

You need to run both the backend server and frontend dev server:

**Terminal 1 - Backend Server:**
```bash
npm run server:dev
```

Expected output:
```
Server running on port 3001
Environment: development
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Expected output:
```
VITE ready in 250 ms
➜  Local:   http://localhost:5173/
```

Open your browser to `http://localhost:5173`

### Production Build

```bash
# Build the frontend
npm run build

# Preview production build
npm run preview

# Start server in production mode
NODE_ENV=production npm run server
```

---

## 🌐 API Endpoints

All API endpoints are prefixed with `/api`

### POST `/api/generate-prd`

Generate a complete PRD from input data.

**Request Body:**
```json
{
  "name": "TaskMaster Pro",
  "description": "AI-powered task management...",
  "targetAudience": "Remote software engineers",
  "primaryGoals": "Increase productivity by 30%",
  "keyFeatures": "Smart scheduling, AI prioritization...",
  "roadmapPhases": [
    { "name": "MVP", "keyGoals": "Core features" }
  ],
  "contextFiles": []
}
```

**Response:** Complete PRD object with all sections

**Rate Limit:** 10 requests per 15 minutes

---

### POST `/api/fast-response`

Get quick AI responses for tips and suggestions.

**Request Body:**
```json
{
  "prompt": "Provide a product strategy tip..."
}
```

**Response:**
```json
{
  "text": "Your AI-generated tip here..."
}
```

**Rate Limit:** 10 requests per 15 minutes

---

### POST `/api/generate-image`

Generate images using AI.

**Request Body:**
```json
{
  "prompt": "A professional dashboard UI...",
  "aspectRatio": "16:9",
  "imageSize": "2K"
}
```

**Response:**
```json
{
  "imageUrl": "data:image/png;base64,..."
}
```

**Rate Limit:** 10 requests per 15 minutes

---

### POST `/api/generate-video`

Generate videos using Veo AI.

**Request Body:**
```json
{
  "prompt": "Product demo video...",
  "aspectRatio": "16:9"
}
```

**Response:**
```json
{
  "videoUrl": "https://..."
}
```

**Rate Limit:** 10 requests per 15 minutes

---

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-04-15T12:00:00.000Z"
}
```

---

## 📁 Project Structure

```
blueprintai/
├── components/              # React components
│   ├── ChatBot.tsx         # AI chat assistant
│   ├── CollaborationPanel.tsx  # Comments & collaboration
│   ├── Header.tsx          # App header
│   ├── PRDForm.tsx         # Input form with file upload
│   ├── PRDViewer.tsx       # PRD display component
│   ├── TemplateManager.tsx # Template save/load
│   └── VisualsLab.tsx      # Image/video generation
├── server/                  # Backend server
│   ├── index.ts            # Express server & API routes
│   └── tsconfig.json       # Server TypeScript config
├── services/                # API service layer
│   ├── api.ts              # Frontend API client
│   └── gemini.ts           # Deprecated direct API (kept for reference)
├── types.ts                 # TypeScript interfaces
├── App.tsx                  # Main application component
├── index.html               # HTML entry point
├── index.tsx                # React entry point
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite configuration
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

---

## 📖 Usage Guide

### Creating a PRD

1. **Fill in Product Details**
   - Enter product name
   - Write a brief description
   - Define target audience
   - Set primary goals
   - List key features

2. **Optional: Add Roadmap Phases**
   - Click "Add Phase"
   - Define phase name and key goals
   - Add multiple phases for detailed planning

3. **Optional: Upload Context Files**
   - Click "Upload Files"
   - Select images, text files, or JSON
   - Maximum 10 files, 5MB each
   - Files provide additional context to AI

4. **Generate PRD**
   - Click "Generate PRD"
   - Wait for AI processing (typically 30-60 seconds)
   - Review generated document

5. **Refine and Collaborate**
   - Add comments to specific sections
   - Adjust requirement priorities
   - Use chat bot for suggestions
   - Export or save as template

### Using Visual Labs

1. Navigate to the Media Lab section
2. Choose Image or Video tab
3. Customize the prompt
4. Select aspect ratio and quality
5. Click "Generate"
6. Download the generated asset

### Template Management

1. After creating a PRD, click "Save as Template"
2. Give your template a name
3. Access templates from the Template Manager
4. Load templates to pre-fill the form

---

## 👨‍💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run server` | Run production server |
| `npm run server:dev` | Run development server with watch |

### Code Style

- TypeScript strict mode enabled
- ESLint rules configured in `tsconfig.json`
- Prettier formatting recommended

### Adding New Features

1. Create feature branch
2. Implement changes with tests
3. Ensure TypeScript compilation passes
4. Update documentation
5. Submit pull request

---

## 🚢 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure secure API key storage
3. Set appropriate `FRONTEND_URL`
4. Enable HTTPS in production

### Docker Deployment (Recommended)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001 5173

CMD ["npm", "run", "server"]
```

### Cloud Platforms

**Vercel/Netlify:**
- Deploy frontend as static site
- Deploy backend to serverless functions
- Configure environment variables

**AWS/GCP/Azure:**
- Deploy backend to container service
- Serve frontend from CDN
- Use managed database for persistence

---

## 🔧 Troubleshooting

### Common Issues

#### 1. API Key Errors

**Error:** `Invalid API Key`

**Solution:**
- Verify API key in `.env` file
- Ensure no extra spaces or quotes
- Check API key permissions in Google AI Studio
- Restart server after changing `.env`

#### 2. CORS Errors

**Error:** `Access to fetch has been blocked by CORS policy`

**Solution:**
- Verify `FRONTEND_URL` matches your dev server
- Check server is running on correct port
- Clear browser cache

#### 3. File Upload Fails

**Error:** `File type not allowed`

**Solution:**
- Check file type is in whitelist
- Verify file size under 5MB
- Ensure maximum 10 files

#### 4. Rate Limit Exceeded

**Error:** `Too many requests`

**Solution:**
- Wait 15 minutes for limit reset
- Reduce request frequency
- Consider upgrading API quota

#### 5. Build Failures

**Error:** TypeScript compilation errors

**Solution:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

- Check existing issues on GitHub
- Review error logs in browser console
- Check server logs for backend errors
- Verify environment configuration

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code style
- Include TypeScript types
- Add comments for complex logic
- Update documentation
- Test thoroughly before submitting

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with [Google Gemini AI](https://ai.google.dev/)
- UI powered by [Tailwind CSS](https://tailwindcss.com/)
- Developed with [Vite](https://vitejs.dev/)

---

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check documentation wiki
- Review example PRDs in examples folder

---

<div align="center">
  <strong>Built with ❤️ for Product Teams everywhere</strong>
</div>
