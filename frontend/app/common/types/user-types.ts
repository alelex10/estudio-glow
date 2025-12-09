// ========== USUARIOS ==========
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "customer";
}
