import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar, ActiveTab } from "./components/Sidebar";
import { OverviewView } from "./components/OverviewView";
import { Project360View } from "./components/Project360View";
import { WorkItemsView } from "./components/WorkItemsView";
import { TicketingView } from "./components/TicketingView";
import { IncidentRoomView } from "./components/IncidentRoomView";
import { GitIntelligenceView } from "./components/GitIntelligenceView";
import { DeploymentsView } from "./components/DeploymentsView";
import { InfrastructureView } from "./components/InfrastructureView";
import { AIIntelligenceView } from "./components/AIIntelligenceView";
import { ReportsView } from "./components/ReportsView";
import { BlueprintView } from "./components/BlueprintView";
import { KnowledgeBaseView } from "./components/KnowledgeBaseView";
import { AuditLogView } from "./components/AuditLogView";
import { SecurityView } from "./components/SecurityView";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { RetroDesktopShell } from "./components/ui/RetroDesktopShell";
import { MobileBottomBar } from "./components/MobileBottomBar";
import { RBACDenialModal } from "./components/RBACDenialModal";
import { LoginView } from "./components/LoginView";
import { authManager, authFetch, DIRECTORY_USERS } from "./lib/auth";
import { hasPermission } from "./lib/rbac";

import {
  mockProjects,
  mockWorkItems,
  mockTickets,
  mockDeployments,
  mockServers,
  mockAIFindings,
  mockAIRecommendations,
  mockTechnicalDebts,
  mockIncidents,
  mockCommits,
  mockPullRequests,
  mockEngineeringEvents,
  mockKnowledgeArticles
} from "./mockData";

import {
  Project,
  User,
  WorkItem,
  Ticket,
  TicketStatus,
  WorkItemStatus,
  AIFinding,
  AIRecommendation,
  Deployment,
  EvidenceItem,
  EngineeringEvent,
  ServerTelemetry,
  Incident,
  Permission,
  AuthSession
} from "./types";

