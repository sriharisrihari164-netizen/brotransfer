import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
    return (
        <div className="legal-page-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <Link to="/" className="back-to-home">← Back to Home</Link>
            <h1>Terms of Service</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <section>
                <h2>1. Agreement to Terms</h2>
                <p>By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
            </section>

            <section>
                <h2>2. Use License</h2>
                <p>Permission is granted to temporarily download one copy of the materials (information or software) on BroTransfer's website for personal, non-commercial transitory viewing only.</p>
                <p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                <ul>
                    <li>modify or copy the materials;</li>
                    <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                    <li>attempt to decompile or reverse engineer any software contained on BroTransfer's website;</li>
                    <li>remove any copyright or other proprietary notations from the materials; or</li>
                    <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                </ul>
            </section>

            <section>
                <h2>3. Disclaimer</h2>
                <p>The materials on BroTransfer's website are provided on an 'as is' basis. BroTransfer makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            </section>

            <section>
                <h2>4. Limitations</h2>
                <p>In no event shall BroTransfer or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on BroTransfer's website, even if BroTransfer or a BroTransfer authorized representative has been notified orally or in writing of the possibility of such damage.</p>
            </section>

            <section>
                <h2>5. Governing Law</h2>
                <p>These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
            </section>
        </div>
    );
};

export default TermsOfService;
