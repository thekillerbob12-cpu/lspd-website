import React, { useMemo, useState } from "react";
import {
  Shield,
  FileText,
  Users,
  Mail,
  Info,
  Lock,
  LogIn,
  LogOut,
  UserPlus,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { id: "about", label: "About Us", icon: Info, access: "public" },
  { id: "apply", label: "Apply Here", icon: FileText, access: "public" },
  { id: "contact", label: "Contact Us", icon: Mail, access: "public" },
  { id: "forms", label: "Department Forms", icon: Lock, access: "department" },
  { id: "roster", label: "Master Roster", icon: Users, access: "admin" },
];

const demoUsers = [
  { username: "officer", password: "lspd123", name: "Officer Demo", role: "department", callsign: "3C-24", rank: "Officer" },
  { username: "admin", password: "admin123", name: "Command Staff Demo", role: "admin", callsign: "1A-01", rank: "Chief of Police" },
];

const protectedStatuses = ["VACANT", "LOA", "Suspended", "Under Investigation"];
const manualStatuses = ["Active", "LOA", "VACANT", "Suspended", "Under Investigation"];

const statusStyles = {
  VACANT: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  Active: "bg-green-500/10 text-green-300 border-green-500/30",
  LOA: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  Inactive: "bg-red-500/10 text-red-300 border-red-500/30",
  Suspended: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  "Under Investigation": "bg-purple-500/10 text-purple-300 border-purple-500/30",
};

const manualStatusLabels = {
  Active: "System Managed",
  LOA: "LOA",
  VACANT: "VACANT",
  Suspended: "Suspended",
  "Under Investigation": "Under Investigation",
};

const initialRoster = [
  { name: "John Doe", rank: "Chief of Police", callsign: "1A-01", status: "Active", monthlyActivityCheck: true, lastActivityCheck: "2026-05-04", patrolHours: 12, activitySummary: "Completed command patrols and supervised active units." },
  { name: "Jane Smith", rank: "Captain", callsign: "1A-02", status: "Active", monthlyActivityCheck: false, lastActivityCheck: "2026-04-02", patrolHours: 0, activitySummary: "" },
  { name: "Alex Carter", rank: "Sergeant", callsign: "2B-12", status: "LOA", monthlyActivityCheck: false, lastActivityCheck: "2026-03-18", patrolHours: 0, activitySummary: "" },
  { name: "VACANT", rank: "Lieutenant", callsign: "2A-01", status: "VACANT", monthlyActivityCheck: false, lastActivityCheck: null, patrolHours: 0, activitySummary: "" },
  { name: "Officer Demo", rank: "Officer", callsign: "3C-24", status: "Active", monthlyActivityCheck: false, lastActivityCheck: "2026-04-29", patrolHours: 0, activitySummary: "" },
  { name: "Chris Walker", rank: "Officer", callsign: "3C-31", status: "Under Investigation", monthlyActivityCheck: true, lastActivityCheck: "2026-05-11", patrolHours: 3, activitySummary: "Submitted activity while pending review." },
];

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getDisplayStatus(member) {
  if (protectedStatuses.includes(member.status)) return member.status;
  if (!member.monthlyActivityCheck) return "Inactive";
  return "Active";
}

function getActivityCheckText(member) {
  if (member.status === "VACANT") return "N/A";
  if (["LOA", "Suspended", "Under Investigation"].includes(member.status)) return "Manual Hold";
  if (member.monthlyActivityCheck) return "Submitted";
  return "Missing";
}

function getAccessStatus(tab, currentUser) {
  if (!tab || tab.access === "public") return "allowed";
  if (!currentUser) return "login-required";
  if (tab.access === "department") return "allowed";
  if (tab.access === "admin" && currentUser.role === "admin") return "allowed";
  return "admin-required";
}

function runRosterRuleTests() {
  const addedMember = {
    name: "Test Officer",
    rank: "Officer",
    callsign: "9T-01",
    status: "Active",
    monthlyActivityCheck: true,
    lastActivityCheck: getTodayString(),
    patrolHours: 0,
    activitySummary: "Manually added by command staff.",
  };

  return [
    { name: "Newly added member starts Active", passed: getDisplayStatus(addedMember) === "Active" },
    { name: "Missing monthly check becomes Inactive", passed: getDisplayStatus({ ...addedMember, monthlyActivityCheck: false }) === "Inactive" },
    { name: "LOA overrides activity check", passed: getDisplayStatus({ ...addedMember, status: "LOA", monthlyActivityCheck: false }) === "LOA" },
    { name: "VACANT is manual and protected", passed: getDisplayStatus({ ...addedMember, name: "VACANT", status: "VACANT", monthlyActivityCheck: false }) === "VACANT" },
    { name: "Suspended is manual and protected", passed: getDisplayStatus({ ...addedMember, status: "Suspended", monthlyActivityCheck: true }) === "Suspended" },
    { name: "Under Investigation is manual and protected", passed: getDisplayStatus({ ...addedMember, status: "Under Investigation", monthlyActivityCheck: true }) === "Under Investigation" },
  ];
}

