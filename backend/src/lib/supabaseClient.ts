// backend/src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Use SUPABASE_KEY (service_role) for admin tasks on backend

if (!supabaseUrl || !supabaseKey) {
  logger.error('Supabase URL or Key is missing. Check .env file.');
  throw new Error('Supabase URL or Key is missing. Check .env file.');
}

const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

logger.info('Supabase client initialized successfully.');
export default supabaseClient;
