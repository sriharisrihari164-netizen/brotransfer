import React from 'react';

const FeatureBlock = ({ icon, title, children }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '4rem',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto'
    }}>
        <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: '#C25E00', // ToffeeShare Orange-ish
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}>
            {icon}
        </div>
        <h2 style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#e0e0e0'
        }}>
            {title}
        </h2>
        <div style={{
            fontSize: '1.1rem',
            lineHeight: '1.6',
            color: '#9ca3af'
        }}>
            {children}
        </div>
    </div>
);

const Features = () => {
    return (
        <div style={{
            padding: '4rem 1rem',
            background: 'var(--bg-primary)',
            width: '100%'
        }}>

            {/* Introduction */}
            <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#fff' }}>
                    What is BroTransfer?
                </h1>
                <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.2rem', color: '#9ca3af' }}>
                    We are a free and independent peer-to-peer (P2P) file sharing service that prioritizes your privacy and keeps your data safe. We store nothing online: simply close your browser to stop sending.
                </p>
            </div>

            {/* Feature 1: Privacy */}
            <FeatureBlock icon="☁️" title="Files are shared straight from your device">
                <p>
                    When you close the browser tab your files are no longer accessible, minimizing the risk of anyone getting unwanted access.
                </p>
                <br />
                <p>
                    BroTransfer uses the peer-to-peer technology WebRTC to find the shortest path, meaning sometimes your data doesn't even have to leave the building!
                </p>
            </FeatureBlock>

            {/* Feature 2: No Limits */}
            <FeatureBlock icon="📏" title="No more file size limits">
                <p>
                    Because we don't store the data, there's no need for file size limits. Just share files of any size or whatever amount. As long as you keep an eye on your own data usage.
                </p>
            </FeatureBlock>

            {/* Feature 3: Encryption */}
            <FeatureBlock icon="🔒" title="Only the receiver can access your files">
                <p>
                    Only you and the receiver can access your files. Your data is encrypted end-to-end, and can only be read by your receiver (and you of course).
                </p>
            </FeatureBlock>

            {/* Feature 4: Environment */}
            <FeatureBlock icon="🌳" title="Low environmental impact">
                <p>
                    Because we don't store data we don't need bulky servers, and that saves a lot of energy. By using BroTransfer you'll have a much smaller carbon footprint than when using a cloud storage provider.
                </p>
            </FeatureBlock>

        </div>
    );
};

export default Features;