export default function LosSantosPDWebsite() {
  const [activeTab, setActiveTab] = useState("about");
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [roster, setRoster] = useState(initialRoster);
  const [monthlySubmissions, setMonthlySubmissions] = useState([]);

  const selectedTab = tabs.find((tab) => tab.id === activeTab);
  const accessStatus = getAccessStatus(selectedTab, currentUser);
  const requiresLogin = accessStatus === "login-required";
  const requiresAdmin = accessStatus === "admin-required";

  function handleLogin(event) {
    event.preventDefault();
    const matchedUser = demoUsers.find((user) => user.username === username.trim() && user.password === password);

    if (!matchedUser) {
      setLoginError("Invalid department credentials.");
      return;
    }

    setCurrentUser(matchedUser);
    setLoginError("");
    setUsername("");
    setPassword("");
  }

  function handleLogout() {
    setCurrentUser(null);
    setActiveTab("about");
  }

  function handleMonthlyCheckSubmit(submission) {
    const submittedDate = getTodayString();

    setMonthlySubmissions((currentSubmissions) => [{ ...submission, submittedAt: submittedDate }, ...currentSubmissions]);

    setRoster((currentRoster) =>
      currentRoster.map((member) => {
        if (member.callsign.toLowerCase() !== submission.callsign.toLowerCase()) return member;

        return {
          ...member,
          name: submission.officerName,
          rank: submission.rank,
          monthlyActivityCheck: true,
          lastActivityCheck: submittedDate,
          patrolHours: Number(submission.patrolHours),
          activitySummary: submission.activitySummary,
        };
      })
    );
  }

  function handleAddRosterMember(newMember) {
    const addedDate = getTodayString();

    setRoster((currentRoster) => [
      ...currentRoster,
      {
        ...newMember,
        status: "Active",
        monthlyActivityCheck: true,
        lastActivityCheck: addedDate,
        patrolHours: 0,
        activitySummary: "Manually added by command staff. Initial roster status set to Active.",
      },
    ]);
  }

  function handleRemoveRosterMember(callsign) {
    setRoster((currentRoster) => currentRoster.filter((member) => member.callsign !== callsign));
  }

  function handleUpdateManualStatus(callsign, manualStatus) {
    setRoster((currentRoster) =>
      currentRoster.map((member) => {
        if (member.callsign !== callsign) return member;
        return {
          ...member,
          name: manualStatus === "VACANT" ? "VACANT" : member.name === "VACANT" ? "" : member.name,
          status: manualStatus,
        };
      })
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_#3b82f6,_transparent_30%),radial-gradient(circle_at_bottom_left,_#facc15,_transparent_25%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4 shadow-lg shadow-blue-950/40">
                <Shield className="h-10 w-10 text-blue-300" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Los Santos Police Department</p>
                <h1 className="mt-1 text-3xl font-bold md:text-5xl">LSPD Department Portal</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <span className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                    Signed in as {currentUser.name} · {currentUser.role === "admin" ? "Admin" : "Department"}
                  </span>
                  <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                  <Lock className="h-4 w-4" /> Public Access
                </span>
              )}
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300">
            Serving Los Santos with professionalism, integrity, and dedication. This portal provides public information,
            recruitment access, contact options, and secure department resources for authorized personnel.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[280px_1fr]">
        <nav className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-xl shadow-black/20">
          <div className="mb-3 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Navigation</div>
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const locked = getAccessStatus(tab, currentUser) !== "allowed";

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                    activeTab === tab.id ? "bg-blue-500 text-white shadow-lg shadow-blue-950/40" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </span>
                  {locked && <Lock className="h-4 w-4 opacity-70" />}
                </button>
              );
            })}
          </div>
        </nav>

        <motion.div
          key={activeTab + String(currentUser?.role || "public")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20"
        >
          {requiresLogin ? (
            <LoginPanel handleLogin={handleLogin} username={username} setUsername={setUsername} password={password} setPassword={setPassword} loginError={loginError} />
          ) : requiresAdmin ? (
            <AdminOnlyPanel />
          ) : (
            <TabContent
              activeTab={activeTab}
              currentUser={currentUser}
              roster={roster}
              monthlySubmissions={monthlySubmissions}
              onMonthlyCheckSubmit={handleMonthlyCheckSubmit}
              onAddRosterMember={handleAddRosterMember}
              onRemoveRosterMember={handleRemoveRosterMember}
              onUpdateManualStatus={handleUpdateManualStatus}
            />
          )}
        </motion.div>
      </section>
    </main>
  );
}

