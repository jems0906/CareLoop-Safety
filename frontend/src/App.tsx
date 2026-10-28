import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  ClipboardCheck,
  Download,
  FileClock,
  FileText,
  Gauge,
  Home,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Plus,
  RefreshCw,
  ShieldCheck,
  Signpost,
  UsersRound,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  api,
  type ActionRecord,
  type EquitySetting,
  type EventRecord,
  type MetricPoint,
  type ProjectRecord,
} from "./api";

type Section =
  | "overview"
  | "events"
  | "investigations"
  | "actions"
  | "improvement"
  | "measurement";
const sections: { id: Section; label: string; icon: typeof Home }[] = [
  { id: "overview", label: "Program overview", icon: LayoutDashboard },
  { id: "events", label: "Safety events", icon: FileClock },
  { id: "investigations", label: "Investigations", icon: CircleHelp },
  { id: "actions", label: "Action register", icon: ClipboardCheck },
  { id: "improvement", label: "Improvement project", icon: Signpost },
  { id: "measurement", label: "Measurement", icon: Gauge },
];
const sectionIds = sections.map((item) => item.id);
const settingOptions = [
  "all",
  "assisted living",
  "group home",
  "independent living",
];
const settingLabel = (setting: string) =>
  setting === "all" ? "All settings" : setting;
const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export default function App() {
  const [section, setSection] = useState<Section>(() => {
    const requested = window.location.hash.slice(1) as Section;
    return sectionIds.includes(requested) ? requested : "overview";
  });
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [equityData, setEquityData] = useState<EquitySetting[]>([]);
  const [setting, setSetting] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function refresh() {
    setError("");
    try {
      const [
        nextEvents,
        nextActions,
        nextProjects,
        nextMetrics,
        nextEquity,
      ] =
        await Promise.all([
          api.events(),
          api.actions(),
          api.projects(),
          api.metrics(setting),
          api.equity(),
        ]);
      setEvents(nextEvents);
      setActions(nextActions);
      setProjects(nextProjects);
      setMetrics(nextMetrics);
      setEquityData(nextEquity);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load program data",
      );
    } finally {
      setLoading(false);
    }
  }

  function navigateTo(next: Section) {
    setSection(next);
    if (window.location.hash !== `#${next}`) window.location.hash = next;
  }

  useEffect(() => {
    void refresh();
  }, [setting]);
  useEffect(() => {
    const syncHash = () => {
      const requested = window.location.hash.slice(1) as Section;
      setSection(sectionIds.includes(requested) ? requested : "overview");
    };
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  const project = projects[0];
  const selected = events.find((event) => event.id === selectedEvent) ?? null;
  const eligible = metrics.reduce((sum, row) => sum + row.eligible, 0);
  const timely = metrics.reduce((sum, row) => sum + row.timely, 0);
  const processRate = eligible ? Math.round((timely / eligible) * 100) : 0;
  const overdue = actions.filter(
    (action) =>
      !["effective", "ineffective"].includes(action.state) &&
      action.due_date < new Date().toISOString().slice(0, 10),
  ).length;

  async function perform(task: () => Promise<unknown>) {
    try {
      setError("");
      await task();
      await refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The requested change could not be saved",
      );
    }
  }

  return (
    <div className="app-shell">
      <header className="synthetic-banner">
        <ShieldCheck size={15} strokeWidth={2.2} />
        <span>Fictional training workspace</span>
        <i />
        <span>No real people, patient records, or clinical protocols</span>
      </header>
      <div className="workspace">
        <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
          <div className="brand">
            <div className="brand-mark">
              <Activity size={21} />
            </div>
            <div>
              <strong>careloop</strong>
              <span>SAFETY PROGRAM</span>
            </div>
            <button
              className="icon-button mobile-close"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="nav-caption">WORKSPACE</div>
          <nav aria-label="Main navigation">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`nav-item ${section === id ? "active" : ""}`}
                onClick={() => {
                  navigateTo(id);
                  setMobileNavOpen(false);
                }}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {id === "events" && <small>{events.length}</small>}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-project">
              <span className="status-dot" />
              <div>
                <small>ACTIVE CASE</small>
                <strong>Checklist reliability</strong>
                <span>12-week synthetic pilot</span>
              </div>
            </div>
            <button className="nav-item" onClick={() => setAdminOpen(true)}>
              <KeyRound size={17} />
              <span>Admin access</span>
              <LockKeyhole size={13} className="nav-lock" />
            </button>
            <div className="profile-row">
              <div className="avatar">CL</div>
              <div>
                <strong>Demo workspace</strong>
                <span>Read-only access</span>
              </div>
              <button
                title="Refresh data"
                aria-label="Refresh data"
                className="icon-button"
                onClick={() => void refresh()}
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
        </aside>

        {mobileNavOpen && (
          <button
            className="mobile-scrim"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
        )}
        <main className="main-area">
          <header className="topbar">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={19} />
            </button>
            <div className="breadcrumb">
              CareLoop <span>/</span>{" "}
              {sections.find((item) => item.id === section)?.label}
            </div>
            <div className="topbar-right">
              <span className="pilot-chip">
                <span /> DEMO PILOT
              </span>
              <button className="top-action" onClick={() => setAdminOpen(true)}>
                <KeyRound size={15} />{" "}
                <span>{adminKey ? "Admin enabled" : "Read only"}</span>
              </button>
            </div>
          </header>
          <div className="content-wrap">
            {error && (
              <div className="error-banner" role="alert">
                <AlertTriangle size={17} />
                <span>{error}</span>
                <button
                  className="icon-button"
                  aria-label="Dismiss"
                  onClick={() => setError("")}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {loading ? (
              <div className="loading-state">
                <span className="loading-mark">
                  <Activity size={19} />
                </span>
                <span>Loading synthetic workspace</span>
              </div>
            ) : (
              <>
                {section === "overview" && (
                  <Overview
                    events={events}
                    actions={actions}
                    project={project}
                    metrics={metrics}
                    rate={processRate}
                    eligible={eligible}
                    overdue={overdue}
                    onNavigate={navigateTo}
                    onSelect={setSelectedEvent}
                  />
                )}
                {section === "events" && (
                  <Events
                    events={events}
                    adminKey={adminKey}
                    onSelect={setSelectedEvent}
                    onCreate={(payload) =>
                      perform(() => api.createEvent(payload, adminKey))
                    }
                  />
                )}
                {section === "investigations" && (
                  <Investigations events={events} onSelect={setSelectedEvent} />
                )}
                {section === "actions" && (
                  <Actions
                    actions={actions}
                    adminKey={adminKey}
                    events={events}
                    project={project}
                    onCreate={(payload) =>
                      perform(() => api.createAction(payload, adminKey))
                    }
                    onChange={(id, payload) =>
                      perform(() => api.transitionAction(id, payload, adminKey))
                    }
                  />
                )}
                {section === "improvement" && project && (
                  <Improvement
                    project={project}
                    adminKey={adminKey}
                    onChange={(status) =>
                      perform(() =>
                        api.updateProject(project.id, status, adminKey),
                      )
                    }
                    onAddCycle={(payload) =>
                      perform(() => api.addPDSA(project.id, payload, adminKey))
                    }
                    onUpdateCycle={(cycleId, payload) =>
                      perform(() =>
                        api.updatePDSA(project.id, cycleId, payload, adminKey),
                      )
                    }
                  />
                )}
                {section === "measurement" && (
                  <Measurement
                    metrics={metrics}
                    equityData={equityData}
                    setting={setting}
                    onSetting={setSetting}
                  />
                )}
              </>
            )}
            <footer className="page-footer">
              <span>
                CARELOOP SAFETY <i /> SYNTHETIC PORTFOLIO DEMONSTRATION
              </span>
              <span>
                Not a clinical system · Not evidence of real-world effectiveness
              </span>
            </footer>
          </div>
        </main>
      </div>
      {selected && (
        <InvestigationDrawer
          event={selected}
          adminKey={adminKey}
          onClose={() => setSelectedEvent(null)}
          onSave={(payload) =>
            perform(() =>
              api.updateInvestigation(selected.id, payload, adminKey),
            )
          }
          onSignoff={(reviewer) =>
            perform(() =>
              api.signoffInvestigation(selected.id, reviewer, adminKey),
            )
          }
        />
      )}
      {adminOpen && (
        <AdminDialog
          adminKey={adminKey}
          onClose={() => setAdminOpen(false)}
          onSave={setAdminKey}
        />
      )}
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="title-actions">{actions}</div>}
    </div>
  );
}

