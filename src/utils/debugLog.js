
// Simple Event Emitter for Debug Logging
const listeners = new Set();
const logs = [];

/**
 * Internal method to add a log entry and notify UI listeners
 */
export const addLog = (message, type = 'info') => {
    const logEntry = {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        message: typeof message === 'object' ? JSON.stringify(message) : String(message),
        type // info, error, success, warning
    };

    // Keep max 50 logs
    if (logs.length > 50) logs.shift();
    logs.push(logEntry);

    // Notify listeners
    listeners.forEach(listener => listener(logs));

    // Also log to console in development
    if (import.meta.env.DEV) {
        if (type === 'error') console.error(`[DEBUG] ${logEntry.message}`);
        else if (type === 'warning') console.warn(`[DEBUG] ${logEntry.message}`);
        else console.log(`[DEBUG] ${logEntry.message}`);
    }
};

/**
 * Centralized Logger for the application
 * Wraps console methods with environment checks
 */
export const logger = {
    log: (msg, data = '') => {
        addLog(data ? `${msg} ${JSON.stringify(data)}` : msg, 'info');
    },
    info: (msg, data = '') => {
        addLog(data ? `${msg} ${JSON.stringify(data)}` : msg, 'info');
    },
    warn: (msg, data = '') => {
        addLog(data ? `${msg} ${JSON.stringify(data)}` : msg, 'warning');
    },
    error: (msg, data = '') => {
        addLog(data ? `${msg} ${JSON.stringify(data)}` : msg, 'error');
    },
    success: (msg, data = '') => {
        addLog(data ? `${msg} ${JSON.stringify(data)}` : msg, 'success');
    }
};

export const subscribeLogs = (callback) => {
    listeners.add(callback);
    callback(logs); // Initial call
    return () => listeners.delete(callback);
};

export const clearLogs = () => {
    logs.length = 0;
    listeners.forEach(listener => listener(logs));
};