function LoginPanel({ handleLogin, username, setUsername, password, setPassword, loginError }) {
  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
          <LogIn className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold">Department Login Required</h2>
        <p className="mt-2 text-sm text-slate-400">Authorized LSPD personnel only.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Username</label>
          <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400" placeholder="Enter username" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-400" placeholder="Enter password" />
        </div>

        {loginError && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{loginError}</p>}

        <button type="submit" className="w-full rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-400">
          Login
        </button>

        <p className="text-center text-xs text-slate-500">
          Demo department login: officer / lspd123
          <br />
          Demo admin login: admin / admin123
        </p>
      </form>
    </div>
  );
}

function AdminOnlyPanel() {
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
        <Lock className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold">Admin Access Required</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">You are signed in with department access, but the Master Roster is restricted to admin or command staff accounts only.</p>
    </div>
  );
}

function TabContent({ activeTab, currentUser, roster, monthlySubmissions, onMonthlyCheckSubmit, onAddRosterMember, onRemoveRosterMember, onUpdateManualStatus }) {
  switch (activeTab) {
    case "about":
      return <AboutUs />;
    case "apply":
      return <ApplyHere />;
    case "contact":
      return <ContactUs />;
    case "forms":
      return <DepartmentForms currentUser={currentUser} onMonthlyCheckSubmit={onMonthlyCheckSubmit} />;
    case "roster":
      return <MasterRoster roster={roster} monthlySubmissions={monthlySubmissions} onAddRosterMember={onAddRosterMember} onRemoveRosterMember={onRemoveRosterMember} onUpdateManualStatus={onUpdateManualStatus} />;
    default:
      return null;
  }
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="mt-2 max-w-3xl text-slate-400">{subtitle}</p>
    </div>
  );
}

