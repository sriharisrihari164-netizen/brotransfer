import React, { useState } from 'react';
import Sender from '../components/Sender';
import Receiver from '../components/Receiver';
import Features from '../components/Features';
import Instructions from '../components/Instructions';

const Home = () => {
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
                    BroTransfer
                </h1>
                <p className="animate-fade-in" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                    Send files without limits.
                </p>
            </div>

            {/* Split View Container */}
            <div className="animate-fade-in" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
                width: '100%',
                maxWidth: '1200px',
                padding: '0 1rem'
            }}>
                {/* Left Box (Sender) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Sender
                        key={senderSessionKey}
                        onReset={() => setSenderSessionKey(prev => prev + 1)}
                    />
                </div>

                {/* Right Box (Receiver) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Receiver
                        key={receiverSessionKey}
                        onReset={() => setReceiverSessionKey(prev => prev + 1)}
                    />
                </div>
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
