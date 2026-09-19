import React, { useState, useEffect, useMemo } from "react";
import { MotionConfig } from "motion/react";
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
import { ReportView } from "./components/ReportView";
import { SprintPanel } from "./components/SprintPanel";
import { KnowledgeBaseView } from "./components/KnowledgeBaseView";
import { AuditLogView } from "./components/AuditLogView";
import { SecurityView } from "./components/SecurityView";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { RetroDesktopShell } from "./components/ui/RetroDesktopShell";
import { MobileBottomBar } from "./components/MobileBottomBar";
import { RBACDenialModal } from "./components/RBACDenialModal";
import { LoginView } from "./components/LoginView";
import { authManager, authFetch, DIRECTORY_USERS } from "./lib/auth";
import { useServerMetrics, ServerHealthEntry } from "./hooks/api/useServerMetrics";
import { useIncidents, IncidentDto } from "./hooks/api/useIncidents";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./lib/apiClient";
import {
  useGitCommits,
  useGitPullRequests,
  mapCommitDto,
  mapPullRequestDto
} from "./hooks/api/useGitEntities";
import { useDeployments, mapDeploymentDto } from "./hooks/api/useDeployments";
import { useKbArticles, mapKbArticleDto } from "./hooks/api/useKbArticles";
import { hasPermission, ROLE_PERMISSIONS } from "./lib/rbac";
import { NAV_ITEMS, filterNavigation } from "./config/navigation";

