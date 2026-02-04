import React from 'react';

const Instructions = () => {
    const Step = ({ number, title, text }) => (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
        }}>
            <div style={{
                background: 'var(--accent-primary)',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                flexShrink: 0
            }}>
                {number}
            </div>
            <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1.1rem' }}>{title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>{text}</p>
            </div>
        </div>
    );

    return (
        <div style={{
            maxWidth: '800px',
            margin: '2rem auto 4rem',
            padding: '2rem',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem'
        }}>
            <div>
                <h3 style={{
                    color: 'var(--accent-primary)',
                    marginBottom: '1.5rem',
                    fontSize: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    Sending Files
                </h3>
                <Step
                    number="1"
                    title="Select File"
                    text="Click 'Send' and choose the file you want to share."
                />
                <Step
                    number="2"
                    title="Get Code"
                    text="A unique 6-digit code will be generated for your file."
                />
                <Step
                    number="3"
                    title="Share Code"
                    text="Share this code with the person you want to send the file to."
                />
            </div>

            <div>
                <h3 style={{
                    color: 'var(--accent-primary)',
                    marginBottom: '1.5rem',
                    fontSize: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Receiving Files
                </h3>
                <Step
                    number="1"
                    title="Enter Code"
                    text="Click 'Receive' and enter the 6-digit code provided by the sender."
                />
                <Step
                    number="2"
                    title="Connect"
                    text="Click 'Connect' to establish a secure peer-to-peer connection."
                />
                <Step
                    number="3"
                    title="Download"
                    text="The file transfer will start automatically. Accept the download when prompted."
                />
            </div>

            <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Note: Keep the browser tab open until the transfer is complete.
                </p>
            </div>
        </div>
    );
};

export default Instructions;