function Overview({
  events,
  actions,
  project,
  metrics,
  rate,
  eligible,
  overdue,
  onNavigate,
  onSelect,
}: {
  events: EventRecord[];
  actions: ActionRecord[];
  project?: ProjectRecord;
  metrics: MetricPoint[];
  rate: number;
  eligible: number;
  overdue: number;
  onNavigate: (section: Section) => void;
  onSelect: (id: string) => void;
}) {
  const pending = actions.filter(
    (action) => !["effective", "ineffective"].includes(action.state),
  ).length;
  const trend = metrics.slice(-1)[0]?.process_rate ?? null;
  return (
    <>
      <PageTitle
        eyebrow="PROGRAM PULSE · WEEK 10"
        title="Good systems make safe work easier."
        description="A working view of synthetic events, improvement activity, and learning across three living settings."
        actions={
          <button
            className="button-outline"
            onClick={() => onNavigate("measurement")}
          >
            <Activity size={15} /> View measures
          </button>
        }
      />
      <section className="metric-strip" aria-label="Program indicators">
        <MetricCard
          label="Timely checklists"
          value={`${rate}%`}
          detail={`${eligible} eligible transitions`}
          icon={<ClipboardCheck size={17} />}
          trend={trend === null ? "No data" : `Latest week ${trend}%`}
          tone="teal"
        />
        <MetricCard
          label="Open safety events"
          value={String(
            events.filter((event) => event.status !== "reviewed").length,
          ).padStart(2, "0")}
          detail="Across 3 settings"
          icon={<FileClock size={17} />}
          trend="Synthetic examples"
          tone="coral"
        />
        <MetricCard
          label="Actions in flight"
          value={String(pending).padStart(2, "0")}
          detail={`${overdue} past demonstration due date`}
          icon={<Signpost size={17} />}
          trend="Owners assigned"
          tone="blue"
        />
        <MetricCard
          label="Project status"
          value={
            project?.status === "testing" ? "Testing" : (project?.status ?? "—")
          }
          detail="12-week pilot · constructed data"
          icon={<Gauge size={17} />}
          trend="PDSA 01 active"
          tone="gold"
        />
      </section>
      <div className="overview-grid">
        <section className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">PROCESS MEASURE</div>
              <h2>Checklist completion</h2>
              <p>Completed within 48 hours / eligible transitions</p>
            </div>
            <button
              className="text-button"
              onClick={() => onNavigate("measurement")}
            >
              Open run chart <ArrowUpRight size={14} />
            </button>
          </div>
          <TrendChart rows={metrics} compact />
          <div className="chart-foot">
            <span>
              <i className="legend-dot process-dot" /> Timely completion
            </span>
            <span className="chart-note">
              Synthetic before/after; not causal evidence
            </span>
          </div>
        </section>
        <section className="panel event-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">SAFETY LEARNING</div>
              <h2>Recent event reports</h2>
            </div>
            <button
              className="text-button"
              onClick={() => onNavigate("events")}
            >
              All events <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="event-list compact-list">
            {events.slice(0, 3).map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onClick={() => onSelect(event.id)}
              />
            ))}
          </div>
          <button
            className="inline-link"
            onClick={() => onNavigate("investigations")}
          >
            Review investigation queue <ArrowDownRight size={14} />
          </button>
        </section>
        <section className="panel aim-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">IMPROVEMENT AIM</div>
              <h2>What we are working toward</h2>
            </div>
            <span className="status-pill status-testing">In testing</span>
          </div>
          <p className="aim-copy">{project?.aim}</p>
          <div className="aim-meter">
            <div className="aim-meter-labels">
              <span>
                Baseline <strong>{project?.baseline}%</strong>
              </span>
              <span>
                Target <strong>{project?.target}%</strong>
              </span>
            </div>
            <div className="aim-track">
              <span style={{ width: `${Math.min(rate, 100)}%` }} />
            </div>
            <div className="aim-meter-foot">
              <span>
                Current synthetic rate <b>{rate}%</b>
              </span>
              <span>12-week pilot</span>
            </div>
          </div>
          <button
            className="inline-link"
            onClick={() => onNavigate("improvement")}
          >
            Open project charter <ArrowDownRight size={14} />
          </button>
        </section>
        <section className="panel action-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">ACCOUNTABILITY</div>
              <h2>Next actions</h2>
            </div>
            <button
              className="text-button"
              onClick={() => onNavigate("actions")}
            >
              Register <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="action-mini-list">
            {actions
              .filter((action) => action.state !== "effective")
              .slice(0, 3)
              .map((action) => (
                <div className="action-mini" key={action.id}>
                  <span className={`action-state-dot state-${action.state}`} />
                  <div>
                    <strong>{action.title}</strong>
                    <span>
                      {action.owner} · due {dateLabel(action.due_date)}
                    </span>
                  </div>
                  <span className="mini-state">
                    {action.state.replace("_", " ")}
                  </span>
                </div>
              ))}
          </div>
          <div className="commitment-note">
            <UsersRound size={15} />
            <span>
              Stakeholder roles are fictional placeholders. No team
              participation is claimed.
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  trend,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  trend: string;
  tone: string;
}) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
      <div className="metric-trend">
        <span className="trend-arrow">
          <ArrowUpRight size={13} />
        </span>
        {trend}
      </div>
    </div>
  );
}

function EventRow({
  event,
  onClick,
}: {
  event: EventRecord;
  onClick: () => void;
}) {
  return (
    <button className="event-row" onClick={onClick}>
      <span
        className={`event-marker marker-${event.event_type.startsWith("transition") ? "green" : event.event_type === "near miss" ? "orange" : "blue"}`}
      >
        <FileText size={16} />
      </span>
      <span className="event-row-body">
        <strong>{event.summary}</strong>
        <span>
          {event.setting} <i /> {dateLabel(event.occurred_on)}
        </span>
      </span>
      <span className={`status-pill status-${event.status}`}>
        {event.status}
      </span>
      <ArrowUpRight size={14} className="row-arrow" />
    </button>
  );
}

