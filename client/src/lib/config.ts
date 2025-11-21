
export const isHostedMode = () => {
  // Check if running on Azure Static Web Apps
  // SWA usually runs on *.azurestaticapps.net
  // Or if we are in local SWA emulation (usually port 4280, but can vary)
  // A more robust way might be to check a specific header or endpoint, 
  // but for client-side detection, hostname is the most direct.
  
  if (typeof window === 'undefined') return false;
  
  return window.location.hostname.includes('azurestaticapps.net');
};

export const getApiBaseUrl = () => {
  // In SWA, the API is at /api
  // In local dev (Vite), we proxy /api to the backend
  // So it's always relative
  return '/api';
};
