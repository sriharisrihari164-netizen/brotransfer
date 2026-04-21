
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
        const peerOptions = {
            host: '0.peerjs.com',
            port: 443,
            secure: true,
            debug: 1, // 0: no logs, 1: errors, 2: errors+warnings, 3: all
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        };

        const newPeer = customId ? new Peer(customId, peerOptions) : new Peer(peerOptions);

        newPeer.on('open', (id) => {
            logger.success('Peer Ready!', id);
            setMyId(id);
            setStatus('ready');
            setError(null);
        });

        newPeer.on('error', (err) => {
            logger.error(`PeerJS Error Level: ${err.type}`, err);
            
            let userFriendlyError = err.message || "An unknown connection error occurred.";

            switch (err.type) {
                case 'unavailable-id':
                    userFriendlyError = "This connection code is already being used. Please refresh to try another.";
                    break;
                case 'peer-unavailable':
                    userFriendlyError = "Target peer not found. Check if the code is correct and the sender is still online.";
                    break;
                case 'network':
                    userFriendlyError = "Network error. Please check your internet connection.";
                    break;
                case 'server-error':
                case 'socket-error':
                    userFriendlyError = "Connection to signaling server failed. The service might be temporarily down.";
                    break;
                case 'ssl-unavailable':
                    userFriendlyError = "Secure connection (SSL) is required but not available.";
                    break;
                default:
                    // Keep the original message if not specifically mapped
                    break;
            }

            setError(new Error(userFriendlyError));
            setStatus('error');
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
