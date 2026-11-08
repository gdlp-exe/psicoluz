
// Compatibility entry point; all active routes use the verified new-project client.
import { getStaffClient } from '../features/auth/client';
export const supabase = getStaffClient();
