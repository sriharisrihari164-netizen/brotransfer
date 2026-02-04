import React, { useEffect, useState, useRef } from 'react';
import { Peer } from 'peerjs';
import FileDrop from './FileDrop';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 16384; // 16KB

const Sender = () => {
    const [file, setFile] = useState(null);
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('idle'); // idle, ready, connecting, transferring, completed
    const [progress, setProgress] = useState(0);
    const peerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []);

    const generateCode = () => {
        // Generate a random 6-digit code
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const initializePeer = (codeObj) => {
        const peerId = `brotransfer-${codeObj}`;
        const peer = new Peer(peerId);
        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log('My Peer ID is: ' + id);
            setCode(codeObj);
            setStatus('ready');
        });

        peer.on('connection', (conn) => {
            console.log('Connected to: ' + conn.peer);
            setStatus('connecting');

            conn.on('open', () => {
                setStatus('transferring');
                sendFile(conn);
            });

            conn.on('close', () => {
                console.log('Connection closed');
                setStatus(prev => prev === 'completed' ? prev : 'error');
            });
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            if (err.type === 'unavailable-id') {
                // Retry with new code if collision (unlikely but possible)
                const newCode = generateCode();
                initializePeer(newCode);
            } else {
                setStatus('error');
            }
        });
    };

    const fileRef = useRef(null); // Keep fresh ref for callbacks

    const handleFileSelected = (selectedFile) => {
        setFile(selectedFile);
        fileRef.current = selectedFile;
        const newCode = generateCode();
        initializePeer(newCode);
    };

    const sendFile = (conn) => {
        const currentFile = fileRef.current;
        if (!currentFile) return;

        // Send metadata
        conn.send({
            type: 'metadata',
            name: currentFile.name,
            size: currentFile.size,
            type: currentFile.type
        });

        let offset = 0;
        const reader = new FileReader();

        reader.onload = (e) => {
            conn.send({
                type: 'chunk',
                data: e.target.result,
                offset: offset
            });

            offset += e.target.result.byteLength;
            const percent = Math.min((offset / currentFile.size) * 100, 100);
            setProgress(percent);

            if (offset < currentFile.size) {
                // Throttle to prevent buffer overflow and ensure reliability
                setTimeout(readNextChunk, 10);
            } else {
                conn.send({ type: 'end' });
                setStatus('completed');
            }
        };

        const readNextChunk = () => {
            const slice = currentFile.slice(offset, offset + CHUNK_SIZE);
            reader.readAsArrayBuffer(slice);
        };

        // Small delay before starting chunks to ensure metadata is received
        setTimeout(readNextChunk, 100);
    };

    const reset = () => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setFile(null);
        setCode('');
        setStatus('idle');
        setProgress(0);
        fileRef.current = null;
    };

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            {status === 'idle' && (
                <FileDrop onFileSelected={handleFileSelected} />
            )}

            {status === 'ready' && (
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>File Ready to Send</h2>
                    <div style={{
                        background: 'var(--bg-primary)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        wordBreak: 'break-all'
                    }}>
                        📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>

                    <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Enter this code on the receiving device:</p>

                    <div style={{
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.5rem',
                        color: 'var(--accent-primary)',
                        margin: '1.5rem 0'
                    }}>
                        {code}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                        <p className="animate-pulse">Waiting for receiver...</p>
                    </div>

                    <button
                        onClick={reset}
                        style={{
                            marginTop: '1.5rem',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            padding: '0.5rem',
                            textDecoration: 'underline'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {(status === 'transferring' || status === 'completed') && (
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>{status === 'completed' ? 'Transfer Complete!' : 'Sending File...'}</h2>
                    <div style={{ width: '100%', height: '10px', background: 'var(--bg-primary)', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                            transition: 'width 0.2s linear'
                        }}></div>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(progress)}%</p>

                    {status === 'completed' && (
                        <button
                            onClick={reset}
                            style={{
                                marginTop: '2rem',
                                background: 'var(--accent-primary)',
                                color: 'white',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '8px',
                                fontWeight: 'bold'
                            }}
                        >
                            Send Another File
                        </button>
                    )}
                </div>
            )}

            {status === 'error' && (
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Error Occurred</h2>
                    <p>Something went wrong. Please try again.</p>
                    <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Try Again</button>
                </div>
            )}
        </div>
    );
};

export default Sender;
