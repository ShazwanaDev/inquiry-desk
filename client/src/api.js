const TOKEN_KEY = 'inquiry_token';

// Where we keep the login token. sessionStorage = cleared when the tab is closed.
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

// Same idea as HttpError on the server: an error that knows its status code
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// AuthContext sets this, so an expired token logs the user out automatically
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only throws when the server can't be reached at all
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  const data = await response.json().catch(() => ({})); // empty/invalid body -> {}

    if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized(); // token expired -> log out

    // 5xx with no message from OUR server = the server is down or unreachable
    const fallback =
      response.status >= 500
        ? 'The server is not responding right now. Please try again in a moment.'
        : 'Something went wrong. Please try again.';

    throw new ApiError(response.status, data.error || fallback, data.details);
  }
  return data;
}