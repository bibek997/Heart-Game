# Heart-Guessing Game

A full-stack web application featuring a React frontend, Node.js/Express backend, and Firebase for authentication and database storage.

## 📌 Overview

This project implements a heart-guessing game using a modern web technology stack. The backend handles authentication, JWT management, and API communication, while the frontend provides an interactive user interface. Firebase is used for user authentication and Firestore database management.

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/bibek997/Heart-Game
cd Heart-Game
```

### Step 2: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 3: Create a Firebase Project

```bash
Follow the official Firebase documentation:
https://firebase.google.com/docs/web/setup

Required configuration:

Create a new Firebase project.

Enable Email/Password Authentication.

Create a Firestore Database.

In Project Settings → General → Your Apps, add a Web App.

Copy the Firebase config keys.
```

## 🛠 Backend Setup (Node.js + Express)

### Navigate to backend:

```bash
cd heartgamebackend
```

### Install dependencies:

```bash
npm install
```

### Create a .env file:

```bash
PORT=4000
JWT_SECRET=change_this_to_a_long_random_secret
API_BASE=http://marcconrad.com/uob/heart/api.php
TOKEN_EXPIRES_SECONDS=300
```

### Start the backend:

```bash
npm start
```

## 🎨 Frontend Setup (React + Vite)

### Navigate to frontend:

```bash
cd heartgamefrontend
```

### Install dependencies:

```bash
npm install
```

### Create a .env file:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Start the frontend:

```bash
npm run dev
```
