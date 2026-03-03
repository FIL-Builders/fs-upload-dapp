import type { SessionStatus } from "./session-store";

interface SessionDisplay {
  label: string;
  menuLabel: string;
  iconClass: string;
  badgeClass: string;
}

const DISPLAY_MAP: Record<SessionStatus, SessionDisplay> = {
  valid: {
    label: "Session Key is Active",
    menuLabel: "Session (active)",
    iconClass: "text-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  expiring: {
    label: "Session Key is Expiring Soon",
    menuLabel: "Session (expiring)",
    iconClass: "text-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  expired: {
    label: "Session Key is Expired",
    menuLabel: "Session (expired)",
    iconClass: "text-orange-500",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  none: {
    label: "Not created",
    menuLabel: "No session",
    iconClass: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

export function getSessionDisplay(status: SessionStatus, hasValidSession: boolean): SessionDisplay {
  if (hasValidSession) return DISPLAY_MAP.valid;
  return DISPLAY_MAP[status];
}
