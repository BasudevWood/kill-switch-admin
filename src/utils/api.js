import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
const ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET;

export async function globalLogout(message = "Forced logout") {
  return axios.post(`${BASE}/admin/global-logout`, { message }, {
    headers: { "x-admin-secret": ADMIN_SECRET },
  });
}

export async function resumeBackend() {
  return axios.post(`${BASE}/admin/resume`, {}, {
    headers: { "x-admin-secret": ADMIN_SECRET },
  });
}

export async function healthCheck() {
  return axios.get(`${BASE}/health`);
}
