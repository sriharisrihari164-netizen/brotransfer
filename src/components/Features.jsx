import React from 'react';

const Icons = {
    Cloud: () => (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 16.26C4.46062 16.0102 2.76639 13.626 3.19535 11.1147C3.62432 8.60334 6.00222 6.99611 8.5 7.50003C9.4005 3.9069 14.1561 2.91095 16.536 5.81188C18.4907 5.40243 20.4285 6.77702 20.7303 8.75389C21.0321 10.7308 19.5701 12.5029 17.59 12.75" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="9" fill="#ffffff" fillOpacity="0.15" />
        </svg>
    ),
    Ruler: () => (
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3L5 17L7 19L21 5L19 3Z" fill="#ffd700" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M15 7L16 8" stroke="#ffffff" strokeLinecap="round" />
            <path d="M13 9L14 10" stroke="#ffffff" strokeLinecap="round" />
            <path d="M11 11L12 12" stroke="#ffffff" strokeLinecap="round" />
            <path d="M9 13L10 14" stroke="#ffffff" strokeLinecap="round" />
        </svg>
    ),
    Lock: () => (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="11" width="14" height="10" rx="2" fill="#ffd700" stroke="#ffffff" strokeWidth="2" />
            <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="#ffffff" />
        </svg>
    ),
    Tree: () => (
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21V11" stroke="#c4b5a0" strokeWidth="3" strokeLinecap="round" />
            <path d="M12 3C7.58172 3 4 6.58172 4 11C4 15.4183 7.58172 19 12 19C16.4183 19 20 15.4183 20 11C20 6.58172 16.4183 3 12 3Z" fill="#4ade80" stroke="#ffffff" strokeWidth="2" />
            <path d="M9 11L12 8L15 11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Chart: () => (
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="13" width="4" height="8" rx="1" fill="#e74c3c" />
            <rect x="9" y="8" width="4" height="13" rx="1" fill="#3498db" />
            <rect x="15" y="4" width="4" height="17" rx="1" fill="#2ecc71" />
            <path d="M2 22H22" stroke="#d35400" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Chat: () => (
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" fill="none" stroke="#ffffff" strokeWidth="2" />
            <circle cx="8" cy="10" r="1.5" fill="#ffffff" />
            <circle cx="12" cy="10" r="1.5" fill="#ffffff" />
            <circle cx="16" cy="10" r="1.5" fill="#ffffff" />
        </svg>
    )
};

const IconContainer = ({ children }) => (
    <div className="icon-wrapper">
        <div className="icon-divider"></div>
        <div className="icon-circle">
            {children}
        </div>
    </div>
);

const Section = ({ title, description, Icon, customContent }) => (
    <div className="feature-section">
        <IconContainer>
            {Icon && <Icon />}
        </IconContainer>
        <h2 className="feature-title">
            {title}
        </h2>
        {description && (
            <p className="feature-description">
                {description}
            </p>
        )}
        {customContent}
    </div>
);

const Features = () => {
    return (
        <div className="features-container">

            {/* 1. What is BroTransfer? */}
            <div className="text-center m-b-rem-6">
                <h2 className="large-title">
                    What is BroTransfer?
                </h2>
                <div className="feature-illustration">
                    <svg width="320" height="160" viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M40 90H100V120H40V90Z" stroke="#ecf0f1" strokeWidth="2" />
                        <path d="M30 120H110L115 130H25L30 120Z" stroke="#ecf0f1" strokeWidth="2" />
                        <path d="M220 90H280V120H220V90Z" stroke="#ecf0f1" strokeWidth="2" />
                        <path d="M210 120H290L295 130H205L210 120Z" stroke="#ecf0f1" strokeWidth="2" />
                        <path d="M120 105H200" stroke="#ecf0f1" strokeWidth="2" strokeDasharray="4 4" />
                        <circle cx="160" cy="105" r="15" fill="#2c3e50" stroke="#ecf0f1" strokeWidth="2" />
                        <text x="160" y="108" fontSize="10" fill="#ecf0f1" textAnchor="middle" dominantBaseline="middle">P2P</text>
                    </svg>
                </div>

                <p className="feature-description feature-text-large">
                    We are a free and independent peer-to-peer (P2P) file sharing service that prioritizes your privacy and keeps your data safe. We store nothing online: simply close your browser to stop sending.
                </p>
                <p className="feature-description feature-text-italic">
                    Our mission is to make sure people keep their data safely into their own hands, as it should be.
                </p>
            </div>

            {/* 2. Features List */}
            <Section
                title="Files are shared straight from your device"
                description="When you close the browser tab your files are no longer accessible, minimising the risk of anyone getting unwanted access. BroTransfer uses the peer-to-peer technology WebRTC to find the shortest path, meaning sometimes your data doesn't even have to leave the building!"
                Icon={Icons.Cloud}
            />

            <Section
                title="No more file size limits"
                description="Because we don't store the data, there's no need for file size limits. Just share files of any size or whatever amount. As long as you keep an eye on your own data usage."
                Icon={Icons.Ruler}
            />

            <Section
                title="Only the receiver can access your files"
                description="Only you and the receiver can access your files. Your data is encrypted end-to-end, and can only be read by your receiver (and you of course). BroTransfer currently uses an implementation of DTLS 1.3."
                Icon={Icons.Lock}
            />

            <Section
                title="Low environmental impact"
                description="Because we don't store data we don't need bulky servers, and that saves a lot of energy. By using BroTransfer you'll have a much smaller carbon footprint than when using a cloud storage provider."
                Icon={Icons.Tree}
            />

            {/* 3. Stats / Growth */}
            <Section
                title="Built for unlimited transfers!"
                description="BroTransfer enables you to share files of any size directly between devices. From small documents to massive video files, transfer gigabytes or even terabytes without worrying about limits or storage costs!"
                Icon={Icons.Chart}
            />

            {/* 4. FAQ */}
            <Section
                title="Do you still have questions?"
                Icon={Icons.Chat}
                customContent={
                    <div className="feature-description">
                        Check out our <a href="#" className="feature-link">frequently asked questions</a>. You can also <a href="#" className="feature-link">contact us</a> for any questions you might have.
                    </div>
                }
            />

        </div>
    );
};

export default Features;
