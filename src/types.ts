// WORKSTATION - Engineering Intelligence & Operations Platform
// Core Domain Models & Schemas

export type UserRole =
  | "Super Admin"
  | "Organization Admin"
  | "Manager"
  | "Project Manager"
  | "Tech Lead"
  | "Developer"
  | "QA"
  | "Support"
  | "Viewer";

export type Permission =
  | "PERM_VIEW_DASHBOARD"
  | "PERM_VIEW_ENGINEERING"
  | "PERM_VIEW_MANAGEMENT"
  | "PERM_WORK_ITEM_CREATE"
  | "PERM_WORK_ITEM_UPDATE"
  | "PERM_WORK_ITEM_DELETE"
  | "PERM_EVIDENCE_ATTACH"
  | "PERM_TICKET_CREATE"
  | "PERM_TICKET_UPDATE"
  | "PERM_TICKET_RESOLVE"
  | "PERM_INCIDENT_DECLARE"
  | "PERM_INCIDENT_COMMAND"
  | "PERM_INCIDENT_RESOLVE"
  | "PERM_DEPLOYMENT_EXECUTE"
  | "PERM_DEPLOYMENT_ROLLBACK"
  | "PERM_AI_SCAN_TRIGGER"
  | "PERM_AI_TRANSLATE"
  | "PERM_SERVER_TELEMETRY"
  | "PERM_AUDIT_LOGS_VIEW"
  | "PERM_USER_MANAGEMENT";

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
  issuedAt: string;
  permissions: Permission[];
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  permissions?: Permission[];
  expiresAt?: string;
  error?: string;
}

export interface RBACCheckResult {
  allowed: boolean;
  userRole: UserRole;
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  reason?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  team: string;
}

export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "AT_RISK" | "COMPLETED" | "ARCHIVED";

export interface Project {
  id: string;
  key: string;
  name: string;
  tagline: string;
  status: ProjectStatus;
  progress: number; // calculated from evidence
  health: number; // 0 - 100 explainable
  owner: string;
  techLead: string;
  currentSprint: string;
  openTickets: number;
  blockersCount: number;
  latestRelease: string;
  productionStatus: "Healthy" | "Degraded" | "Down";
  repoName: string;
  modulesCount: number;
  description: string;
}

export type WorkItemType =
  | "EPIC"
  | "FEATURE"
  | "TASK"
  | "SUBTASK"
  | "BUG"
  | "TECH_DEBT"
  | "SPIKE"
  | "MAINTENANCE"
  | "REFACTOR"
  | "IMPROVEMENT";

export type WorkItemStatus =
  | "BACKLOG"
  | "READY"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "IN_REVIEW"
  | "READY_FOR_TEST"
  | "TESTING"
  | "READY_FOR_DEPLOY"
  | "DEPLOYED"
  | "DONE"
  | "CANCELLED";

export type VerificationState =
  | "UNVERIFIED"
  | "SYSTEM_VERIFIED"
  | "HUMAN_VERIFIED"
  | "DISPUTED"
  | "REJECTED";

export interface EvidenceItem {
  id: string;
  type: "COMMIT" | "PULL_REQUEST" | "TEST_RUN" | "DEPLOYMENT" | "AGENT_TELEMETRY" | "AI_SCAN" | "HUMAN_APPROVAL";
  title: string;
  source: string;
  sourceId: string;
  timestamp: string;
  confidence: number;
  verificationStatus: VerificationState;
  verifiedBy?: string;
  details?: string;
}

export interface WorkItem {
  id: string;
  code: string; // e.g. ENR-024
  title: string;
  description: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: "Critical" | "High" | "Medium" | "Low";
  projectId: string;
  assignee: User;
  sprintId: string;
  milestoneId?: string;
  estimateHours: number;
  actualHours: number;
  acceptanceCriteria: { id: string; text: string; completed: boolean }[];
  dependencies: string[]; // item codes
  evidence: EvidenceItem[];
  gitBranch?: string;
  createdAt: string;
  updatedAt: string;
}

export type TicketType =
  | "BUG"
  | "FEATURE_REQUEST"
  | "TECHNICAL_ISSUE"
  | "MAINTENANCE"
  | "SECURITY"
  | "PERFORMANCE"
  | "QUESTION"
  | "SERVICE_REQUEST"
  | "INCIDENT";

export type TicketStatus =
  | "NEW"
  | "TRIAGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "READY_FOR_TEST"
  | "TESTING"
  | "READY_FOR_DEPLOY"
  | "DEPLOYED"
  | "RESOLVED"
  | "CLOSED"
  | "BLOCKED";

export type SLAStatus = "ON_TRACK" | "AT_RISK" | "BREACHED" | "PAUSED";

