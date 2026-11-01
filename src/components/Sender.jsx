import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { usePeer } from '../hooks/usePeer';
import { useFileSender } from '../hooks/useFileSender';
import FileDrop from './FileDrop';

const generateRandomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const Sender = ({ onReset }) => {
    // Generate a stable code for this session
    const [code, setCode] = useState(generateRandomCode);

    const peerId = `brotransfer-${code}`;
    const [copied, setCopied] = useState(false);
    const [forceRelay, setForceRelay] = useState(false);

    const { peer, status: peerStatus, error: peerError, retry } = usePeer(peerId, forceRelay);
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

    const handleSoftReset = () => {
        // "Send Another File" / "Cancel" -> Keep same Peer ID
        softReset();
    };

    const handleNewSession = () => {
        // "New Session" -> Generate NEW Peer ID
        softReset();
        setCode(generateRandomCode());
        if (onReset) onReset();
    };

    if (peerError) {
        return (
            <div className="glass-card animate-fade-in text-center error-border">
                <h3 className="error-text">Connection Error</h3>
                <p>{peerError.message}</p>
                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button className="glass-btn primary" onClick={() => retry()}>Retry</button>
                    <button className="glass-btn" onClick={() => { setCode(generateRandomCode()); retry(); }}>New Code</button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-600 m-auto">
            
            {/* Signaling Status Badge */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                marginBottom: '1rem', 
                fontSize: '0.75rem',
                opacity: 0.8
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.3rem 0.6rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: peerStatus === 'ready' ? '#4ade80' : peerStatus === 'error' ? '#f87171' : '#fbbf24'
                    }}></div>
                    <span>{peerStatus === 'ready' ? 'Signaling: Connected' : peerStatus === 'loading' ? 'Signaling: Connecting...' : 'Signaling: Offline'}</span>
                </div>
            </div>

            {/* 1. File Selection State */}
            {transferStatus === 'idle' && (
                <>
                    <FileDrop onFileSelected={selectFile} />
                    {peerStatus === 'loading' && (
                        <p className="text-center animate-pulse" style={{ marginTop: '1rem', opacity: 0.7 }}>Preparing cloud signaling...</p>
                    )}
                </>
            )}

            {/* 2. Ready / Waiting for Receiver State */}
            {(transferStatus === 'connecting' || (transferStatus === 'idle' && file)) && (
                <div className="glass-card text-center">
                    <h2 style={{ marginBottom: '1rem' }}>Ready to Send</h2>

                    <div className="glass-input meta-info">
                        <span>File: </span>
                        <strong>{file?.name}</strong>
                        <br />
                        <span className="size">
                            Size: {(file?.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                    </div>

                    <p style={{ opacity: 0.8, marginBottom: '0.5rem' }}>Ask receiver to enter this code:</p>
                    <div className="code-display">
                        {code}
                    </div>

                    <button
                        className="glass-btn"
                        onClick={() => {
                            navigator.clipboard.writeText(code);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', marginBottom: '1rem' }}
                    >
                        {copied ? 'Copied!' : 'Copy Code'}
                    </button>

                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
                        <input 
                            type="checkbox" 
                            id="force-relay" 
                            checked={forceRelay} 
                            onChange={(e) => setForceRelay(e.target.checked)} 
                        />
                        <label htmlFor="force-relay" style={{ cursor: 'pointer' }}>
                            Force Relay (Hotspot Fix)
                        </label>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <div className="spinner"></div>
                        <p className="animate-pulse" style={{ marginTop: '1rem' }}>
                            {transferStatus === 'connecting' ? 'Receiver connecting...' : 'Waiting for receiver connection...'}
                        </p>
                    </div>

                    <button
                        className="glass-btn"
                        onClick={handleSoftReset}
                        style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7 }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* 2.5 Waiting for Receiver Acceptance State */}
            {transferStatus === 'waiting-for-approval' && (
                <div className="glass-card text-center">
                    <h2 style={{ marginBottom: '1rem' }}>Receiver Connected!</h2>

                    <div className="glass-input meta-info">
                        <span>File: </span>
                        <strong>{file?.name}</strong>
                        <br />
                        <span className="size">
                            Size: {(file?.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <div className="spinner"></div>
                        <p className="animate-pulse" style={{ marginTop: '1rem' }}>
                            Waiting for receiver to accept the file...
                        </p>
                    </div>

                    <button
                        className="glass-btn"
                        onClick={handleSoftReset}
                        style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7 }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* 3. Transferring / Waiting for ACK / Completed State */}
            {(transferStatus === 'transferring' || transferStatus === 'waiting-for-ack' || transferStatus === 'completed') && (
                <div className="glass-card text-center">
                    <h2 style={{ marginBottom: '1rem' }}>
                        {transferStatus === 'completed'
                            ? 'Sent Successfully!'
                            : transferStatus === 'waiting-for-ack'
                                ? 'Finalizing Transfer...'
                                : 'Sending...'}
                    </h2>

                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="progress-stats">
                        <span>{Math.round(progress)}%</span>
                        <span>{transferStatus === 'waiting-for-ack' ? 'Verifying...' : formatSpeed(speed)}</span>
                    </div>

                    {transferStatus === 'completed' && (
                        <div className="animate-fade-in btn-group-v">
                            <button className="glass-btn primary" onClick={handleSoftReset}>
                                Send Another File
                            </button>
                            <button className="glass-btn" onClick={handleNewSession} style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                                New Session
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 4. Error State */}
            {transferStatus === 'error' && (
                <div className="glass-card text-center error-border">
                    <h2 className="error-text" style={{ marginBottom: '1rem' }}>Transfer Failed</h2>
                    <p>The connection was lost or interrupted.</p>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="glass-btn" onClick={handleSoftReset}>
                            Try Again
                        </button>
                        <button className="glass-btn" onClick={handleNewSession} style={{ opacity: 0.7 }}>
                            New Session
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

Sender.propTypes = {
    onReset: PropTypes.func
};

export default Sender;
