import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const IS_DEV = process.env.EXPO_PUBLIC_APP_VARIANT === 'dev';

const supabaseUrl = IS_DEV
  ? 'https://hcqtjvqknespatnpmbrt.supabase.co'
  : 'https://iihxhlzbkeovqjcdzvkv.supabase.co';

const supabaseKey = IS_DEV
  ? 'sb_publishable_uD_Lz2IZSEMXPRQC7WrVeQ_uKeOeh_p'
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaHhobHpia2VvdnFqY2R6dmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODEzMDUsImV4cCI6MjA4OTA1NzMwNX0.wpBDQbLc_yyjxPmbuWfkrhBy_ylVjXWV8pAXCh4gRuo';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});