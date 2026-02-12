import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Privacy Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <section>
                <h2>1. Introduction</h2>
                <p>Welcome to BroTransfer. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
            </section>

            <section>
                <h2>2. Data We Collect</h2>
                <p>We collect and process the following data:</p>
                <ul>
                    <li><strong>Usage Data:</strong> Information about how you use our website, products, and services.</li>
                    <li><strong>Technical Data:</strong> Internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                </ul>
                <p><strong>Note:</strong> We do not store files transferred through our service on our servers permanently. Files are transferred directly between peers (P2P) whenever possible.</p>
            </section>

            <section>
                <h2>3. How We Use Your Data</h2>
                <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                <ul>
                    <li>To provide the service you have requested (file transfer).</li>
                    <li>To improve our website and services.</li>
                    <li>To comply with a legal or regulatory obligation.</li>
                </ul>
            </section>

            <section>
                <h2>4. Data Security</h2>
                <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.</p>
            </section>

            <section>
                <h2>5. Contact Us</h2>
                <p>If you have any questions about this privacy policy or our privacy practices, please contact us.</p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
