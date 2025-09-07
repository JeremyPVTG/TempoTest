// Runtime environment validation for production safety
// Logs warnings for missing variables but never crashes the app

export interface EnvCheckResult {
  valid: boolean
  missing: string[]
  warnings: string[]
}

export interface EnvRequirements {
  required: string[]
  optional: string[]
}

const CLIENT_ENV_REQUIREMENTS: EnvRequirements = {
  required: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  optional: ['EXPO_PUBLIC_REVENUECAT_IOS_API_KEY', 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY']
}

const EDGE_ENV_REQUIREMENTS: EnvRequirements = {
  required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  optional: ['REVENUECAT_WEBHOOK_SECRET']
}

function getEnvVar(key: string): string | undefined {
  // Support both import.meta.env (Vite) and process.env (Node)
  if (typeof import !== 'undefined' && import.meta?.env) {
    return import.meta.env[key]
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  return undefined
}

function checkEnvironment(requirements: EnvRequirements): EnvCheckResult {
  const missing: string[] = []
  const warnings: string[] = []
  
  // Check required variables
  for (const varName of requirements.required) {
    const value = getEnvVar(varName)
    if (!value || value.trim() === '') {
      missing.push(varName)
    }
  }
  
  // Check optional variables
  for (const varName of requirements.optional) {
    const value = getEnvVar(varName)
    if (!value || value.trim() === '') {
      warnings.push(`Optional environment variable ${varName} is not set - some features may be unavailable`)
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  }
}

export function checkClientEnv(): EnvCheckResult {
  return checkEnvironment(CLIENT_ENV_REQUIREMENTS)
}

export function checkEdgeEnv(): EnvCheckResult {
  return checkEnvironment(EDGE_ENV_REQUIREMENTS)
}

export function logEnvCheck(context: 'client' | 'edge'): void {
  const result = context === 'client' ? checkClientEnv() : checkEdgeEnv()
  
  if (result.valid) {
    console.log(`[EnvCheck] ${context} environment: ✅ All required variables present`)
  } else {
    console.error(`[EnvCheck] ${context} environment: ❌ Missing required variables:`, result.missing)
  }
  
  for (const warning of result.warnings) {
    console.warn(`[EnvCheck] ${warning}`)
  }
  
  // In development, be more verbose about what we found
  if (getEnvVar('NODE_ENV') === 'development' || getEnvVar('MODE') === 'development') {
    const requirements = context === 'client' ? CLIENT_ENV_REQUIREMENTS : EDGE_ENV_REQUIREMENTS
    const found = requirements.required.filter(key => getEnvVar(key))
    console.log(`[EnvCheck] Development mode - Found ${found.length}/${requirements.required.length} required variables`)
  }
}

// Safe initialization function that never throws
export function initEnvCheck(context: 'client' | 'edge'): boolean {
  try {
    logEnvCheck(context)
    const result = context === 'client' ? checkClientEnv() : checkEdgeEnv()
    return result.valid
  } catch (error) {
    console.error('[EnvCheck] Failed to validate environment:', error)
    return false // Assume invalid if check fails
  }
}