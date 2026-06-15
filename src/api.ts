const API_BASE = "/api";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("okkhor_pathagar_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const apiClient = {
  async get(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: getHeaders(),
    });
    if (res.status === 401) {
      localStorage.removeItem("okkhor_pathagar_token");
      window.dispatchEvent(new Event("auth-expired"));
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "নেটওয়ার্ক রেসপন্স সন্তোষজনক নয়।");
    }
    return res.json();
  },

  async post(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      localStorage.removeItem("okkhor_pathagar_token");
      window.dispatchEvent(new Event("auth-expired"));
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "অনুরোধটি সফল হয়নি।");
    }
    return res.json();
  },

  async put(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      localStorage.removeItem("okkhor_pathagar_token");
      window.dispatchEvent(new Event("auth-expired"));
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "আপডেট সফল হয়নি।");
    }
    return res.json();
  },

  async delete(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (res.status === 401) {
      localStorage.removeItem("okkhor_pathagar_token");
      window.dispatchEvent(new Event("auth-expired"));
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "মুছে ফেলা সম্ভব হয়নি।");
    }
    return res.json();
  },
};