export interface Ticket {
  id: string;
  code: string; // e.g. TK-2026-0182
  title: string;
  type: TicketType;
  category: string;
  severity: "Critical" | "Major" | "Minor" | "Low";
  priority: "P1" | "P2" | "P3" | "P4";
  status: TicketStatus;
  projectId: string;
  reporter: string;
  assignee?: User;
  slaStatus: SLAStatus;
  slaTargetResolution: string;
  slaRemainingMinutes: number;
  description: string;
  linkedWorkItemId?: string;
  evidence: EvidenceItem[];
  createdAt: string;
  resolution?: string;
}

export interface Incident {
  id: string;
  code: string; // INC-00042
  projectId?: string;
  title: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  environment: "Production" | "Staging";
  server: string;
  detectedAt: string;
  resolvedAt?: string;
  commander: string;
  impact: string;
  status?: "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "MITIGATED" | "RESOLVED";
  runbookUrl?: string;
  relatedTicketCode?: string;
  timeline: { time: string; event: string; actor: string; type?: "alert" | "action" | "mitigation" | "resolution" }[];
  postmortem?: {
    rootCause: string;
    impactDurationMinutes: number;
    mitigation: string;
    correctiveActionWorkItemCode: string;
  };
  /** Story 13.2/13.3 — live SLA picture from the incident API (badges on cards). */
  sla?: {
    response: { targetMinutes: number; status: "PENDING" | "MET" | "BREACHED"; actualMinutes: number | null; overdueMinutes: number };
    resolution: { targetMinutes: number; status: "PENDING" | "MET" | "BREACHED"; actualMinutes: number | null; overdueMinutes: number };
  };
}

export interface Commit {
  sha: string;
  projectId?: string;
  message: string;
  author: string;
  branch: string;
  timestamp: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  linkedItemCodes: string[];
}

export interface PullRequest {
  id: number;
  projectId?: string;
  title: string;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  status: "OPEN" | "MERGED" | "CLOSED";
  reviewers: { name: string; approved: boolean }[];
  ciStatus: "PASSED" | "FAILED" | "RUNNING";
  commitsCount: number;
  linkedItemCode: string;
  mergedAt?: string;
}

export interface Deployment {
  id: string;
  code: string; // DEP-502
  projectId: string;
  environment: "Development" | "Staging" | "UAT" | "Production";
  server: string;
  version: string;
  commitSha: string;
  actor: string;
  startedAt: string;
  completedAt: string;
  status: "SUCCESS" | "FAILED" | "RUNNING" | "ROLLED_BACK";
  gates: { name: string; passed: boolean; verifiedBy: string }[];
  logsSummary: string;
}

export interface ServerTelemetry {
  id: string;
  name: string;
  environment: "Production" | "Development" | "Staging";
  ip: string;
  provider: "Kontabo VPS" | "Office Server Local" | "Cloud";
  os: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  agentVersion: string;
  lastHeartbeat: string;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  loadAverage: string;
  uptime: string;
  services: {
    name: string;
    status: "Running" | "Stopped" | "Warning";
    port?: number;
    memoryMb: number;
  }[];
}

export interface AIFinding {
  id: string;
  scanId: string;
  title: string;
  category: "Architecture" | "Security" | "Performance" | "Testing" | "Documentation";
  severity: "Critical" | "High" | "Medium" | "Low";
  confidence: number;
  affectedFile: string;
  evidence: string;
  impact: string;
  suggestedRemediation: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "RESOLVED" | "FALSE_POSITIVE";
  detectedAt: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  reason: string;
  expectedImpact: string;
  effortEstimate: string;
  affectedModule: string;
  confidence: number;
  convertedToWorkItem?: string;
}

export interface TechnicalDebt {
  id: string;
  code: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  estimatedEffortHours: number;
  source: "AI Scan" | "Tech Lead Audit" | "Code Review";
  status: "OPEN" | "PLANNED" | "IN_PROGRESS" | "RESOLVED";
  agingDays: number;
  affectedModule: string;
}

export interface EngineeringEvent {
  id: string;
  type:
    | "CODE_COMMITTED"
    | "PR_CREATED"
    | "PR_MERGED"
    | "TASK_CREATED"
    | "TASK_COMPLETED"
    | "TASK_UPDATED"
    | "TICKET_CREATED"
    | "TICKET_RESOLVED"
    | "TICKET_UPDATED"
    | "AI_SCAN_COMPLETED"
    | "RELEASE_CREATED"
    | "DEPLOYMENT_SUCCESS"
    | "DEPLOYMENT_FAILED"
    | "SERVER_ALERT"
    | "INCIDENT_TRIGGERED"
    | "INCIDENT_RESOLVED"
    | "SYSTEM_AUDIT"; // Story 18.4 (CC-5): log audit yang tak masuk kategori lain — jujur, bukan dipaksakan
  actor: string;
  projectId?: string;
  source?: string;
  timestamp: string;
  title: string;
  descriptionTechnical: string;
  descriptionManagement: string;
  evidenceRef: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: "Troubleshooting" | "Infrastructure" | "Architecture" | "Deployment Guide";
  originTicketCode?: string;
  author: string;
  content: string;
  tags: string[];
  lastUpdated: string;
}
