import React, { useMemo, useState, useEffect } from 'react';
import { usePeer } from '../hooks/usePeer';
import { useFileSender } from '../hooks/useFileSender';
import FileDrop from './FileDrop';

const Sender = ({ onReset }) => {
    // Generate a stable code for this session
    const code = useMemo(() => Math.floor(100000 + Math.random() * 900000).toString(), []);
    const peerId = `brotransfer-${code}`;

    const { peer, status: peerStatus, error: peerError } = usePeer(peerId);
    const {
        file,
        transferStatus,
        progress,
        speed,
        selectFile,
        resetSender: softReset
    } = useFileSender(peer);

    const formatSpeed = (bytesPerSec) => {
        if (bytesPerSec < 1024) return bytesPerSec.toFixed(0) + ' B/s';
        if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
        return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
    };

    const handleReset = () => {
        // Trigger parent to re-mount us, getting a fresh Peer ID and clean slate.
        if (onReset) onReset();
        else softReset(); // Fallback
    };

    if (peerError) {
        return (
            <div className="glass-card animate-fade-in" style={{ textAlign: 'center', borderColor: 'var(--error)' }}>
                <h3 style={{ color: 'var(--error)' }}>Connection Error</h3>
                <p>{peerError.message}</p>
                <button className="glass-btn" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>

            {/* 1. File Selection State */}
            {transferStatus === 'idle' && (
                <>
                    <FileDrop onFileSelected={selectFile} />
                    {peerStatus === 'loading' && (
                        <p style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.7 }}>Initializing secure connection...</p>
                    )}
                </>
            )}

            {/* 2. Ready / Waiting for Receiver State */}
            {transferStatus === 'connecting' || (transferStatus === 'idle' && file) ? (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Ready to Send</h2>

                    <div className="glass-input" style={{ marginBottom: '2rem', display: 'inline-block', textAlign: 'left' }}>
                        <span style={{ opacity: 0.7 }}>File: </span>
                        <strong>{file?.name}</strong>
                        <br />
                        <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                            Size: {(file?.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                    </div>

                    <p style={{ opacity: 0.8, marginBottom: '0.5rem' }}>Ask receiver to enter this code:</p>
                    <div style={{
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        letterSpacing: '0.4rem',
                        color: 'var(--accent-primary)',
                        textShadow: '0 0 30px var(--accent-glow)',
                        marginBottom: '1rem'
                    }}>
                        {code}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <div className="spinner"></div>
                        <p className="animate-pulse" style={{ marginTop: '1rem' }}>Waiting for receiver connection...</p>
                    </div>

                    <button
                        className="glass-btn"
                        onClick={handleReset}
                        style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7 }}
                    >
                        Cancel
                    </button>
                </div>
            ) : null}

            {/* 3. Transferring State */}
            {(transferStatus === 'transferring' || transferStatus === 'completed') && (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1rem' }}>
                        {transferStatus === 'completed' ? 'Sent Successfully!' : 'Sending...'}
                    </h2>

                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8, marginBottom: '2rem' }}>
                        <span>{Math.round(progress)}%</span>
                        <span>{formatSpeed(speed)}</span>
                    </div>

                    {transferStatus === 'completed' && (
                        <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
                            <button className="glass-btn primary" onClick={handleReset}>
                                Send Another File
                            </button>
                        </div>
                    )}

                    {/* 4. Error State */}
                    {transferStatus === 'error' && (
                        <div className="glass-card" style={{ textAlign: 'center', borderColor: 'var(--error)' }}>
                            <h2 style={{ color: 'var(--error)', marginBottom: '1rem' }}>Transfer Failed</h2>
                            <p>The connection was lost or interrupted.</p>
                            <button className="glass-btn" onClick={handleReset} style={{ marginTop: '1.5rem' }}>
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            );
};

            export default Sender;
