import { useEffect, useState } from 'react'
import {
  Info,
  FileText,
  Mail,
  Lock,
  Users,
  Trash2,
  ClipboardCheck,
  RotateCcw,
  History
} from 'lucide-react'
import { supabase } from './supabase'

const ranks = [
  'Cadet',
  'Officer',
  'Senior Officer',
  'Corporal',
  'Sergeant',
  'Lieutenant',
  'Captain',
  'Commander',
  'Deputy Chief',
  'Assistant Chief',
  'Chief of Police'
]

const divisions = [
  'Patrol',
  'Traffic',
  'Detective Bureau',
  'SWAT',
  'K9',
  'Training',
  'Command'
]

const protectedStatuses = [
  'VACANT',
  'LOA',
  'Suspended',
  'Under Investigation'
]

const adminUsers = [
  { username: 'J.malone@lspd.gov', password: 'LSPDHC301', role: 'Chief of Police' },
  { username: 'R.parish@lspd.gov', password: 'LSPDHC302', role: 'Assistant Chief' },
  { username: 'A.alastor1@lspd.gov', password: 'LSPDHC303', role: 'Deputy Chief' },
  { username: 'A.alastor2@lspd.gov', password: 'LSPDHC304', role: 'Commander' },
  { username: 'admin@lspd.gov', password: 'adminpass100!', role: 'System Administrator' },
]

const departmentForms = [
  { title: 'Incident Report', url: 'https://docs.google.com/' },
  { title: 'Arrest Report', url: 'https://docs.google.com/' },
  { title: 'Use of Force Report', url: 'https://docs.google.com/' },
  { title: 'Leave of Absence Request', url: 'https://docs.google.com/' },
  { title: 'Ride Along Request', url: 'https://docs.google.com/' },
  { title: 'Complaint Form', url: 'https://docs.google.com/' },
  { title: 'Training Request', url: 'https://docs.google.com/' },
  { title: 'Supervisor Review Form', url: 'https://docs.google.com/' },
]

