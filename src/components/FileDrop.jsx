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
            className={`file-drop-card ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '16px',
                padding: '3rem',
                textAlign: 'center',
                background: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                borderColor: isDragging ? 'var(--accent-primary)' : 'var(--border-color)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                width: '100%',
                maxWidth: '600px'
            }}
            onClick={() => document.getElementById('fileInput').click()}
        >
            <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                📁
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Click or Drag & Drop a file
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
                Transfer files directly to your peers. No size limit.
            </p>
        </div>
    );
};

export default FileDrop;
