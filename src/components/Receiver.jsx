import React, { useEffect, useState, useRef } from 'react';
import { Peer } from 'peerjs';

const Receiver = () => {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('idle'); // idle, connecting, receiving, completed, error
    const [progress, setProgress] = useState(0);
    const [fileMeta, setFileMeta] = useState(null);
    const chunksRef = useRef([]);
    const receivedSizeRef = useRef(0);
    const peerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []);

    const handleConnect = (e) => {
        e.preventDefault();
        if (code.length !== 6) return;

        setStatus('connecting');
        const peer = new Peer(); // Random ID for receiver
        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log('My ID: ' + id);
            const conn = peer.connect(`brotransfer-${code}`);

            conn.on('open', () => {
                console.log('Connected to Sender');
                setStatus('connected');
            });

            conn.on('data', (data) => {
                if (data.type === 'metadata') {
                    setFileMeta(data);
                    setStatus('receiving');
                    chunksRef.current = [];
                    receivedSizeRef.current = 0;
                } else if (data.type === 'chunk') {
                    chunksRef.current.push(data.data);
                    receivedSizeRef.current += data.data.byteLength;

                    if (fileMeta) {
                        const percent = Math.min((receivedSizeRef.current / fileMeta.size) * 100, 100);
                        setProgress(percent);
                    }
                } else if (data.type === 'end') {
                    setStatus('completed');
                    downloadFile();
                }
            });

            conn.on('error', (err) => {
                console.error('Connection error:', err);
                setStatus('error');
            });

            conn.on('close', () => {
                console.log("Connection closed");
            });
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            setStatus('error');
        });
    };

    const downloadFile = () => {
        if (!fileMeta || chunksRef.current.length === 0) return;

        const blob = new Blob(chunksRef.current, { type: fileMeta.type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileMeta.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setCode('');
        setStatus('idle');
        setProgress(0);
        setFileMeta(null);
        chunksRef.current = [];
        receivedSizeRef.current = 0;
    };

    return (
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            {status === 'idle' && (
                <form onSubmit={handleConnect} className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Receive File</h2>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            Enter 6-digit code
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="000000"
                            style={{
                                width: '100%',
                                maxWidth: '300px',
                                fontSize: '2.5rem',
                                letterSpacing: '0.5rem',
                                textAlign: 'center',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '2px solid var(--border-color)',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                fontFamily: 'monospace'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={code.length !== 6}
                        style={{
                            background: code.length === 6 ? 'var(--accent-primary)' : 'var(--bg-primary)',
                            color: code.length === 6 ? 'white' : 'var(--text-secondary)',
                            padding: '1rem 2rem',
                            borderRadius: '8px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            width: '100%',
                            maxWidth: '300px',
                            cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                            opacity: code.length === 6 ? 1 : 0.5
                        }}
                    >
                        Receive
                    </button>
                </form>
            )}

            {(status === 'connecting' || status === 'connected') && (
                <div className="card" style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                    <h2>{status === 'connecting' ? 'Connecting to peer...' : 'Waiting for file...'}</h2>
                    <button onClick={reset} style={{ marginTop: '1rem', background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
                </div>
            )}

            {status === 'receiving' && fileMeta && (
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>Downloading...</h2>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{fileMeta.name}</p>

                    <div style={{ width: '100%', height: '10px', background: 'var(--bg-primary)', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                            transition: 'width 0.2s linear'
                        }}></div>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{Math.round(progress)}%</p>
                </div>
            )}

            {status === 'completed' && (
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Download Complete!</h2>
                    <p style={{ marginBottom: '1.5rem' }}>{fileMeta?.name} has been saved to your device.</p>
                    <button
                        onClick={reset}
                        style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '0.8rem 1.5rem',
                            borderRadius: '6px',
                            fontWeight: 'bold'
                        }}
                    >
                        Receive Another
                    </button>
                </div>
            )}

            {status === 'error' && (
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Error</h2>
                    <p>Could not connect to peer. Check the code and try again.</p>
                    <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Try Again</button>
                </div>
            )}
        </div>
    );
};

export default Receiver;