function Events({
  events,
  adminKey,
  onSelect,
  onCreate,
}: {
  events: EventRecord[];
  adminKey: string;
  onSelect: (id: string) => void;
  onCreate: (payload: Record<string, string>) => void;
}) {
  const [intakeOpen, setIntakeOpen] = useState(false);
  return (
    <>
      <PageTitle
        eyebrow="EVENT INTAKE · SYNTHETIC"
        title="Safety events"
        description="Structured fictional reports for system-level learning. This workspace has no file upload or open narrative intake."
        actions={
          adminKey ? (
            <button
              className="button-primary"
              onClick={() => setIntakeOpen(!intakeOpen)}
            >
              {intakeOpen ? <X size={15} /> : <Plus size={15} />}
              {intakeOpen ? "Close intake" : "Record synthetic event"}
            </button>
          ) : (
            <span className="readonly-note">
              <LockKeyhole size={13} /> Admin access required for intake
            </span>
          )
        }
      />
      <div className="list-toolbar">
        <span>{events.length} fictional records</span>
        <span className="filter-tag">
          <ShieldCheck size={14} /> Synthetic only
        </span>
      </div>
      <section className="panel table-panel">
        <div className="table-header event-table-header">
          <span>EVENT</span>
          <span>SETTING</span>
          <span>TYPE</span>
          <span>REPORTED</span>
          <span>STATUS</span>
          <span />
        </div>
        {events.map((event) => (
          <button
            className="table-row event-table-row"
            key={event.id}
            onClick={() => onSelect(event.id)}
          >
            <span className="table-event">
              <span className="table-event-icon">
                <FileText size={15} />
              </span>
              <span>
                <strong>{event.summary}</strong>
                <small>{event.id}</small>
              </span>
            </span>
            <span className="setting-cell">{event.setting}</span>
            <span>{event.event_type}</span>
            <span>{dateLabel(event.reported_on)}</span>
            <span className={`status-pill status-${event.status}`}>
              {event.status}
            </span>
            <ArrowUpRight size={15} />
          </button>
        ))}
      </section>
      {intakeOpen && adminKey && (
        <SyntheticEventForm
          onCancel={() => setIntakeOpen(false)}
          onCreate={(payload) => {
            onCreate(payload);
            setIntakeOpen(false);
          }}
        />
      )}
      <section className="info-band">
        <div className="info-symbol">
          <ShieldCheck size={18} />
        </div>
        <p>
          <strong>Boundary by design.</strong> Events contain no real
          identifiers. Narrative fields are absent from anonymous intake; this
          portfolio demonstrates review and routing only.
        </p>
      </section>
    </>
  );
}

function SyntheticEventForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (payload: Record<string, string>) => void;
}) {
  const [setting, setSetting] = useState("assisted living");
  const [eventType, setEventType] = useState("transition handoff");
  const [communication, setCommunication] = useState(
    "large-print written update",
  );
  const [barrier, setBarrier] = useState("handoff timing");
  const summaries: Record<string, string> = {
    "transition handoff":
      "Checklist ownership unclear after a synthetic transition",
    "medication-list discrepancy":
      "Medication-list versions differed across synthetic transition records",
    "near miss": "Duplicate checklist task detected before synthetic review",
  };
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form
      className="synthetic-event-form"
      onSubmit={(event) => {
        event.preventDefault();
        onCreate({
          id: `evt-demo-${Date.now()}`,
          setting,
          event_type: eventType,
          occurred_on: today,
          reported_on: today,
          summary: summaries[eventType],
          communication_preference: communication,
          access_barrier: barrier,
        });
      }}
    >
      <div className="eyebrow">CONTROLLED SCENARIO · NO FREE-TEXT NARRATIVE</div>
      <div className="form-grid">
        <label>
          Setting
          <select value={setting} onChange={(event) => setSetting(event.target.value)}>
            <option>assisted living</option>
            <option>group home</option>
            <option>independent living</option>
          </select>
        </label>
        <label>
          Event category
          <select
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
          >
            <option>transition handoff</option>
            <option>medication-list discrepancy</option>
            <option>near miss</option>
          </select>
        </label>
        <label>
          Communication preference
          <select
            value={communication}
            onChange={(event) => setCommunication(event.target.value)}
          >
            <option>large-print written update</option>
            <option>phone call with support person</option>
            <option>accessible email summary</option>
            <option>verbal update</option>
          </select>
        </label>
        <label>
          Access barrier
          <select value={barrier} onChange={(event) => setBarrier(event.target.value)}>
            <option value="handoff timing">Handoff arrived after shift change</option>
            <option value="document access">Document version not visible</option>
            <option value="task duplication">Duplicate task created during role handoff</option>
            <option>none recorded</option>
          </select>
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-plain" onClick={onCancel}>
          Cancel
        </button>
        <button className="button-primary">
          <Plus size={15} /> Add fictional event
        </button>
      </div>
    </form>
  );
}

