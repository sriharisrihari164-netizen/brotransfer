
import React, { useState, useEffect, useRef } from 'react';
import { subscribeLogs, clearLogs } from '../utils/debugLog';

const DebugLogger = () => {
    const [logs, setLogs] = useState([]);
    const [isVisible, setIsVisible] = useState(true); // Default to true for user to see immediately
    const logsEndRef = useRef(null);

    // Completely disable in production
    if (import.meta.env.PROD) {
        return null;
    }

    useEffect(() => {
        return subscribeLogs((newLogs) => {
            setLogs([...newLogs]); // Create new reference to trigger render
        });
    }, []);

    useEffect(() => {
        // Auto-scroll
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.8)',
                    color: '#0f0',
                    border: '1px solid #0f0',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    cursor: 'pointer'
                }}
            >
                Show Debug
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '200px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderTop: '2px solid #333',
            color: '#0f0',
            fontFamily: 'monospace',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            fontSize: '11px',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '5px 10px',
                background: '#222',
                borderBottom: '1px solid #444'
            }}>
                <span style={{ fontWeight: 'bold' }}>Debug Console</span>
                <div>
                    <button onClick={clearLogs} style={{ marginRight: '10px', cursor: 'pointer', background: '#444', color: '#fff', border: 'none', padding: '2px 8px' }}>Clear</button>
                    <button onClick={() => setIsVisible(false)} style={{ cursor: 'pointer', background: '#844', color: '#fff', border: 'none', padding: '2px 8px' }}>Hide</button>
                </div>
            </div>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                {logs.map((log) => (
                    <div key={log.id} style={{ borderBottom: '1px solid #333', paddingBottom: '2px' }}>
                        <span style={{ color: '#888', marginRight: '8px' }}>[{log.time}]</span>
                        <span style={{
                            color: log.type === 'error' ? '#ff5555' :
                                log.type === 'success' ? '#55ff55' :
                                    log.type === 'warning' ? '#ffff55' : '#dddddd'
                        }}>
                            {log.message}
                        </span>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
};

export default DebugLogger;
