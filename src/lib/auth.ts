import { AuthSession, AuthResponse, Permission, User, UserRole } from "../types";
import { ROLE_PERMISSIONS, hasPermission } from "./rbac";

const TOKEN_STORAGE_KEY = "workstation_auth_session_v1";

/**
 * Public organization members directory (profile metadata only).
 * Sanitized for Story 1.4 & closing DS-05: ALL plaintext password hints deleted.
 */
export const DIRECTORY_USERS: User[] = [
  {
    id: "usr-admin-0",
    name: "System Security Admin",
    email: "vibelab.kd@gmail.com",
    avatar: "SA",
    role: "Super Admin",
    team: "Platform Security"
  },
  {
    id: "usr-2",
    name: "Rina Wijaya",
    email: "rina@workstation.io",
    avatar: "RW",
    role: "Tech Lead",
    team: "Core Engineering"
  },
  {
    id: "usr-1",
    name: "Kevin Santoso",
    email: "kevin@workstation.io",
    avatar: "KS",
    role: "Developer",
    team: "Web Team"
  },
  {
    id: "usr-3",
    name: "Budi Pratama",
    email: "budi@workstation.io",
    avatar: "BP",
    role: "Project Manager",
    team: "Product Delivery"
  },
  {
    id: "usr-4",
    name: "Citra Dewi",
    email: "citra@workstation.io",
    avatar: "CD",
    role: "Manager",
    team: "Operations & Exec"
  },
  {
    id: "usr-5",
    name: "Andi Saputra",
    email: "andi@workstation.io",
    avatar: "AS",
    role: "QA",
    team: "Quality Assurance"
  },
  {
    id: "usr-6",
    name: "Maya Putri",
    email: "maya@workstation.io",
    avatar: "MP",
    role: "Viewer",
    team: "Stakeholder Relations"
  }
];

export class AuthManager {
  private static instance: AuthManager;
  private currentSession: AuthSession | null = null;
  private listeners: ((session: AuthSession | null) => void)[] = [];

  private constructor() {
    this.restoreSession();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Restores session from localStorage.
   * Closes DS-03: NEVER automatically bootstraps a Super Admin session.
   */
  private restoreSession() {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        const expires = new Date(parsed.expiresAt).getTime();
        if (Date.now() < expires) {
          this.currentSession = parsed;
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          this.currentSession = null;
        }
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
      this.currentSession = null;
    }
  }

  public getSession(): AuthSession | null {
    return this.currentSession;
  }

  public getUser(): User | null {
    return this.currentSession?.user || null;
  }

  public getToken(): string | null {
    return this.currentSession?.token || null;
  }

  public hasPermission(permission: Permission): boolean {
    if (!this.currentSession) return false;
    return hasPermission(this.currentSession.user.role, permission);
  }

  public subscribe(callback: (session: AuthSession | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentSession);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentSession));
  }

  /**
   * Performs authentication against the backend API.
   * Closes DS-03: Offline fallback without password verification is deleted.
   */
  public async login(email: string, password?: string): Promise<AuthResponse> {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const json = await response.json();
      const data = json.data || json;

      if (response.ok && (json.success || data.success) && data.token && data.user) {
        const session: AuthSession = {
          token: data.token,
          user: data.user,
          expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          issuedAt: new Date().toISOString(),
          permissions: data.permissions || ROLE_PERMISSIONS[data.user.role as UserRole] || []
        };

        this.currentSession = session;
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(session));
        this.notify();
        return { success: true, token: data.token, user: data.user, permissions: session.permissions };
      } else {
        const errorMsg = json.error?.message || data.error || "Authentication failed: Invalid email or password";
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      return { success: false, error: error.message || "Network error: Unable to reach authentication server" };
    }
  }

  public async logout(): Promise<void> {
    try {
      if (this.currentSession?.token) {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.currentSession.token}`
          }
        });
      }
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      this.currentSession = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      this.notify();
    }
  }

  /**
   * Switches active user.
   * Closes DS-04: Backdoor default password "admin123" is deleted; password is required.
   */
  public async switchRole(targetUser: User, password?: string): Promise<boolean> {
    if (!password) {
      return false;
    }
    const res = await this.login(targetUser.email, password);
    return res.success;
  }
}

export const authManager = AuthManager.getInstance();

/**
 * Authenticated fetch wrapper that automatically attaches the Bearer token
 * and handles 401/403 RBAC errors consistently.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authManager.getToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers
  });
}
