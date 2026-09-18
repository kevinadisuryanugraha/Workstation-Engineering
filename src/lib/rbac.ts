import { Permission, UserRole } from "../types";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  "Super Admin": [
    "PERM_VIEW_DASHBOARD",
    "PERM_VIEW_ENGINEERING",
    "PERM_VIEW_MANAGEMENT",
    "PERM_WORK_ITEM_CREATE",
    "PERM_WORK_ITEM_UPDATE",
    "PERM_WORK_ITEM_DELETE",
    "PERM_EVIDENCE_ATTACH",
    "PERM_TICKET_CREATE",
    "PERM_TICKET_UPDATE",
    "PERM_TICKET_RESOLVE",
    "PERM_INCIDENT_DECLARE",
    "PERM_INCIDENT_COMMAND",
    "PERM_INCIDENT_RESOLVE",
    "PERM_DEPLOYMENT_EXECUTE",
    "PERM_DEPLOYMENT_ROLLBACK",
    "PERM_AI_SCAN_TRIGGER",
    "PERM_AI_TRANSLATE",
    "PERM_SERVER_TELEMETRY",
    "PERM_AUDIT_LOGS_VIEW",
    "PERM_USER_MANAGEMENT"
  ],
  "Organization Admin": [
    "PERM_VIEW_DASHBOARD",
    "PERM_VIEW_ENGINEERING",
    "PERM_VIEW_MANAGEMENT",
    "PERM_WORK_ITEM_CREATE",
    "PERM_WORK_ITEM_UPDATE",
    "PERM_WORK_ITEM_DELETE",
    "PERM_EVIDENCE_ATTACH",
    "PERM_TICKET_CREATE",
    "PERM_TICKET_UPDATE",
    "PERM_TICKET_RESOLVE",
    "PERM_INCIDENT_DECLARE",
    "PERM_INCIDENT_COMMAND",
    "PERM_DEPLOYMENT_EXECUTE",
    "PERM_DEPLOYMENT_ROLLBACK",
    "PERM_AI_SCAN_TRIGGER",
    "PERM_AI_TRANSLATE",
    "PERM_SERVER_TELEMETRY",
    "PERM_AUDIT_LOGS_VIEW",
    "PERM_USER_MANAGEMENT"
  ],
  "Tech Lead": [
    "PERM_VIEW_DASHBOARD",
    "PERM_VIEW_ENGINEERING",
    "PERM_VIEW_MANAGEMENT",
    "PERM_WORK_ITEM_CREATE",
    "PERM_WORK_ITEM_UPDATE",
    "PERM_WORK_ITEM_DELETE",
    "PERM_EVIDENCE_ATTACH",
    "PERM_TICKET_CREATE",
    "PERM_TICKET_UPDATE",
    "PERM_TICKET_RESOLVE",
    "PERM_INCIDENT_DECLARE",
    "PERM_INCIDENT_COMMAND",
    "PERM_INCIDENT_RESOLVE",
    "PERM_DEPLOYMENT_EXECUTE",
    "PERM_DEPLOYMENT_ROLLBACK",
    "PERM_AI_SCAN_TRIGGER",
    "PERM_AI_TRANSLATE",
    "PERM_SERVER_TELEMETRY",
    "PERM_AUDIT_LOGS_VIEW"
  ],
  "Project Manager": [
    "PERM_VIEW_DASHBOARD",
    "PERM_VIEW_ENGINEERING",
    "PERM_VIEW_MANAGEMENT",
    "PERM_WORK_ITEM_CREATE",
    "PERM_WORK_ITEM_UPDATE",
    "PERM_EVIDENCE_ATTACH",
    "PERM_TICKET_CREATE",
    "PERM_TICKET_UPDATE",
    "PERM_TICKET_RESOLVE",
    "PERM_INCIDENT_DECLARE",
    "PERM_AI_TRANSLATE",
    "PERM_AUDIT_LOGS_VIEW"
  ],
  "Manager": [
    "PERM_VIEW_DASHBOARD",
    "PERM_VIEW_MANAGEMENT",
    "PERM_TICKET_CREATE",
    "PERM_TICKET_UPDATE",
    "PERM_AI_TRANSLATE",
    "PERM_AUDIT_LOGS_VIEW"
  ],
  "Developer": [
    "PERM_VIEW_DASHBOARD",
    "PERM_VIEW_ENGINEERING",
    "PERM_WORK_ITEM_CREATE",
    "PERM_WORK_ITEM_UPDATE",
    "PERM_EVIDENCE_ATTACH",
    "PERM_TICKET_CREATE",
    "PERM_TICKET_UPDATE",
    "PERM_AI_SCAN_TRIGGER",
    "PERM_SERVER_TELEMETRY"
  ],
  "QA": [
    "PERM_VIEW_DASHBOARD",
    "PERM_VIEW_ENGINEERING",
    "PERM_WORK_ITEM_UPDATE",
    "PERM_EVIDENCE_ATTACH",
    "PERM_TICKET_CREATE",
    "PERM_TICKET_UPDATE",
    "PERM_TICKET_RESOLVE"
  ],
  "Support": [
    "PERM_VIEW_DASHBOARD",
    "PERM_TICKET_CREATE",
    "PERM_TICKET_UPDATE"
  ],
  "Viewer": [
    "PERM_VIEW_DASHBOARD"
  ]
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, { label: string; category: string; description: string }> = {
  PERM_VIEW_DASHBOARD: {
    label: "View General Dashboard",
    category: "Navigation",
    description: "Read-only access to overview metrics and high-level health indicators"
  },
  PERM_VIEW_ENGINEERING: {
    label: "View Engineering Intelligence",
    category: "Navigation",
    description: "Access to Git commits, telemetry, branches, and code scans"
  },
  PERM_VIEW_MANAGEMENT: {
    label: "View Management Perspectives",
    category: "Navigation",
    description: "Access to executive summaries, portfolio views, and business KPI translations"
  },
  PERM_WORK_ITEM_CREATE: {
    label: "Create Sprint Work Items",
    category: "Sprint Backlog",
    description: "Author new epics, features, tasks, and bugs into sprint backlogs"
  },
  PERM_WORK_ITEM_UPDATE: {
    label: "Update Work Item & ACs",
    category: "Sprint Backlog",
    description: "Transition work item states, check acceptance criteria, and update details"
  },
  PERM_WORK_ITEM_DELETE: {
    label: "Delete Work Items",
    category: "Sprint Backlog",
    description: "Prune or purge work items from project backlogs"
  },
  PERM_EVIDENCE_ATTACH: {
    label: "Attach Verification Evidence",
    category: "Quality & Governance",
    description: "Upload commits, test artifacts, or logs as verifiable proof of completion"
  },
  PERM_TICKET_CREATE: {
    label: "Create ITSM Tickets",
    category: "ITSM Ticketing",
    description: "Report issues, bugs, and infrastructure requests into ticketing queues"
  },
  PERM_TICKET_UPDATE: {
    label: "Update Tickets",
    category: "ITSM Ticketing",
    description: "Reassign, triage, comment, and adjust severity levels on tickets"
  },
  PERM_TICKET_RESOLVE: {
    label: "Resolve & Close Tickets",
    category: "ITSM Ticketing",
    description: "Mark tickets as resolved with root cause evidence and SLA sign-off"
  },
  PERM_INCIDENT_DECLARE: {
    label: "Declare Major Incident",
    category: "Incident Response",
    description: "Open active War Rooms, spin up incident channels, and trigger paging"
  },
  PERM_INCIDENT_COMMAND: {
    label: "Incident Commander Powers",
    category: "Incident Response",
    description: "Lead active incident responses, assign mitigation tasks, and post updates"
  },
  PERM_INCIDENT_RESOLVE: {
    label: "Close Incident & Sign Post-Mortem",
    category: "Incident Response",
    description: "Authorize formal resolution and publish cryptographic post-mortem reports"
  },
  PERM_DEPLOYMENT_EXECUTE: {
    label: "Trigger Production Deploy",
    category: "DevOps & Release",
    description: "Run automated deployment pipelines to Staging and Production clusters"
  },
  PERM_DEPLOYMENT_ROLLBACK: {
    label: "Execute Emergency Rollback",
    category: "DevOps & Release",
    description: "Rollback faulty production deployments to previously known stable releases"
  },
  PERM_AI_SCAN_TRIGGER: {
    label: "Trigger AI Deep Codebase Scan",
    category: "AI Intelligence",
    description: "Invoke server-side Gemini neural code analyzer and vulnerability sweeps"
  },
  PERM_AI_TRANSLATE: {
    label: "Execute Dual-Perspective Translation",
    category: "AI Intelligence",
    description: "Generate executive management summaries from raw engineering logs"
  },
  PERM_SERVER_TELEMETRY: {
    label: "Inspect Hardware Nodes & Systemd",
    category: "Infrastructure",
    description: "View real-time CPU, RAM, disk, load averages, and daemon status"
  },
  PERM_AUDIT_LOGS_VIEW: {
    label: "Inspect Audit Trail Event Bus",
    category: "Security & Governance",
    description: "Audit immutable chronological logs of all operational actions and access attempts"
  },
  PERM_USER_MANAGEMENT: {
    label: "Manage Users & Role Assignments",
    category: "Administration",
    description: "Provision team members, revoke access, and modify RBAC role tiering"
  }
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every((p) => hasPermission(role, p));
}
