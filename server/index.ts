import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import { createServer } from "http";
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import activityRoutes from './routes/activity';
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import { wsManager } from './websocket';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
const PgSession = connectPgSimple(session);
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false for HTTP
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

app.get('/download/windows-agent', (req, res) => {
    const filePath = path.join(__dirname, '../desktop-agents/python-agent/windows_agent.py');
    res.download(filePath, 'windows_agent.py');
});

app.get('/download/macos-agent', (req, res) => {
    const filePath = path.join(__dirname, '../desktop-agents/python-agent/macos_agent.py');
    res.download(filePath, 'macos_agent.py');
});

app.get('/download/linux-agent', (req, res) => {
    const filePath = path.join(__dirname, '../desktop-agents/python-agent/linux_agent.py');
    res.download(filePath, 'linux_agent.py');
});

// Routes
app.use('/api/activity', activityRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

(async () => {
  try {
    const server = await registerRoutes(app);
    const port = 8000;
    process.env.PORT = port.toString();
    
    server.listen({
      port,
      host: "127.0.0.1",
    }, () => {
      log(`Server running on http://127.0.0.1:${port}`);
      log(`WebSocket server is running on ws://127.0.0.1:8080`);
    });

    // Handle server errors
    server.on('error', (error) => {
      log(`Server error: ${error}`);
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      log('Shutting down server...');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    log(`Failed to start server: ${err}`);
    process.exit(1);
  }
})();

export default app;
