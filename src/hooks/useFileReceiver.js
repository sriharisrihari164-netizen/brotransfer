import { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '../utils/debugLog';

export const useFileReceiver = (peer) => {
    const [fileMeta, setFileMeta] = useState(null);
    const [transferStatus, setTransferStatus] = useState('idle'); // idle, connecting, waiting, asking-permission, receiving, completed, error
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [speed, setSpeed] = useState(0);
    const [isStreaming, setIsStreaming] = useState(false);

    const chunksRef = useRef([]);
    const receivedSizeRef = useRef(0);
    const connectionRef = useRef(null);
    const lastProgressTimeRef = useRef(0);
    const lastReceivedSizeRef = useRef(0);
    const fileMetaRef = useRef(null);
    const writableStreamRef = useRef(null); // File System Access API
    const objectUrlsRef = useRef([]); // Track created ObjectURLs for cleanup
    const pendingBlobRef = useRef(null); // Store blob for download
    const handleDataRef = useRef(null);

    // 1. Download file helper
    const downloadFile = useCallback(() => {
        logger.info("[DOWNLOAD] downloadFile called");
        const meta = fileMetaRef.current;

        // 1. Check if we already have a generated URL (reuse it)
        if (objectUrlsRef.current.length > 0) {
            logger.info("Reusing existing Blob URL for download.");
            const url = objectUrlsRef.current[0];
            const a = document.createElement('a');
            a.href = url;
            a.download = meta ? meta.name : 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }

        // 2. Check if we have a pending Blob
        if (pendingBlobRef.current) {
            logger.info("Using pending Blob for download", { size: pendingBlobRef.current.size });
            const blob = pendingBlobRef.current;

            const url = URL.createObjectURL(blob);
            objectUrlsRef.current.push(url);

            const a = document.createElement('a');
            a.href = url;
            a.download = meta ? meta.name : 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }

        // 3. Fallback: Generate from chunks if present
        if (!meta || chunksRef.current.length === 0) {
            logger.warn("Download failed - no data available.");
            alert("Error: No file data found. The transfer may have completed or been cleared. Please try again.");
            return;
        }

        try {
            logger.info("Generating Blob for file", { name: meta.name, size: meta.size });
            const blob = new Blob(chunksRef.current, { type: meta.fileType });

            if (blob.size !== meta.size) {
                logger.warn("Blob size mismatch!", { expected: meta.size, actual: blob.size });
            }

            chunksRef.current = []; // Clear chunks to free memory

            const url = URL.createObjectURL(blob);
            objectUrlsRef.current.push(url);

            const a = document.createElement('a');
            a.href = url;
            a.download = meta.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            logger.error("Download failed:", err);
            setErrorMsg("Failed to construct file. Device memory limit might be exceeded.");
        }
    }, []);

    // 2. Accept file transfer
    const acceptFile = useCallback(async () => {
        const meta = fileMetaRef.current;
        if (!meta) return;

        // Cleanup previous transfer memory
        if (objectUrlsRef.current.length > 0) {
            objectUrlsRef.current.forEach(url => {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) {
                    logger.warn("Failed to revoke URL:", e);
                }
            });
            objectUrlsRef.current = [];
        }

        chunksRef.current = [];
        receivedSizeRef.current = 0;
        pendingBlobRef.current = null;

        await new Promise(resolve => setTimeout(resolve, 50));

        // Try direct-to-disk streaming via File System Access API
        try {
            if (window.showSaveFilePicker) {
                logger.info("Opening File Picker for direct disk streaming...");
                const handle = await window.showSaveFilePicker({
                    suggestedName: meta.name,
                });
                const writable = await handle.createWritable();
                writableStreamRef.current = writable;
                setIsStreaming(true);
                logger.success("Direct disk streaming enabled!");
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                logger.info("User cancelled file picker. Aborting transfer.");
                return;
            }
            logger.info("Falling back to RAM buffering mode.");
        }

        setTransferStatus('receiving');
        lastProgressTimeRef.current = Date.now();
        lastReceivedSizeRef.current = 0;
        setErrorMsg('');

        if (connectionRef.current && connectionRef.current.open) {
            connectionRef.current.send({ type: 'ack-start' });
            logger.info("Sent ack-start to sender.");
        }
    }, []);

    // 3. Handle incoming data handler
    const handleData = useCallback(async (data, conn) => {
        if (data.type === 'metadata') {
            logger.info("Received metadata", data);

            if (objectUrlsRef.current.length > 0) {
                objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
                objectUrlsRef.current = [];
            }

            const meta = {
                name: data.name,
                size: data.size,
                fileType: data.fileType
            };

            fileMetaRef.current = meta;
            setFileMeta(meta);
            setTransferStatus('asking-permission');
        }
        else if (data.type === 'chunk') {
            setErrorMsg('');

            if (writableStreamRef.current) {
                writableStreamRef.current.write(data.data).catch(err => {
                    logger.error("Stream write error", err);
                    setErrorMsg("Disk write error");
                    conn.close();
                });
            } else {
                chunksRef.current.push(data.data);
            }

            receivedSizeRef.current += data.data.byteLength;

            const now = Date.now();
            if (now - lastProgressTimeRef.current > 400 && fileMetaRef.current) {
                const percent = Math.min((receivedSizeRef.current / fileMetaRef.current.size) * 100, 100);
                setProgress(percent);

                const bytesNew = receivedSizeRef.current - lastReceivedSizeRef.current;
                const timeDiff = (now - lastProgressTimeRef.current) / 1000;
                if (timeDiff > 0) {
                    setSpeed(bytesNew / timeDiff);
                }

                lastProgressTimeRef.current = now;
                lastReceivedSizeRef.current = receivedSizeRef.current;
            }
        }
        else if (data.type === 'end') {
            logger.info("[END] Transfer finished", { received: receivedSizeRef.current, expected: fileMetaRef.current?.size });

            if (writableStreamRef.current) {
                try {
                    await writableStreamRef.current.close();
                    writableStreamRef.current = null;
                } catch (e) {
                    logger.error("Stream close error", e);
                    setErrorMsg("Failed to finalize file save");
                    return;
                }
            }

            if (fileMetaRef.current && receivedSizeRef.current !== fileMetaRef.current.size) {
                logger.warn("Size mismatch!", { received: receivedSizeRef.current, expected: fileMetaRef.current.size });
                setErrorMsg("Transfer mismatch/corruption detected.");
                return;
            }

            setTransferStatus('completed');
            setProgress(100);

            conn.send({ type: 'ack-end' });

            if (chunksRef.current.length > 0) {
                try {
                    const blob = new Blob(chunksRef.current, { type: fileMetaRef.current?.fileType });
                    pendingBlobRef.current = blob;
                    chunksRef.current = [];
                    logger.success("Blob created successfully and ready for download.");
                } catch (err) {
                    logger.error("Failed to create Blob on transfer end", err);
                    setErrorMsg("Memory error: Failed to process file.");
                }
            }
        }
    }, []);

    useEffect(() => {
        handleDataRef.current = handleData;
    }, [handleData]);

    // 4. Connect to Sender
    const connectToSender = useCallback((senderId) => {
        if (!peer || !senderId) return;

        if (peer.disconnected) {
            logger.warn("Local peer disconnected from signaling. Reconnecting...");
            peer.reconnect();
            setErrorMsg("Restoring signaling connection... Please try again in 1-2 seconds.");
            setTransferStatus('error');
            return;
        }

        if (!peer.open) {
            logger.warn("Signaling connection not yet open.");
            setErrorMsg("Setting up connection... Please wait a few seconds and try again.");
            setTransferStatus('error');
            return;
        }

        if (peer.destroyed) {
            logger.error("Local peer is destroyed. Resetting...");
            window.location.reload();
            return;
        }

        const connId = `brotransfer-${senderId}`;
        logger.info(`Attempting connection to: ${connId}`);
        setTransferStatus('connecting');
        setErrorMsg('');
        setProgress(0);

        const conn = peer.connect(connId, {
            reliable: true,
            serialization: 'binary'
        });

        connectionRef.current = conn;

        const timeoutId = setTimeout(() => {
            if (connectionRef.current === conn && conn.open === false) {
                logger.error("Connection attempt timed out. NAT traversal failed.");
                setErrorMsg("Connection timed out. Check code or toggle 'Force Relay' mode.");
                setTransferStatus('error');
                conn.close();
            }
        }, 45000);

        const handlePeerError = (err) => {
            if (err.type === 'peer-unavailable') {
                clearTimeout(timeoutId);
                peer.off('error', handlePeerError);
                logger.warn(`Peer unavailable: ${connId}`);
                setErrorMsg("Sender not found. Please check the 6-digit code or ensure the sender is ready.");
                setTransferStatus('error');
            }
        };
        peer.on('error', handlePeerError);

        const onOpen = () => {
            clearTimeout(timeoutId);
            peer.off('error', handlePeerError);
            logger.success('Connected to Sender!');
            setTransferStatus('waiting'); 
        };

        if (conn.open) {
            onOpen();
        } else {
            conn.on('open', onOpen);
        }

        conn.on('data', (data) => {
            if (handleDataRef.current) {
                handleDataRef.current(data, conn);
            }
        });

        conn.on('close', () => {
            clearTimeout(timeoutId);
            peer.off('error', handlePeerError);
            logger.info('Sender disconnected');
            if (connectionRef.current === conn) {
                setTransferStatus(prev => {
                    if (prev === 'completed') return prev;
                    setErrorMsg('Sender disconnected prematurely');
                    return 'error';
                });
            }
        });

        conn.on('error', (err) => {
            clearTimeout(timeoutId);
            peer.off('error', handlePeerError);
            logger.error('Connection error', err);
            let msg = err.message || 'Connection failed';
            if (err.type === 'peer-unavailable') {
                msg = "Sender not found. Check code or ensure sender is active.";
            }
            setErrorMsg(msg);
            setTransferStatus('error');
        });
    }, [peer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (connectionRef.current) {
                connectionRef.current.close();
            }
            if (objectUrlsRef.current.length > 0) {
                objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
                objectUrlsRef.current = [];
            }
            if (writableStreamRef.current) {
                writableStreamRef.current.close().catch(e => logger.error("Stream close error on unmount", e));
                writableStreamRef.current = null;
            }
            chunksRef.current = [];
        };
    }, []);

    const resetReceiver = () => {
        objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        objectUrlsRef.current = [];
        chunksRef.current = [];
        pendingBlobRef.current = null;

        setFileMeta(null);
        fileMetaRef.current = null;
        writableStreamRef.current = null;
        setIsStreaming(false);
        setTransferStatus('idle');
        setProgress(0);
        setSpeed(0);
        receivedSizeRef.current = 0;
        setErrorMsg('');
        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }
    };

    return {
        fileMeta,
        transferStatus,
        progress,
        speed,
        errorMsg,
        isStreaming,
        connectToSender,
        acceptFile,
        downloadFile,
        resetReceiver
    };
};
