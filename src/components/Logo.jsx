import React from 'react';

const Logo = ({ size = 40, className = "" }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ overflow: 'visible' }}
        >
            {/* Glow */}
            <circle cx="50" cy="50" r="40" fill="var(--accent-primary)" fillOpacity="0.2" filter="blur(10px)" />

            {/* Left Circle (Sender) */}
            <circle cx="35" cy="50" r="12" fill="var(--text-primary)" />

            {/* Right Circle (Receiver) */}
            <circle cx="85" cy="50" r="12" stroke="var(--text-primary)" strokeWidth="4" />

            {/* Connecting Path (Transfer) */}
            <path
                d="M35 50 H 73"
                stroke="var(--accent-primary)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="10 6"
            >
                <animate
                    attributeName="stroke-dashoffset"
                    from="32"
                    to="0"
                    dur="1s"
                    repeatCount="indefinite"
                />
            </path>

            {/* Letter B shape hint or just clean geometry? Let's stick to abstract P2P nodes */}
        </svg>
    );
};

export default Logo;
