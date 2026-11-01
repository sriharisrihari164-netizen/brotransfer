import React from 'react';
import Header from './Header';
import { Outlet, Link } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="app-container">
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
            <footer style={{
                textAlign: 'center',
                padding: '1rem',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
            }}>
                <p>P2P File Sharing • Secure • Limitless</p>
                <span>|</span>
                <Link to="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</Link>
                <span>|</span>
                <Link to="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</Link>
            </footer>
        </div>
    );
};

export default Layout;
