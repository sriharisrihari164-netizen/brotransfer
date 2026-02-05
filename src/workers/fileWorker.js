
// Worker to handle file reading
self.onmessage = (e) => {
    const { file, offset, chunkSize, action } = e.data;

    if (action === 'read_chunk') {
        const reader = new FileReader();
        const blob = file.slice(offset, offset + chunkSize);

        reader.onload = (event) => {
            if (event.target.result) {
                self.postMessage({
                    type: 'chunk_data',
                    data: event.target.result,
                    offset: offset
                }, [event.target.result]); // Transferable
            }
        };

        reader.onerror = (err) => {
            self.postMessage({ type: 'error', error: err });
        };

        reader.readAsArrayBuffer(blob);
    }
};
