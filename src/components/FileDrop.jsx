import React, { useCallback, useState } from 'react';

const FileDrop = ({ onFileSelected }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelected(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, [onFileSelected]);

    const handleFileChange = useCallback((e) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelected(e.target.files[0]);
        }
    }, [onFileSelected]);

    return (
        <div
            className={`file-drop-card glass-card ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                borderStyle: 'dashed',
                borderWidth: '2px',
                borderColor: isDragging ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)',
                background: isDragging ? 'rgba(255, 71, 87, 0.1)' : 'rgba(0,0,0,0.2)',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.3s ease'
            }}
            onClick={() => document.getElementById('fileInput').click()}
        >
            <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}>
                📁
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white' }}>
                Click or Drag & Drop
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                Unlimited size. Secure P2P.
            </p>
        </div>
    );
};

export default FileDrop;
