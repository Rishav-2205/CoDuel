const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("coduel_token");
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("coduel_token", token);
  }
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("coduel_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: any) => request<any>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<any>("/auth/logout", { method: "POST" }),
  getMe: () => request<any>("/auth/me", { method: "GET" }),

  // Duel
  startDuel: (body: { language: string; duelType?: string; difficulty?: string }) =>
    request<any>("/duels/start", { method: "POST", body: JSON.stringify(body) }),
  answerQuestion: (duelId: string, answer: string) =>
    request<any>(`/duels/${duelId}/answer`, { method: "POST", body: JSON.stringify({ answer }) }),
  skipQuestion: (duelId: string) =>
    request<any>(`/duels/${duelId}/skip`, { method: "POST" }),
  getDuelStatus: (duelId: string) =>
    request<any>(`/duels/${duelId}`, { method: "GET" }),
  finishDuel: (duelId: string) =>
    request<any>(`/duels/${duelId}/finish`, { method: "POST" }),
  submitTypingProgress: (duelId: string, charsTyped: number, charsCorrect: number) =>
    request<any>(`/duels/${duelId}/typing-progress`, {
      method: "POST",
      body: JSON.stringify({ charsTyped, charsCorrect }),
    }),

  // Ratings v1.0
  getMyRatings: () => request<any>("/ratings/me", { method: "GET" }),
  getMyRatingHistory: (mode?: string) => {
    const qs = mode ? `?mode=${mode}` : "";
    return request<any>(`/ratings/me/history${qs}`, { method: "GET" });
  },

  // User & History
  getProfile: () => request<any>("/users/me", { method: "GET" }),
  updateProfile: (body: { username?: string; avatar?: string }) =>
    request<any>("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  getMatchHistory: (params?: { duelType?: string; language?: string }) => {
    const query = new URLSearchParams();
    if (params?.duelType && params.duelType !== "all") query.append("duelType", params.duelType);
    if (params?.language && params.language !== "all") query.append("language", params.language);
    const qs = query.toString();
    return request<any>(`/users/me/history${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  // Leaderboard v1.0
  getLeaderboard: (params?: {
    category?: string;
    mode?: string;
    period?: string;
    page?: number;
    limit?: number;
  } | string) => {
    if (typeof params === "string") {
      // Legacy signature
      const qs = params && params !== "all" ? `?language=${params}` : "";
      return request<any>(`/leaderboard${qs}`, { method: "GET" });
    }
    const query = new URLSearchParams();
    const mode = params?.category || params?.mode;
    if (mode) query.append("mode", mode);
    if (params?.period) query.append("period", params.period);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    const qs = query.toString();
    return request<any>(`/leaderboard${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
};
