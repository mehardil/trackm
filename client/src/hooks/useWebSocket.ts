import { useState, useEffect, useCallback, useRef } from 'react';

export type WebSocketEvent = {
  event: string;
  data: any;
};

type WebSocketConfig = {
  userId?: number;
  organizationId?: number;
  teamId?: number;
  onMessage?: (event: WebSocketEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
};

/**
 * Custom hook for WebSocket communication with the server
 */
export const useWebSocket = ({
  userId,
  organizationId,
  teamId,
  onMessage,
  onConnect,
  onDisconnect,
  autoReconnect = true,
  reconnectInterval = 5000
}: WebSocketConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Function to create the WebSocket connection with query parameters
  const createWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Add query parameters for identification
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId.toString());
      if (organizationId) params.append('organizationId', organizationId.toString());
      if (teamId) params.append('teamId', teamId.toString());
      
      if (params.toString()) {
        wsUrl += `?${params.toString()}`;
      }
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        if (onConnect) onConnect();
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
        setIsConnected(false);
        if (onDisconnect) onDisconnect();
        
        // Attempt to reconnect if enabled
        if (autoReconnect && reconnectTimeoutRef.current === null) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectTimeoutRef.current = null;
            createWebSocket();
          }, reconnectInterval);
        }
      };
      
      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(new Error('WebSocket connection error'));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socketRef.current = socket;
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError(error instanceof Error ? error : new Error('Unknown WebSocket error'));
    }
  }, [userId, organizationId, teamId, onConnect, onDisconnect, onMessage, autoReconnect, reconnectInterval]);

  // Function to send data through the WebSocket
  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event, data }));
      return true;
    }
    return false;
  }, []);

  // Connect when the hook is first used
  useEffect(() => {
    createWebSocket();
    
    // Clean up the WebSocket connection and any reconnect timers
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [createWebSocket]);

  // Reconnect if the identity parameters change
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.close();
      createWebSocket();
    }
  }, [userId, organizationId, teamId, createWebSocket]);

  return {
    isConnected,
    error,
    sendMessage
  };
};