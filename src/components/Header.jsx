import React from 'react';
import Logo from './Logo';

const Header = ({ onToggleDebug }) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.5rem 0',
      marginBottom: '2rem'
    }}>
      <div 
        onClick={onToggleDebug} 
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
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
      </div>


    </header>
  );
};

export default Header;
