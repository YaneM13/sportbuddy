import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iihxhlzbkeovqjcdzvkv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaHhobHpia2VvdnFqY2R6dmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODEzMDUsImV4cCI6MjA4OTA1NzMwNX0.wpBDQbLc_yyjxPmbuWfkrhBy_ylVjXWV8pAXCh4gRuo';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});