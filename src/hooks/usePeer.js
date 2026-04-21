
import { useState, useEffect } from 'react';
import { Peer } from 'peerjs';
import { logger } from '../utils/debugLog';

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
        logger.info("Manual retry triggered");
        setError(null);
        setStatus('loading');
        setRetryCount(prev => prev + 1);
    };

    useEffect(() => {
        // If we have a customId, we might want to wait for it, OR we assume it's stable.

        logger.info("Initializing Peer", { id: customId, attempt: retryCount });

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
            logger.success('Peer Open', id);
            setMyId(id);
            setStatus('ready');
            setError(null); // Clear any previous errors on successful connection
        });

        newPeer.on('error', (err) => {
            logger.error('Peer Error', err);
            
            if (err.type === 'unavailable-id') {
                setError(new Error("This connection code is already in use. Please try again."));
                setStatus('error');
            } else if (err.type === 'peer-unavailable') {
                setError(new Error("Connection failed. The other peer might be offline or using a wrong code."));
                setStatus('error');
            } else if (err.type === 'disconnected' || err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error' || err.type === 'socket-closed') {
                logger.warn("Transient error detected. Attempting reconnect...");
            } else {
                setError(err);
                setStatus('error');
            }
        });

        // Auto-reconnect on disconnect
        newPeer.on('disconnected', () => {
            logger.warn('Peer disconnected from signaling server. Attempting reconnect...');
            // Don't change status to 'error' immediately, wait for reconnect
            // setStatus('disconnected'); 

            // Try to reconnect
            try {
                newPeer.reconnect();
            } catch (err) {
                logger.error("Reconnect failed", err);
                setError(new Error("Connection lost. Please retry."));
                setStatus('error');
            }
        });

        newPeer.on('close', () => {
            // Only set closed if we didn't initiate a retry/destroy cycle
            if (!newPeer.destroyed) {
                logger.info("Peer destroyed/closed.");
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
