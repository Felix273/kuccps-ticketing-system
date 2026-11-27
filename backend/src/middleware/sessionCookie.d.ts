import type { Request, Response } from 'express';

export const SESSION_COOKIE: string;
export function parseCookies(header: string | undefined): Record<string, string>;
export function getRequestToken(req: Request): { token: string | null; source: 'cookie' | 'bearer' | null };
export function isCsrfSafe(req: Request, source: 'cookie' | 'bearer' | null): boolean;
export function setSessionCookie(res: Response, token: string, expiresAtSeconds: number): void;
export function clearSessionCookie(res: Response): void;
