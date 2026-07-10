/** Dynamic backend API production routing engine anchor */
export const API_BASE_URL = `https://tally-lhy7.onrender.com`;
/** Reusable network layer that forces secure JWT transmission on all cluster endpoints */
export async function secureFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  let targetUrl = url;

  // 🌟 THE MAGIC INTERCEPTOR: If the URL contains localhost or 127.0.0.1, 
  // strip it out and replace it with your live Render production link automatically!
  if (targetUrl.includes('127.0.0.1:8000') || targetUrl.includes('localhost:8000')) {
    // This transforms "http://127.0.0.1:8000/companies/1/stock" -> "/companies/1/stock"
    targetUrl = targetUrl.replace(/^https?:\/\/(127\.0\.0\.1|localhost):8000/, '');
  }

  // Prepend the live Render URL if it's now a relative path
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `${API_BASE_URL}${targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(targetUrl, { ...options, headers });
  
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    throw new Error("Session validation signature expired.");
  }
  
  return response;
}