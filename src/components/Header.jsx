import React from 'react';
import Logo from './Logo';

const Header = () => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.5rem 0',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Logo size={48} />
        <span style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          letterSpacing: '-0.5px',
          background: 'linear-gradient(90deg, #fff, #a0a0a0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          BroTransfer
        </span>
      </div>

      <a
        href="https://github.com/sriharisrihari164-netizen/brotransfer"
        target="_blank"
        rel="noopener noreferrer"
        className="glass-btn"
        style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}
      >
        GitHub
      </a>
    </header>
  );
};

export default Header;
