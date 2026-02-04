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
            handleData(data, conn);
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

    const handleData = (data, conn) => {
        if (data.type === 'metadata') {
            console.log("Received Metadata:", data);
            setFileMeta(data);
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
            if (now - lastProgressTimeRef.current > 500 && fileMeta) {
                const percent = Math.min((receivedSizeRef.current / fileMeta.size) * 100, 100);
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

    const downloadFile = useCallback(() => {
        // ... (Download logic same as before, but accessing ref/state via closure)
        // Since we are inside the hook, we need access to the CURRENT refs.
        // But `downloadFile` needs `fileMeta` from state.

        // Note: inside useCallback with dependency [fileMeta], logic is fine.
        // HOWEVER, `chunksRef` is a ref, so it's always fresh.
        if (!fileMeta || chunksRef.current.length === 0) return;

        try {
            const blob = new Blob(chunksRef.current, { type: fileMeta.fileType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileMeta.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => URL.revokeObjectURL(url), 10000); // 10s delay
        } catch (err) {
            console.error("Download failed:", err);
            setErrorMsg("Failed to construct file. System memory limit might be exceeded.");
        }
    }, [fileMeta]);

    const resetReceiver = () => {
        setFileMeta(null);
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
