'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/voice-command-suggestions.ts';
import '@/ai/flows/verify-voice.ts';
