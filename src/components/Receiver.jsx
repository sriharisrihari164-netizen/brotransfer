import React, { useState, useEffect } from 'react';
import { usePeer } from '../hooks/usePeer';
import { useFileReceiver } from '../hooks/useFileReceiver';

const Receiver = ({ onReset }) => {
    const [code, setCode] = useState('');
    const [refreshTimer, setRefreshTimer] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true); // Default to true for reliability
    const { peer, myId, status: peerStatus, error: peerError } = usePeer();
    const {
        fileMeta,
        transferStatus,
        progress,
        speed,
        errorMsg,
        isStreaming,
        connectToSender,
        downloadFile,
        resetReceiver
    } = useFileReceiver(peer, myId);

    // Auto-Refresh Logic
    useEffect(() => {
        if (transferStatus === 'completed' && autoRefresh) {
            setRefreshTimer(5); // Start 5s countdown
            const timer = setInterval(() => {
                setRefreshTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        window.location.reload(); // Force Reload
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setRefreshTimer(null); // Reset if toggled off
        }
    }, [transferStatus, autoRefresh]);

    const handleConnect = (e) => {
        e.preventDefault();
        if (code.length !== 6 || !peer) return;
        connectToSender(code);
    };

    const handleReset = () => {
        if (onReset) onReset();
        else resetReceiver();
    };

    const formatSpeed = (bytesPerSec) => {
        if (bytesPerSec < 1024) return bytesPerSec.toFixed(0) + ' B/s';
        if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
        return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
    };

    if (peerError) {
        return (
            <div className="glass-card animate-fade-in" style={{ textAlign: 'center', borderColor: 'var(--error)' }}>
                <h3 style={{ color: 'var(--error)' }}>Network Error</h3>
                <p>{peerError.message}</p>
                <button className="glass-btn" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>

            {/* 1. Idle / Entry State */}
            {transferStatus === 'idle' && (
                <form onSubmit={handleConnect} className="glass-card" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Receive File</h2>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.8rem', opacity: 0.8 }}>
                            Enter 6-digit code
                        </label>
                        <input
                            required
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="000000"
                            className="glass-input"
                            style={{
                                width: '100%',
                                maxWidth: '280px',
                                fontSize: '2.5rem',
                                letterSpacing: '0.5rem',
                                textAlign: 'center',
                                fontFamily: 'monospace',
                                color: 'var(--accent-primary)',
                                fontWeight: 'bold'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={code.length !== 6 || peerStatus !== 'ready'}
                        className={`glass-btn ${code.length === 6 ? 'primary' : ''}`}
                        style={{ width: '100%', maxWidth: '280px', opacity: code.length === 6 ? 1 : 0.5 }}
                    >
                        {peerStatus === 'loading' ? 'Initializing...' : 'Receive'}
                    </button>
                </form>
            )}

            {/* 2. Connecting / Waiting State */}
            {(transferStatus === 'connecting' || transferStatus === 'waiting') && (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
                    <h2>{transferStatus === 'connecting' ? 'Connecting to Peer...' : 'Waiting for Metadata...'}</h2>
                    <button className="glass-btn" onClick={handleReset} style={{ marginTop: '1.5rem' }}>Cancel</button>
                </div>
            )}

            {/* 3. Receiving State */}
            {(transferStatus === 'receiving' || transferStatus === 'completed') && fileMeta && (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>
                        {transferStatus === 'completed'
                            ? (isStreaming ? 'File Saved!' : 'Download Ready')
                            : (isStreaming ? 'Saving to Disk...' : 'Downloading...')}
                    </h2>

                    <div style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                        {fileMeta.name} ({(fileMeta.size / 1024 / 1024).toFixed(2)} MB)
                    </div>

                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 'bold' }}>
                        <span>{Math.round(progress)}%</span>
                        <span>{formatSpeed(speed)}</span>
                    </div>

                    {/* Show Download Button if Completed OR Progress is 100% (fallback for stuck transfers) */}
                    {(transferStatus === 'completed' || progress >= 100) && (
                        <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
                            {!isStreaming && (
                                <button
                                    className="glass-btn primary"
                                    onClick={downloadFile}
                                    style={{ width: '100%', marginBottom: '1rem' }}
                                >
                                    Download File
                                </button>
                            )}

                            {/* Auto-Refresh Message & Toggle */}
                            {autoRefresh && (
                                <div style={{ margin: '1rem 0', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                    Refreshing in {refreshTimer}s...
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="autoRefresh"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                />
                                <label htmlFor="autoRefresh" style={{ cursor: 'pointer', opacity: 0.8 }}>Auto-Refresh Website</label>
                            </div>

                            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1rem' }}>
                                (Clearing memory for next transfer)
                            </p>

                            <button
                                className="glass-btn"
                                onClick={() => window.location.reload()}
                            >
                                Refresh Now
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 4. Error State */}
            {transferStatus === 'error' && (
                <div className="glass-card" style={{ textAlign: 'center', borderColor: 'var(--error)' }}>
                    <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Error</h2>
                    <p>{errorMsg}</p>
                    <button className="glass-btn" onClick={handleReset} style={{ marginTop: '1rem' }}>Try Again</button>
                </div>
            )}
        </div>
    );
};

export default Receiver;
