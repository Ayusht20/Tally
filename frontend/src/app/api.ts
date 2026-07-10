/** Dynamic backend API production routing engine anchor */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tally-lhy7.onrender.com/';

/** Reusable network layer that forces secure JWT transmission on all cluster endpoints */
export async function secureFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  // 🔄 Check if the url is a relative path (e.g., "/companies/1/stock") 
  // and prepend the live Render API_BASE_URL automatically.
  const targetUrl = url.startsWith('http://') || url.startsWith('https://') 
    ? url 
    : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;

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