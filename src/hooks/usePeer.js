import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer } from 'peerjs';
import { logger } from '../utils/debugLog';

/**
 * Hook to manage the PeerJS instance.
 * @param {string} customId - Optional custom ID to use.
 * @param {boolean} forceRelay - Whether to force usage of TURN (relay only).
 * @returns {Object} { peer, myId, status, error, retry }
 */
export const usePeer = (customId = null, forceRelay = false) => {
    const [peer, setPeer] = useState(null);
    const [myId, setMyId] = useState('');
    const [status, setStatus] = useState('loading'); // loading, ready, error, closed
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const peerRef = useRef(null);

    const retry = useCallback(() => {
        logger.info("Manual retry triggered");
        setError(null);
        setStatus('loading');
        setRetryCount(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (peerRef.current) return;

        peerRef.current = 'initializing';

        const delayTimer = setTimeout(() => {
            logger.info("Initializing Peer instance", { id: customId, relay: forceRelay });

            const peerOptions = {
                debug: 1, 
                host: '0.peerjs.com',
                port: 443,
                secure: true,
                pingInterval: 5000,
                config: {
                    iceTransportPolicy: forceRelay ? 'relay' : 'all',
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun.cloudflare.com:3478' },
                        {
                            urls: [
                                "turn:eu-0.turn.peerjs.com:3478",
                                "turn:us-0.turn.peerjs.com:3478"
                            ],
                            username: "peerjs",
                            credential: "peerjsp"
                        },
                        {
                            urls: [
                                "turn:openrelay.metered.ca:80",
                                "turn:openrelay.metered.ca:443",
                                "turn:openrelay.metered.ca:443?transport=tcp",
                                "turns:openrelay.metered.ca:443?transport=tcp"
                            ],
                            username: "openrelayproject",
                            credential: "openrelayproject"
                        }
                    ],
                    iceCandidatePoolSize: 2 
                }
            };

            const newPeer = customId ? new Peer(customId, peerOptions) : new Peer(peerOptions);
            peerRef.current = newPeer;

            newPeer.on('open', (id) => {
                logger.success('Peer Ready!', id);
                setMyId(id);
                setStatus('ready');
                setError(null);
                setPeer(newPeer);
            });

            newPeer.on('error', (err) => {
                logger.error(`PeerJS Error: ${err.type}`, err);
                
                let userFriendlyError = err.message || "An unknown error occurred.";

                switch (err.type) {
                    case 'unavailable-id':
                        userFriendlyError = "Connection code busy or unavailable. Please retry or generate a new code.";
                        setError(new Error(userFriendlyError));
                        setStatus('error');
                        break;
                    case 'peer-unavailable':
                        // Non-fatal: local peer is still connected and ready.
                        // Connection-level error is handled by the receiver/sender connection listeners.
                        logger.warn("Target peer not found. Check the code or ensure sender is active.");
                        break;
                    case 'network':
                        userFriendlyError = "Network issue. Please check your connection.";
                        setError(new Error(userFriendlyError));
                        setStatus('error');
                        break;
                    case 'server-error':
                    case 'socket-error':
                    case 'socket-closed':
                        userFriendlyError = "Signaling server disconnected. Reconnecting...";
                        setError(new Error(userFriendlyError));
                        setStatus('error');
                        break;
                    default:
                        logger.warn(`Non-fatal PeerJS error: ${err.type}`);
                        break;
                }
            });

            newPeer.on('disconnected', () => {
                logger.warn('Peer disconnected from signaling. Reconnecting...');
                try {
                    if (newPeer && !newPeer.destroyed) {
                        newPeer.reconnect();
                    }
                } catch (err) {
                    logger.error("Reconnect attempt failed", err);
                }
            });

            newPeer.on('close', () => {
                logger.info("Peer destroyed/closed.");
                setStatus('closed');
                setPeer(null);
            });
        }, 300); 

        return () => {
            clearTimeout(delayTimer);
            if (peerRef.current && peerRef.current !== 'initializing') {
                logger.info("Destroying Peer instance...");
                peerRef.current.destroy();
                setPeer(null);
            }
            peerRef.current = null;
        };
    }, [customId, retryCount, retry, forceRelay]);

    return { 
        peer, 
        myId, 
        status, 
        error, 
        retry 
    };
};
