import React, { useState } from 'react';
import Sender from '../components/Sender';
import Receiver from '../components/Receiver';
import Instructions from '../components/Instructions';
import Features from '../components/Features';

const Home = () => {
    const [mode, setMode] = useState('send');

    return (
        <div className="flex-column-center" style={{ gap: '2rem', width: '100%' }}>

            <div className="hero-container">
                <h1 className="hero-title animate-fade-in">
                    BroTransfer
                </h1>
                <p className="hero-subtitle animate-fade-in">
                    Send files without limits.
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="toggle-container animate-fade-in">
                <button
                    onClick={() => setMode('send')}
                    className={`toggle-btn ${mode === 'send' ? 'active' : ''}`}
                >
                    Send
                </button>
                <button
                    onClick={() => setMode('receive')}
                    className={`toggle-btn ${mode === 'receive' ? 'active' : ''}`}
                >
                    Receive
                </button>
            </div>

            <div className="max-w-600 m-auto" style={{ padding: '0 1rem' }}>
                {mode === 'send' ? <Sender /> : <Receiver />}
            </div>

            {/* Sections */}
            <div className="glass-card max-w-800 m-auto" style={{ marginBottom: '2rem', marginTop: '2rem' }}>
                <Instructions />
            </div>

            {/* Features Section */}
            <div style={{ width: '100%', marginBottom: '4rem' }}>
                <Features />
            </div>
        </div>
    );
};

export default Home;
