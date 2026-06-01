import { toast } from 'sonner'

// ── Typed toast helpers for Persist ──────────────────────────────────────────
// Import this instead of raw `toast` so every callsite gets the right
// icon, description, and duration automatically.

export const showToast = {
  // ── Nudge events ────────────────────────────────────────────────────────────

  nudgeSent: (studentName: string) =>
    toast.success(`Nudge sent to ${studentName}`, {
      description: "They'll receive it shortly. Keep the momentum going.",
      icon: '📬',
      duration: 4000,
    }),

  nudgeFailed: (studentName: string) =>
    toast.error(`Nudge to ${studentName} failed`, {
      description: 'Check your Resend API key in Settings and try again.',
      icon: '⚠️',
      action: {
        label: 'Go to Settings',
        onClick: () => { window.location.href = '/dashboard/settings' },
      },
      duration: 6000,
    }),

  // ── Save / persist actions ──────────────────────────────────────────────────

  saved: (label = 'Changes saved') =>
    toast.success(label, {
      description: 'Your changes are saved and live.',
      icon: '✓',
      duration: 3000,
    }),

  // ── Copy to clipboard ───────────────────────────────────────────────────────

  copied: (label = 'Copied to clipboard') =>
    toast(label, {
      description: 'Ready to paste wherever you need it.',
      icon: '📋',
      duration: 2500,
    }),

  // ── Generic error ───────────────────────────────────────────────────────────

  error: (message: string, description?: string) =>
    toast.error(message, {
      description,
      icon: '✕',
      duration: 5000,
    }),

  // ── Course completion ───────────────────────────────────────────────────────

  courseComplete: (studentName: string, courseName: string) =>
    toast.success(`${studentName} completed a course! 🎉`, {
      description: courseName,
      icon: '🏆',
      duration: 6000,
    }),
}
