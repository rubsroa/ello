import "server-only";
import { SignJWT, jwtVerify } from "jose";

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);
export async function createGoogleState(staffId: string, userId: string) { return new SignJWT({ staffId, userId, purpose: "google-calendar" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("10m").sign(key()); }
export async function verifyGoogleState(state: string) { const { payload } = await jwtVerify(state, key(), { algorithms: ["HS256"] }); if (payload.purpose !== "google-calendar" || typeof payload.staffId !== "string" || typeof payload.userId !== "string") throw new Error("État OAuth invalide"); return { staffId: payload.staffId, userId: payload.userId }; }
