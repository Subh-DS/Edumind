
# EduMind - AI-Powered Adaptive Learning Platform

EduMind is a next-generation educational web application that leverages Google's Gemini API to provide a personalized, Socratic learning experience. It features a robust frontend simulation of a full-stack environment, complete with multi-user authentication, persistent progress tracking, and multimodal analysis (text, image, voice, and live video).

## 🚀 Key Features

### 🧠 **Neuro-Symbolic Socratic Tutor**
Unlike standard chatbots, EduMind is prompted to act as a Socratic tutor. It uses a simulated **Bayesian Knowledge Tracing (BKT)** model to assess:
*   **Latency & Hesitation:** Tracks typing speed and backspaces to gauge uncertainty.
*   **Confidence:** User self-reported confidence levels.
*   **Mastery:** It doesn't just give answers; it asks guiding questions to build conceptual understanding.

### 👁️ **Multimodal Analysis (Gemini 2.0 / 1.5 Pro)**
*   **Text:** Deep reasoning on complex questions.
*   **Image:** Upload diagrams or homework photos for instant analysis.
*   **Voice:** Speak naturally to the AI and receive audio responses.
*   **Live Camera:** Real-time video scanning of textbooks using the Gemini Live API capabilities.

### 📊 **Progress Dashboard**
A fully responsive dashboard that visualizes:
*   **Learning Velocity:** Area charts tracking performance over time.
*   **Mastery Heatmap:** Subject-specific proficiency levels.
*   **Study Library:** Manages uploaded content (PDFs, videos) with AI-generated metadata.

### 🔐 **Secure Local Authentication**
*   Simulated secure backend using `localStorage`.
*   Supports **Sign Up** (with duplicate email checks) and **Sign In** (with password validation).
*   **Multi-user support:** Different users can log in on the same browser and see their own isolated data.

### 🕸️ **Knowledge Graph**
*   Generates dynamic Concept Maps using Mermaid-style node/edge logic powered by Gemini.

### 🌍 **Localization**
*   Full support for English, Hindi, and Odia.

---

## 🛠️ Tech Stack

*   **Framework:** [React 19](https://react.dev/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **AI SDK:** [`@google/genai`](https://www.npmjs.com/package/@google/genai)
*   **Visualization:** [Recharts](https://recharts.org/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Markdown:** `react-markdown`

---

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/edumind.git
    cd edumind
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    Create a `.env` file in the root directory:
    ```env
    VITE_API_KEY=your_google_gemini_api_key_here
    ```
    *Note: You must get a valid API key from [Google AI Studio](https://aistudio.google.com/).*

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Build for Production**
    ```bash
    npm run build
    ```

---

## 🏗️ Architecture Overview

### **Backend Simulation (`services/storageService.ts`)**
Instead of a complex Node/SQL backend for this demo, we implemented a `StorageService` class that acts as a local database wrapper.
*   **Data Structure:** Stores a normalized JSON object containing Users, Profiles, Histories, and Metrics.
*   **Session Management:** Handles login tokens and session persistence across reloads.
*   **Isolation:** Ensures User A cannot see User B's quiz results.

### **AI Service (`services/geminiService.ts`)**
Centralized logic for interacting with Google Gemini.
*   **`analyzeLearningContent`**: The core function that switches between `gemini-3-flash` (for speed) and `gemini-3-pro` (for deep reasoning/thinking).
*   **`live.connect`**: Handles WebRTC-style streaming for the Live Camera feature.

---

## 🛡️ License

This project is licensed under the MIT License.

---

**Developed with ❤️ using Google Gemini.**
