# ChatApp

A real-time, room-based chat application built with a **React (Vite)** frontend and a **Java JSR-356 WebSocket** backend.

[Go Chat Now](https://tonykennah.github.io/chatapp/)

## 🚀 Features

- **Real-time Messaging**: Instant communication via WebSockets.
- **Room Support**: Dynamic path-based chat rooms.
- **Live User List**: See who is currently active in the room.
- **Responsive UI**: A clean, modern chat interface.

---

## 💻 Tech Stack

### Frontend
- **React** (Vite)
- **CSS3** (Custom styling)
- **WebSockets API** (Native browser support)

### Backend
- **Java** (Jakarta/JSR-356 WebSocket API)
- **Concurrent Collections**: Thread-safe session management.

---

## 🛠️ Installation & Setup

### 1. Backend (Java)
- Beyond the scpe of this document.

### 2. Frontend (React)
1. **Clone the repo**:
   ```bash
   git clone https://github.com
   cd ChatApp
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run locally**:
   ```bash
   npm run dev
   ```

---

## 🚢 Deployment (GitHub Pages)

This project is deployed via the `gh-pages` package.

1. **Build and Deploy**:
   ```bash
   npm run deploy
   ```
2. **Base Path**: The application uses the base path `/ChatApp/` to ensure assets load correctly on GitHub Pages.

---

## ⚠️ Connectivity Note

Because GitHub Pages uses **HTTPS**, browsers may block the connection to a local **WS** (insecure) server. 

- **To test**: Click the "Shield" icon or "Site Settings" in your browser and select **"Allow Insecure Content"**.
- **Production**: Requires a backend with **SSL (WSS)** support.

