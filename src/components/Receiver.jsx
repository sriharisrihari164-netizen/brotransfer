import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { usePeer } from '../hooks/usePeer';
import { useFileReceiver } from '../hooks/useFileReceiver';

const Receiver = ({ onReset }) => {
    const [code, setCode] = useState('');
    const [forceRelay, setForceRelay] = useState(false);
    
    // Pass forceRelay to usePeer to enable/disable TURN relay policy
    const { peer, status: peerStatus, error: peerError, retry } = usePeer(null, forceRelay);
    
    const {
        fileMeta,
        transferStatus,
        progress,
        speed,
        errorMsg,
        isStreaming,
        connectToSender,
        acceptFile,
        downloadFile,
        resetReceiver
    } = useFileReceiver(peer);

    const handleConnect = (e) => {
        e.preventDefault();
        if (code.length !== 6 || !peer) return;
        connectToSender(code);
    };

    const handleSoftReset = () => {
        resetReceiver();
    };

    const handleNewSession = () => {
        if (onReset) onReset();
        else window.location.reload();
    };

    const formatSpeed = (bytesPerSec) => {
        if (bytesPerSec < 1024) return bytesPerSec.toFixed(0) + ' B/s';
        if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
        return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
    };

    if (peerError) {
        return (
            <div className="glass-card animate-fade-in text-center error-border">
                <h3 className="error-text">Network Error</h3>
                <p>{peerError.message}</p>
                <button className="glass-btn" onClick={() => retry()}>Retry</button>
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

            {/* 1. Idle / Entry State */}
            {transferStatus === 'idle' && (
                <form onSubmit={handleConnect} className="glass-card text-center">
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
                            className="glass-input code-input"
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

                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
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
                </form>
            )}

            {/* 2. Connecting / Waiting State */}
            {(transferStatus === 'connecting' || transferStatus === 'waiting') && (
                <div className="glass-card text-center">
                    <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
                    <h2>{transferStatus === 'connecting' ? 'Connecting to Peer...' : 'Waiting for Metadata...'}</h2>
                    <button className="glass-btn" onClick={handleSoftReset} style={{ marginTop: '1.5rem' }}>Cancel</button>
                </div>
            )}

            {/* 2.5 Approval State (Incoming File) */}
            {transferStatus === 'asking-permission' && fileMeta && (
                <div className="glass-card text-center">
                    <h2 style={{ marginBottom: '1rem' }}>Incoming File</h2>

                    <div className="glass-input meta-info">
                        <span>File: </span>
                        <strong>{fileMeta.name}</strong>
                        <br />
                        <span className="size">
                            Size: {(fileMeta.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            className="glass-btn primary"
                            onClick={acceptFile}
                            style={{ flex: 1 }}
                        >
                            Accept & Download
                        </button>
                        <button
                            className="glass-btn"
                            onClick={handleSoftReset}
                            style={{ flex: 1, opacity: 0.7 }}
                        >
                            Decline
                        </button>
                    </div>
                </div>
            )}

            {/* 3. Receiving State */}
            {(transferStatus === 'receiving' || transferStatus === 'completed') && fileMeta && (
                <div className="glass-card text-center">
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

                    <div className="progress-stats">
                        <span style={{ fontWeight: 'bold' }}>{Math.round(progress)}%</span>
                        <span style={{ fontWeight: 'bold' }}>{formatSpeed(speed)}</span>
                    </div>

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

                            <div className="btn-group-v" style={{ marginTop: '1rem' }}>
                                <button
                                    className="glass-btn"
                                    onClick={handleSoftReset}
                                >
                                    Receive Another
                                </button>
                                <button
                                    className="glass-btn"
                                    onClick={handleNewSession}
                                    style={{ opacity: 0.7, fontSize: '0.9rem' }}
                                >
                                    New Session
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. Error State */}
            {transferStatus === 'error' && (
                <div className="glass-card text-center error-border">
                    <h2 className="error-text" style={{ marginBottom: '1rem' }}>Connection Failed</h2>
                    <p style={{ whiteSpace: 'pre-line', textAlign: 'left', display: 'inline-block', maxWidth: '100%', margin: '0 auto', fontSize: '0.9rem', opacity: 0.9 }}>
                        {errorMsg}
                    </p>

                    <button 
                        className="glass-btn" 
                        style={{ marginTop: '1rem', fontSize: '0.8rem', borderColor: '#4ade80', color: '#4ade80' }}
                        onClick={() => {
                            const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
                            const text = logs.map(l => `[${l.time}] [${l.type}] ${l.message}`).join('\n');
                            navigator.clipboard.writeText(text);
                            alert("Logs copied!");
                        }}
                    >
                        Copy Diagnostics to Clipboard
                    </button>

                    <div className="hotspot-troubleshooting" style={{ textAlign: 'left', marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,165,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.2)' }}>
                        <h4 style={{ color: '#ffa500', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Using a Mobile Hotspot?</h4>
                        <ul style={{ fontSize: '0.85rem', color: '#ffcc80', paddingLeft: '1.2rem', margin: 0 }}>
                            <li style={{ marginBottom: '0.3rem' }}><strong>Symmetric NAT:</strong> 4G/5G networks often block Peer-to-Peer. We've enabled a relay (TURN) to help bypass this.</li>
                            <li style={{ marginBottom: '0.3rem' }}><strong>Stay Connected:</strong> Keep this page open on BOTH devices while connecting.</li>
                            <li><strong>Same Network:</strong> Ensure your Laptop is connected to the Phone's hotspot and not another Wi-Fi.</li>
                        </ul>
                    </div>

                    <button className="glass-btn" onClick={handleSoftReset} style={{ marginTop: '1.5rem', width: '100%' }}>Try Again</button>
                </div>
            )}
        </div>
    );
};

Receiver.propTypes = {
    onReset: PropTypes.func
};

export default Receiver;
