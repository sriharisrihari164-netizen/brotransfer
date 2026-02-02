import React from 'react';

const Features = () => {
    // Shared styles for the circular icon container
    const IconContainer = ({ children }) => (
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '4px', background: '#D35400', borderRadius: '2px', marginBottom: '2rem' }}></div>
            <div style={{
                width: '120px',
                height: '120px',
                background: '#D35400',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}>
                {children}
            </div>
        </div>
    );

    const Section = ({ title, description, icon, customContent }) => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '6rem'
        }}>
            <IconContainer>{icon}</IconContainer>
            <h2 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '1.5rem',
                color: '#ecf0f1'
            }}>
                {title}
            </h2>
            {description && (
                <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    color: '#bdc3c7',
                    maxWidth: '600px'
                }}>
                    {description}
                </p>
            )}
            {customContent}
        </div>
    );

    return (
        <div style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto' }}>

            {/* 1. What is BroTransfer? */}
            <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    What is BroTransfer?
                </h2>
                {/* Placeholder for the diagram from screenshot */}
                <div style={{ margin: '3rem 0', opacity: 0.8 }}>
                    <svg width="300" height="150" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="10" y="50" width="80" height="50" rx="4" stroke="#D35400" strokeWidth="2" />
                        <path d="M20 75L80 75" stroke="#D35400" strokeWidth="2" />
                        <rect x="210" y="50" width="80" height="50" rx="4" stroke="#D35400" strokeWidth="2" />
                        <path d="M220 75L280 75" stroke="#D35400" strokeWidth="2" />
                        <path d="M100 75L200 75" stroke="#D35400" strokeWidth="2" markerEnd="url(#arrowhead)" />
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#D35400" />
                            </marker>
                        </defs>
                        <text x="150" y="65" textAnchor="middle" fill="#bdc3c7" fontSize="12">Direct P2P</text>
                    </svg>
                </div>

                <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#bdc3c7', marginBottom: '2rem' }}>
                    We are a free and independent peer-to-peer (P2P) file sharing service that prioritizes your privacy and keeps your data safe. We store nothing online: simply close your browser to stop sending.
                </p>
                <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#bdc3c7', fontStyle: 'italic' }}>
                    Our mission is to make sure people keep their data safely into their own hands, as it should be.
                </p>
            </div>

            {/* 2. Features List */}
            <Section
                title="Files are shared straight from your device"
                description="When you close the browser tab your files are no longer accessible, minimising the risk of anyone getting unwanted access. BroTransfer uses the peer-to-peer technology WebRTC to find the shortest path, meaning sometimes your data doesn't even have to leave the building!"
                icon="☁️"
            />

            <Section
                title="No more file size limits"
                description="Because we don't store the data, there's no need for file size limits. Just share files of any size or whatever amount. As long as you keep an eye on your own data usage."
                icon="📏"
            />

            <Section
                title="Only the receiver can access your files"
                description="Only you and the receiver can access your files. Your data is encrypted end-to-end, and can only be read by your receiver (and you of course). BroTransfer currently uses an implementation of DTLS 1.3."
                icon="🔒"
            />

            <Section
                title="Low environmental impact"
                description="Because we don't store data we don't need bulky servers, and that saves a lot of energy. By using BroTransfer you'll have a much smaller carbon footprint than when using a cloud storage provider."
                icon="🌳"
            />

            {/* 3. Stats / Growth */}
            <Section
                title="We keep on growing!"
                description="We started a couple of years ago with just a few users per day, but we now transfer more than 50 terabyte (TB) per month!"
                icon="📊" // Using bar chart icon
            />

            {/* 4. FAQ */}
            <Section
                title="Do you still have questions?"
                icon="💬"
                customContent={
                    <div style={{ color: '#bdc3c7', fontSize: '1.1rem', lineHeight: '1.6' }}>
                        Check out our <a href="#" style={{ color: '#D35400', textDecoration: 'underline' }}>frequently asked questions</a>. You can also <a href="#" style={{ color: '#D35400', textDecoration: 'underline' }}>contact us</a> for any questions you might have.
                    </div>
                }
            />

        </div>
    );
};

export default Features;
