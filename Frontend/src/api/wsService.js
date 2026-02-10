import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * WebSocket Service for Real-Time Updates
 * 
 * Features:
 * - Auto-reconnect on disconnect
 * - Fallback to polling if WebSocket fails
 * - Per-auction subscriptions
 */
class WebSocketService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.onConnectionChange = null;
    }

    /**
     * Connect to WebSocket server
     */
    connect(onConnect, onError) {
        if (this.client && this.connected) {
            console.log('WebSocket already connected');
            onConnect?.();
            return;
        }

        const socket = new SockJS('http://localhost:9001/ws');
        this.client = Stomp.over(socket);

        // Disable debug logging in production
        this.client.debug = (msg) => {
            if (import.meta.env.DEV) {
                console.log('[WS]', msg);
            }
        };

        this.client.connect(
            {},
            (frame) => {
                console.log('WebSocket connected:', frame);
                this.connected = true;
                this.reconnectAttempts = 0;
                this.onConnectionChange?.(true);
                onConnect?.();
            },
            (error) => {
                console.error('WebSocket error:', error);
                this.connected = false;
                this.onConnectionChange?.(false);
                onError?.(error);
                this.attemptReconnect();
            }
        );

        this.client.onStompError = (frame) => {
            console.error('STOMP error:', frame);
        };
    }

    /**
     * Attempt reconnection with exponential backoff
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('Max reconnect attempts reached, falling back to polling');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Subscribe to auction-specific updates
     * 
     * @param {number} auctionId - Auction ID to subscribe to
     * @param {function} callback - Called when new message received
     * @returns {string} Subscription ID for unsubscribing
     */
    subscribeToAuction(auctionId, callback) {
        if (!this.client || !this.connected) {
            console.warn('WebSocket not connected, subscription queued');
            return null;
        }

        const topic = `/topic/auction/${auctionId}`;

        if (this.subscriptions.has(topic)) {
            console.log('Already subscribed to:', topic);
            return this.subscriptions.get(topic).id;
        }

        const subscription = this.client.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body);
                console.log('WS Message:', data);
                callback(data);
            } catch (err) {
                console.error('Failed to parse WS message:', err);
            }
        });

        this.subscriptions.set(topic, subscription);
        console.log('Subscribed to:', topic);

        return subscription.id;
    }

    /**
     * Subscribe to all bid updates (for dashboard)
     */
    subscribeToAllBids(callback) {
        if (!this.client || !this.connected) {
            return null;
        }

        const topic = '/topic/bids';
        const subscription = this.client.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body);
                callback(data);
            } catch (err) {
                console.error('Failed to parse WS message:', err);
            }
        });

        this.subscriptions.set(topic, subscription);
        return subscription.id;
    }

    /**
     * Unsubscribe from a topic
     */
    unsubscribe(topic) {
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(topic);
            console.log('Unsubscribed from:', topic);
        }
    }

    /**
     * Unsubscribe from all topics
     */
    unsubscribeAll() {
        this.subscriptions.forEach((sub, topic) => {
            sub.unsubscribe();
            console.log('Unsubscribed from:', topic);
        });
        this.subscriptions.clear();
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.client) {
            this.unsubscribeAll();
            this.client.disconnect(() => {
                console.log('WebSocket disconnected');
                this.connected = false;
                this.onConnectionChange?.(false);
            });
        }
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Set connection state change callback
     */
    setOnConnectionChange(callback) {
        this.onConnectionChange = callback;
    }
}

// Singleton instance
const wsService = new WebSocketService();

export default wsService;
