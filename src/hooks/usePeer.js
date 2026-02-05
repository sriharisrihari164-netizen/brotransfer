import { useState, useEffect, useRef } from 'react';
import { Peer } from 'peerjs';

/**
 * Hook to manage the PeerJS instance.
 * @returns {Object} { peer, myId, status, error }
 */
export const usePeer = (customId = null) => {
    const [peer, setPeer] = useState(null);
    const [myId, setMyId] = useState('');
    const [status, setStatus] = useState('loading'); // loading, ready, error
    const [error, setError] = useState(null);

    // We only want to create the peer ONCE.
    const ranOnce = useRef(false);

    useEffect(() => {
        // If we have a customId, we might want to wait for it, OR we assume it's stable.
        // For this app, we generate it once.
        if (ranOnce.current) return;
        ranOnce.current = true;

        console.log("Initializing Peer with ID:", customId);
        // Auto-generate ID is handled by PeerJS if we don't pass one, 
        // but for this app we might want to let the component decide or just use random.
        // Let's use a random short code logic wrapper for "Sender" later, 
        // but the base Peer object just needs to exist.

        // If customId is provided, use it. Otherwise undefined (random)
        const peerConfig = {
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        };

        const newPeer = customId ? new Peer(customId, peerConfig) : new Peer(peerConfig);

        newPeer.on('open', (id) => {
            console.log('Peer Open. ID:', id);
            setMyId(id);
            setStatus('ready');
        });

        newPeer.on('error', (err) => {
            console.error('Peer Error:', err);
            setError(err);
            setStatus('error');
        });

        // Auto-reconnect on disconnect
        newPeer.on('disconnected', () => {
            console.log('Peer disconnected from signaling server. Attempting reconnect...');
            setStatus('disconnected');
            // Try to reconnect
            try {
                newPeer.reconnect();
            } catch (err) {
                console.error("Reconnect failed:", err);
            }
        });

        newPeer.on('close', () => {
            console.log("Peer destroyed/closed.");
            setStatus('closed');
        });

        setPeer(newPeer);

        return () => {
            // Clean up: destroy peer when hook unmounts
            newPeer.destroy();
        };
    }, []);

    return { peer, myId, status, error };
};
