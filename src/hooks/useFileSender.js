import { useState, useRef, useEffect, useCallback } from 'react';
import FileWorker from '../workers/fileWorker.js?worker';
import { logger } from '../utils/debugLog';

const CHUNK_SIZE = 64 * 1024; // 64KB for maximum reliability
const MAX_BUFFER_AMOUNT = 64 * 1024 * 4; // 256KB buffer limit

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
    const handleChunkFromWorkerRef = useRef(null);

    // 1. Send chunk request to Web Worker
    const requestNextChunk = useCallback((currentFile, offset) => {
        if (!workerRef.current) return;
        workerRef.current.postMessage({
            action: 'read_chunk',
            file: currentFile,
            offset: offset,
            chunkSize: CHUNK_SIZE
        });
    }, []);

    // 2. Update transfer speed and progress
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

    const getBufferedAmount = (conn) => {
        return conn?.dataChannel?.bufferedAmount ?? conn?.bufferSize ?? conn?.bufferedAmount ?? 0;
    };

    // 3. Buffer backpressure handler
    const waitForBuffer = useCallback(function checkBuffer(conn, currentFile, nextOffset) {
        if (!conn || !conn.open) return;
        const buffered = getBufferedAmount(conn);
        if (buffered <= MAX_BUFFER_AMOUNT / 2) {
            requestNextChunk(currentFile, nextOffset);
        } else {
            setTimeout(() => {
                checkBuffer(conn, currentFile, nextOffset);
            }, 50);
        }
    }, [requestNextChunk]);

    // 4. Chunk callback from worker
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

        const buffered = getBufferedAmount(conn);
        if (buffered > MAX_BUFFER_AMOUNT) {
            waitForBuffer(conn, currentFile, nextOffset);
        } else {
            requestNextChunk(currentFile, nextOffset);
        }
    }, [requestNextChunk, waitForBuffer, updateProgress]);

    // Keep handleChunkFromWorkerRef up to date
    useEffect(() => {
        handleChunkFromWorkerRef.current = handleChunkFromWorker;
    }, [handleChunkFromWorker]);

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
                logger.error("Worker error", error);
                setTransferStatus('error');
            }
        };

        return () => {
            worker.terminate();
        };
    }, []);

    // 5. Start transfer by sending metadata
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

        logger.info("Metadata sent. Waiting for receiver acceptance...");
        setTransferStatus('waiting-for-approval');
    }, []);

    // 6. Listen for incoming connections from receiver
    useEffect(() => {
        if (!peer) return;

        const handleConnection = (conn) => {
            logger.info("Sender received connection from", conn.peer);

            if (!fileRef.current) {
                logger.warn("Connection received but no file selected. Closing.");
                conn.close();
                return;
            }

            connectionRef.current = conn;
            setTransferStatus('connecting');

            const onConnectionOpen = () => {
                logger.info("Connection opened! Sending metadata...");
                startTransfer(conn);
            };

            if (conn.open) {
                onConnectionOpen();
            } else {
                conn.on('open', onConnectionOpen);
            }

            conn.on('close', () => {
                logger.info("Connection closed.");
                if (connectionRef.current === conn) {
                    setTransferStatus(prev => prev === 'completed' ? prev : 'error');
                }
            });

            conn.on('data', (data) => {
                if (data && data.type === 'ack-end') {
                    logger.success("Received ACK-END from receiver. Transfer complete.");
                    setTransferStatus('completed');
                    setProgress(100);
                } else if (data && data.type === 'ack-start') {
                    logger.info("Receiver accepted file. Starting transfer...");
                    setTransferStatus('transferring');
                    if (fileRef.current) {
                        requestNextChunk(fileRef.current, 0);
                    }
                }
            });

            conn.on('error', (err) => {
                logger.error("Connection error", err);
                setTransferStatus('error');
            });
        };

        logger.info("Sender attached connection listener.");
        peer.on('connection', handleConnection);

        return () => {
            peer.off('connection', handleConnection);
        };
    }, [peer, requestNextChunk, startTransfer]);

    const selectFile = (selectedFile) => {
        setFile(selectedFile);
        fileRef.current = selectedFile;
        setTransferStatus('idle');
        setProgress(0);
        setSpeed(0);
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
        selectFile,
        resetSender
    };
};