export default function App() {
  // Navigation & Authentic RBAC Session States
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isManagementView, setIsManagementView] = useState<boolean>(false);
  const [session, setSession] = useState<AuthSession | null>(authManager.getSession());
  const [currentUser, setCurrentUser] = useState<User>(
    authManager.getUser() || DIRECTORY_USERS[0]
  );
  const [currentProject, setCurrentProject] = useState<Project>(mockProjects[0]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [rbacDenial, setRbacDenial] = useState<{
    isOpen: boolean;
    requiredPermission?: Permission;
    requiredRole?: string;
    actionName?: string;
  }>({ isOpen: false });

  // Sync session state from AuthManager
  useEffect(() => {
    const unsubscribe = authManager.subscribe((newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setCurrentUser(newSession.user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Strict RBAC Guard Helper
  const checkRBAC = (permission: Permission, actionName: string, minRole?: string): boolean => {
    if (!hasPermission(currentUser.role, permission)) {
      setRbacDenial({
        isOpen: true,
        requiredPermission: permission,
        requiredRole: minRole,
        actionName
      });
      return false;
    }
    return true;
  };

  // Core Data States
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [workItems, setWorkItems] = useState<WorkItem[]>(mockWorkItems);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [deployments, setDeployments] = useState<Deployment[]>(mockDeployments);
  const [servers, setServers] = useState<ServerTelemetry[]>(mockServers);
  const [aiFindings, setAiFindings] = useState<AIFinding[]>(mockAIFindings);
  const [aiScanMode, setAiScanMode] = useState<string | null>(null); // SEC-05: integrity flag from /api/ai/scan
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>(mockAIRecommendations);
  const [technicalDebts, setTechnicalDebts] = useState(mockTechnicalDebts);
  const [incidents, setIncidents] = useState(mockIncidents);
  const [commits, setCommits] = useState(mockCommits);
  const [pullRequests, setPullRequests] = useState(mockPullRequests);
  const [events, setEvents] = useState<EngineeringEvent[]>(mockEngineeringEvents);
  const [articles] = useState(mockKnowledgeArticles);

  // Filter project-specific items
  const projectWorkItems = workItems.filter((w) => w.projectId === currentProject.id);
  const projectTickets = tickets.filter((t) => t.projectId === currentProject.id);
  const projectDeployments = deployments.filter((d) => d.projectId === currentProject.id);
  const projectCommits = commits.filter((c) => !c.projectId || c.projectId === currentProject.id);
  const projectPullRequests = pullRequests.filter((pr) => !pr.projectId || pr.projectId === currentProject.id);
  const projectIncidents = incidents.filter((i) => !i.projectId || i.projectId === currentProject.id);

  // Recalculate project progress dynamically from evidence
  const calculateProgress = () => {
    if (projectWorkItems.length === 0) return 0;
    const completed = projectWorkItems.filter((w) => w.status === "DONE" || w.status === "DEPLOYED").length;
    return Math.round((completed / projectWorkItems.length) * 100);
  };

  const dynamicProgress = calculateProgress();
  const activeProject: Project = {
    ...currentProject,
    progress: dynamicProgress
  };

  // Handlers for Work Items
  const handleUpdateWorkItemStatus = (itemId: string, newStatus: WorkItemStatus) => {
    if (!checkRBAC("PERM_WORK_ITEM_UPDATE", "Ubah Status Work Item", "Developer / QA / Tech Lead")) {
      return;
    }

    setWorkItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    );

    const updated = workItems.find((w) => w.id === itemId);
    if (updated) {
      setEvents((prev) => [
        {
          id: `EVT-${Date.now()}`,
          type: newStatus === "DONE" ? "TASK_COMPLETED" : "TASK_UPDATED",
          title: `Work Item ${updated.code} moved to ${newStatus}`,
          descriptionTechnical: `State machine transitioned ${updated.code} status to ${newStatus} by ${currentUser.name} (${currentUser.role}).`,
          descriptionManagement: `Status tugas ${updated.code} diperbarui ke ${newStatus} oleh ${currentUser.name}.`,
          actor: currentUser.name,
          source: "WEB_APP",
          evidenceRef: updated.code,
          projectId: currentProject.id,
          timestamp: "Just now"
        },
        ...prev
      ]);
    }
  };

  const handleToggleAcceptanceCriteria = (itemId: string, criteriaId: string) => {
    if (!checkRBAC("PERM_WORK_ITEM_UPDATE", "Centang Acceptance Criteria", "Developer / QA")) {
      return;
    }

    setWorkItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            acceptanceCriteria: item.acceptanceCriteria.map((c) =>
              c.id === criteriaId ? { ...c, completed: !c.completed } : c
            )
          };
        }
        return item;
      })
    );
  };

  const handleAddEvidence = (itemId: string, evidence: Omit<EvidenceItem, "id" | "timestamp">) => {
    if (!checkRBAC("PERM_EVIDENCE_ATTACH", "Lampirkan Bukti Verifikasi", "Developer / QA / Tech Lead")) {
      return;
    }

    const newEvidence: EvidenceItem = {
      ...evidence,
      id: `EVD-${Date.now()}`,
      timestamp: "Just now"
    };

    setWorkItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            evidence: [newEvidence, ...item.evidence]
          };
        }
        return item;
      })
    );

    setEvents((prev) => [
      {
        id: `EVT-${Date.now()}`,
        type: "TASK_UPDATED",
        title: `Verification Evidence Attached to ${itemId}`,
        descriptionTechnical: `Cryptographic verification evidence (${evidence.type}) attached with confidence ${evidence.confidence}% by ${currentUser.name}.`,
        descriptionManagement: `Bukti penyelesaian pekerjaan (${evidence.title}) telah divalidasi ke sistem.`,
        actor: currentUser.name,
        source: "EVIDENCE_ENGINE",
        evidenceRef: newEvidence.id,
        projectId: currentProject.id,
        timestamp: "Just now"
      },
      ...prev
    ]);
  };

  const handleCreateWorkItem = (newItem: Partial<WorkItem>) => {
    if (!checkRBAC("PERM_WORK_ITEM_CREATE", "Buat Work Item Baru", "Project Manager / Developer / Tech Lead")) {
      return;
    }

    const nextNumber = workItems.length + 25;
    const code = `${activeProject.key}-${String(nextNumber).padStart(3, "0")}`;

    const createdItem: WorkItem = {
      id: `item-${Date.now()}`,
      code,
      title: newItem.title || "Untitled Work Item",
      description: newItem.description || "",
      type: newItem.type || "FEATURE",
      status: newItem.status || "BACKLOG",
      priority: newItem.priority || "Medium",
      projectId: activeProject.id,
      assignee: currentUser,
      sprintId: activeProject.currentSprint || "Sprint 01",
      estimateHours: newItem.estimateHours || 8,
      actualHours: 0,
      acceptanceCriteria: (newItem.acceptanceCriteria || []).map((c: any, idx: number) => ({
        id: `ac-${Date.now()}-${idx}`,
        text: typeof c === "string" ? c : c.text,
        completed: typeof c === "string" ? false : Boolean(c.completed)
      })),
      dependencies: newItem.dependencies || [],
      evidence: [],
      createdAt: "Just now",
      updatedAt: "Just now"
    };

    setWorkItems((prev) => [createdItem, ...prev]);

    setEvents((prev) => [
      {
        id: `EVT-${Date.now()}`,
        type: "TASK_CREATED",
        title: `New Work Item ${createdItem.code} created`,
        descriptionTechnical: `Work Item created with initial state [BACKLOG] by ${currentUser.name} (${currentUser.role}).`,
        descriptionManagement: `Tugas baru ${createdItem.code} (${createdItem.title}) telah ditambahkan ke backlog.`,
        actor: currentUser.name,
        source: "SPRINT_MANAGER",
        evidenceRef: createdItem.code,
        projectId: activeProject.id,
        timestamp: "Just now"
      },
      ...prev
    ]);
  };

  // Handlers for Ticketing
  const handleUpdateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    if (newStatus === "RESOLVED" || newStatus === "CLOSED") {
      if (!checkRBAC("PERM_TICKET_RESOLVE", "Tutup/Selesaikan Tiket", "Tech Lead / QA / PM")) {
        return;
      }
    } else {
      if (!checkRBAC("PERM_TICKET_UPDATE", "Ubah Status Tiket", "Support / QA / Dev")) {
        return;
      }
    }

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      setEvents((prev) => [
        {
          id: `EVT-${Date.now()}`,
          type: newStatus === "RESOLVED" ? "TICKET_RESOLVED" : "TICKET_UPDATED",
          title: `Ticket ${ticket.code} status changed to ${newStatus}`,
          descriptionTechnical: `Ticket state updated to ${newStatus} with SLA status [${ticket.slaStatus}] by ${currentUser.name}.`,
          descriptionManagement: `Status tiket ${ticket.code} diperbarui ke ${newStatus}.`,
          actor: currentUser.name,
          source: "ITSM_ENGINE",
          evidenceRef: ticket.code,
          projectId: currentProject.id,
          timestamp: "Just now"
        },
        ...prev
      ]);
    }
  };

  const handleCreateTicket = (newTicket: Partial<Ticket>) => {
    if (!checkRBAC("PERM_TICKET_CREATE", "Buat Tiket ITSM Baru", "Semua Pengguna Terdaftar")) {
      return;
    }

    const nextCode = `TK-2026-${String(tickets.length + 183).padStart(4, "0")}`;
    const ticket: Ticket = {
      title: newTicket.title || "Untitled Ticket",
      description: newTicket.description || "",
      type: newTicket.type || "BUG",
      category: newTicket.category || "General",
      severity: newTicket.severity || "Minor",
      priority: newTicket.priority || "P3",
      status: newTicket.status || "NEW",
      projectId: newTicket.projectId || activeProject.id,
      assignee: newTicket.assignee || currentUser,
      id: `tk-${Date.now()}`,
      code: nextCode,
      slaStatus: "ON_TRACK",
      slaTargetResolution: "4 hours",
      slaRemainingMinutes: 240,
      evidence: [],
      createdAt: "Just now",
      reporter: currentUser.name
    };

    setTickets((prev) => [ticket, ...prev]);

    setEvents((prev) => [
      {
        id: `EVT-${Date.now()}`,
        type: "TICKET_CREATED",
        title: `New Ticket logged: ${ticket.code}`,
        descriptionTechnical: `ITSM engine registered ${ticket.type} with priority [${ticket.priority}] by ${currentUser.name}.`,
        descriptionManagement: `Tiket baru ${ticket.code} (${ticket.title}) dibuat dengan prioritas ${ticket.priority}.`,
        actor: currentUser.name,
        source: "ITSM_ENGINE",
        evidenceRef: ticket.code,
        projectId: currentProject.id,
        timestamp: "Just now"
      },
      ...prev
    ]);
  };

  // Handlers for Incidents
  const handleDeclareIncident = async (newInc: Partial<Incident>) => {
    if (!checkRBAC("PERM_INCIDENT_DECLARE", "Deklarasikan Insiden Kritis (War Room)", "Tech Lead / PM / Super Admin")) {
      return;
    }

    try {
      // Call authenticated backend action endpoint
      const response = await authFetch("/api/actions/declare-incident", {
        method: "POST",
        body: JSON.stringify({
          title: newInc.title,
          severity: newInc.severity,
          impact: newInc.impact,
          environment: newInc.environment
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setRbacDenial({
          isOpen: true,
          requiredPermission: "PERM_INCIDENT_DECLARE",
          actionName: `Deklarasi Insiden (${errData.error || "Akses Ditolak"})`
        });
        return;
      }
    } catch (e) {
      console.warn("Backend auth call warning:", e);
    }

    const nextCode = `INC-${String(incidents.length + 43).padStart(5, "0")}`;
    const incident: Incident = {
      title: newInc.title || "Critical Service Outage",
      severity: newInc.severity || "CRITICAL",
      impact: newInc.impact || "Degraded core services",
      environment: newInc.environment || "Production",
      server: newInc.server || "Kontabo VPS Node 1",
      id: `inc-${Date.now()}`,
      code: nextCode,
      detectedAt: "Just now",
      commander: newInc.commander || currentUser.name,
      status: "INVESTIGATING",
      timeline: [
        {
          time: "Just now",
          event: `Incident declared via War Room by ${currentUser.name} (${currentUser.role}): ${newInc.title}`,
          actor: currentUser.name,
          type: "alert"
        }
      ]
    };

    setIncidents((prev) => [incident, ...prev]);

    setEvents((prev) => [
      {
        id: `EVT-${Date.now()}`,
        type: "INCIDENT_TRIGGERED",
        title: `CRITICAL WAR ROOM: ${incident.code} Declared`,
        descriptionTechnical: `Severity ${incident.severity} incident opened for server ${incident.server}. War room active under Commander ${incident.commander}.`,
        descriptionManagement: `Insiden operasional (${incident.title}) sedang dalam penanganan intensif tim engineering.`,
        actor: currentUser.name,
        source: "WAR_ROOM",
        evidenceRef: incident.code,
        projectId: currentProject.id,
        timestamp: "Just now"
      },
      ...prev
    ]);
  };

  const handleUpdateIncidentStatus = (incidentId: string, newStatus: Incident["status"]) => {
    if (!checkRBAC("PERM_INCIDENT_COMMAND", "Ubah Status Insiden War Room", "Tech Lead / Incident Commander")) {
      return;
    }

    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: newStatus } : inc))
    );
  };

  const handleAddIncidentTimeline = (
    incidentId: string,
    event: { time: string; event: string; actor: string; type?: "alert" | "action" | "mitigation" | "resolution" }
  ) => {
    if (!checkRBAC("PERM_INCIDENT_COMMAND", "Tambah Timeline Insiden", "Tech Lead / Incident Commander")) {
      return;
    }

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            timeline: [
              ...inc.timeline,
              {
                time: event.time || "Just now",
                event: event.event,
                actor: event.actor || currentUser.name,
                type: event.type || "action"
              }
            ]
          };
        }
        return inc;
      })
    );
  };

  // Handlers for AI Finding & Scans
  const handleUpdateFindingStatus = (findingId: string, newStatus: AIFinding["status"]) => {
    setAiFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, status: newStatus } : f))
    );
  };

  const handleConvertRecommendationToWorkItem = (rec: AIRecommendation) => {
    if (!checkRBAC("PERM_WORK_ITEM_CREATE", "Konversi Rekomendasi AI ke Work Item", "Developer / Tech Lead / PM")) {
      return;
    }

    const nextNumber = workItems.length + 26;
    const code = `${activeProject.key}-${String(nextNumber).padStart(3, "0")}`;

    const newWorkItem: WorkItem = {
      id: `item-${Date.now()}`,
      code,
      title: `[AI Refactor] ${rec.title}`,
      description: `Rekomendasi otomatis dari AI Codebase Intel: ${rec.reason}\n\nDampak yang diharapkan: ${rec.expectedImpact}`,
      type: "REFACTOR",
      status: "BACKLOG",
      priority: "Medium",
      projectId: activeProject.id,
      assignee: currentUser,
      sprintId: activeProject.currentSprint || "Sprint 04",
      estimateHours: 6,
      actualHours: 0,
      acceptanceCriteria: [
        { id: `ac-1`, text: "Implement suggested remediation from AI findings", completed: false },
        { id: `ac-2`, text: "Verify with unit test and profile query performance", completed: false }
      ],
      dependencies: [],
      evidence: [
        {
          id: `ev-ai-${Date.now()}`,
          type: "AI_SCAN",
          title: "AI Neural Recommendation Proof",
          source: "WORKSTATION_AI",
          sourceId: rec.id,
          timestamp: "Just now",
          confidence: rec.confidence,
          verificationStatus: "SYSTEM_VERIFIED",
          details: `Target: ${rec.affectedModule}`
        }
      ],
      createdAt: "Just now",
      updatedAt: "Just now"
    };

    setWorkItems((prev) => [newWorkItem, ...prev]);
    setAiRecommendations((prev) =>
      prev.map((r) => (r.id === rec.id ? { ...r, convertedToWorkItem: code } : r))
    );

    setEvents((prev) => [
      {
        id: `EVT-${Date.now()}`,
        type: "TASK_CREATED",
        title: `AI Recommendation converted to ${code}`,
        descriptionTechnical: `Auto-generated work item from AI Codebase Recommendation with baseline confidence ${rec.confidence}%.`,
        descriptionManagement: `Peluang optimasi kode (${rec.title}) telah dimasukkan ke daftar rencana kerja tim.`,
        actor: currentUser.name,
        source: "AI_ENGINE",
        evidenceRef: code,
        projectId: currentProject.id,
        timestamp: "Just now"
      },
      ...prev
    ]);
  };

  const handleRunScan = async (focusArea?: string) => {
    if (!checkRBAC("PERM_AI_SCAN_TRIGGER", "Jalankan AI Deep Codebase Scan", "Developer / Tech Lead / Super Admin")) {
      return;
    }

    try {
      const response = await authFetch("/api/ai/scan", {
        method: "POST",
        body: JSON.stringify({
          projectName: currentProject.name,
          focusArea: focusArea || "Full Architecture, Security, Performance"
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          setRbacDenial({
            isOpen: true,
            requiredPermission: "PERM_AI_SCAN_TRIGGER",
            actionName: "Deep Codebase AI Scan"
          });
          return;
        }
        throw new Error("Scan request rejected by server");
      }

      const data = await response.json();
      // SEC-05 (Story 8.3): preserve integrity mode so UI can label demo data honestly
      setAiScanMode(typeof data.mode === "string" ? data.mode : "LIVE_ANALYSIS");
      if (data.findings && Array.isArray(data.findings)) {
        const newFindings: AIFinding[] = data.findings.map((f: any, idx: number) => ({
          id: `FND-${Date.now()}-${idx}`,
          scanId: `SCN-${Date.now()}`,
          category: f.category || "Architecture",
          severity: f.severity || "Medium",
          title: f.title || "Discovered Code Quality Issue",
          affectedFile: f.affectedFile || "app/Http/Controllers/OrderController.php",
          evidence: f.evidence || "Identified pattern in code snippet",
          impact: f.impact || "Potential latency degradation",
          suggestedRemediation: f.suggestedRemediation || "Refactor to use eager loading",
          confidence: f.confidence || 90,
          status: "PENDING",
          detectedAt: "Just now"
        }));

        setAiFindings((prev) => [...newFindings, ...prev]);

        setEvents((prev) => [
          {
            id: `EVT-${Date.now()}`,
            type: "AI_SCAN_COMPLETED",
            title: `AI Code Scan completed (${newFindings.length} findings)`,
            descriptionTechnical: `Gemini scanner analyzed code AST, generating ${newFindings.length} new advisory findings.`,
            descriptionManagement: `Pemeriksaan otomatis kualitas kode berhasil mendeteksi ${newFindings.length} potensi peningkatan.`,
            actor: `${currentUser.name} (via AI Engine)`,
            source: "AI_ENGINE",
            evidenceRef: `SCAN-${Date.now()}`,
            projectId: currentProject.id,
            timestamp: "Just now"
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error("Scan error:", err);
    }
  };

  const handleTriggerRollback = async (depId: string) => {
    if (!checkRBAC("PERM_DEPLOYMENT_ROLLBACK", "Eksekusi Emergency Deployment Rollback", "Tech Lead / Super Admin")) {
      return;
    }

    const dep = deployments.find((d) => d.id === depId);
    if (!dep) return;

    try {
      const res = await authFetch("/api/actions/rollback", {
        method: "POST",
        body: JSON.stringify({
          deploymentId: dep.id,
          targetVersion: "v1.4.1",
          server: dep.server
        })
      });

      if (!res.ok) {
        setRbacDenial({
          isOpen: true,
          requiredPermission: "PERM_DEPLOYMENT_ROLLBACK",
          requiredRole: "Tech Lead / Super Admin",
          actionName: `Rollback Deployment ${dep.code}`
        });
        return;
      }
    } catch (e) {
      console.warn("Rollback API warning:", e);
    }

    setDeployments((prev) =>
      prev.map((d) => (d.id === depId ? { ...d, status: "ROLLED_BACK" as const } : d))
    );

    setEvents((prev) => [
      {
        id: `EVT-${Date.now()}`,
        type: "RELEASE_CREATED",
        title: `Emergency Rollback authorized for ${dep.code}`,
        descriptionTechnical: `Authorized rollback of ${dep.version} on ${dep.server} executed by ${currentUser.name} (${currentUser.role}).`,
        descriptionManagement: `Pemulihan versi sistem sebelumnya diaktifkan pada server untuk menjaga kestabilan transaksi.`,
        actor: currentUser.name,
        source: "DEPLOYER",
        evidenceRef: dep.code,
        projectId: currentProject.id,
        timestamp: "Just now"
      },
      ...prev
    ]);
  };

  // Dedicated Professional Auth Gateway (Story 1.4 & ADR-003)
  // When unauthenticated, render the full-screen LoginView rather than auto-opening the dashboard
  if (!session || !session.user) {
    return (
      <LoginView
        onLoginSuccess={() => {
          const freshSession = authManager.getSession();
          setSession(freshSession);
          if (freshSession?.user) {
            setCurrentUser(freshSession.user);
          }
        }}
      />
    );
  }

  return (
    <RetroDesktopShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      projectName={activeProject.name}
      projectKey={activeProject.key}
      userName={currentUser.name}
      onOpenSearch={() => setIsSearchOpen(true)}
    >
      {/* Top Application Bar */}
      <Header
        currentProject={activeProject}
        projects={projects}
        onSelectProject={setCurrentProject}
        isManagementView={isManagementView}
        onToggleView={() => setIsManagementView(!isManagementView)}
        onOpenSearch={() => setIsSearchOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setActiveTab("security")}
        onLogout={async () => {
          await authManager.logout();
          setSession(null);
        }}
        onTriggerAIScanModal={() => setActiveTab("ai")}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
      />

      {/* Main Body: Sidebar + Dynamic Content Canvas */}
      <div className="flex-1 flex flex-row overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          openTicketsCount={projectTickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length}
          criticalIncidentsCount={projectIncidents.filter((i) => i.severity === "CRITICAL").length}
          aiFindingsCount={aiFindings.filter((f) => f.status === "PENDING").length}
          isManagementView={isManagementView}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto w-full pb-20 lg:pb-6">
          {activeTab === "overview" && (
            <OverviewView
              projects={projects.map((p) => (p.id === activeProject.id ? activeProject : p))}
              events={events}
              servers={servers}
              isManagementView={isManagementView}
              onSelectProject={setCurrentProject}
              onNavigateTab={(tab: any) => setActiveTab(tab)}
            />
          )}

          {activeTab === "project360" && (
            <Project360View
              project={activeProject}
              workItems={projectWorkItems}
              tickets={projectTickets}
              deployments={projectDeployments}
              isManagementView={isManagementView}
              onNavigateTab={(tab: any) => setActiveTab(tab)}
            />
          )}

          {activeTab === "workitems" && (
            <WorkItemsView
              workItems={projectWorkItems}
              project={activeProject}
              onUpdateWorkItemStatus={handleUpdateWorkItemStatus}
              onToggleAcceptanceCriteria={handleToggleAcceptanceCriteria}
              onAddEvidence={handleAddEvidence}
              onCreateWorkItem={handleCreateWorkItem}
              isManagementView={isManagementView}
            />
          )}

          {activeTab === "tickets" && (
            <TicketingView
              tickets={projectTickets}
              incidents={projectIncidents}
              project={activeProject}
              currentUser={currentUser}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              onCreateTicket={handleCreateTicket}
              isManagementView={isManagementView}
            />
          )}

          {activeTab === "incidents" && (
            <IncidentRoomView
              incidents={projectIncidents}
              project={activeProject}
              currentUser={currentUser}
              onDeclareIncident={handleDeclareIncident}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              onAddTimelineEvent={handleAddIncidentTimeline}
              onNavigateTab={(tab: any, entityId?: string) => setActiveTab(tab)}
              isManagementView={isManagementView}
            />
          )}

          {activeTab === "git" && (
            <GitIntelligenceView
              commits={projectCommits}
              pullRequests={projectPullRequests}
              project={activeProject}
              isManagementView={isManagementView}
            />
          )}

          {activeTab === "deployments" && (
            <DeploymentsView
              deployments={projectDeployments}
              project={activeProject}
              onTriggerRollback={handleTriggerRollback}
              isManagementView={isManagementView}
            />
          )}

          {activeTab === "infrastructure" && (
            <InfrastructureView
              servers={servers}
              onRefreshTelemetry={() => {
                setServers((prev: ServerTelemetry[]) =>
                  prev.map((s: ServerTelemetry) => ({
                    ...s,
                    cpuUsage: Math.floor(15 + Math.random() * 25),
                    lastHeartbeat: "Just now"
                  }))
                );
              }}
              isManagementView={isManagementView}
            />
          )}

          {activeTab === "ai" && (
            <AIIntelligenceView
              findings={aiFindings}
              scanMode={aiScanMode}
              recommendations={aiRecommendations}
              technicalDebts={technicalDebts}
              project={activeProject}
              onUpdateFindingStatus={handleUpdateFindingStatus}
              onConvertRecommendationToWorkItem={handleConvertRecommendationToWorkItem}
              onRunScan={handleRunScan}
              isManagementView={isManagementView}
            />
          )}

          {activeTab === "reports" && (
            <ReportsView
              project={activeProject}
              isManagementView={isManagementView}
              onToggleView={() => setIsManagementView(!isManagementView)}
              workItems={workItems}
              deployments={deployments}
              incidents={incidents}
              commits={commits}
              pullRequests={pullRequests}
              tickets={tickets}
              servers={servers}
            />
          )}

          {activeTab === "blueprint" && <BlueprintView />}

          {activeTab === "knowledge" && (
            <KnowledgeBaseView articles={articles} isManagementView={isManagementView} />
          )}

          {activeTab === "audit" && (
            <AuditLogView events={events} isManagementView={isManagementView} />
          )}

          {activeTab === "security" && (
            <SecurityView
              currentSession={session}
              onLogout={async () => {
                await authManager.logout();
                setSession(null);
              }}
              isManagementView={isManagementView}
            />
          )}
        </main>
      </div>

      {/* Global Search Modal (Cmd+K / Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        workItems={workItems}
        tickets={tickets}
        deployments={deployments}
        incidents={incidents}
        commits={commits}
        onNavigate={(tab: any) => {
          setActiveTab(tab);
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
        openTicketsCount={projectTickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length}
      />

      {/* 403 Forbidden RBAC Denial Modal */}
      <RBACDenialModal
        isOpen={rbacDenial.isOpen}
        onClose={() => setRbacDenial({ isOpen: false })}
        currentUser={currentUser}
        requiredPermission={rbacDenial.requiredPermission}
        requiredRole={rbacDenial.requiredRole}
        actionName={rbacDenial.actionName}
        onOpenAuthModal={() => {
          setRbacDenial({ isOpen: false });
          setActiveTab("security");
        }}
      />
    </RetroDesktopShell>
  );
}
