
// Simple Event Emitter for Debug Logging
const listeners = new Set();
const logs = [];

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

    // Also log to console
    console.log(`[DEBUG UI] ${logEntry.message}`);
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
