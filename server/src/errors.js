// Our own error type that carries an HTTP status code (400, 401, 404...).
// Anywhere in the code we can write: throw new HttpError(404, 'Inquiry not found')
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details; // optional extra info, e.g. which fields are invalid
  }
}