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
    const writableStreamRef = useRef(null); // For File System Access API
    const objectUrlsRef = useRef([]); // Track created ObjectURLs for cleanup

    // Keep handleDataRef up to date with the latest render's handleData
    const handleDataRef = useRef(null);

    const handleData = (data, conn) => {
        if (data.type === 'metadata') {
            const meta = data;
            console.log("Received Metadata:", meta);

            // Lazy Cleanup: Revoke OLD blobs now that a NEW transfer is starting
            if (objectUrlsRef.current.length > 0) {
                console.log("Cleaning up previous file memory...");
                objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
                objectUrlsRef.current = [];
            }

            setFileMeta(meta);
            fileMetaRef.current = meta;
            setTransferStatus('receiving');
            chunksRef.current = [];
            receivedSizeRef.current = 0;

            // Attempt to open file stream for "unlimited" transfer
            // We can't use await here easily in the synchronous socket callback without care, 
            // but we can trigger the prompt. 
            // However, showSaveFilePicker usually requires user gesture. 
            // We might need to handle this differently or ask for permission *before* connect, 
            // OR we just prompt now and hope the browser allows it (it often blocks non-gesture).
            // Actually, for P2P, we usually accept -> then prompt. 
            // Let's TRY to prompt here. If it fails (due to no user gesture), we fall back?
            // BETTER: We should probably rely on a "Accept & Save" button in UI if possible, 
            // but the current flow is auto-start. 
            // Let's try the stream setup. If generic, we might need a transient "Click to Accept" state.
            // For now, let's try strict streaming if possible, else RAM.

            // ASYNC IIFE to handle stream setup
            (async () => {
                try {
                    if (window.showSaveFilePicker) {
                        const handle = await window.showSaveFilePicker({
                            suggestedName: meta.name,
                        });
                        const writable = await handle.createWritable();
                        writableStreamRef.current = writable;
                        console.log("Streaming mode enabled.");
                    }
                } catch (err) {
                    console.warn("Stream setup failed or cancelled (falling back to RAM):", err);
                }
            })();

            lastProgressTimeRef.current = Date.now();
            lastReceivedSizeRef.current = 0;
            setErrorMsg('');
        }
        else if (data.type === 'chunk') {
            // Write to stream OR RAM
            if (writableStreamRef.current) {
                // We should write async but we are in an event handler. 
                // We need to ensure order. Streams handle this via internal queue usually, 
                // but strictly we should await. 
                // Fire and forget (catch error) for now, assuming robust stream.
                writableStreamRef.current.write(data.data).catch(err => {
                    console.error("Stream write error:", err);
                    setErrorMsg("Disk write error");
                    conn.close();
                });
            } else {
                chunksRef.current.push(data.data);
            }

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



            // Finalize
            (async () => {
                if (writableStreamRef.current) {
                    try {
                        await writableStreamRef.current.close();
                        console.log("Stream closed.");
                    } catch (e) { console.error("Stream close error", e); }
                    writableStreamRef.current = null;
                }
            })();

            // Verify integrity
            if (fileMetaRef.current && receivedSizeRef.current !== fileMetaRef.current.size) {
                console.warn("Size mismatch!", receivedSizeRef.current, fileMetaRef.current.size);
                setErrorMsg("Transfer mismatch/corruption detected.");
                return;
            }

            setTransferStatus('completed');
            setProgress(100);

            // Send ACK
            conn.send({ type: 'ack-end' });

            // Only auto-download if we were buffering (RAM mode)
            if (!writableStreamRef.current) {
                downloadFile();
            }
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

    // Ensure connection is closed when component unmounts
    useEffect(() => {
        return () => {
            if (connectionRef.current) {
                connectionRef.current.close();
            }
        };
    }, []);

    const downloadFile = useCallback(() => {
        const meta = fileMetaRef.current;
        if (!meta || chunksRef.current.length === 0) {
            console.error("Attempted download with no metadata or empty body.", { meta, chunks: chunksRef.current.length });
            alert("Error: No file data found. Please try again.");
            return;
        }

        try {
            console.log("Downloading file:", meta.name, "Size:", meta.size);
            const blob = new Blob(chunksRef.current, { type: meta.fileType });
            const url = URL.createObjectURL(blob);
            objectUrlsRef.current.push(url); // Track URL

            const a = document.createElement('a');
            a.href = url;
            a.download = meta.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Removed Auto-Cleanup: Blob stays in RAM until next file starts (Lazy Cleanup)
            // This ensures manual download always works.

        } catch (err) {
            console.error("Download failed:", err);
            alert(`Download Error: ${err.message}. Your device might be out of RAM for this file size.`);
            setErrorMsg("Failed to construct file. System memory limit might be exceeded.");
        }
    }, []);

    const resetReceiver = () => {
        // Cleanup Memory
        objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        objectUrlsRef.current = [];
        chunksRef.current = [];

        setFileMeta(null);
        fileMetaRef.current = null;
        writableStreamRef.current = null; // Clear stream ref
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
        isStreaming: !!writableStreamRef.current, // Expose if we are using streaming mode
        connectToSender,
        downloadFile,
        resetReceiver
    };
};

