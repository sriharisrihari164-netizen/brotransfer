import React from 'react';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import DebugLogger from './DebugLogger';

const Layout = () => {
    return (
        <div className="app-container">
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
            <DebugLogger />
            <footer style={{
                textAlign: 'center',
                padding: '1rem',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                borderTop: '1px solid var(--border-color)'
            }}>
                <p>P2P File Sharing • Secure • Limitless</p>
            </footer>
        </div>
    );
};

export default Layout;
