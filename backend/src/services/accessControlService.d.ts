export const SETTINGS_SECTIONS: Record<string, string>;
export function getRequiredSettingsPermissions(fields: string[]): string[] | null;
export function getPermissionsForUser(userId: string): Promise<string[]>;
export function requirePermission(permission: string): (req: any, res: any, next: any) => void;
