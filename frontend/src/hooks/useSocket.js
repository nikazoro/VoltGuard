import { useEffect, useRef, useState, useCallback } from 'react';
import { getAuthToken } from '@/lib/utils';

const WS_BASE_URL = import.meta.env.VITE_WS_URL ||
    (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
    window.location.host;

export const useSocket = (endpoint, options = {}) => {
    // 1. Stable Reference for Options (prevents re-renders breaking things)
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const {
        reconnect = true,
        reconnectInterval = 3000,
        maxReconnectAttempts = 5,
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [error, setError] = useState(null);

    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const shouldConnectRef = useRef(true);

    const connect = useCallback(() => {
        // If we are unmounted, stop.
        if (!shouldConnectRef.current) return;

        try {
            const token = getAuthToken();
            const wsUrl = `${WS_BASE_URL}${endpoint}${token ? `?token=${token}` : ''}`;

            console.log("🔵 Connecting to:", endpoint);

            // --- CRITICAL FIX START ---
            // Before creating a new socket, we must clean up the old one
            // AND remove its listeners so it doesn't trigger a "reconnect" loop.
            if (wsRef.current) {
                // Nullify handlers so 'onclose' won't fire for the intentional kill
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                wsRef.current.onmessage = null;
                wsRef.current.onopen = null;

                wsRef.current.close();
            }
            // --- CRITICAL FIX END ---

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = (event) => {
                // Double check this is still the active socket
                if (ws !== wsRef.current) return;

                console.log('✅ Connected');
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;
                optionsRef.current.onOpen?.(event);
            };

            ws.onmessage = (event) => {
                if (ws !== wsRef.current) return;
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                    optionsRef.current.onMessage?.(data);
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };

            ws.onerror = (event) => {
                if (ws !== wsRef.current) return;
                console.error('⚠️ WebSocket Error:', event);
                optionsRef.current.onError?.(event);
            };

            ws.onclose = (event) => {
                if (ws !== wsRef.current) return; // Ignore old socket events

                console.log(`❌ Closed (Code: ${event.code})`);
                setIsConnected(false);
                optionsRef.current.onClose?.(event);

                // Don't reconnect if unmounted OR if server blocked us (1008)
                if (!shouldConnectRef.current || event.code === 1008) {
                    return;
                }

                if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current += 1;
                    console.log(`🔄 Reconnecting in ${reconnectInterval}ms...`);
                    reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
                }
            };
        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            setError(err.message);
        }
    }, [endpoint, reconnect, reconnectInterval, maxReconnectAttempts]);

    const disconnect = useCallback(() => {
        shouldConnectRef.current = false;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            // Silence listeners
            wsRef.current.onclose = null;
            wsRef.current.onerror = null;
            wsRef.current.onmessage = null;
            wsRef.current.onopen = null;

            // ONLY close if it's actually open or nearly open
            // This prevents the "closed before established" error in Strict Mode
            if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                wsRef.current.close();
            }
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    // Effect to handle connection lifecycle
    useEffect(() => {
        shouldConnectRef.current = true;
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return { isConnected, lastMessage, error, send: () => { }, disconnect, reconnect: connect };
};

export const useOwnerTelemetry = (stationId, onData) => {
    return useSocket('/ws/owner/telemetry', {
        onMessage: (data) => {
            if (data.station_id === stationId) {
                onData?.(data);
            }
        },
    });
};

export const useAdminAlerts = (onAlert) => {
    return useSocket('/ws/admin/alerts', {
        onMessage: (data) => {
            onAlert?.(data);
        },
    });
};
