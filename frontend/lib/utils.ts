import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// export const url = "http://localhost:8000"
export const url = "https://5ywb7vjgv5.execute-api.us-east-1.amazonaws.com";
