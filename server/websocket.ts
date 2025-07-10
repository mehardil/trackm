import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from './db';
import { activities } from './schema';
import { eq } from 'drizzle-orm';
import { log } from './vite';

interface Activity {
    id: string;
    application: string;
    title: string;
    start_time: string;
    duration: number;
    category: string;
    metrics?: {
        cpu: number;
        memory: number;
    };
    user_id: string;
    team_id: string;
}

interface WebSocketEvent {
    type: string;
    data: any;
}

interface WebSocketClient {
    ws: WebSocket;
    userId: number;
    teamId: number;
}

export class WebSocketManager {
    private wss: WebSocketServer;
    private connections: Map<string, WebSocket>;

    constructor(port: number = 8080) {
        this.connections = new Map();
        this.wss = new WebSocketServer({ 
            port,
            host: "127.0.0.1",
            clientTracking: true
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.wss.on('connection', (ws: WebSocket) => {
            const connectionId = Math.random().toString(36).substring(7);
            this.connections.set(connectionId, ws);
            log(`New WebSocket connection established: ${connectionId}`);

            // Send a welcome message
            ws.send(JSON.stringify({ type: 'connected', message: 'Welcome to TrackM WebSocket server' }));

            // Handle incoming messages
            ws.on('message', (message: string) => {
                try {
                    const data = JSON.parse(message);
                    log(`Received WebSocket message from ${connectionId}:`, data);
                } catch (error) {
                    log(`Error parsing WebSocket message: ${error}`);
                }
            });

            // Handle connection close
            ws.on('close', () => {
                this.connections.delete(connectionId);
                log(`WebSocket connection closed: ${connectionId}`);
            });

            // Handle errors
            ws.on('error', (error) => {
                log(`WebSocket error for ${connectionId}: ${error.message || 'Unknown error'}`);
                this.connections.delete(connectionId);
            });

            // Send periodic ping to keep connection alive
            const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                } else {
                    clearInterval(pingInterval);
                }
            }, 30000);

            // Clean up on close
            ws.on('close', () => {
                clearInterval(pingInterval);
            });
        });

        this.wss.on('error', (error) => {
            log(`WebSocket server error: ${error.message || 'Unknown error'}`);
        });
    }

    broadcast(message: string) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    broadcastActivity(activity: any): void {
        const message = JSON.stringify({
            type: 'activity',
            data: activity
        });
        this.broadcast(message);
    }

    broadcastAgentStatus(agent: any): void {
        const message = JSON.stringify({
            type: 'agent_status',
            data: agent
        });
        this.broadcast(message);
    }

    public broadcastToTeam(teamId: string, message: string) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

export const wsManager = new WebSocketManager(); 