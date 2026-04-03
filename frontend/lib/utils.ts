import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Requests go through Next.js API proxy routes, which attach the server-side API key.
// Direct backend URLs are managed in .env.local (BACKEND_URL).
export const url = "/api";
