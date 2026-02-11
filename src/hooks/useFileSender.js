import { useState, useRef, useEffect, useCallback } from 'react';
import FileWorker from '../workers/fileWorker.js?worker';

const CHUNK_SIZE = 64 * 1024; // Reverted to 64KB for maximum reliability
const MAX_BUFFER_AMOUNT = 64 * 1024 * 4; // Tighter buffer control

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
    const workerRef = useRef(null);

    // Listen for incoming connections
    useEffect(() => {
        if (!peer) return;

        const handleConnection = (conn) => {
            console.log("Sender received connection from:", conn.peer);

            // If no file is selected, we shouldn't really accept, or we might be in weird state.
            // But with the UI flow, we shouldn't reach here easily without a file.
            // Using ref to ensure we get the latest file instance without re-binding listener.
            if (!fileRef.current) {
                console.warn("Connection received but no file selected. Closing.");
                conn.close();
                return;
            }

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
                // Only react if this is the active connection
                if (connectionRef.current === conn) {
                    setTransferStatus(prev => prev === 'completed' ? prev : 'error');
                }
            });

            conn.on('data', (data) => {
                if (data && data.type === 'ack-end') {
                    console.log("Received ACK-END from receiver. Transfer complete.");
                    // Only now do we consider it completed
                    setTransferStatus('completed');
                    setProgress(100);
                }
                else if (data && data.type === 'ack-start') {
                    console.log("Receiver accepted file. Starting transfer...");
                    setTransferStatus('transferring');
                    if (fileRef.current) {
                        requestNextChunk(fileRef.current, 0);
                    }
                }
            });

            conn.on('error', (err) => {
                console.error("Connection error:", err);
                setTransferStatus('error');
            });
        };

        console.log("Sender attached connection listener.");
        peer.on('connection', handleConnection);

        return () => {
            peer.off('connection', handleConnection);
        };

    }, [peer]);

    // Initialize Worker
    // Keep latest ref for worker callback
    const handleChunkFromWorkerRef = useRef(null);

    // Initialize Worker
    useEffect(() => {
        const worker = new FileWorker();
        workerRef.current = worker;

        worker.onmessage = (e) => {
            const { type, data, offset, error } = e.data;
            if (type === 'chunk_data') {
                if (handleChunkFromWorkerRef.current) {
                    handleChunkFromWorkerRef.current(data, offset);
                }
            } else if (type === 'error') {
                console.error("Worker error:", error);
                setTransferStatus('error');
            }
        };

        return () => {
            worker.terminate();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [peer]);

    const requestNextChunk = useCallback((currentFile, offset) => {
        if (!workerRef.current) return;
        workerRef.current.postMessage({
            action: 'read_chunk',
            file: currentFile,
            offset: offset,
            chunkSize: CHUNK_SIZE
        });
    }, []);

    // Recursive function using Ref to avoid dependency cycle
    const waitForBuffer = useCallback((conn, currentFile, nextOffset) => {
        if (!conn.open) return;
        if (conn.bufferedAmount <= MAX_BUFFER_AMOUNT / 2) {
            requestNextChunk(currentFile, nextOffset);
        } else {
            setTimeout(() => waitForBuffer(conn, currentFile, nextOffset), 50);
        }
    }, [requestNextChunk]);

    const updateProgress = useCallback((totalSize) => {
        const now = Date.now();
        if (now - lastProgressTimeRef.current >= 200) {
            const percent = Math.min((offsetRef.current / totalSize) * 100, 100);
            setProgress(percent);

            const bytesSinceLast = offsetRef.current - lastOffsetRef.current;
            const timeSinceLast = (now - lastProgressTimeRef.current) / 1000;
            if (timeSinceLast > 0) {
                setSpeed(bytesSinceLast / timeSinceLast);
            }

            lastProgressTimeRef.current = now;
            lastOffsetRef.current = offsetRef.current;
        }
    }, []);

    const handleChunkFromWorker = useCallback((chunkData, offset) => {
        const conn = connectionRef.current;
        const currentFile = fileRef.current;

        if (!conn || !conn.open || !currentFile) return;

        conn.send({
            type: 'chunk',
            data: chunkData,
            offset: offset
        });

        offsetRef.current += chunkData.byteLength;
        updateProgress(currentFile.size);

        const nextOffset = offset + chunkData.byteLength;

        if (nextOffset >= currentFile.size) {
            conn.send({ type: 'end' });
            setTransferStatus('waiting-for-ack');
            setProgress(100);
            return;
        }

        if (conn.bufferedAmount > MAX_BUFFER_AMOUNT) {
            waitForBuffer(conn, currentFile, nextOffset);
        } else {
            requestNextChunk(currentFile, nextOffset);
        }
    }, [requestNextChunk, waitForBuffer, updateProgress]);

    // Keep Ref updated
    useEffect(() => {
        handleChunkFromWorkerRef.current = handleChunkFromWorker;
    }, [handleChunkFromWorker]);

    const startTransfer = useCallback((conn) => {
        const currentFile = fileRef.current;
        if (!currentFile) return;

        startTimeRef.current = Date.now();
        lastProgressTimeRef.current = Date.now();
        lastOffsetRef.current = 0;
        offsetRef.current = 0;

        conn.send({
            type: 'metadata',
            name: currentFile.name,
            size: currentFile.size,
            fileType: currentFile.type
        });

        console.log("Metadata sent. Waiting for receiver acceptance...");
        setTransferStatus('waiting-for-approval');
    }, []); // No dependencies needed as it relies on refs/setters



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
