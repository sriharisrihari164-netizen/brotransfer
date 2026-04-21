import { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '../utils/debugLog';

export const useFileReceiver = (peer) => {
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

    // MOBILE FIX: Store the Blob immediately when transfer completes
    // to prevent mobile memory pressure from clearing the chunks array
    const pendingBlobRef = useRef(null);

    // Track if streaming was used (persists even after stream closes)
    const [isStreaming, setIsStreaming] = useState(false);

    // Keep handleDataRef up to date with the latest render's handleData
    const handleDataRef = useRef(null);

    const handleData = async (data, conn) => {
        if (data.type === 'metadata') {
            logger.info("Received metadata", data);

            // Lazy Cleanup: Revoke OLD blobs now that a NEW transfer is starting
            if (objectUrlsRef.current.length > 0) {
                logger.info("Cleaning up previous file memory...");
                objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
                objectUrlsRef.current = [];
            }

            // Sender sends flat metadata object (name, size, fileType), not wrapped in .meta
            const meta = {
                name: data.name,
                size: data.size,
                fileType: data.fileType
            };

            fileMetaRef.current = meta;
            setFileMeta(meta);
            // Wait for user approval to enable streaming (User Gesture)
            setTransferStatus('asking-permission');
        }
        else if (data.type === 'chunk') {
            setErrorMsg('');

            // Write to stream OR RAM
            if (writableStreamRef.current) {
                // We should write async but we are in an event handler. 
                // We need to ensure order. Streams handle this via internal queue usually, 
                // but strictly we should await. 
                // Fire and forget (catch error) for now, assuming robust stream.
                writableStreamRef.current.write(data.data).catch(err => {
                    logger.error("Stream write error", err);
                    setErrorMsg("Disk write error");
                    conn.close();
                });
            } else {
                chunksRef.current.push(data.data);
                logger.info(`[CHUNK] Pushed chunk. Total chunks: ${chunksRef.current.length}`);
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
            logger.info("[END] Transfer finished", { received: receivedSizeRef.current, expected: fileMetaRef.current?.size });
            logger.info(`[END] Chunks array length: ${chunksRef.current.length}`);
            logger.info(`[END] writableStreamRef: ${!!writableStreamRef.current}`);

            // CRITICAL FIX: Properly close stream BEFORE marking as completed
            if (writableStreamRef.current) {
                try {
                    logger.info("Closing writable stream...");
                    await writableStreamRef.current.close();
                    logger.success("Stream closed successfully.");
                    writableStreamRef.current = null;
                } catch (e) {
                    logger.error("Stream close error", e);
                    setErrorMsg("Failed to finalize file save");
                    return;
                }
            }

            // Verify integrity
            if (fileMetaRef.current && receivedSizeRef.current !== fileMetaRef.current.size) {
                logger.warn("Size mismatch!", { received: receivedSizeRef.current, expected: fileMetaRef.current.size });
                setErrorMsg("Transfer mismatch/corruption detected.");
                return;
            }

            setTransferStatus('completed');
            setProgress(100);

            // Send ACK
            conn.send({ type: 'ack-end' });

            // MOBILE FIX: Create Blob IMMEDIATELY before any delays or async operations
            // This prevents mobile browsers from clearing the chunks array due to memory pressure
            // Only do this if we're NOT streaming (chunks mode)
            if (chunksRef.current.length > 0) {
                // RAM mode: create blob and trigger download
                logger.info("[BLOB] Starting blob creation", { chunks: chunksRef.current.length });
                try {
                    logger.info("[BLOB] RAM mode: Creating Blob immediately");
                    const blob = new Blob(chunksRef.current, { type: fileMetaRef.current?.fileType });

                    // Verify blob size
                    if (blob.size !== fileMetaRef.current?.size) {
                        logger.error("Blob size mismatch!", { expected: fileMetaRef.current?.size, actual: blob.size });
                    }

                    // Store the blob for later download
                    pendingBlobRef.current = blob;
                    logger.success("[BLOB] Blob created and stored", { size: blob.size });

                    // Now we can safely clear chunks to free memory
                    const chunkCount = chunksRef.current.length;
                    chunksRef.current = [];
                    logger.info(`Cleared ${chunkCount} chunks after creating Blob`);

                    // DISABLED AUTO-DOWNLOAD: Let user click button manually
                    /*
                    setTimeout(() => {
                        console.log("Triggering auto-download from pendingBlob");
                        downloadFile();
                    }, 200);
                    */
                    logger.info("[BLOB] Blob ready. Click 'Download File' button to download.");
                } catch (err) {
                    logger.error("Failed to create Blob on transfer end", err);
                    setErrorMsg("Memory error: Failed to process file. Try manual download.");
                }
            } else {
                // Streaming mode: file already saved to disk, no download needed
                logger.success("Streaming mode: File saved to disk successfully.");
            }
        }
    };

    useEffect(() => {
        handleDataRef.current = handleData;
    });

    const connectToSender = useCallback((code) => {
        if (!peer || !code) return;

        const connId = `brotransfer-${code}`;
        logger.info(`Connecting to Sender: ${connId}`);
        setTransferStatus('connecting');
        setErrorMsg('');

        const conn = peer.connect(connId, {
            reliable: true
        });

        connectionRef.current = conn;

        // Connection timeout safety
        const timeoutId = setTimeout(() => {
            if (connectionRef.current === conn && conn.open === false) {
                logger.error("Connection attempt timed out");
                setErrorMsg("Connecting to Peer... Timed out. Please check the code and ensure the sender is ready.");
                setTransferStatus('error');
                conn.close();
            }
        }, 15000); // 15s timeout

        conn.on('open', () => {
            clearTimeout(timeoutId);
            logger.success('Connected to Sender!');
            setTransferStatus('waiting'); // Waiting for metadata
        });

        conn.on('data', (data) => {
            // Use the ref to ensure we call the latest handleData (with access to fresh state)
            if (handleDataRef.current) {
                handleDataRef.current(data, conn);
            }
        });

        conn.on('close', () => {
            clearTimeout(timeoutId);
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
            logger.error('Connection error', err);
            
            let msg = err.message || 'Connection failed';
            if (err.type === 'peer-unavailable') {
                msg = "Receiver could not find the Sender. This usually means the 6-digit code is incorrect or the Sender session has expired.";
            }

            setErrorMsg(msg);
            setTransferStatus('error');
        });
    }, [peer]);

    // Ensure connection is closed when component unmounts
    useEffect(() => {
        return () => {
            if (connectionRef.current) {
                connectionRef.current.close();
            }
            // Cleanup Memory on Unmount
            if (objectUrlsRef.current.length > 0) {
                logger.info("Unmounting: Cleaning up file memory...");
                objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
                objectUrlsRef.current = [];
            }
            // Close stream if open
            if (writableStreamRef.current) {
                writableStreamRef.current.close().catch(e => console.error("Stream close error on unmount", e));
                writableStreamRef.current = null;
            }
            chunksRef.current = [];
        };
    }, []);


    const downloadFile = useCallback(() => {
        logger.info("[DOWNLOAD] downloadFile called");
        const meta = fileMetaRef.current;
        logger.info("[DOWNLOAD] State check", {
            hasMeta: !!meta,
            objectUrls: objectUrlsRef.current.length,
            hasPendingBlob: !!pendingBlobRef.current,
            chunks: chunksRef.current.length
        });

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

        // 2. MOBILE FIX: Check if we have a pending Blob (created immediately on transfer end)
        if (pendingBlobRef.current) {
            logger.info("Using pending Blob for download", { size: pendingBlobRef.current.size });
            const blob = pendingBlobRef.current;
            // DON'T clear pendingBlob - but URL will be stored in objectUrlsRef for reuse
            // pendingBlobRef.current = null; 

            const url = URL.createObjectURL(blob);
            objectUrlsRef.current.push(url);

            const a = document.createElement('a');
            a.href = url;
            a.download = meta ? meta.name : 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            console.log("Download triggered from pending Blob. URL saved for reuse.");
            return;
        }

        // 3. Fallback: Generate from chunks (if they still exist)
        if (!meta || chunksRef.current.length === 0) {
            console.error("Attempted download with no metadata or empty body.", { meta, chunks: chunksRef.current.length });

            // MOBILE FIX: On mobile, sometimes the chunks array gets cleared prematurely
            // Log more details for debugging
            logger.warn("Download failed - no data available. This may be a memory issue on mobile.");
            logger.info("Current state", {
                hasMeta: !!meta,
                chunkCount: chunksRef.current.length,
                receivedSize: receivedSizeRef.current,
                objectUrls: objectUrlsRef.current.length,
                hasPendingBlob: !!pendingBlobRef.current
            });

            alert("Error: No file data found. The transfer may have completed but the file data was lost (mobile memory issue). Please try again.");
            return;
        }

        try {
            logger.info("Generating Blob for file", { name: meta.name, size: meta.size, chunks: chunksRef.current.length });
            const blob = new Blob(chunksRef.current, { type: meta.fileType });

            // Verify blob size
            if (blob.size !== meta.size) {
                console.error("Blob size mismatch!", { expected: meta.size, actual: blob.size });
                alert(`Warning: File size mismatch. Expected ${meta.size} bytes, got ${blob.size} bytes.`);
            }

            // CRITICAL MEMORY OPTIMIZATION for Mobile:
            // Immediately clear the raw chunks array to free RAM *before* other operations
            const chunkCount = chunksRef.current.length;
            chunksRef.current = [];
            console.log(`Cleared ${chunkCount} chunks to free memory.`);

            const url = URL.createObjectURL(blob);
            objectUrlsRef.current.push(url); // Track URL

            const a = document.createElement('a');
            a.href = url;
            a.download = meta.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            console.log("Download triggered successfully. Blob created and chunks cleared.");

        } catch (err) {
            console.error("Download failed:", err);
            alert(`Download Error: ${err.message}. Your device might be out of RAM.`);
            setErrorMsg("Failed to construct file. System memory limit might be exceeded.");
        }
    }, []);

    const acceptFile = useCallback(async () => {
        const meta = fileMetaRef.current;
        if (!meta) return;

        // MOBILE FIX: Aggressive cleanup before accepting new file
        console.log("Accepting file: Cleaning up previous transfer memory...");

        // 1. Revoke all previous object URLs
        if (objectUrlsRef.current.length > 0) {
            objectUrlsRef.current.forEach(url => {
                try {
                    URL.revokeObjectURL(url);
                    logger.info(`Revoked URL: ${url.substring(0, 50)}...`);
                } catch (e) {
                    console.warn("Failed to revoke URL:", e);
                }
            });
            objectUrlsRef.current = [];
        }

        // 2. Clear chunks array completely
        chunksRef.current.length = 0;
        chunksRef.current = [];

        // 3. Reset size counter
        receivedSizeRef.current = 0;

        // 4. Force a microtask delay to allow garbage collection on mobile
        // This gives the browser a chance to free memory before the next transfer
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("Memory cleanup complete. Ready for new transfer.");

        // STREAMING: File System Access API for unlimited file sizes
        // Try to use direct-to-disk streaming if supported by browser
        try {
            if (window.showSaveFilePicker) {
                logger.info("Attempting to open File Picker for streaming...");
                const handle = await window.showSaveFilePicker({
                    suggestedName: meta.name,
                });
                const writable = await handle.createWritable();
                writableStreamRef.current = writable;
                setIsStreaming(true); // Mark that streaming is being used
                logger.success("Streaming mode enabled (Direct to Disk). Supports unlimited file sizes!");
            } else {
                logger.info("File System Access API not supported. Using RAM buffering.");
            }
        } catch (err) {
            console.warn("Stream setup skipped/cancelled.", err);
            if (err.name === 'AbortError') {
                logger.info("User cancelled file picker. Aborting transfer.");
                return; // User cancelled, don't start transfer
            }
            logger.info("Falling back to RAM buffering mode.");
        }

        setTransferStatus('receiving');
        lastProgressTimeRef.current = Date.now();
        lastReceivedSizeRef.current = 0;
        setErrorMsg('');

        // Notify Sender to start
        if (connectionRef.current && connectionRef.current.open) {
            connectionRef.current.send({ type: 'ack-start' });
            logger.info("Sent ack-start to sender.");
        }
    }, []);

    const resetReceiver = () => {
        // Cleanup Memory
        objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        objectUrlsRef.current = [];
        chunksRef.current = [];
        pendingBlobRef.current = null; // Clear any pending blob

        setFileMeta(null);
        fileMetaRef.current = null;
        writableStreamRef.current = null; // Clear stream ref
        setIsStreaming(false); // Reset streaming flag
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
        isStreaming, // Expose if streaming was used (persists after stream closes)
        connectToSender,
        acceptFile,
        downloadFile,
        resetReceiver
    };
};

