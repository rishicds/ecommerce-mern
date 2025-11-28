import { io } from 'socket.io-client';

let socket = null;

export function initSocket(backendUrl) {
    if (!backendUrl) return null;
    if (socket) return socket;

    socket = io(backendUrl, { withCredentials: true });

    socket.on('connect', () => {
        console.log('Admin socket connected', socket.id);
        // Optionally join an admin room server-side if implemented
        socket.emit('joinAdmin');
    });

    socket.on('connect_error', (err) => {
        console.warn('Socket connect error', err);
    });

    return socket;
}

export function getSocket() {
    return socket;
}
