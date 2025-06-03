let socket: WebSocket | null = null;

export const initSocket = (
    url: string,
    onMessage: (text: string, base64Audio: string) => void
) => {
    const cleanUrl = url.replace(/\/+$/, ''); // strip trailing slashes
    console.log("🌐 Connecting to WebSocket at:", cleanUrl);

    console.log("🌐 Connecting to WebSocket at:", url);
    socket = new WebSocket(cleanUrl);// ✅ DO NOT append a slash here
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
        console.log("🟢 WebSocket connected");
    };

    socket.onerror = (e) => {
        console.error("❌ WebSocket error", e);
    };

    socket.onclose = (e) => {
        console.warn("🔌 WebSocket closed", e);
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("📩 Bot response:", data);
            onMessage(data.text, data.audio);
        } catch (err) {
            console.error("⚠️ Failed to parse message", event.data, err);
        }
    };
};

export const sendAudioChunk = (blob: Blob) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("📤 Sending audio blob:", blob);
        socket.send(blob);
    } else {
        console.warn("❌ WebSocket not open");
        console.warn("📡 Socket state:", socket?.readyState); // NEW
    }
};


export const closeSocket = () => {
    if (socket) {
        socket.close();
    }
};
