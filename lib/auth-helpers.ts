import type { Database } from "./supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export function getUserRoleFromProfile(profile: Profile | null, userEmail?: string): "admin" | "viewer" {
  if (!profile && !userEmail) return "viewer"

  // Check by email for admin access
  const email = profile?.email || userEmail
  if (email === "admin@demo.com" || email === "admin@example.com") {
    return "admin"
  }

  // Check by full_name as fallback (if user has full_name, they're admin)
  if (profile?.full_name) {
    return "admin"
  }

  return "viewer"
}

export function isUserAdmin(profile: Profile | null, userEmail?: string): boolean {
  return getUserRoleFromProfile(profile, userEmail) === "admin"
}
