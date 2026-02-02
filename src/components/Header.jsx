import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header" style={{
      padding: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(15, 17, 26, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="logo">
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="gradient-text">BroTransfer</span>
        </Link>
      </div>
      <nav>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          transition: 'color 0.2s'
        }}>
          GitHub
        </a>
      </nav>
    </header>
  );
};

export default Header;