function Investigations({
  events,
  onSelect,
}: {
  events: EventRecord[];
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <PageTitle
        eyebrow="SYSTEMS REVIEW · HUMAN AUTHORED"
        title="Investigation workspace"
        description="Separate what is known from what is suspected. Findings need a reviewer before they become a signed record."
      />
      <div className="investigation-layout">
        <section className="panel investigation-queue">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">CASE QUEUE</div>
              <h2>
                Open reviews{" "}
                <span className="heading-count">
                  {
                    events.filter(
                      (event) => !event.investigation?.reviewer_signed_by,
                    ).length
                  }
                </span>
              </h2>
            </div>
            <span className="filter-tag">
              <UsersRound size={13} /> Human review
            </span>
          </div>
          {events.map((event) => (
            <button
              className="case-row"
              key={event.id}
              onClick={() => onSelect(event.id)}
            >
              <span
                className={`case-indicator ${event.investigation?.reviewer_signed_by ? "case-signed" : ""}`}
              />{" "}
              <span>
                <strong>{event.summary}</strong>
                <small>
                  {event.setting} · {event.id}
                </small>
              </span>
              <span className="case-meta">
                {event.investigation?.reviewer_signed_by
                  ? "Signed"
                  : "Needs review"}
                <ArrowUpRight size={14} />
              </span>
            </button>
          ))}
        </section>
        <aside className="panel method-panel">
          <div className="eyebrow">REVIEW LENS</div>
          <h2>Stay curious about the system.</h2>
          <p>
            Use a structured worksheet to organize inquiry, not to auto-generate
            conclusions.
          </p>
          <div className="method-block">
            <span>01</span>
            <div>
              <strong>Established facts</strong>
              <small>Evidence-backed observations</small>
            </div>
          </div>
          <div className="method-block">
            <span>02</span>
            <div>
              <strong>Hypotheses</strong>
              <small>Testable explanations, not findings</small>
            </div>
          </div>
          <div className="method-block">
            <span>03</span>
            <div>
              <strong>Open questions</strong>
              <small>What the team still needs to learn</small>
            </div>
          </div>
          <div className="method-block">
            <span>04</span>
            <div>
              <strong>Human sign-off</strong>
              <small>Reviewer initials the finding record</small>
            </div>
          </div>
          <div className="method-caution">
            <AlertTriangle size={15} />
            <span>
              Do not treat a 5-Whys chain or cause category as a definitive root
              cause.
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

function InvestigationDrawer({
  event,
  adminKey,
  onClose,
  onSave,
  onSignoff,
}: {
  event: EventRecord;
  adminKey: string;
  onClose: () => void;
  onSave: (payload: Partial<EventRecord["investigation"]>) => void;
  onSignoff: (reviewer: string) => void;
}) {
  const [reviewer, setReviewer] = useState("");
  const [findings, setFindings] = useState(
    (event.investigation?.findings ?? []).join("\n"),
  );
  const [facts, setFacts] = useState(
    (event.investigation?.established_facts ?? []).join("\n"),
  );
  const [hypotheses, setHypotheses] = useState(
    (event.investigation?.hypotheses ?? []).join("\n"),
  );
  const [questions, setQuestions] = useState(
    (event.investigation?.open_questions ?? []).join("\n"),
  );
  const [whys, setWhys] = useState(
    (event.investigation?.five_whys ?? []).join("\n"),
  );
  const [causes, setCauses] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      ["people", "process", "technology", "environment"].map((category) => [
        category,
        (event.investigation?.cause_categories?.[category] ?? []).join("\n"),
      ]),
    ),
  );
  const investigation = event.investigation;
  const splitLines = (value: string) =>
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  const saveWorksheet = () =>
    onSave({
      established_facts: splitLines(facts),
      hypotheses: splitLines(hypotheses),
      open_questions: splitLines(questions),
      five_whys: splitLines(whys),
      cause_categories: Object.fromEntries(
        Object.entries(causes).map(([category, items]) => [
          category,
          splitLines(items),
        ]),
      ),
      findings: splitLines(findings),
    });
  return (
    <div className="drawer-scrim" role="presentation" onClick={onClose}>
      <aside
        className="investigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Investigation details"
        onClick={(eventClick) => eventClick.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <div className="eyebrow">CASE REVIEW · {event.id}</div>
            <h2>Systems investigation</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close investigation"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer-content">
          <div className="drawer-event-summary">
            <span className="status-pill status-investigating">
              {event.status}
            </span>
            <h3>{event.summary}</h3>
            <div>
              {event.setting} <i /> {dateLabel(event.occurred_on)} <i />{" "}
              {event.event_type}
            </div>
          </div>
          <section className="worksheet timeline-worksheet">
            <div className="worksheet-title">
              <span className="worksheet-num">00</span>
              <h3>Evidence timeline</h3>
            </div>
            <div className="timeline-entry">
              <span>{dateLabel(event.occurred_on)}</span>
              <div>
                <strong>Scenario event recorded</strong>
                <small>{event.event_type} · synthetic event fixture</small>
              </div>
            </div>
            <div className="timeline-entry">
              <span>{dateLabel(event.reported_on)}</span>
              <div>
                <strong>Report entered</strong>
                <small>Structured example; no patient documents attached</small>
              </div>
            </div>
            <p className="empty-note">No additional evidence artifacts are linked.</p>
          </section>
          <div className="feedback-card">
            <div className="eyebrow">SYNTHETIC RESIDENT / FAMILY CONTEXT</div>
            <p>
              Preferred communication:{" "}
              <strong>{event.communication_preference}</strong>
            </p>
            <p>
              Recorded access barrier: <strong>{event.access_barrier}</strong>
            </p>
          </div>
          {adminKey ? (
            <EditableWorksheet title="Established facts" value={facts} onChange={setFacts} />
          ) : (
            <Worksheet title="Established facts" items={investigation?.established_facts ?? []} tone="fact" />
          )}
          {adminKey ? (
            <EditableWorksheet title="Hypotheses to test" value={hypotheses} onChange={setHypotheses} />
          ) : (
            <Worksheet title="Hypotheses to test" items={investigation?.hypotheses ?? []} tone="hypothesis" />
          )}
          {adminKey ? (
            <EditableWorksheet title="Open questions" value={questions} onChange={setQuestions} />
          ) : (
            <Worksheet title="Open questions" items={investigation?.open_questions ?? []} tone="question" />
          )}
          <section className="worksheet">
            <div className="worksheet-title">
              <span className="worksheet-num">04</span>
              <h3>5-Whys worksheet</h3>
            </div>
            {adminKey ? (
              <textarea
                aria-label="5-Whys entries"
                maxLength={1200}
                value={whys}
                onChange={(eventChange) => setWhys(eventChange.target.value)}
                placeholder="One why per line; treat the chain as an inquiry aid, not a conclusion."
                rows={4}
              />
            ) : (investigation?.five_whys ?? []).length ? (
              <ol className="whys-list">
                {investigation.five_whys.map((why, index) => (
                  <li key={index}>
                    <span>WHY {index + 1}</span>
                    {why}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-note">No 5-Whys entries recorded.</p>
            )}
          </section>
          <section className="worksheet">
            <div className="worksheet-title">
              <span className="worksheet-num">05</span>
              <h3>Cause-and-effect categories</h3>
            </div>
            <div className="cause-grid">
              {adminKey
                ? Object.entries(causes).map(([category, items]) => (
                    <label className="cause-edit" key={category}>
                      <span>{category}</span>
                      <textarea
                        aria-label={`${category} cause entries`}
                        maxLength={960}
                        rows={3}
                        value={items}
                        onChange={(eventChange) =>
                          setCauses({ ...causes, [category]: eventChange.target.value })
                        }
                        placeholder="One observation per line"
                      />
                    </label>
                  ))
                : Object.entries(investigation?.cause_categories ?? {}).map(
                ([category, items]) => (
                  <div key={category}>
                    <span>{category}</span>
                    {items.length ? items.join(", ") : "None recorded"}
                  </div>
                ),
              )}
            </div>
          </section>
          <section className="worksheet finding-worksheet">
            <div className="worksheet-title">
              <span className="worksheet-num">06</span>
              <h3>Human-authored findings</h3>
            </div>
            {adminKey ? (
              <>
                <textarea
                  aria-label="Investigation findings"
                  value={findings}
                  onChange={(eventChange) =>
                    setFindings(eventChange.target.value)
                  }
                  placeholder="Record bounded, evidence-linked findings. Distinguish findings from hypotheses."
                  rows={4}
                />
                <button
                  className="button-primary button-full"
                  onClick={saveWorksheet}
                >
                  <Check size={15} /> Save investigation draft
                </button>
              </>
            ) : (
              <ul>
                {(investigation?.findings ?? []).map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            )}
            {investigation?.reviewer_signed_by && (
              <p className="signed-note">
                <Check size={14} /> Reviewed by{" "}
                {investigation.reviewer_signed_by}
              </p>
            )}
          </section>
          {adminKey && !investigation?.reviewer_signed_by && (
            <form
              className="signoff-form"
              onSubmit={(eventSubmit) => {
                eventSubmit.preventDefault();
                if (reviewer.trim()) onSignoff(reviewer.trim());
              }}
            >
              <label htmlFor="reviewer">Reviewer sign-off</label>
              <div>
                <input
                  id="reviewer"
                  value={reviewer}
                  onChange={(eventChange) =>
                    setReviewer(eventChange.target.value)
                  }
                  placeholder="Fictional reviewer name"
                  required
                />
                <button className="button-primary" type="submit">
                  <Check size={15} /> Sign off
                </button>
              </div>
            </form>
          )}
          <p className="drawer-disclaimer">
            A signed finding is a human review artifact, not a clinical
            conclusion.
          </p>
        </div>
      </aside>
    </div>
  );
}

function EditableWorksheet({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="worksheet">
      <div className="worksheet-title">
        <span className="worksheet-dot fact" />
        <h3>{title}</h3>
      </div>
      <textarea
        aria-label={title}
        maxLength={2880}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="One bounded, evidence-linked entry per line"
      />
    </section>
  );
}

function Worksheet({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <section className="worksheet">
      <div className="worksheet-title">
        <span className={`worksheet-dot ${tone}`} />
        <h3>{title}</h3>
      </div>
      {items.length ? (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">Nothing recorded.</p>
      )}
    </section>
  );
}

function Actions({
  actions,
  adminKey,
  events,
  project,
  onCreate,
  onChange,
}: {
  actions: ActionRecord[];
  adminKey: string;
  events: EventRecord[];
  project?: ProjectRecord;
  onCreate: (payload: Record<string, string>) => void;
  onChange: (id: string, payload: Record<string, string>) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <>
      <PageTitle
        eyebrow="ACTION REGISTER · OWNERSHIP & VERIFICATION"
        title="From learning to change"
        description="Track an accountable owner, due date, implementation evidence, and a scheduled check of effectiveness."
        actions={
          adminKey ? (
            <button
              className="button-primary"
              onClick={() => setCreateOpen(!createOpen)}
            >
              {createOpen ? <X size={15} /> : <Plus size={15} />}
              {createOpen ? "Close" : "Assign action"}
            </button>
          ) : null
        }
      />
      {createOpen && adminKey && (
        <ActionCreateForm
          events={events}
          project={project}
          onCancel={() => setCreateOpen(false)}
          onCreate={(payload) => {
            onCreate(payload);
            setCreateOpen(false);
          }}
        />
      )}
      <div className="action-summary-strip">
        <span>
          <b>{actions.length}</b> total actions
        </span>
        <span>
          <b>
            {actions.filter((action) => action.state === "in_progress").length}
          </b>{" "}
          in progress
        </span>
        <span>
          <b>
            {
              actions.filter(
                (action) => action.state === "effectiveness_pending",
              ).length
            }
          </b>{" "}
          effectiveness checks due
        </span>
        <span>
          <b>
            {actions.filter((action) => action.state === "effective").length}
          </b>{" "}
          verified effective
        </span>
      </div>
      <div className="action-register">
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            adminKey={adminKey}
            onChange={onChange}
          />
        ))}
      </div>
      <div className="info-band">
        <div className="info-symbol">
          <CircleHelp size={18} />
        </div>
        <p>
          <strong>Action rationale matters.</strong> Prefer stronger system
          changes over reminders alone. Effectiveness is assessed separately
          from implementation completion.
        </p>
      </div>
    </>
  );
}

function ActionCreateForm({
  events,
  project,
  onCancel,
  onCreate,
}: {
  events: EventRecord[];
  project?: ProjectRecord;
  onCancel: () => void;
  onCreate: (payload: Record<string, string>) => void;
}) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [actionType, setActionType] = useState("standardize");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const defaultLink = project ? `project:${project.id}` : `event:${events[0]?.id ?? ""}`;
  const [link, setLink] = useState(defaultLink);
  return (
    <form
      className="synthetic-event-form action-create-form"
      onSubmit={(event) => {
        event.preventDefault();
        const [linkType, linkId] = link.split(":");
        onCreate({
          id: `action-demo-${Date.now()}`,
          title: title.trim(),
          owner: owner.trim(),
          action_type: actionType,
          due_date: dueDate,
          ...(linkType === "event" ? { event_id: linkId } : { project_id: linkId }),
        });
      }}
    >
      <div className="eyebrow">ASSIGN A CORRECTIVE ACTION</div>
      <div className="form-grid action-form-grid">
        <label>
          Action
          <input
            required
            maxLength={180}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Describe a bounded workflow change"
          />
        </label>
        <label>
          Accountable owner
          <input
            required
            maxLength={80}
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Fictional role or demo owner"
          />
        </label>
        <label>
          Action type
          <select
            value={actionType}
            onChange={(event) => setActionType(event.target.value)}
          >
            <option value="standardize">Standardize</option>
            <option value="simplify">Simplify</option>
            <option value="involve">Involve stakeholders</option>
            <option value="inform">Inform</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Linked case or project
          <select value={link} onChange={(event) => setLink(event.target.value)}>
            {project && (
              <option value={`project:${project.id}`}>Project · {project.title}</option>
            )}
            {events.map((item) => (
              <option value={`event:${item.id}`} key={item.id}>
                Event · {item.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due date
          <input
            type="date"
            required
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-plain" onClick={onCancel}>
          Cancel
        </button>
        <button className="button-primary">
          <Plus size={15} /> Add to register
        </button>
      </div>
    </form>
  );
}

function ActionCard({
  action,
  adminKey,
  onChange,
}: {
  action: ActionRecord;
  adminKey: string;
  onChange: (id: string, payload: Record<string, string>) => void;
}) {
  const [evidence, setEvidence] = useState("");
  const [checkDate, setCheckDate] = useState("");
  const nextState: Record<string, string> = {
    proposed: "approved",
    approved: "in_progress",
    in_progress: "implemented",
    implemented: "effectiveness_pending",
  };
  const advance = nextState[action.state];
  return (
    <article className="action-card">
      <div className="action-card-main">
        <div className={`action-icon action-icon-${action.action_type}`}>
          <ClipboardCheck size={17} />
        </div>
        <div className="action-copy">
          <div className="action-kind">
            {action.action_type} <span>·</span> {action.id}
          </div>
          <h3>{action.title}</h3>
          <div className="action-meta">
            <span>
              <UsersRound size={13} /> {action.owner}
            </span>
            <span>
              <FileClock size={13} /> Due {dateLabel(action.due_date)}
            </span>
            {action.event_id && <span>Event {action.event_id}</span>}
          </div>
        </div>
        <span className={`status-pill action-status-${action.state}`}>
          {action.state.replace("_", " ")}
        </span>
      </div>
      {action.implementation_evidence && (
        <div className="evidence-line">
          <Check size={14} /> Evidence: {action.implementation_evidence}
        </div>
      )}
      {action.effectiveness_due && (
        <div className="evidence-line">
          <Gauge size={14} /> Effectiveness review due{" "}
          {dateLabel(action.effectiveness_due)}
        </div>
      )}
      {adminKey && advance && (
        <div className="action-controls">
          {action.state === "in_progress" && (
            <input
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              aria-label="Implementation evidence"
              placeholder="Brief implementation evidence"
            />
          )}
          {action.state === "implemented" && (
            <input
              type="date"
              value={checkDate}
              onChange={(event) => setCheckDate(event.target.value)}
              aria-label="Effectiveness review date"
            />
          )}
          {action.state === "in_progress" && !evidence.trim() ? (
            <span className="control-hint">
              Evidence required to mark implemented
            </span>
          ) : action.state === "implemented" && !checkDate ? (
            <span className="control-hint">Schedule review to continue</span>
          ) : (
            <button
              className="button-outline small"
              onClick={() =>
                onChange(action.id, {
                  state: advance,
                  ...(evidence ? { implementation_evidence: evidence } : {}),
                  ...(checkDate ? { effectiveness_due: checkDate } : {}),
                })
              }
            >
              {advance.replace("_", " ")} <ArrowUpRight size={13} />
            </button>
          )}
        </div>
      )}
      {adminKey && action.state === "effectiveness_pending" && (
        <div className="action-controls">
          <span className="control-hint">
            Record the scheduled check result
          </span>
          <button
            className="button-outline small"
            onClick={() =>
              onChange(action.id, {
                state: "effective",
                effectiveness_result: "effective",
              })
            }
          >
            Effective <Check size={13} />
          </button>
          <button
            className="button-outline small"
            onClick={() =>
              onChange(action.id, {
                state: "ineffective",
                effectiveness_result: "ineffective",
              })
            }
          >
            Ineffective <X size={13} />
          </button>
        </div>
      )}
    </article>
  );
}

function Improvement({
  project,
  adminKey,
  onChange,
  onAddCycle,
  onUpdateCycle,
}: {
  project: ProjectRecord;
  adminKey: string;
  onChange: (status: string) => void;
  onAddCycle: (payload: Record<string, string | number>) => void;
  onUpdateCycle: (id: string, payload: Record<string, string>) => void;
}) {
  const [showCycle, setShowCycle] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [scope, setScope] = useState("");
  const cycleNumbers = project.pdsa_cycles.map((cycle) => cycle.cycle_number);
  const nextCycle = cycleNumbers.length ? Math.max(...cycleNumbers) + 1 : 1;
  return (
    <>
      <PageTitle
        eyebrow="A3 · PDSA · SUSTAINMENT"
        title="Post-discharge checklist reliability"
        description="A scoped synthetic improvement case: aim, baseline, test, measures, decisions, and sustainment."
        actions={
          adminKey && (
            <select
              aria-label="Project status"
              value={project.status}
              onChange={(event) => onChange(event.target.value)}
            >
              <option value="planning">Planning</option>
              <option value="testing">Testing</option>
              <option value="review">Review</option>
              <option value="sustaining">Sustaining</option>
              <option value="closed">Closed</option>
            </select>
          )
        }
      />
      <section className="charter-band">
        <div className="charter-aim">
          <div className="eyebrow">PROJECT AIM</div>
          <p>{project.aim}</p>
          <div className="charter-stats">
            <span>
              <small>BASELINE</small>
              <strong>{project.baseline}%</strong>
            </span>
            <span className="charter-divider" />
            <span>
              <small>TARGET</small>
              <strong>{project.target}%</strong>
            </span>
            <span className="charter-divider" />
            <span>
              <small>STATUS</small>
              <strong className="capitalize">{project.status}</strong>
            </span>
          </div>
        </div>
        <div className="charter-intervention">
          <div className="eyebrow">PROPOSED CHANGE</div>
          <div className="intervention-mark">
            <Signpost size={19} />
          </div>
          <p>{project.intervention}</p>
          <small>
            Test as a workflow change only. Clinical content and time windows
            require separate clinician-approved protocols.
          </small>
        </div>
      </section>
      <div className="project-grid">
        <section className="panel project-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">SCOPE & MEASURES</div>
              <h2>What is in this pilot</h2>
            </div>
          </div>
          <p className="scope-copy">{project.scope}</p>
          <div className="measure-list">
            {project.measures.map((measure) => (
              <div className="measure-row" key={measure.name}>
                <span className={`measure-type type-${measure.kind}`}>
                  {measure.kind}
                </span>
                <div>
                  <strong>{measure.name}</strong>
                  <small>{measure.definition}</small>
                </div>
                <span>{measure.unit}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel project-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">MILESTONES & RISKS</div>
              <h2>Keep the work bounded</h2>
            </div>
          </div>
          <ol className="milestone-list">
            {project.milestones.map((milestone, index) => (
              <li key={milestone}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {milestone}
                <i className={index < 2 ? "milestone-done" : ""} />
              </li>
            ))}
          </ol>
          <div className="risk-list-title">
            <AlertTriangle size={14} /> Risks to watch
          </div>
          {project.risks.map((risk) => (
            <div className="risk-line" key={risk}>
              {risk}
            </div>
          ))}
        </section>
        <section className="panel project-panel pdsa-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">PLAN · DO · STUDY · ACT</div>
              <h2>PDSA cycles</h2>
            </div>
            {adminKey && (
              <button
                className="button-outline small"
                onClick={() => setShowCycle(!showCycle)}
              >
                {showCycle ? <X size={14} /> : <Plus size={14} />}{" "}
                {showCycle ? "Cancel" : "New cycle"}
              </button>
            )}
          </div>
          {project.pdsa_cycles.map((cycle) => (
            <div className="pdsa-cycle" key={cycle.id}>
              <div className="cycle-number">
                {String(cycle.cycle_number).padStart(2, "0")}
              </div>
              <div className="cycle-body">
                <div className="cycle-top">
                  <strong>Cycle {cycle.cycle_number}</strong>
                  <span className={`status-pill status-${cycle.decision}`}>
                    {cycle.decision}
                  </span>
                </div>
                <div className="cycle-grid">
                  <div>
                    <small>PREDICTION</small>
                    <p>{cycle.prediction}</p>
                  </div>
                  <div>
                    <small>TEST SCOPE</small>
                    <p>{cycle.test_scope}</p>
                  </div>
                  <div>
                    <small>OBSERVED RESULT</small>
                    <p>{cycle.observed_result}</p>
                  </div>
                  <div>
                    <small>LEARNING</small>
                    <p>{cycle.learning}</p>
                  </div>
                </div>
                {adminKey && cycle.decision === "pending" && (
                  <PDSAReview
                    onSave={(payload) => onUpdateCycle(cycle.id, payload)}
                  />
                )}
              </div>
            </div>
          ))}
          {showCycle && adminKey && (
            <form
              className="new-cycle-form"
              onSubmit={(event) => {
                event.preventDefault();
                onAddCycle({
                  id: `demo-cycle-${Date.now()}`,
                  cycle_number: nextCycle,
                  prediction,
                  test_scope: scope,
                });
                setShowCycle(false);
                setPrediction("");
                setScope("");
              }}
            >
              <label>
                Prediction
                <input
                  required
                  maxLength={240}
                  value={prediction}
                  onChange={(event) => setPrediction(event.target.value)}
                  placeholder="What do you expect to happen?"
                />
              </label>
              <label>
                Test scope
                <input
                  required
                  maxLength={180}
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  placeholder="Who/where will the test include?"
                />
              </label>
              <button className="button-primary">
                <Plus size={15} /> Add cycle
              </button>
            </form>
          )}
        </section>
        <section className="panel project-panel sustain-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">CONTROL PLAN</div>
              <h2>Sustainment & handoff</h2>
            </div>
            <RefreshCw size={16} className="quiet-icon" />
          </div>
          <div className="sustain-grid">
            <div>
              <small>HANDOFF OWNER</small>
              <strong>{project.sustainment_owner}</strong>
            </div>
            <div>
              <small>MONITORING</small>
              <strong>{project.monitoring_cadence}</strong>
            </div>
            <div>
              <small>REOPEN WHEN</small>
              <strong>{project.reopen_trigger}</strong>
            </div>
          </div>
          <div className="sustain-caveat">
            Deterioration triggers prompt a workgroup review, not an automated
            care recommendation.
          </div>
        </section>
        <section className="panel project-panel raci-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">STAKEHOLDER COMMITMENTS</div>
              <h2>RACI & decisions</h2>
            </div>
            <span className="fictional-tag">FICTIONAL ROLES</span>
          </div>
          <div className="raci-table">
            {project.raci.map((row) => (
              <div key={row.role}>
                <span className="raci-code">{row.raci}</span>
                <span>
                  <strong>{row.role}</strong>
                  <small>{row.commitment}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="decision-line">
            <span className="decision-mark">?</span>
            <span>
              <small>UNRESOLVED DECISION</small>
              <strong>{project.decisions[0]?.decision}</strong>
              <em>{project.decisions[0]?.note}</em>
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

function PDSAReview({
  onSave,
}: {
  onSave: (payload: Record<string, string>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState("");
  const [learning, setLearning] = useState("");
  const [decision, setDecision] = useState("adapt");
  if (!expanded)
    return (
      <button
        className="text-button cycle-review-link"
        onClick={() => setExpanded(true)}
      >
        Record study result <ArrowUpRight size={13} />
      </button>
    );
  return (
    <form
      className="cycle-review-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ observed_result: result, learning, decision });
      }}
    >
      <label>
        Observed result
        <input
          required
          maxLength={240}
          value={result}
          onChange={(event) => setResult(event.target.value)}
        />
      </label>
      <label>
        Learning
        <input
          required
          maxLength={240}
          value={learning}
          onChange={(event) => setLearning(event.target.value)}
        />
      </label>
      <label>
        Decision
        <select
          value={decision}
          onChange={(event) => setDecision(event.target.value)}
        >
          <option value="adopt">Adopt</option>
          <option value="adapt">Adapt</option>
          <option value="abandon">Abandon</option>
        </select>
      </label>
      <button className="button-outline small">Save PDSA review</button>
    </form>
  );
}

function Measurement({
  metrics,
  equityData,
  setting,
  onSetting,
}: {
  metrics: MetricPoint[];
  equityData: EquitySetting[];
  setting: string;
  onSetting: (setting: string) => void;
}) {
  const latest = metrics[metrics.length - 1];
  const sumEligible = metrics.reduce((sum, row) => sum + row.eligible, 0);
  const sumTimely = metrics.reduce((sum, row) => sum + row.timely, 0);
  const processRate = sumEligible ? (sumTimely / sumEligible) * 100 : 0;
  const totalReviewed = metrics.reduce((sum, row) => sum + row.reviewed, 0);
  const totalUnresolved = metrics.reduce((sum, row) => sum + row.unresolved, 0);
  const outcomeRate = totalReviewed
    ? (totalUnresolved / totalReviewed) * 100
    : 0;
  return (
    <>
      <PageTitle
        eyebrow="RUN CHARTS · PROCESS · OUTCOME · BALANCING"
        title="Measure the work, not the story."
        description="Constructed weekly data for learning exercises. Rates include explicit denominators; small setting samples should not be read as disparity evidence."
        actions={
          <div className="measurement-actions">
            <select
              aria-label="Filter by setting"
              value={setting}
              onChange={(event) => onSetting(event.target.value)}
            >
              {settingOptions.map((option) => (
                <option value={option} key={option}>
                  {settingLabel(option)}
                </option>
              ))}
            </select>
            <a
              className="button-outline"
              href={`${import.meta.env.VITE_API_URL || ""}/api/measurement/export.csv`}
            >
              <Download size={15} /> Export CSV
            </a>
          </div>
        }
      />
      <div className="measurement-kpis">
        <div>
          <span>Process · timely checklist</span>
          <strong>{Math.round(processRate)}%</strong>
          <small>
            {sumTimely} / {sumEligible} eligible transitions
          </small>
        </div>
        <div>
          <span>Outcome · unresolved at checkpoint</span>
          <strong>{Math.round(outcomeRate)}%</strong>
          <small>
            {totalUnresolved} / {totalReviewed} reviewed transitions
          </small>
        </div>
        <div>
          <span>Balancing · documentation time</span>
          <strong>
            {latest?.documentation_minutes ?? "—"}
            <em> min</em>
          </strong>
          <small>Latest weekly mean</small>
        </div>
        <div>
          <span>Balancing · duplicate tasks</span>
          <strong>{latest?.duplicate_tasks ?? "—"}</strong>
          <small>Latest weekly count</small>
        </div>
      </div>
      <div className="charts-grid">
        <ChartPanel
          title="Timely checklist completion"
          eyebrow="PROCESS · HIGHER IS BETTER"
          data={metrics}
          dataKey="process_rate"
          color="#187d68"
          unit="%"
          denominatorKey="eligible"
          denominatorLabel="Eligible"
          annotation
        />
        <ChartPanel
          title="Unresolved discrepancies"
          eyebrow="OUTCOME · AT REVIEW CHECKPOINT"
          data={metrics}
          dataKey="outcome_rate"
          color="#c56d51"
          unit="%"
          denominatorKey="reviewed"
          denominatorLabel="Reviewed"
        />
        <ChartPanel
          title="Documentation time"
          eyebrow="BALANCING · LOWER IS NOT ALWAYS BETTER"
          data={metrics}
          dataKey="documentation_minutes"
          color="#557f98"
          unit=" min"
          annotation
        />
        <ChartPanel
          title="Duplicate tasks & burden"
          eyebrow="BALANCING · KEEP WORKFLOW VISIBLE"
          data={metrics}
          dataKey="workflow_burden_score"
          color="#9a7836"
          unit=" / 10"
          extraKey="duplicate_tasks"
          annotation
        />
      </div>
      <section className="info-band measurement-caveat">
        <div className="info-symbol">
          <AlertTriangle size={18} />
        </div>
        <p>
          <strong>Interpretation limit.</strong> An increased completion rate
          does not establish reduced readmissions or prevented harm. Constructed
          before/after data cannot establish causality. Denominator definitions
          and checkpoint timing are demonstration assumptions, not clinical
          protocol.
        </p>
      </section>
      <section className="panel equity-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">EQUITY REVIEW · EXPLORATORY</div>
            <h2>Setting-level coverage</h2>
          </div>
          <span className="filter-tag">Synthetic sample only</span>
        </div>
        <div className="equity-table">
          <div>
            <span>Setting</span>
            <span>Eligible</span>
            <span>Timely</span>
            <span>Completion</span>
            <span>Missingness</span>
          </div>
          {equityData.map((item) => (
            <div key={item.setting}>
              <strong>{item.setting}</strong>
              <span>{item.eligible ?? "Suppressed"}</span>
              <span>{item.timely ?? "Suppressed"}</span>
              <span>
                {item.completion_rate === null
                  ? "Suppressed"
                  : `${item.completion_rate}%`}
              </span>
              <span>
                {item.missingness_rate === null
                  ? "Suppressed"
                  : `${item.missingness_rate}%`}
              </span>
            </div>
          ))}
        </div>
        <div className="equity-table barrier-table">
          <div>
            <span>Setting · access barrier</span>
            <span>Eligible</span>
            <span>Timely</span>
            <span>Completion</span>
            <span>Missingness</span>
          </div>
          {equityData.flatMap((item) =>
            item.barriers.map((barrier) => (
              <div key={`${item.setting}-${barrier.access_barrier}`}>
                <strong>
                  {item.setting} · {barrier.access_barrier}
                </strong>
                <span>{barrier.eligible ?? "Suppressed"}</span>
                <span>{barrier.timely ?? "Suppressed"}</span>
                <span>
                  {barrier.completion_rate === null
                    ? "Suppressed"
                    : `${barrier.completion_rate}%`}
                </span>
                <span>
                  {barrier.missingness_rate === null
                    ? "Suppressed"
                    : `${barrier.missingness_rate}%`}
                </span>
              </div>
            )),
          )}
        </div>
        <p>
          Setting and access-barrier rates are suppressed when denominators are
          below 30. All values are constructed synthetic examples; no disparity
          conclusion is supported.
        </p>
      </section>
    </>
  );
}

function TrendChart({
  rows,
  compact = false,
  dataKey = "process_rate",
  color = "#187d68",
  unit = "%",
}: {
  rows: MetricPoint[];
  compact?: boolean;
  dataKey?: string;
  color?: string;
  unit?: string;
}) {
  return (
    <div className={`chart-wrap ${compact ? "compact-chart" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 10, right: 12, bottom: 0, left: -18 }}
        >
          <CartesianGrid stroke="#e8e9e3" vertical={false} />
          <XAxis
            dataKey="week_start"
            tickFormatter={dateLabel}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#858a83", fontSize: 10 }}
            minTickGap={23}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#858a83", fontSize: 10 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            labelFormatter={(value) => dateLabel(String(value))}
            formatter={(value, name) => [
              `${value ?? "—"}${unit}`,
              name === dataKey ? "Timely completion" : name,
            ]}
            contentStyle={{
              border: "1px solid #e6e5dc",
              borderRadius: 4,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.4}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartPanel({
  title,
  eyebrow,
  data,
  dataKey,
  color,
  unit,
  denominatorKey,
  denominatorLabel,
  extraKey,
  annotation = false,
}: {
  title: string;
  eyebrow: string;
  data: MetricPoint[];
  dataKey: string;
  color: string;
  unit: string;
  denominatorKey?: "eligible" | "reviewed";
  denominatorLabel?: string;
  extraKey?: string;
  annotation?: boolean;
}) {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
        </div>
        {denominatorLabel && (
          <span className="chart-denominator">
            n = {denominatorLabel.toLowerCase()}
          </span>
        )}
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 16, bottom: 0, left: -13 }}
          >
            <CartesianGrid stroke="#e8e9e3" vertical={false} />
            <XAxis
              dataKey="week_start"
              tickFormatter={dateLabel}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#858a83", fontSize: 10 }}
              minTickGap={18}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#858a83", fontSize: 10 }}
              tickFormatter={(value) => `${value}${unit}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              hide
              domain={[0, "auto"]}
            />
            <Tooltip
              labelFormatter={(value) => dateLabel(String(value))}
              formatter={(value, name, item) => [
                `${value ?? "—"}${unit}${denominatorKey ? ` · n=${(item as { payload?: MetricPoint }).payload?.[denominatorKey] ?? 0}` : ""}`,
                name === dataKey ? title : name,
              ]}
              contentStyle={{
                border: "1px solid #e6e5dc",
                borderRadius: 4,
                fontSize: 12,
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={dataKey}
              name={title}
              stroke={color}
              strokeWidth={2.2}
              dot={{ r: 2.8, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
            {extraKey && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={extraKey}
                name="Duplicate tasks"
                stroke="#c56d51"
                strokeWidth={1.7}
                strokeDasharray="4 4"
                dot={{ r: 2, fill: "#c56d51", strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        {annotation && (
          <div className="chart-annotation" style={{ left: "48%" }}>
            <span />
            {data.find((row) => row.week_start >= "2026-02-02")?.week_start
              ? dateLabel(
                  data.find((row) => row.week_start >= "2026-02-02")!
                    .week_start,
                )
              : "Test"}{" "}
            · first workflow test
          </div>
        )}
      </div>
      {extraKey && (
        <div className="chart-legend">
          <span>
            <i style={{ backgroundColor: color }} /> Workflow burden (0–10)
          </span>
          <span>
            <i style={{ backgroundColor: "#c56d51" }} /> Duplicate tasks (count)
          </span>
        </div>
      )}
    </section>
  );
}

function AdminDialog({
  adminKey,
  onClose,
  onSave,
}: {
  adminKey: string;
  onClose: () => void;
  onSave: (key: string) => void;
}) {
  const [value, setValue] = useState(adminKey);
  const [visible, setVisible] = useState(false);
  return (
    <div className="modal-scrim" role="presentation" onClick={onClose}>
      <section
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-icon">
          <LockKeyhole size={20} />
        </div>
        <button
          className="icon-button dialog-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={17} />
        </button>
        <div className="eyebrow">RESTRICTED DEMO OPERATIONS</div>
        <h2 id="admin-title">Admin access</h2>
        <p>
          Read-only browsing is open. Enter the local admin key to enable writes
          for this demo workspace. The key stays in memory and is not stored by
          the app.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave(value);
            onClose();
          }}
        >
          <label htmlFor="admin-key">Admin API key</label>
          <div className="key-input">
            <input
              id="admin-key"
              type={visible ? "text" : "password"}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoComplete="off"
              placeholder="Set ADMIN_API_KEY on the backend"
            />
            <button
              type="button"
              className="text-button"
              onClick={() => setVisible(!visible)}
            >
              {visible ? "Hide" : "Show"}
            </button>
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="button-plain"
              onClick={() => {
                onSave("");
                onClose();
              }}
            >
              Clear access
            </button>
            <button type="submit" className="button-primary">
              <KeyRound size={15} /> Enable admin
            </button>
          </div>
        </form>
        <div className="dialog-warning">
          <AlertTriangle size={14} /> No production identity provider or
          multi-user authorization is included.
        </div>
      </section>
    </div>
  );
}
