const { Server } = require('socket.io');
const socketAuth = require('./middleware/socketAuth');
const { setIO } = require('./emitters');
const registerPresenceHandlers = require('./handlers/presenceHandlers');
const registerChatHandlers = require('./handlers/chatHandlers');

// Attaches Socket.IO to the HTTP server. Add new feature handlers
// (groups, status, ...) as another register*Handlers module below.
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: 'https://mongchat.netlify.app' },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  setIO(io);
  return io;
}

module.exports = { initSocket };
