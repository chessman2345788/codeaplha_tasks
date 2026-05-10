# Real-Time Communication Web App (Meet Clone)

Welcome to the Real-Time Communication Web App! This project is a full-stack application leveraging the MERN stack (MongoDB, Express, React, Node.js) along with WebRTC and Socket.io to bring you seamless video interactions and real-time messaging.

## Features

- **Multi-user Video Calling**: Real-time video/audio streaming using robust WebRTC connections.
- **Room System**: Create a new room or join an existing one seamlessly.
- **Chat System**: Real-time text messaging inside the room using Socket.io.
- **Screen Sharing**: Easily share your screen with other room participants.
- **Whiteboard**: Real-time collaborative canvas.
- **Secure Authentication**: JWT-based user login and registration for security.

## Technologies Used

- **Frontend**: React.js, Vite, Axios, Socket.io-client, Simple-Peer (WebRTC wrapper), React-Router-Dom.
- **Backend**: Node.js, Express.js, Socket.io, JsonWebToken, Bcryptjs.
- **Database**: MongoDB (Mongoose ODM).

## Folder Structure

The project has been configured into two main directories: `client` and `server`.

```text
rtc-app/
│
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Full page views (Login, Home, Room)
│   │   ├── context/        # React Context for global state
│   │   ├── hooks/          # Custom hooks (e.g. useWebRTC)
│   │   ├── services/       # API calls (Axios instances)
│   │   └── utils/          # Helper functions
│   └── package.json        # Frontend dependencies
│
└── server/                 # Node.js + Express Backend
    ├── config/             # DB and Environment config
    ├── controllers/        # Route handler functions
    ├── middlewares/        # Custom middlewares (auth, etc)
    ├── models/             # Mongoose schemas (User, Room)
    ├── routes/             # Express API routes
    ├── sockets/            # Socket.io event handlers
    ├── utils/              # Helper functions
    ├── .env                # Environment variables
    ├── server.js           # Main Entry Point
    └── package.json        # Backend dependencies
```

## Setup Instructions

### 1. Database Setup
Ensure you have MongoDB running locally or have a MongoDB URI (e.g., MongoDB Atlas).

### 2. Configure Environment Variables
Inside the `server/` directory, create a `.env` file and add the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Start the Backend Server
Navigate to the `server` folder, install any missing dependencies, and run the development server:
```bash
cd server
npm install
npm run dev
```

### 4. Start the Frontend App
Open a new terminal, navigate to the `client` folder, install dependencies, and start React:
```bash
cd client
npm install
npm run dev
```

The application client runs on `http://localhost:5173/` by default, and your server runs on `http://localhost:5000/`. Let's explore RTC!
