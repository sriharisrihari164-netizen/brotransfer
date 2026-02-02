import React, { useState } from 'react';
import Sender from '../components/Sender';
import Receiver from '../components/Receiver';

const Home = () => {
    const [mode, setMode] = useState('send'); // 'send' or 'receive'

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    Share files instantly.
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                    Direct peer-to-peer transfer using a 6-digit code.
                </p>
            </div>

            <div style={{
                display: 'flex',
                background: 'var(--bg-secondary)',
                padding: '0.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
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
                        transition: 'all 0.2s ease'
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
                        transition: 'all 0.2s ease'
                    }}
                >
                    Receive
                </button>
            </div>

            <div style={{ width: '100%', marginTop: '1rem' }}>
                {mode === 'send' ? <Sender /> : <Receiver />}
            </div>
        </div>
    );
};

export default Home;
