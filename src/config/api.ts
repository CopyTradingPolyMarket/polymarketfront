export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const WS_BASE = API_BASE.replace(/^http/, "ws");
