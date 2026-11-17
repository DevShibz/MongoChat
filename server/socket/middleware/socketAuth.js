const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// Authenticates the socket handshake with the same JWT the REST API uses.
// Client connects with: io({ auth: { token } })
module.exports = async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user) return next(new Error('User not found'));

    socket.data.user = user;
    socket.data.userId = String(user._id);
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};