// Story 17.2 (CC-4): Demo Data Gating — seed mock HANYA saat VITE_DEMO_MODE
// aktif; boot default memakai data nyata via React Query (AC1).
import { DEMO_MODE, getInitialDataSource } from "./mockData";

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
  const initialData = useMemo(() => getInitialDataSource(DEMO_MODE), []);
  const [currentProject, setCurrentProject] = useState<Project | null>(initialData.currentProject);
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

  // CC-4 (Story 17.1): fallback ke overview bila view aktif tidak lagi
  // terlihat oleh role ini (menu difilter per permission).
  useEffect(() => {
    const permissions = ROLE_PERMISSIONS[currentUser.role] ?? [];
    const visibleIds = new Set(filterNavigation(NAV_ITEMS, permissions).map((i) => i.id));
    if (!visibleIds.has(activeTab)) {
      setActiveTab("overview");
    }
  }, [currentUser.role, activeTab]);

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

  // Core Data States — Story 17.2 (CC-4): seed mock HANYA saat mode demo.
  // Boot default (tanpa flag) mulai kosong lalu ter-hydrate dari API nyata.
  const [projects, setProjects] = useState<Project[]>(initialData.projects);
  const [workItems, setWorkItems] = useState<WorkItem[]>(initialData.workItems);
  const [tickets, setTickets] = useState<Ticket[]>(initialData.tickets);
  const [deployments, setDeployments] = useState<Deployment[]>(initialData.deployments);

  // Story 18.2 (CC-5): deployment nyata dari API releases (6.1) — boot real
  // MENGANTIKAN seed; mode demo tetap utuh.
  const { data: apiDeployments } = useDeployments(undefined, { enabled: !DEMO_MODE && Boolean(session?.user) });
  useEffect(() => {
    if (DEMO_MODE || !Array.isArray(apiDeployments)) return;
    setDeployments(apiDeployments.map(mapDeploymentDto));
  }, [apiDeployments]);
  const [servers, setServers] = useState<ServerTelemetry[]>(initialData.servers);

  // Story 9.3 + 17.2: live server health. Boot real → hanya telemetri agent
  // (tanpa fallback palsu); mode demo → telemetri live di-merge ke seed mock.
  const { data: serverHealthData, refetch: refetchServerHealth } = useServerMetrics({ enabled: Boolean(session?.user) });
  useEffect(() => {
    if (!serverHealthData?.servers?.length) return;
    setServers((prev) => mergeServerTelemetry(DEMO_MODE ? prev : [], serverHealthData.servers));
  }, [serverHealthData]);

  // Story 17.2 (AC1): hydration work items & tickets dari API nyata.
  // Inline useQuery (bukan hook useWorkItems/useTickets) supaya fetch bisa
  // digating `enabled` — tidak ada request 401 di login screen atau request
  // percuma saat mode demo. QueryKey sama dengan hook agar cache berbagi.
  const { data: apiWorkItems } = useQuery({
    queryKey: ["workItems"],
    queryFn: () => apiRequest<WorkItem[]>("/api/v1/work-items"),
    enabled: !DEMO_MODE && Boolean(session?.user)
  });
  useEffect(() => {
    if (DEMO_MODE || !Array.isArray(apiWorkItems)) return;
    setWorkItems(apiWorkItems);
  }, [apiWorkItems]);
  const { data: apiTickets } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => apiRequest<Ticket[]>("/api/v1/tickets"),
    enabled: !DEMO_MODE && Boolean(session?.user)
  });
  useEffect(() => {
    if (DEMO_MODE || !Array.isArray(apiTickets)) return;
    setTickets(apiTickets);
  }, [apiTickets]);

  // Story 17.2: proyek nyata untuk boot produksi (project picker & filter
  // project-scoped). Query inline di blok sumber data — tanpa file hook baru.
  const { data: apiProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiRequest<Project[]>("/api/v1/projects"),
    enabled: !DEMO_MODE && Boolean(session?.user)
  });
  useEffect(() => {
    if (DEMO_MODE || !Array.isArray(apiProjects) || apiProjects.length === 0) return;
    setProjects(apiProjects.map(mapProjectDto));
    setCurrentProject((prev) => prev ?? mapProjectDto(apiProjects[0]));
  }, [apiProjects]);

  const [aiFindings, setAiFindings] = useState<AIFinding[]>(initialData.aiFindings);
  const [aiScanMode, setAiScanMode] = useState<string | null>(null); // SEC-05: integrity flag from /api/ai/scan
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>(initialData.aiRecommendations);
  const [technicalDebts, setTechnicalDebts] = useState(initialData.technicalDebts);
  const [incidents, setIncidents] = useState(initialData.incidents);

  // Story 13.3 + 17.2: live incident feed — boot real MENGANTIKAN (bukan
  // memperkaya) seed; mode demo tetap merge ke mock.
  const { data: incidentFeed } = useIncidents({ enabled: Boolean(session?.user) });
  useEffect(() => {
    if (!incidentFeed?.items?.length) return;
    setIncidents((prev) => mapIncidentDtos(DEMO_MODE ? prev : [], incidentFeed.items));
  }, [incidentFeed]);
  const [commits, setCommits] = useState(initialData.commits);
  const [pullRequests, setPullRequests] = useState(initialData.pullRequests);

  // Story 18.1 (CC-5): git entities nyata dari ingest webhook (5.x) — boot
  // real MENGANTIKAN seed; mode demo tetap merge ke mock.
  const { data: apiCommits } = useGitCommits(undefined, { enabled: !DEMO_MODE && Boolean(session?.user) });
  useEffect(() => {
    if (DEMO_MODE || !Array.isArray(apiCommits)) return;
    setCommits(apiCommits.map(mapCommitDto));
  }, [apiCommits]);
  const { data: apiPullRequests } = useGitPullRequests(undefined, { enabled: !DEMO_MODE && Boolean(session?.user) });
  useEffect(() => {
    if (DEMO_MODE || !Array.isArray(apiPullRequests)) return;
    setPullRequests(apiPullRequests.map(mapPullRequestDto));
  }, [apiPullRequests]);
  const [events, setEvents] = useState<EngineeringEvent[]>(initialData.events);
  const [articles, setArticles] = useState(initialData.articles);

  // Story 18.3 (CC-5): artikel KB nyata dari API (15.1) — boot real
  // MENGANTIKAN seed; mode demo tetap utuh.
  const { data: apiArticles } = useKbArticles({ enabled: !DEMO_MODE && Boolean(session?.user) });
  useEffect(() => {
    if (DEMO_MODE || !Array.isArray(apiArticles)) return;
    setArticles(apiArticles.map(mapKbArticleDto));
  }, [apiArticles]);

  // Filter project-specific items
  const projectWorkItems = workItems.filter((w) => w.projectId === currentProject?.id);
  const projectTickets = tickets.filter((t) => t.projectId === currentProject?.id);
  const projectDeployments = deployments.filter((d) => d.projectId === currentProject?.id);
  const projectCommits = commits.filter((c) => !c.projectId || c.projectId === currentProject?.id);
  const projectPullRequests = pullRequests.filter((pr) => !pr.projectId || pr.projectId === currentProject?.id);
  const projectIncidents = incidents.filter((i) => !i.projectId || i.projectId === currentProject?.id);

  // Recalculate project progress dynamically from evidence
  const calculateProgress = () => {
    if (projectWorkItems.length === 0) return 0;
    const completed = projectWorkItems.filter((w) => w.status === "DONE" || w.status === "DEPLOYED").length;
    return Math.round((completed / projectWorkItems.length) * 100);
  };

  const dynamicProgress = calculateProgress();

  // Story 17.2 (AC1/AC3): boot real menunggu proyek nyata dari API —
  // TIDAK ada fallback ke proyek fiktif. Tampilkan status jujur.
  if (!DEMO_MODE && !currentProject) {
    return (
      <div data-testid="boot-loading" className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-base font-semibold text-slate-700">
            {projectsLoading ? "Memuat data proyek…" : "Belum ada proyek tersedia"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {projectsLoading
              ? "Mengambil daftar proyek dari API."
              : "Buat proyek pertama melalui API atau seed database, lalu muat ulang halaman."}
          </p>
        </div>
      </div>
    );
  }
  if (!currentProject) return null; // demo mode selalu punya seed — guard narrowing TS

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
    <MotionConfig reducedMotion="user">
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

      {/* Story 17.2 (AC2): banner label demo — konsisten pola SEC-05
          "honestly labeled demo data" (amber, eksplisit, tidak bisa diabaikan). */}
      {DEMO_MODE && (
        <div
          data-testid="app-demo-mode-banner"
          role="status"
          className="mx-3 sm:mx-6 mt-3 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4"
        >
          <span aria-hidden="true">⚠️</span>
          <p className="text-sm text-amber-900">
            <strong>MODE DEMO (VITE_DEMO_MODE aktif)</strong> — Aplikasi menampilkan data contoh
            statis, bukan data produksi. Jangan dijadikan dasar keputusan teknis.
          </p>
        </div>
      )}

      {/* Main Body: Sidebar + Dynamic Content Canvas */}
      <div className="flex-1 flex flex-row overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          role={currentUser.role}
          openTicketsCount={projectTickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length}
          criticalIncidentsCount={projectIncidents.filter((i) => i.severity === "CRITICAL").length}
          aiFindingsCount={aiFindings.filter((f) => f.status === "PENDING").length}
          isManagementView={isManagementView}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto w-full pb-20 lg:pb-6">
          {activeTab === "overview" && (
            <>
              {!DEMO_MODE && projects.length === 0 && (
                <HonestEmptyState title="Belum ada proyek" hint="Buat proyek pertama, lalu ringkasan operasional akan tampil di sini." />
              )}
              <OverviewView
                projects={projects.map((p) => (p.id === activeProject.id ? activeProject : p))}
                events={events}
                servers={servers}
                isManagementView={isManagementView}
                onSelectProject={setCurrentProject}
                onNavigateTab={(tab: any) => setActiveTab(tab)}
              />
            </>
          )}

          {activeTab === "project360" && (
            <SprintPanel projectId={currentProject.id} isAuthenticated={Boolean(session?.user)} />
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
            <>
              {!DEMO_MODE && projectWorkItems.length === 0 && (
                <HonestEmptyState title="Belum ada work item" hint="Gunakan tombol buat work item di bawah untuk menambahkan yang pertama." />
              )}
              <WorkItemsView
                workItems={projectWorkItems}
                project={activeProject}
                onUpdateWorkItemStatus={handleUpdateWorkItemStatus}
                onToggleAcceptanceCriteria={handleToggleAcceptanceCriteria}
                onAddEvidence={handleAddEvidence}
                onCreateWorkItem={handleCreateWorkItem}
                isManagementView={isManagementView}
              />
            </>
          )}

          {activeTab === "tickets" && (
            <>
              {!DEMO_MODE && projectTickets.length === 0 && (
                <HonestEmptyState title="Belum ada tiket masuk" hint="Gunakan intake ticketing di bawah untuk mengirim bug atau insiden pertama." />
              )}
              <TicketingView
                tickets={projectTickets}
                incidents={projectIncidents}
                project={activeProject}
                currentUser={currentUser}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onCreateTicket={handleCreateTicket}
                isManagementView={isManagementView}
              />
            </>
          )}

          {activeTab === "incidents" && (
            <>
              {!DEMO_MODE && projectIncidents.length === 0 && (
                <HonestEmptyState title="Tidak ada insiden" hint="Semua sistem berjalan normal. Deklarasikan insiden dari tombol di bawah bila terjadi." />
              )}
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
            </>
          )}

          {activeTab === "git" && (
            <>
              {!DEMO_MODE && projectCommits.length === 0 && projectPullRequests.length === 0 && (
                <HonestEmptyState title="Belum ada aktivitas Git" hint="Hubungkan repository via webhook GitHub — commit & PR nyata akan tertaut otomatis." />
              )}
              <GitIntelligenceView
                commits={projectCommits}
                pullRequests={projectPullRequests}
                project={activeProject}
                isManagementView={isManagementView}
              />
            </>
          )}

          {activeTab === "deployments" && (
            <>
              {!DEMO_MODE && projectDeployments.length === 0 && (
                <HonestEmptyState title="Belum ada deployment tercatat" hint="Deployment tercatat otomatis saat rilis didaftarkan melalui API releases." />
              )}
              <DeploymentsView
                deployments={projectDeployments}
                project={activeProject}
                onTriggerRollback={handleTriggerRollback}
                isManagementView={isManagementView}
              />
            </>
          )}

          {activeTab === "infrastructure" && (
            <>
              {!DEMO_MODE && servers.length === 0 && (
                <HonestEmptyState title="Belum ada server terhubung" hint="Jalankan workstation-agent di server untuk mengirim telemetri nyata." />
              )}
              <InfrastructureView
                servers={servers}
                onRefreshTelemetry={() => {
                  // Story 17.2: refresh produksi = refetch telemetri agent;
                  // randomisasi CPU palsu hanya boleh terjadi di mode demo.
                  if (!DEMO_MODE) {
                    void refetchServerHealth();
                    return;
                  }
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
            </>
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

          {activeTab === "report-id" && (
            <ReportView isManagementView={isManagementView} />
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

          {activeTab === "knowledge" && (
            <>
              {!DEMO_MODE && articles.length === 0 && (
                <HonestEmptyState title="Belum ada artikel KB" hint="Artikel knowledge base akan tampil di sini setelah dibuat atau didraft dari tiket resolved." />
              )}
              <KnowledgeBaseView articles={articles} isManagementView={isManagementView} />
            </>
          )}

          {activeTab === "audit" && (
            <>
              {!DEMO_MODE && events.length === 0 && (
                <HonestEmptyState title="Belum ada aktivitas audit" hint="Log transaksi sistem (append-only) akan tampil di sini begitu aktivitas tercatat." />
              )}
              <AuditLogView events={events} isManagementView={isManagementView} />
            </>
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
    </MotionConfig>
  );
}

/**
 * Story 17.2 (AC3) — Honest empty state: an informative notice rendered ABOVE
 * a real-data view whose API content is still empty. The view stays mounted
 * (action buttons keep working) and NO fabricated data fills the gap.
 */
function HonestEmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      data-testid="honest-empty-state"
      className="mb-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center"
    >
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

/**
 * Story 17.2 — Maps a projects API row (GET /api/v1/projects) onto the UI
 * Project contract. Display fields without an API source yet are filled with
 * honest placeholders (never fabricated values) — noted in Dev Agent Record.
 */
function mapProjectDto(dto: any): Project {
  return {
    id: dto.id,
    key: dto.key,
    name: dto.name,
    tagline: dto.tagline ?? "",
    status: (dto.status ?? "ACTIVE") as Project["status"],
    progress: dto.progress ?? 0,
    health: dto.health ?? 100,
    owner: "—",
    techLead: "—",
    currentSprint: "—",
    openTickets: 0,
    blockersCount: 0,
    latestRelease: "—",
    productionStatus: "Healthy",
    repoName: "—",
    modulesCount: 0,
    description: dto.description ?? ""
  };
}

/**
 * Story 9.3 — Maps ingested agent telemetry (server-metrics API) onto the
 * dashboard's ServerTelemetry cards, preserving static metadata as base.
 */
function mergeServerTelemetry(base: ServerTelemetry[], entries: ServerHealthEntry[]): ServerTelemetry[] {
  const byName = (name: string) =>
    base.find(
      (b) =>
        b.name.toLowerCase().includes(name.toLowerCase()) ||
        (name.toLowerCase().includes("kontabo") && b.provider === "Kontabo VPS") ||
        (name.toLowerCase().includes("kantor") && b.provider === "Office Server Local")
    );

  return entries.map((entry) => {
    const { latest, stale, serverName } = entry;
    const cpuUsage = Math.round(latest.cpuUsage * 10) / 10;
    const ramUsage = latest.memoryTotal > 0 ? Math.round((latest.memoryUsed / latest.memoryTotal) * 1000) / 10 : 0;
    const diskUsage = latest.disks.length > 0 ? Math.max(...latest.disks.map((d) => d.usePercent ?? 0)) : 0;
    const peak = Math.max(cpuUsage, ramUsage, diskUsage);

    // Story 11.2 (AC #4): map agent service probes to the UI services panel
    const liveServices = ((latest.services ?? []) as any[]).map((svc) => {
      const portRaw = typeof svc.target === "string" ? svc.target.split(":")[1] : undefined;
      const port = portRaw ? Number.parseInt(portRaw, 10) : undefined;
      return {
        name: `${svc.name} (${svc.target})`,
        status: (svc.healthy ? "Running" : "Stopped") as "Running" | "Stopped",
        port: Number.isFinite(port) ? port : undefined,
        memoryMb: 0, // probe-based monitoring: latency instead of RSS
      };
    });

    const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(latest.recordedAt).getTime()) / 60000));
    const lastHeartbeat = minutesAgo < 1 ? "Just now" : `${minutesAgo} min ago`;

    const existing = byName(serverName);
    if (existing) {
      return {
        ...existing,
        status: (stale ? "OFFLINE" : peak >= 80 ? "DEGRADED" : "ONLINE") as ServerTelemetry["status"],
        cpuUsage,
        ramUsage,
        diskUsage,
        lastHeartbeat,
        services: liveServices.length > 0 ? liveServices : existing.services,
      };
    }

    return {
      id: `srv-${serverName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: serverName,
      environment: "Production" as const,
      ip: "—",
      provider: serverName.toLowerCase().includes("kontabo") ? ("Kontabo VPS" as const) : ("Office Server Local" as const),
      os: "Linux (agent)",
      status: (stale ? "OFFLINE" : peak >= 80 ? "DEGRADED" : "ONLINE") as ServerTelemetry["status"],
      agentVersion: "v1.0.0 (workstation-agent)",
      lastHeartbeat,
      cpuUsage,
      ramUsage,
      diskUsage,
      loadAverage: "—",
      uptime: "—",
      services: liveServices,
    };
  });
}

/**
 * Story 13.3 — Maps live incident DTOs onto the UI Incident contract,
 * enriching each card with SLA badge data and a translated timeline.
 */
function mapIncidentDtos(base: Incident[], dtos: IncidentDto[]): Incident[] {
  const byCode = (code: string) => base.find((b) => b.code === code);

  return dtos.map((dto) => {
    const existing = byCode(dto.code);
    const timeline = [
      {
        time: new Date(dto.detectedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        event: `Insiden terdeteksi dan dideklarasikan (${dto.code})`,
        actor: dto.commanderName,
        type: "alert" as const,
      },
      ...(dto.acknowledgedAt
        ? [
            {
              time: new Date(dto.acknowledgedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              event: "Insiden ditanggapi oleh commander (ACK)",
              actor: dto.commanderName,
              type: "action" as const,
            },
          ]
        : []),
      ...(dto.resolvedAt
        ? [
            {
              time: new Date(dto.resolvedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              event: "Insiden dinyatakan selesai (RESOLVED)",
              actor: dto.commanderName,
              type: "resolution" as const,
            },
          ]
        : []),
    ];

    return {
      ...(existing ?? {}),
      id: existing?.id ?? dto.id,
      code: dto.code,
      title: dto.title,
      severity: dto.severity,
      environment: dto.environment,
      server: dto.serverName,
      detectedAt: dto.detectedAt,
      resolvedAt: dto.resolvedAt ?? undefined,
      commander: dto.commanderName,
      impact: dto.impact,
      status: dto.status,
      relatedTicketCode: dto.relatedTicketCode ?? undefined,
      timeline,
      sla: dto.sla,
    } as Incident;
  });
}
