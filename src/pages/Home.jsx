import React, { useState } from 'react';
import Sender from '../components/Sender';
import Receiver from '../components/Receiver';
import Features from '../components/Features';
import Instructions from '../components/Instructions';

const Home = () => {
    const [mode, setMode] = useState('send');

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
                    BroTransfer
                </h1>
                <p className="animate-fade-in" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                    Send files without limits.
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="animate-fade-in" style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: '12px'
            }}>
                <button
                    onClick={() => setMode('send')}
                    style={{
                        padding: '0.75rem 2rem',
                        borderRadius: '8px',
                        background: mode === 'send' ? 'var(--bg-primary)' : 'transparent',
                        color: mode === 'send' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        boxShadow: mode === 'send' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s ease',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Send
                </button>
                <button
                    onClick={() => setMode('receive')}
                    style={{
                        padding: '0.75rem 2rem',
                        borderRadius: '8px',
                        background: mode === 'receive' ? 'var(--bg-primary)' : 'transparent',
                        color: mode === 'receive' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        boxShadow: mode === 'receive' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s ease',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Receive
                </button>
            </div>

            <div style={{ width: '100%', maxWidth: '600px', padding: '0 1rem' }}>
                {mode === 'send' ? <Sender /> : <Receiver />}
            </div>

            {/* Sections */}
            <div className="glass-card" style={{ width: '100%', maxWidth: '800px', marginBottom: '4rem', marginTop: '2rem' }}>
                <Instructions />
            </div>

            <Features />
        </div>
    );
};

export default Home;
