import React, { useState } from 'react';
import Sender from '../components/Sender';
import Receiver from '../components/Receiver';
import Features from '../components/Features';
import Instructions from '../components/Instructions';

const Home = () => {
    const [mode, setMode] = useState('send'); // 'send' or 'receive'
    const [senderSessionKey, setSenderSessionKey] = useState(0);
    const [receiverSessionKey, setReceiverSessionKey] = useState(0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%' }}>

            <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '1rem' }}>
                <h1 className="animate-fade-in" style={{
                    fontSize: '4rem',
                    marginBottom: '0.5rem',
                    background: 'linear-gradient(to right, #ffffff, #a0a0a0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800
                }}>
                    Share files instantly.
                </h1>
                <p className="animate-fade-in" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                    Secure, Limitless P2P Transfer.
                </p>
            </div>

            {/* Mode Switcher */}
            <div className="glass-card" style={{ padding: '0.5rem', borderRadius: '16px', display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => setMode('send')}
                    className="glass-btn"
                    style={{
                        background: mode === 'send' ? 'var(--accent-primary)' : 'transparent',
                        borderColor: mode === 'send' ? 'var(--accent-primary)' : 'transparent',
                        boxShadow: mode === 'send' ? '0 4px 15px var(--accent-glow)' : 'none',
                        minWidth: '120px'
                    }}
                >
                    Send
                </button>
                <button
                    onClick={() => setMode('receive')}
                    className="glass-btn"
                    style={{
                        background: mode === 'receive' ? 'var(--accent-primary)' : 'transparent',
                        borderColor: mode === 'receive' ? 'var(--accent-primary)' : 'transparent',
                        boxShadow: mode === 'receive' ? '0 4px 15px var(--accent-glow)' : 'none',
                        minWidth: '120px'
                    }}
                >
                    Receive
                </button>
            </div>

            <div style={{ width: '100%', marginBottom: '4rem' }}>
                {mode === 'send' ? (
                    <Sender
                        key={senderSessionKey}
                        onReset={() => setSenderSessionKey(prev => prev + 1)}
                    />
                ) : (
                    <Receiver
                        key={receiverSessionKey}
                        onReset={() => setReceiverSessionKey(prev => prev + 1)}
                    />
                )}
            </div>

            {/* Sections */}
            <div className="glass-card" style={{ width: '100%', maxWidth: '800px', marginBottom: '4rem' }}>
                <Instructions />
            </div>

            <Features />
        </div>
    );
};

export default Home;