export default function App() {
  const [page, setPage] = useState('about')
  const [officers, setOfficers] = useState([])
  const [monthlyChecks, setMonthlyChecks] = useState([])
  const [monthlyCycles, setMonthlyCycles] = useState([])

  const [accessLevel, setAccessLevel] = useState('public')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedInUser, setLoggedInUser] = useState('')
  const [message, setMessage] = useState('')

  const [rosterSearch, setRosterSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [divisionFilter, setDivisionFilter] = useState('All')
  const [rankFilter, setRankFilter] = useState('All')

  const [newOfficer, setNewOfficer] = useState({
    full_name: '',
    callsign: '',
    badge_number: '',
    rank: 'Officer',
    division: 'Patrol',
    promotion_date: '',
    notes: '',
  })

  const [monthlyForm, setMonthlyForm] = useState({
    callsign: '',
    patrol_hours: '',
    activity_summary: '',
    supervisor: '',
    submission_month: new Date().toISOString().slice(0, 7),
  })

  useEffect(() => {
    loadAllData()
  }, [])

  function showMessage(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  async function loadAllData() {
    await Promise.all([
      loadOfficers(),
      loadMonthlyChecks(),
      loadMonthlyCycles(),
    ])
  }

  async function loadOfficers() {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) setOfficers(data)
  }

  async function loadMonthlyChecks() {
    const { data, error } = await supabase
      .from('monthly_checks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setMonthlyChecks(data)
  }

  async function loadMonthlyCycles() {
    const { data, error } = await supabase
      .from('monthly_cycles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setMonthlyCycles(data)
  }

  function login() {
    const matchedAdmin = adminUsers.find(
      admin =>
        admin.username.toLowerCase() === username.toLowerCase() &&
        admin.password === password
    )

    if (matchedAdmin) {
      setAccessLevel('supervisor')
      setLoggedInUser(matchedAdmin.role)
      setPage('roster')
      setUsername('')
      setPassword('')
      showMessage(`Welcome ${matchedAdmin.role}`)
      return
    }

    if (
      username.toLowerCase() === 'officer@lspd.gov' &&
      password === 'lspd123'
    ) {
      setAccessLevel('officer')
      setLoggedInUser('Officer')
      setPage('monthly')
      setUsername('')
      setPassword('')
      showMessage('Officer access granted.')
      return
    }

    showMessage('Incorrect credentials.')
  }

  function logout() {
    setAccessLevel('public')
    setLoggedInUser('')
    setPage('about')
    setUsername('')
    setPassword('')
    showMessage('Logged out.')
  }

  function canAccessOfficerPages() {
    return accessLevel === 'officer' || accessLevel === 'supervisor'
  }

  function canAccessRoster() {
    return accessLevel === 'supervisor'
  }

  function isProtectedStatus(status) {
    return protectedStatuses.includes(status)
  }

  function displayStatus(officer) {
    if (isProtectedStatus(officer.status)) return officer.status
    if (officer.status === 'Inactive') return 'Inactive'
    return officer.monthly_activity_completed ? 'Active' : 'Inactive'
  }

  const filteredOfficers = officers.filter(officer => {
    const search = rosterSearch.toLowerCase()
    const realStatus = displayStatus(officer)

    const matchesSearch =
      officer.full_name?.toLowerCase().includes(search) ||
      officer.callsign?.toLowerCase().includes(search) ||
      officer.badge_number?.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'All' || realStatus === statusFilter

    const matchesDivision =
      divisionFilter === 'All' || officer.division === divisionFilter

    const matchesRank =
      rankFilter === 'All' || officer.rank === rankFilter

    return matchesSearch && matchesStatus && matchesDivision && matchesRank
  })

  async function addOfficer(e) {
    e.preventDefault()

    if (!newOfficer.full_name || !newOfficer.callsign || !newOfficer.rank) {
      showMessage('Please complete name, callsign, and rank.')
      return
    }

    const { error } = await supabase.from('officers').insert({
      full_name: newOfficer.full_name,
      callsign: newOfficer.callsign,
      badge_number: newOfficer.badge_number,
      rank: newOfficer.rank,
      division: newOfficer.division,
      promotion_date: newOfficer.promotion_date || null,
      notes: newOfficer.notes,
      status: 'Active',
      monthly_activity_completed: true,
      last_activity_check: new Date().toISOString(),
    })

    if (error) {
      showMessage(error.message)
      return
    }

    setNewOfficer({
      full_name: '',
      callsign: '',
      badge_number: '',
      rank: 'Officer',
      division: 'Patrol',
      promotion_date: '',
      notes: '',
    })

    showMessage('Officer added and marked Active.')
    loadAllData()
  }

  async function removeOfficer(id) {
    await supabase.from('officers').delete().eq('id', id)
    showMessage('Officer removed.')
    loadAllData()
  }

  async function updateOfficer(id, updates) {
    const { error } = await supabase
      .from('officers')
      .update(updates)
      .eq('id', id)

    if (error) {
      showMessage(error.message)
      return
    }

    showMessage('Officer updated.')
    loadAllData()
  }

  async function updateOfficerStatus(officer, newStatus) {
    const updates = { status: newStatus }

    if (newStatus === 'Active') {
      updates.monthly_activity_completed = true
      updates.last_activity_check = new Date().toISOString()
    }

    if (newStatus === 'Inactive') {
      updates.monthly_activity_completed = false
      updates.last_activity_check = null
    }

    await updateOfficer(officer.id, updates)
  }

  async function startNewMonth() {
    const month = new Date().toISOString().slice(0, 7)

    const { error: cycleError } = await supabase.from('monthly_cycles').insert({
      month,
      started_by: loggedInUser || 'Supervisor',
    })

    if (cycleError) {
      showMessage(cycleError.message)
      return
    }

    const resettableOfficerIds = officers
      .filter(officer => !isProtectedStatus(officer.status))
      .map(officer => officer.id)

    if (resettableOfficerIds.length > 0) {
      const { error: resetError } = await supabase
        .from('officers')
        .update({
          status: 'Inactive',
          monthly_activity_completed: false,
          last_activity_check: null,
        })
        .in('id', resettableOfficerIds)

      if (resetError) {
        showMessage(resetError.message)
        return
      }
    }

    showMessage('New month started. Regular officers were reset to Inactive.')
    loadAllData()
  }

  async function submitMonthlyCheck(e) {
    e.preventDefault()

    const officer = officers.find(
      o => o.callsign.toLowerCase() === monthlyForm.callsign.toLowerCase()
    )

    if (!officer) {
      showMessage('No officer found with that callsign.')
      return
    }

    const { error } = await supabase.from('monthly_checks').insert({
      officer_id: officer.id,
      officer_name: officer.full_name,
      callsign: officer.callsign,
      rank: officer.rank,
      patrol_hours: Number(monthlyForm.patrol_hours),
      activity_summary: monthlyForm.activity_summary,
      supervisor: monthlyForm.supervisor,
      submission_month: monthlyForm.submission_month,
    })

    if (error) {
      showMessage(error.message)
      return
    }

    await supabase
      .from('officers')
      .update({
        status: 'Active',
        monthly_activity_completed: true,
        last_activity_check: new Date().toISOString(),
      })
      .eq('id', officer.id)

    setMonthlyForm({
      callsign: '',
      patrol_hours: '',
      activity_summary: '',
      supervisor: '',
      submission_month: new Date().toISOString().slice(0, 7),
    })

    showMessage('Monthly activity check submitted.')
    loadAllData()
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="relative overflow-hidden border-b border-blue-900 bg-[#020617]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#1e3a8a] opacity-95"></div>
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl"></div>
        <div className="absolute left-0 bottom-0 w-full h-[1px] bg-blue-500/60"></div>

        <div className="relative max-w-6xl mx-auto px-6 py-12 flex justify-between items-center">
          <div className="flex gap-6 items-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-blue-500 bg-[#0f172a] flex items-center justify-center shadow-2xl shadow-blue-900/40">
              <img
                src="/lspd-badge.png"
                alt="LSPD Badge"
                className="w-full h-full object-contain p-2"
              />
            </div>

            <div>
              <p className="uppercase tracking-[8px] text-blue-400 text-sm font-semibold">
                LOS SANTOS POLICE DEPARTMENT
              </p>

              <h1 className="text-6xl font-black mt-2 leading-none tracking-tight">
                LSPD PORTAL
              </h1>

              <div className="flex items-center gap-3 mt-4">
                <div className="w-16 h-[2px] bg-blue-500"></div>
                <p className="text-gray-300 text-lg tracking-wide">
                  Professional Law Enforcement Management System
                </p>
              </div>
            </div>
          </div>

          {accessLevel !== 'public' && (
            <div className="text-right">
              <p className="text-blue-300 mb-2">
                Logged in as: {loggedInUser}
              </p>
              <button
                onClick={logout}
                className="border border-red-700 px-5 py-3 rounded-xl hover:bg-red-950"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-[260px_1fr] gap-6">
        <nav className="bg-[#061126] border border-[#13203a] rounded-2xl p-5">
          <p className="text-xs tracking-[4px] text-blue-300 uppercase mb-6">
            Navigation
          </p>

          <Nav icon={<Info />} text="About Us" active={page === 'about'} onClick={() => setPage('about')} />
          <Nav icon={<FileText />} text="Apply Here" active={page === 'apply'} onClick={() => setPage('apply')} />
          <Nav icon={<Mail />} text="Contact Us" active={page === 'contact'} onClick={() => setPage('contact')} />
          <Nav icon={<ClipboardCheck />} text="Monthly Activity Check" active={page === 'monthly'} onClick={() => canAccessOfficerPages() ? setPage('monthly') : setPage('login')} />
          <Nav icon={<Lock />} text="Department Forms" active={page === 'forms'} onClick={() => canAccessOfficerPages() ? setPage('forms') : setPage('login')} />
          <Nav icon={<Users />} text="Master Roster" active={page === 'roster'} onClick={() => canAccessRoster() ? setPage('roster') : setPage('login')} />
        </nav>

        <section className="bg-[#061126] border border-[#13203a] rounded-2xl p-6">
          {message && (
            <div className="mb-4 border border-blue-700 rounded-xl p-3 text-blue-200">
              {message}
            </div>
          )}

          {page === 'about' && (
            <>
              <div className="relative overflow-hidden rounded-2xl border border-blue-900 mb-8">
                <img
                  src="/about-main.jpg"
                  alt="Los Santos Police Department"
                  className="w-full h-72 object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/70 to-transparent"></div>
                <div className="absolute left-8 bottom-8 max-w-xl">
                  <p className="uppercase tracking-[5px] text-blue-300 text-sm mb-2">
                    About the Department
                  </p>
                  <h2 className="text-5xl font-black mb-3">
                    Serving Los Santos
                  </h2>
                  <p className="text-gray-300">
                    Dedicated to professionalism, realistic roleplay, public safety, and strong community leadership.
                  </p>
                </div>
              </div>

              <h2 className="text-4xl font-bold mb-4">About Us</h2>
              <p className="text-gray-300 mb-8">
                The Los Santos Police Department is committed to protecting the city, supporting the community,
                and maintaining professional roleplay standards. Our department values accountability, discipline,
                teamwork, and service above self.
              </p>

              <div className="grid md:grid-cols-3 gap-5 mb-8">
                <Card title="Mission" text="Provide fair, realistic, and professional law enforcement roleplay across Los Santos." />
                <Card title="Values" text="Integrity, discipline, accountability, teamwork, and respect for the community." />
                <Card title="Community" text="Building trust through active patrols, public interaction, and reliable department leadership." />
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                <ImageCard
                  image="/patrol.jpg"
                  title="Patrol Operations"
                  text="Active patrol units maintain public safety and visible law enforcement presence across the city."
                />

                <ImageCard
                  image="/command.jpg"
                  title="Command Leadership"
                  text="Command staff oversees department standards, training, discipline, and operational readiness."
                />

                <ImageCard
                  image="/community.jpg"
                  title="Community Engagement"
                  text="LSPD works to build trust through professionalism, responsiveness, and respectful public contact."
                />
              </div>
            </>
          )}

          {page === 'apply' && (
            <>
              <div className="relative overflow-hidden rounded-2xl border border-blue-900 mb-8">
                <img
                  src="/community.jpg"
                  alt="LSPD Recruitment"
                  className="w-full h-72 object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/70 to-transparent"></div>
                <div className="absolute left-8 bottom-8 max-w-xl">
                  <p className="uppercase tracking-[5px] text-blue-300 text-sm mb-2">
                    Recruitment Division
                  </p>
                  <h2 className="text-5xl font-black mb-3">
                    Join the LSPD
                  </h2>
                  <p className="text-gray-300">
                    Become part of a professional law enforcement team dedicated to realism,
                    leadership, teamwork, and public safety.
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-[350px_1fr] gap-6">
                <div className="bg-[#0f172a] border border-blue-900 rounded-2xl p-6 h-fit">
                  <h3 className="text-3xl font-bold mb-5">
                    Applicant Requirements
                  </h3>

                  <ul className="space-y-4 text-gray-300">
                    <li>• Professional and mature roleplay behavior.</li>
                    <li>• Working microphone and communication skills.</li>
                    <li>• Understanding of server rules and department SOPs.</li>
                    <li>• Ability to remain active within the department.</li>
                    <li>• Willingness to complete academy and field training.</li>
                    <li>• Respect for chain of command and department structure.</li>
                  </ul>

                  <div className="mt-8 border-t border-blue-900 pt-6">
                    <h4 className="text-xl font-semibold mb-3">
                      Recruitment Status
                    </h4>

                    <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700 px-4 py-2 rounded-xl text-green-300">
                      Applications Open
                    </div>
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-blue-900 rounded-2xl overflow-hidden">
                  <div className="border-b border-blue-900 px-6 py-4">
                    <h3 className="text-3xl font-bold">
                      LSPD Application Form
                    </h3>

                    <p className="text-gray-400 mt-2">
                      Complete the application below to apply for the Los Santos Police Department.
                    </p>
                  </div>

                  <iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLSeof6PQ7y5-YAsoI8PpgKuzGCENbRozvI_xYef05xneiI3euw/viewform?embedded=true"
                    width="100%"
                    height="1200"
                    frameBorder="0"
                    marginHeight="0"
                    marginWidth="0"
                    className="bg-white"
                  >
                    Loading…
                  </iframe>
                </div>
              </div>
            </>
          )}

        {page === 'contact' && (
  <>
    <div className="relative overflow-hidden rounded-2xl border border-blue-900 mb-8">
      <img
        src="/patrol.jpg"
        alt="Contact LSPD"
        className="w-full h-72 object-cover opacity-75"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/75 to-transparent"></div>

      <div className="absolute left-8 bottom-8 max-w-xl">
        <p className="uppercase tracking-[5px] text-blue-300 text-sm mb-2">
          Department Contact
        </p>

        <h2 className="text-5xl font-black mb-3">
          Contact Us
        </h2>

        <p className="text-gray-300">
          Reach command staff for recruitment questions, complaints,
          partnerships, or general department support.
        </p>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-4 mb-8">
      <ContactCard
        icon={<MessageSquare size={24} />}
        title="LSPD Discord"
        text="Official Los Santos Police Department communications server."
        detail="discord.gg/GznXtDbPqA"
        link="https://discord.gg/GznXtDbPqA"
      />

      <ContactCard
        icon={<Users size={24} />}
        title="Royalty County Roleplay"
        text="Official main community Discord server."
        detail="discord.gg/RaERpXvuVH"
        link="https://discord.gg/RaERpXvuVH"
      />

      <ContactCard
        icon={<Clock size={24} />}
        title="Response Time"
        text="Command staff will respond as soon as available."
        detail="Usually within 24-48 hours"
      />
    </div>

    <div className="grid lg:grid-cols-[1fr_420px] gap-6">
      <form
        onSubmit={handleContactSubmit}
        className="bg-[#0f172a] border border-blue-900 rounded-2xl p-6"
      >
        <h3 className="text-3xl font-bold mb-4">
          Send a Message
        </h3>

        <p className="text-gray-400 mb-6">
          Fill this out and your email client will open with the message prepared.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            value={contactForm.name}
            onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
            placeholder="Your Name"
            className="input"
          />

          <input
            value={contactForm.contact}
            onChange={e => setContactForm({ ...contactForm, contact: e.target.value })}
            placeholder="Discord or Email"
            className="input"
          />
        </div>

        <select
          value={contactForm.reason}
          onChange={e => setContactForm({ ...contactForm, reason: e.target.value })}
          className="input mb-4"
        >
          <option>General Question</option>
          <option>Recruitment Question</option>
          <option>Complaint</option>
          <option>Partnership Request</option>
          <option>Command Staff Contact</option>
          <option>Website Issue</option>
        </select>

        <textarea
          value={contactForm.message}
          onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
          placeholder="Message"
          className="input min-h-40 mb-4"
        />

        <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl">
          <Send size={18} />
          Prepare Email
        </button>
      </form>

      <div className="bg-[#0f172a] border border-blue-900 rounded-2xl p-6 h-fit">
        <h3 className="text-3xl font-bold mb-4">
          Department Leadership
        </h3>

        <div className="space-y-4 text-gray-300">
          <div className="border border-blue-900 rounded-xl p-4">
            <p className="font-bold text-white">Chief of Police</p>
            <p>Jack Malone</p>
          </div>

          <div className="border border-blue-900 rounded-xl p-4">
            <p className="font-bold text-white">Assistant Chief</p>
            <p>Ryan Parish</p>
          </div>

          <div className="border border-blue-900 rounded-xl p-4">
            <p className="font-bold text-white">Deputy Chief</p>
            <p>Ashley Alastor</p>
          </div>

          <div className="border border-blue-900 rounded-xl p-4">
            <p className="font-bold text-white">Watch Commander</p>
            <p>Alaina Alastor</p>
          </div>

          <div className="border border-blue-900 rounded-xl p-4">
            <p className="font-bold text-white">Website Inquiries</p>
            <p>Bryce Parish (spedsped.)</p>
          </div>
        </div>
      </div>
    </div>
  </>
)}

          {page === 'login' && (
            <>
              <h2 className="text-4xl font-bold mb-4">Department Login</h2>

              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                type="text"
                placeholder="Username"
                className="input max-w-md mb-4"
              />

              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                className="input max-w-md mb-4"
              />

              <button
                onClick={login}
                className="block bg-blue-600 px-6 py-3 rounded-xl"
              >
                Login
              </button>
            </>
          )}

          {page === 'monthly' && canAccessOfficerPages() && (
            <>
              <h2 className="text-4xl font-bold mb-6">Monthly Activity Check</h2>

              <form onSubmit={submitMonthlyCheck} className="grid gap-4">
                <input placeholder="Callsign" value={monthlyForm.callsign} onChange={e => setMonthlyForm({ ...monthlyForm, callsign: e.target.value })} className="input" />
                <input placeholder="Patrol Hours" type="number" value={monthlyForm.patrol_hours} onChange={e => setMonthlyForm({ ...monthlyForm, patrol_hours: e.target.value })} className="input" />
                <input placeholder="Supervisor" value={monthlyForm.supervisor} onChange={e => setMonthlyForm({ ...monthlyForm, supervisor: e.target.value })} className="input" />
                <input type="month" value={monthlyForm.submission_month} onChange={e => setMonthlyForm({ ...monthlyForm, submission_month: e.target.value })} className="input" />
                <textarea placeholder="Activity Summary" value={monthlyForm.activity_summary} onChange={e => setMonthlyForm({ ...monthlyForm, activity_summary: e.target.value })} className="input min-h-32" />

                <button className="bg-blue-600 px-6 py-3 rounded-xl">
                  Submit Monthly Check
                </button>
              </form>
            </>
          )}

          {page === 'forms' && canAccessOfficerPages() && (
            <>
              <h2 className="text-4xl font-bold mb-4">Department Forms</h2>
              <p className="text-gray-300 mb-6">
                Select a department form below. Replace each link with your actual Google Doc, Google Form, PDF, or policy document.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {departmentForms.map(form => (
                  <a
                    key={form.title}
                    href={form.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#0f172a] border border-blue-900 rounded-xl p-5 hover:bg-blue-950 transition"
                  >
                    <h3 className="text-xl font-semibold">{form.title}</h3>
                    <p className="text-gray-400 mt-2">Open linked form</p>
                  </a>
                ))}
              </div>
            </>
          )}

          {page === 'roster' && canAccessRoster() && (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-4xl font-bold">Master Roster</h2>

                <button
                  onClick={startNewMonth}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
                >
                  <RotateCcw size={18} />
                  Start New Month
                </button>
              </div>

              <div className="grid md:grid-cols-4 gap-3 mb-6">
                <input placeholder="Search name, callsign, badge..." value={rosterSearch} onChange={e => setRosterSearch(e.target.value)} className="input" />

                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input">
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>LOA</option>
                  <option>VACANT</option>
                  <option>Suspended</option>
                  <option>Under Investigation</option>
                </select>

                <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)} className="input">
                  <option>All</option>
                  {divisions.map(division => <option key={division}>{division}</option>)}
                </select>

                <select value={rankFilter} onChange={e => setRankFilter(e.target.value)} className="input">
                  <option>All</option>
                  {ranks.map(rank => <option key={rank}>{rank}</option>)}
                </select>
              </div>

              <form onSubmit={addOfficer} className="grid md:grid-cols-3 gap-3 mb-8">
                <input placeholder="Full Name" value={newOfficer.full_name} onChange={e => setNewOfficer({ ...newOfficer, full_name: e.target.value })} className="input" />
                <input placeholder="Callsign" value={newOfficer.callsign} onChange={e => setNewOfficer({ ...newOfficer, callsign: e.target.value })} className="input" />
                <input placeholder="Badge Number" value={newOfficer.badge_number} onChange={e => setNewOfficer({ ...newOfficer, badge_number: e.target.value })} className="input" />

                <select value={newOfficer.rank} onChange={e => setNewOfficer({ ...newOfficer, rank: e.target.value })} className="input">
                  {ranks.map(rank => <option key={rank}>{rank}</option>)}
                </select>

                <select value={newOfficer.division} onChange={e => setNewOfficer({ ...newOfficer, division: e.target.value })} className="input">
                  {divisions.map(division => <option key={division}>{division}</option>)}
                </select>

                <input type="date" value={newOfficer.promotion_date} onChange={e => setNewOfficer({ ...newOfficer, promotion_date: e.target.value })} className="input" />
                <textarea placeholder="Notes" value={newOfficer.notes} onChange={e => setNewOfficer({ ...newOfficer, notes: e.target.value })} className="input md:col-span-2" />

                <button className="bg-blue-600 rounded-xl">
                  Add Officer
                </button>
              </form>

              <div className="space-y-4 mb-10">
                {filteredOfficers.map(officer => {
                  const realStatus = displayStatus(officer)

                  return (
                    <div key={officer.id} className="bg-[#0f172a] border border-blue-900 rounded-xl p-4">
                      <div className="flex justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">{officer.full_name}</h3>
                          <p className="text-gray-400">{officer.rank} | {officer.callsign}</p>
                          <p className="text-gray-400">Badge: {officer.badge_number || 'N/A'}</p>
                          <p className="text-gray-400">Division: {officer.division || 'Patrol'}</p>
                          <p>Status: {realStatus}</p>
                          <p className="text-gray-400">Promotion Date: {officer.promotion_date || 'N/A'}</p>
                          <p className="text-gray-400">
                            Last Activity Check: {officer.last_activity_check ? new Date(officer.last_activity_check).toLocaleDateString() : 'N/A'}
                          </p>
                          {officer.notes && <p className="text-gray-400 mt-2">Notes: {officer.notes}</p>}
                        </div>

                        <div className="flex flex-col gap-2">
                          <select value={officer.status} onChange={e => updateOfficerStatus(officer, e.target.value)} className="bg-[#020617] border border-blue-900 rounded-xl px-3 py-2">
                            <option>Active</option>
                            <option>Inactive</option>
                            <option>LOA</option>
                            <option>VACANT</option>
                            <option>Suspended</option>
                            <option>Under Investigation</option>
                          </select>

                          <select value={officer.rank} onChange={e => updateOfficer(officer.id, { rank: e.target.value })} className="bg-[#020617] border border-blue-900 rounded-xl px-3 py-2">
                            {ranks.map(rank => <option key={rank}>{rank}</option>)}
                          </select>

                          <select value={officer.division || 'Patrol'} onChange={e => updateOfficer(officer.id, { division: e.target.value })} className="bg-[#020617] border border-blue-900 rounded-xl px-3 py-2">
                            {divisions.map(division => <option key={division}>{division}</option>)}
                          </select>

                          <button onClick={() => removeOfficer(officer.id)} className="bg-red-700 px-4 py-2 rounded-xl">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <LogPanel title="Submission History" icon={<History size={20} />}>
                {monthlyChecks.length === 0 ? (
                  <p className="text-gray-400">No monthly checks submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {monthlyChecks.map(check => (
                      <div key={check.id} className="border border-blue-900 rounded-xl p-4">
                        <p className="font-bold">{check.officer_name || 'Unknown Officer'} | {check.callsign || 'N/A'}</p>
                        <p className="text-gray-400">Rank: {check.rank || 'N/A'}</p>
                        <p className="text-gray-400">Month: {check.submission_month}</p>
                        <p className="text-gray-400">Patrol Hours: {check.patrol_hours}</p>
                        <p className="text-gray-400">Supervisor: {check.supervisor}</p>
                        <p className="text-gray-400 mt-2">Summary: {check.activity_summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </LogPanel>

              <LogPanel title="Monthly Cycle History">
                {monthlyCycles.length === 0 ? (
                  <p className="text-gray-400">No monthly cycles started yet.</p>
                ) : (
                  <div className="space-y-3">
                    {monthlyCycles.map(cycle => (
                      <div key={cycle.id} className="border border-blue-900 rounded-xl p-4">
                        <p className="font-bold">Month: {cycle.month}</p>
                        <p className="text-gray-400">Started By: {cycle.started_by || 'N/A'}</p>
                        <p className="text-gray-400">Date: {new Date(cycle.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </LogPanel>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function Nav({ icon, text, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl mb-3 text-left ${
        active ? 'bg-blue-600 text-white' : 'hover:bg-[#0f172a] text-gray-300'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-left leading-tight">{text}</span>
    </button>
  )
}

function Card({ title, text }) {
  return (
    <div className="bg-[#0b1328] border border-blue-900 rounded-2xl p-6">
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-400">{text}</p>
    </div>
  )
}

function ImageCard({ image, title, text }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-900 bg-[#0f172a]">
      <img
        src={image}
        alt={title}
        className="h-44 w-full object-cover opacity-85"
      />
      <div className="p-5">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{text}</p>
      </div>
    </div>
  )
}

function ContactCard({ icon, title, text, detail, link }) {
  return (
    <div className="bg-[#0f172a] border border-blue-900 rounded-2xl p-5">
      <div className="text-blue-300 mb-4">{icon}</div>

      <h3 className="text-2xl font-bold mb-2">{title}</h3>

      <p className="text-gray-400 mb-4">{text}</p>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="text-blue-300 font-semibold hover:text-blue-200 underline"
        >
          {detail}
        </a>
      ) : (
        <p className="text-blue-300 font-semibold">{detail}</p>
      )}
    </div>
  )
}

function LogPanel({ title, icon, children }) {
  return (
    <div className="bg-[#0f172a] border border-blue-900 rounded-xl p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-2xl font-bold">{title}</h3>
      </div>
      {children}
    </div>
  )
}
