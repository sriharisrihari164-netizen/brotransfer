import React from 'react';
import { Link } from 'react-router-dom';
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
      <Link 
        to="/" 
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}
      >
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
      </Link>
    </header>
  );
};

export default Header;
