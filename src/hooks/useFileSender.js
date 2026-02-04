import { useState, useRef, useEffect, useCallback } from 'react';

const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const MAX_BUFFER_AMOUNT = 1024 * 1024 * 8; // 8MB buffer limit

export const useFileSender = (peer) => {
    const [file, setFile] = useState(null);
    const [transferStatus, setTransferStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState(0);

    const connectionRef = useRef(null);
    const fileRef = useRef(null);
    const offsetRef = useRef(0);
    const startTimeRef = useRef(0);
    const lastProgressTimeRef = useRef(0);
    const lastOffsetRef = useRef(0);

    // Listen for incoming connections
    useEffect(() => {
        if (!peer || !file) return;

        console.log("Sender listening for connection...");

        peer.on('connection', (conn) => {
            console.log("Sender received connection from:", conn.peer);

            // Validate connection? For now accept all.
            connectionRef.current = conn;
            setTransferStatus('connecting');

            conn.on('open', () => {
                console.log("Connection opened! Starting transfer...");
                setTransferStatus('transferring');
                startTransfer(conn);
            });

            conn.on('close', () => {
                console.log("Connection closed.");
                setTransferStatus(prev => prev === 'completed' ? prev : 'error');
            });

            conn.on('error', (err) => {
                console.error("Connection error:", err);
                setTransferStatus('error');
            });
        });

    }, [peer, file]);

    const startTransfer = async (conn) => {
        const currentFile = fileRef.current;
        if (!currentFile) return;

        startTimeRef.current = Date.now();
        lastProgressTimeRef.current = Date.now();
        lastOffsetRef.current = 0;
        offsetRef.current = 0;

        // 1. Send Metadata
        conn.send({
            type: 'metadata',
            name: currentFile.name,
            size: currentFile.size,
            fileType: currentFile.type
        });

        // 2. Start Reading and Sending Loop
        // Small delay to ensure metadata is received
        setTimeout(() => sendNextChunk(conn, currentFile), 100);
    };

    const sendNextChunk = (conn, currentFile) => {
        // Stop if connection died
        if (!conn || !conn.open) return;

        // Check Backpressure
        if (conn.bufferedAmount > MAX_BUFFER_AMOUNT) {
            setTimeout(() => sendNextChunk(conn, currentFile), 50);
            return;
        }

        const offset = offsetRef.current;

        if (offset >= currentFile.size) {
            conn.send({ type: 'end' });
            setTransferStatus('completed');
            setProgress(100);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const chunk = e.target.result;

            conn.send({
                type: 'chunk',
                data: chunk,
                offset: offset
            });

            offsetRef.current += chunk.byteLength;

            // Update Progress & Speed
            const now = Date.now();
            if (now - lastProgressTimeRef.current >= 500) {
                const percent = Math.min((offsetRef.current / currentFile.size) * 100, 100);
                setProgress(percent);

                const bytesSinceLast = offsetRef.current - lastOffsetRef.current;
                const timeSinceLast = (now - lastProgressTimeRef.current) / 1000;
                if (timeSinceLast > 0) {
                    setSpeed(bytesSinceLast / timeSinceLast);
                }

                lastProgressTimeRef.current = now;
                lastOffsetRef.current = offsetRef.current;
            }

            // Loop
            sendNextChunk(conn, currentFile);
        };

        const slice = currentFile.slice(offset, offset + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
    };

    const selectFile = (selectedFile) => {
        setFile(selectedFile);
        fileRef.current = selectedFile;
        setTransferStatus('idle');
        setProgress(0);
        setSpeed(0);
        // Note: Changing file triggers useEffect ensuring listening is active if peer exists
    };

    const resetSender = () => {
        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }
        setFile(null);
        fileRef.current = null;
        setTransferStatus('idle');
        setProgress(0);
    };

    return {
        file,
        transferStatus,
        progress,
        speed,
        // Removed connectToReceiver
        selectFile,
        resetSender
    };
};
