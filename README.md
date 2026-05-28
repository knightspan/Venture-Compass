# ◈ VentureCompass

An AI-powered startup business model planner for Indian e-commerce entrepreneurs.

## Project Overview
VentureCompass is a full-stack web application designed to act as a strategic advisor for startup founders. By taking users through a specialized 7-question assessment, it leverages the Google Gemini AI to recommend the optimal business model out of 8 possibilities, tailored specifically to the Indian market.

![VentureCompass UI Placeholder](https://via.placeholder.com/800x400.png?text=VentureCompass+Screenshot)

## Features
- **Immersive Planner:** 7-step profile builder with dynamic UI updates
- **AI Recommendations:** Real-time generation of custom strategies via Gemini 1.5 Flash
- **The Oracle:** Chat interface to ask follow-up questions about your recommendation
- **Interactive Data Visualization:** Chart.js integration featuring scatter, radar, and velocity matrices
- **Deep Model Explorer:** AI-generated deep dives into specific business models
- **Premium Aesthetics:** Bespoke design language using custom golden particle canvases, grain overlays, and custom typography (Cinzel & Cormorant Garamond)

## Architecture

```
[ Frontend (Vanilla HTML/CSS/JS) ]
        │
        │ (REST API / JSON)
        ▼
[ Backend (Node.js + Express) ]
        │
        │ (Prompt Injection & Context Management)
        ▼
[ Google Gemini API (gemini-1.5-flash) ]
```

## Prerequisites
- Node.js (v18 or higher recommended)
- A valid Google Gemini API Key

## Setup Instructions

1. **Clone the repository** (or navigate to the directory):
   ```bash
   cd venturecompass
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   - Rename `.env.example` to `.env`
   - Add your Gemini API Key: `GEMINI_API_KEY=your_api_key_here`

4. **Start the application**:
   ```bash
   npm start
   # or use npm run dev for nodemon
   ```

5. **Open in browser**:
   Navigate to `http://localhost:3000`

## Getting a Gemini API Key
You can get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
The free tier provides 15 requests per minute, which is sufficient for this application.

## Academic Context
*Mini Project 5 | E-Business Fundamentals | Second Year Engineering AI & ML | SPPU 2024 Pattern*
