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
    private clients: Set<WebSocket>;

    constructor() {
        this.clients = new Set();
        this.wss = new WebSocketServer({ port: 8080 });

        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            log('New WebSocket client connected');

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    log(`Received WebSocket message: ${JSON.stringify(data)}`);
                    
                    // Handle subscription messages
                    if (data.type === 'subscribe') {
                        // Store subscription preferences if needed
                        log(`Client subscribed to: ${JSON.stringify(data.data)}`);
                    }
                } catch (error) {
                    log(`Error parsing WebSocket message: ${error}`);
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                log('WebSocket client disconnected');
            });

            ws.on('error', (error) => {
                log(`WebSocket error: ${error}`);
                this.clients.delete(ws);
            });
        });

        log('WebSocket server started on port 8080');
    }

    broadcastActivity(activity: Activity) {
        const message = JSON.stringify({
            type: 'activity',
            data: activity
        });

        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    public broadcastToTeam(teamId: number, activity: any) {
        const message = JSON.stringify({
            type: 'activity',
            data: activity
        });

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

export const wsManager = new WebSocketManager(); 