function AboutUs() {
  return (
    <div>
      <SectionHeader title="About Us" subtitle="The Los Santos Police Department is committed to protecting the city, supporting the community, and maintaining professional roleplay standards." />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Mission", "Provide fair, realistic, and professional law enforcement roleplay across Los Santos."],
          ["Values", "Integrity, discipline, accountability, teamwork, and respect for the community."],
          ["Community", "Building trust through active patrols, public interaction, and reliable department leadership."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <h3 className="text-lg font-semibold text-blue-300">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplyHere() {
  return (
    <div>
      <SectionHeader title="Apply Here" subtitle="Interested in joining LSPD? Review the basic requirements below and submit your application through the department form." />
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <h3 className="text-xl font-semibold">Applicant Requirements</h3>
        <ul className="mt-4 space-y-3 text-slate-300">
          <li>• Must be active and professional within the FiveM server.</li>
          <li>• Must understand basic roleplay rules and chain of command.</li>
          <li>• Must be willing to complete department training.</li>
          <li>• Must maintain respectful conduct in and out of patrol.</li>
        </ul>
        <button type="button" className="mt-6 rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400">
          Start Application
        </button>
        <p className="mt-3 text-sm text-slate-500">Connect this button to a Google Form, Discord ticket, or custom application form.</p>
      </div>
    </div>
  );
}

function ContactUs() {
  return (
    <div>
      <SectionHeader title="Contact Us" subtitle="Reach out to department leadership for questions, concerns, recruitment help, or partnership requests." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <h3 className="text-xl font-semibold">Department Contact</h3>
          <p className="mt-3 text-slate-400">Discord: Replace with your server invite or department command contact.</p>
          <p className="mt-2 text-slate-400">Email: lspd@example.com</p>
        </div>
        <form className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <h3 className="text-xl font-semibold">Send a Message</h3>
          <input className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-400" placeholder="Your name" />
          <input className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-400" placeholder="Your Discord or email" />
          <textarea className="mt-3 min-h-32 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-400" placeholder="Message" />
          <button type="button" className="mt-4 rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

function DepartmentForms({ currentUser, onMonthlyCheckSubmit }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [monthlyForm, setMonthlyForm] = useState({
    officerName: currentUser?.name || "",
    callsign: currentUser?.callsign || "",
    rank: currentUser?.rank || "",
    patrolHours: "",
    activitySummary: "",
    supervisor: "",
    submissionMonth: currentMonth,
  });
  const [submitMessage, setSubmitMessage] = useState("");

  function updateMonthlyForm(field, value) {
    setMonthlyForm((current) => ({ ...current, [field]: value }));
  }

  function handleMonthlySubmit(event) {
    event.preventDefault();

    if (!monthlyForm.officerName || !monthlyForm.callsign || !monthlyForm.rank || !monthlyForm.patrolHours || !monthlyForm.activitySummary || !monthlyForm.supervisor || !monthlyForm.submissionMonth) {
      setSubmitMessage("Please complete every field before submitting your monthly activity check.");
      return;
    }

    onMonthlyCheckSubmit(monthlyForm);
    setSubmitMessage(`Monthly Activity Check submitted for ${monthlyForm.officerName}. The Master Roster has been updated live.`);
    setMonthlyForm((current) => ({ ...current, patrolHours: "", activitySummary: "", supervisor: "" }));
  }

  const forms = [
    { title: "Monthly Activity Check", required: true, description: "Required monthly submission for all active department personnel. Failure to complete this form may result in automatic inactive status." },
    { title: "Incident Report", required: false, description: "Submit official incident documentation." },
    { title: "Arrest Report", required: false, description: "Record arrest details and charges." },
    { title: "Use of Force Report", required: false, description: "Document use of force situations." },
    { title: "Ride Along Request", required: false, description: "Request approval for civilian or trainee ride alongs." },
    { title: "Leave of Absence Request", required: false, description: "Submit an LOA request to command staff." },
  ];

  return (
    <div>
      <SectionHeader title="Department Forms" subtitle="Secure access for LSPD members to submit official department paperwork and required monthly activity checks." />

      <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Required Monthly Submission</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Monthly Activity Check</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Officers are required to submit this document once per month to maintain Active status within the department roster.
              Missing submissions may automatically flag the officer as Inactive unless exempt due to LOA, Suspension, or Investigation status.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200">REQUIRED</div>
        </div>

        <form onSubmit={handleMonthlySubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <LabeledInput label="Officer Name" value={monthlyForm.officerName} onChange={(value) => updateMonthlyForm("officerName", value)} placeholder="Enter full name" />
          <LabeledInput label="Callsign" value={monthlyForm.callsign} onChange={(value) => updateMonthlyForm("callsign", value)} placeholder="Ex: 3C-24" />
          <LabeledInput label="Current Rank" value={monthlyForm.rank} onChange={(value) => updateMonthlyForm("rank", value)} placeholder="Officer / Sergeant / Lieutenant" />
          <LabeledInput label="Patrol Hours This Month" type="number" value={monthlyForm.patrolHours} onChange={(value) => updateMonthlyForm("patrolHours", value)} placeholder="Total patrol hours" />

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">Summary of Activity</label>
            <textarea value={monthlyForm.activitySummary} onChange={(event) => updateMonthlyForm("activitySummary", event.target.value)} className="min-h-32 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400" placeholder="Describe patrols, training, pursuits, investigations, or department participation completed this month." />
          </div>

          <LabeledInput label="Supervisor" value={monthlyForm.supervisor} onChange={(value) => updateMonthlyForm("supervisor", value)} placeholder="Supervisor or command staff" />
          <LabeledInput label="Submission Month" type="month" value={monthlyForm.submissionMonth} onChange={(value) => updateMonthlyForm("submissionMonth", value)} />

          <div className="md:col-span-2 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">By submitting this form, the officer confirms all information is accurate.</p>
            <button type="submit" className="rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400">
              Submit Monthly Check
            </button>
          </div>

          {submitMessage && (
            <div className={`md:col-span-2 rounded-xl border px-4 py-3 text-sm ${submitMessage.startsWith("Please") ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-green-500/30 bg-green-500/10 text-green-200"}`}>
              {submitMessage}
            </div>
          )}
        </form>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {forms.map((form) => (
          <div key={form.title} className={`rounded-xl border p-4 transition ${form.required ? "border-blue-500/30 bg-blue-500/5" : "border-slate-800 bg-slate-950/70 hover:border-blue-400 hover:bg-slate-900"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-100">{form.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{form.description}</p>
              </div>

              {form.required && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">REQUIRED</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <input type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.5" : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400" placeholder={placeholder} />
    </div>
  );
}

function MasterRoster({ roster, monthlySubmissions, onAddRosterMember, onRemoveRosterMember, onUpdateManualStatus }) {
  const [newMember, setNewMember] = useState({ name: "", rank: "", callsign: "" });
  const [adminMessage, setAdminMessage] = useState("");
  const tests = useMemo(() => runRosterRuleTests(), []);
  const passedTestCount = tests.filter((test) => test.passed).length;

  function updateNewMember(field, value) {
    setNewMember((current) => ({ ...current, [field]: value }));
  }

  function handleAddMember(event) {
    event.preventDefault();

    if (!newMember.name.trim() || !newMember.rank.trim() || !newMember.callsign.trim()) {
      setAdminMessage("Please complete name, rank, and callsign before adding a roster member.");
      return;
    }

    if (roster.some((member) => member.callsign.toLowerCase() === newMember.callsign.trim().toLowerCase())) {
      setAdminMessage("That callsign already exists on the roster.");
      return;
    }

    onAddRosterMember({ name: newMember.name.trim(), rank: newMember.rank.trim(), callsign: newMember.callsign.trim() });
    setAdminMessage(`${newMember.rank.trim()} ${newMember.callsign.trim()} was added to the roster and automatically marked Active.`);
    setNewMember({ name: "", rank: "", callsign: "" });
  }

  function handleManualStatusChange(member, manualStatus) {
    onUpdateManualStatus(member.callsign, manualStatus);
    setAdminMessage(`${member.callsign} manual override was updated to ${manualStatusLabels[manualStatus]}.`);
  }

  return (
    <div>
      <SectionHeader title="Master Roster" subtitle="Secure command staff roster. Active and Inactive are calculated by the system from monthly checks. Admins manually control LOA, VACANT, Suspended, and Under Investigation." />

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="mb-4 flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-blue-300" />
          <h3 className="text-xl font-semibold">Admin Roster Controls</h3>
        </div>

        <form onSubmit={handleAddMember} className="grid gap-4 md:grid-cols-4">
          <input value={newMember.name} onChange={(event) => updateNewMember("name", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-400" placeholder="Officer name" />
          <input value={newMember.rank} onChange={(event) => updateNewMember("rank", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-400" placeholder="Rank" />
          <input value={newMember.callsign} onChange={(event) => updateNewMember("callsign", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-400" placeholder="Callsign" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-400">
            <UserPlus className="h-4 w-4" /> Add
          </button>
        </form>

        <p className="mt-3 text-sm text-slate-500">
          Admins manually add each person to the roster. New people are automatically marked Active when added. Admins do not manually set Inactive; if a non-protected member misses the monthly activity check later, the system displays them as Inactive automatically.
        </p>

        {adminMessage && (
          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${adminMessage.startsWith("Please") || adminMessage.includes("already") ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-green-500/30 bg-green-500/10 text-green-200"}`}>
            {adminMessage}
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <InfoCard label="Monthly Check Rule" value="Missing check = Inactive" />
        <InfoCard label="Protected Statuses" value="VACANT, LOA, Suspended, Under Investigation" />
        <InfoCard label="Recent Submissions" value={`${monthlySubmissions.length} submitted this session`} />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Roster Rule Tests</h3>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            {passedTestCount}/{tests.length} passing
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {tests.map((test) => (
            <div key={test.name} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm">
              {test.passed ? <CheckCircle className="h-4 w-4 text-green-300" /> : <XCircle className="h-4 w-4 text-red-300" />}
              <span className={test.passed ? "text-slate-300" : "text-red-200"}>{test.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Callsign</th>
              <th className="px-4 py-3">Activity Check</th>
              <th className="px-4 py-3">Last Check</th>
              <th className="px-4 py-3">System Status</th>
              <th className="px-4 py-3">Manual Override</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/60">
            {roster.map((member) => {
              const displayStatus = getDisplayStatus(member);

              return (
                <tr key={member.callsign}>
                  <td className="px-4 py-3 text-slate-100">{member.name || "Unnamed"}</td>
                  <td className="px-4 py-3 text-slate-300">{member.rank}</td>
                  <td className="px-4 py-3 text-slate-300">{member.callsign}</td>
                  <td className="px-4 py-3 text-slate-300">{getActivityCheckText(member)}</td>
                  <td className="px-4 py-3 text-slate-300">{member.lastActivityCheck || "N/A"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[displayStatus]}`}>{displayStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={member.status} onChange={(event) => handleManualStatusChange(member, event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none focus:border-blue-400">
                      {manualStatuses.map((status) => (
                        <option key={status} value={status}>
                          {manualStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onRemoveRosterMember(member.callsign)} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20">
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-100">{value}</p>
    </div>
  );
}
