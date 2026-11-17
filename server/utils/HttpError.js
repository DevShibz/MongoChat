// Error with an HTTP status code. Thrown by services; turned into a JSON
// response by the error middleware (REST) or an ack error (socket).
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
