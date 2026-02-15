
import { useState, useEffect } from 'react';
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

    const [retryCount, setRetryCount] = useState(0);

    const retry = () => {
        console.log("Manual retry triggered");
        setError(null);
        setStatus('loading');
        setRetryCount(prev => prev + 1);
    };

    useEffect(() => {
        // If we have a customId, we might want to wait for it, OR we assume it's stable.

        console.log("Initializing Peer with ID:", customId, "Attempt:", retryCount);

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
            setError(null); // Clear any previous errors on successful connection
        });

        newPeer.on('error', (err) => {
            console.error('Peer Error:', err);
            // Ignore benign errors or handle specific ones
            if (err.type === 'peer-unavailable') {
                // Keep error, let UI handle it
                setError(err);
                setStatus('error');
            } else if (err.type === 'disconnected' || err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error' || err.type === 'socket-closed') {
                // These might be transient
                console.log("Transient error detected. Attempting reconnect...");
                // Don't immediately set error if we can reconnect, or set a "reconnecting" state?
                // For now, show error but allow retry.
                setError(err);
                setStatus('error');
            } else {
                setError(err);
                setStatus('error');
            }
        });

        // Auto-reconnect on disconnect
        newPeer.on('disconnected', () => {
            console.log('Peer disconnected from signaling server. Attempting reconnect...');
            // Don't change status to 'error' immediately, wait for reconnect
            // setStatus('disconnected'); 

            // Try to reconnect
            try {
                newPeer.reconnect();
            } catch (err) {
                console.error("Reconnect failed:", err);
                setError(new Error("Connection lost. Please retry."));
                setStatus('error');
            }
        });

        newPeer.on('close', () => {
            // Only set closed if we didn't initiate a retry/destroy cycle
            if (!newPeer.destroyed) {
                console.log("Peer destroyed/closed.");
                setStatus('closed');
            }
        });

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPeer(newPeer);

        return () => {
            // Clean up: destroy peer when hook unmounts or prior to re-running effect
            newPeer.destroy();
        };
    }, [customId, retryCount]);

    return { peer, myId, status, error, retry };
};
