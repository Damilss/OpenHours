/**
 * Simple user storage using localStorage.
 * In production this would be a real database.
 */

export interface User {
  id: string;
  name: string;
  school: string;
  email: string;
  password: string;
  role: "student" | "teacher";
}

const STORAGE_KEY = "open-hours-users";
const SESSION_KEY = "open-hours-session";

export function getAllUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addUser(user: User): void {
  const all = getAllUsers();
  all.push(user);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function findUserByEmail(email: string): User | undefined {
  return getAllUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

export function authenticate(
  email: string,
  password: string,
  role: "student" | "teacher"
): { success: boolean; error?: string; user?: User } {
  const user = findUserByEmail(email);
  if (!user) return { success: false, error: "No account found with that email." };
  if (user.password !== password) return { success: false, error: "Incorrect password." };
  if (user.role !== role)
    return {
      success: false,
      error: `This account is registered as a ${user.role}, not a ${role}.`,
    };
  return { success: true, user };
}

export function setSession(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
