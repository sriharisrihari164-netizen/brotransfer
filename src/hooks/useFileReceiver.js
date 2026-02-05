import { useState, useRef, useEffect, useCallback } from 'react';

export const useFileReceiver = (peer, myId) => {
    const [fileMeta, setFileMeta] = useState(null);
    const [transferStatus, setTransferStatus] = useState('idle'); // idle, connecting, waiting, receiving, completed, error
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [speed, setSpeed] = useState(0);

    const chunksRef = useRef([]);
    const receivedSizeRef = useRef(0);
    const connectionRef = useRef(null);
    const lastProgressTimeRef = useRef(0);
    const lastReceivedSizeRef = useRef(0);
    const fileMetaRef = useRef(null);

    // Keep handleDataRef up to date with the latest render's handleData
    const handleDataRef = useRef(null);

    const handleData = (data, conn) => {
        if (data.type === 'metadata') {
            console.log("Received Metadata:", data);
            setFileMeta(data);
            fileMetaRef.current = data;
            setTransferStatus('receiving');
            chunksRef.current = []; // Clear buffer
            receivedSizeRef.current = 0;
            lastProgressTimeRef.current = Date.now();
            lastReceivedSizeRef.current = 0;
            setErrorMsg('');
        }
        else if (data.type === 'chunk') {
            chunksRef.current.push(data.data);
            receivedSizeRef.current += data.data.byteLength;

            // Update Progress & Speed periodically
            const now = Date.now();
            if (now - lastProgressTimeRef.current > 500 && fileMetaRef.current) {
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
            console.log("Transfer finished.");
            setTransferStatus('completed');
            setProgress(100);

            // Auto download attempt
            downloadFile();
        }
    };

    useEffect(() => {
        handleDataRef.current = handleData;
    });

    const connectToSender = useCallback((code) => {
        if (!peer || !code) return;

        const connId = `brotransfer-${code}`;
        console.log(`Connecting to Sender: ${connId}`);
        setTransferStatus('connecting');
        setErrorMsg('');

        const conn = peer.connect(connId, {
            reliable: true
        });

        connectionRef.current = conn;

        conn.on('open', () => {
            console.log('Connected to Sender!');
            setTransferStatus('waiting'); // Waiting for metadata
        });

        conn.on('data', (data) => {
            // Use the ref to ensure we call the latest handleData (with access to fresh state)
            if (handleDataRef.current) {
                handleDataRef.current(data, conn);
            }
        });

        conn.on('close', () => {
            console.log('Sender disconnected');
            setTransferStatus(prev => {
                if (prev === 'completed') return prev;
                setErrorMsg('Sender disconnected prematurely');
                return 'error';
            });
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            setErrorMsg(err.message || 'Connection failed');
            setTransferStatus('error');
        });

    }, [peer]);

    const downloadFile = useCallback(() => {
        const meta = fileMetaRef.current;
        if (!meta || chunksRef.current.length === 0) {
            console.error("Attempted download with no metadata or empty body.", { meta, chunks: chunksRef.current.length });
            return;
        }

        try {
            console.log("Downloading file:", meta.name, "Size:", meta.size);
            const blob = new Blob(chunksRef.current, { type: meta.fileType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = meta.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => URL.revokeObjectURL(url), 10000); // 10s delay
        } catch (err) {
            console.error("Download failed:", err);
            setErrorMsg("Failed to construct file. System memory limit might be exceeded.");
        }
    }, []);

    const resetReceiver = () => {
        setFileMeta(null);
        fileMetaRef.current = null;
        setTransferStatus('idle');
        setProgress(0);
        setSpeed(0);
        chunksRef.current = [];
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
        connectToSender,
        downloadFile,
        resetReceiver
    };
};
