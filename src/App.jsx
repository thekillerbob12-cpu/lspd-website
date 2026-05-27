import { useEffect, useState } from 'react'
import {
  Shield,
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
    const { data } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: true })

    if (data) setOfficers(data)
  }

  async function loadMonthlyChecks() {
    const { data } = await supabase
      .from('monthly_checks')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setMonthlyChecks(data)
  }

  async function loadMonthlyCycles() {
    const { data } = await supabase
      .from('monthly_cycles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setMonthlyCycles(data)
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

  async function addOfficer(e) {
    e.preventDefault()

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

    showMessage('Officer added.')
    loadOfficers()
  }

  async function removeOfficer(id) {
    await supabase.from('officers').delete().eq('id', id)
    showMessage('Officer removed.')
    loadOfficers()
  }

  async function updateOfficer(id, updates) {
    await supabase.from('officers').update(updates).eq('id', id)
    loadOfficers()
  }

  async function startNewMonth() {
    const month = new Date().toISOString().slice(0, 7)

    await supabase.from('monthly_cycles').insert({
      month,
      started_by: loggedInUser,
    })

    const resettableOfficerIds = officers
      .filter(officer => !protectedStatuses.includes(officer.status))
      .map(officer => officer.id)

    if (resettableOfficerIds.length > 0) {
      await supabase
        .from('officers')
        .update({
          monthly_activity_completed: false,
          last_activity_check: null,
        })
        .in('id', resettableOfficerIds)
    }

    showMessage('New month started.')
    loadAllData()
  }

  async function submitMonthlyCheck(e) {
    e.preventDefault()

    const officer = officers.find(
      o => o.callsign.toLowerCase() === monthlyForm.callsign.toLowerCase()
    )

    if (!officer) {
      showMessage('Officer not found.')
      return
    }

    await supabase.from('monthly_checks').insert({
      officer_id: officer.id,
      officer_name: officer.full_name,
      callsign: officer.callsign,
      rank: officer.rank,
      patrol_hours: Number(monthlyForm.patrol_hours),
      activity_summary: monthlyForm.activity_summary,
      supervisor: monthlyForm.supervisor,
      submission_month: monthlyForm.submission_month,
    })

    await supabase
      .from('officers')
      .update({
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

    showMessage('Monthly activity submitted.')
    loadAllData()
  }

  function displayStatus(officer) {
    if (protectedStatuses.includes(officer.status)) {
      return officer.status
    }

    return officer.monthly_activity_completed ? 'Active' : 'Inactive'
  }

  const filteredOfficers = officers.filter(officer => {
    const search = rosterSearch.toLowerCase()

    const matchesSearch =
      officer.full_name?.toLowerCase().includes(search) ||
      officer.callsign?.toLowerCase().includes(search) ||
      officer.badge_number?.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'All' || displayStatus(officer) === statusFilter

    const matchesDivision =
      divisionFilter === 'All' || officer.division === divisionFilter

    const matchesRank =
      rankFilter === 'All' || officer.rank === rankFilter

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDivision &&
      matchesRank
    )
  })

  const departmentForms = [
    { title: 'Incident Report', url: 'https://docs.google.com/' },
    { title: 'Arrest Report', url: 'https://docs.google.com/' },
    { title: 'Use of Force Report', url: 'https://docs.google.com/' },
    { title: 'Leave of Absence Request', url: 'https://docs.google.com/' },
  ]

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] border-b border-blue-900">
        <div className="max-w-6xl mx-auto px-6 py-10 flex justify-between">
          <div className="flex gap-5">
            <div className="w-16 h-16 rounded-2xl border border-blue-500 bg-[#0f172a] flex items-center justify-center">
              <Shield className="text-blue-400" size={34} />
            </div>

            <div>
              <p className="uppercase tracking-[6px] text-blue-300 text-sm">
                Los Santos Police Department
              </p>

              <h1 className="text-5xl font-bold mt-2">
                LSPD Department Portal
              </h1>

              <p className="text-gray-300 mt-4">
                Serving Los Santos with professionalism, integrity, and dedication.
              </p>
            </div>
          </div>

          {accessLevel !== 'public' && (
            <div className="text-right">
              <p className="text-blue-300 mb-2">
                Logged in as: {loggedInUser}
              </p>

              <button
                onClick={logout}
                className="border border-red-700 px-5 py-3 rounded-xl"
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

          <Nav
            icon={<ClipboardCheck />}
            text="Monthly Activity Check"
            active={page === 'monthly'}
            onClick={() =>
              canAccessOfficerPages()
                ? setPage('monthly')
                : setPage('login')
            }
          />

          <Nav
            icon={<Lock />}
            text="Department Forms"
            active={page === 'forms'}
            onClick={() =>
              canAccessOfficerPages()
                ? setPage('forms')
                : setPage('login')
            }
          />

          <Nav
            icon={<Users />}
            text="Master Roster"
            active={page === 'roster'}
            onClick={() =>
              canAccessRoster()
                ? setPage('roster')
                : setPage('login')
            }
          />
        </nav>

        <section className="bg-[#061126] border border-[#13203a] rounded-2xl p-6">
          {message && (
            <div className="mb-4 border border-blue-700 rounded-xl p-3 text-blue-200">
              {message}
            </div>
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
              <h2 className="text-4xl font-bold mb-6">
                Monthly Activity Check
              </h2>

              <form onSubmit={submitMonthlyCheck} className="grid gap-4">
                <input
                  placeholder="Callsign"
                  value={monthlyForm.callsign}
                  onChange={e =>
                    setMonthlyForm({
                      ...monthlyForm,
                      callsign: e.target.value,
                    })
                  }
                  className="input"
                />

                <input
                  placeholder="Patrol Hours"
                  type="number"
                  value={monthlyForm.patrol_hours}
                  onChange={e =>
                    setMonthlyForm({
                      ...monthlyForm,
                      patrol_hours: e.target.value,
                    })
                  }
                  className="input"
                />

                <input
                  placeholder="Supervisor"
                  value={monthlyForm.supervisor}
                  onChange={e =>
                    setMonthlyForm({
                      ...monthlyForm,
                      supervisor: e.target.value,
                    })
                  }
                  className="input"
                />

                <textarea
                  placeholder="Activity Summary"
                  value={monthlyForm.activity_summary}
                  onChange={e =>
                    setMonthlyForm({
                      ...monthlyForm,
                      activity_summary: e.target.value,
                    })
                  }
                  className="input min-h-32"
                />

                <button className="bg-blue-600 px-6 py-3 rounded-xl">
                  Submit Monthly Check
                </button>
              </form>
            </>
          )}

          {page === 'forms' && canAccessOfficerPages() && (
            <>
              <h2 className="text-4xl font-bold mb-6">
                Department Forms
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {departmentForms.map(form => (
                  <a
                    key={form.title}
                    href={form.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#0f172a] border border-blue-900 rounded-xl p-5 hover:bg-blue-950 transition"
                  >
                    <h3 className="text-xl font-semibold">
                      {form.title}
                    </h3>

                    <p className="text-gray-400 mt-2">
                      Open linked form
                    </p>
                  </a>
                ))}
              </div>
            </>
          )}

          {page === 'roster' && canAccessRoster() && (
            <>
              <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
                <h2 className="text-4xl font-bold">
                  Master Roster
                </h2>

                <button
                  onClick={startNewMonth}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
                >
                  <RotateCcw size={18} />
                  Start New Month
                </button>
              </div>

              <div className="grid md:grid-cols-4 gap-3 mb-6">
                <input
                  placeholder="Search officers..."
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  className="input"
                />

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="input"
                >
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>LOA</option>
                  <option>VACANT</option>
                  <option>Suspended</option>
                  <option>Under Investigation</option>
                </select>

                <select
                  value={divisionFilter}
                  onChange={e => setDivisionFilter(e.target.value)}
                  className="input"
                >
                  <option>All</option>

                  {divisions.map(division => (
                    <option key={division}>
                      {division}
                    </option>
                  ))}
                </select>

                <select
                  value={rankFilter}
                  onChange={e => setRankFilter(e.target.value)}
                  className="input"
                >
                  <option>All</option>

                  {ranks.map(rank => (
                    <option key={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </div>

              <form
                onSubmit={addOfficer}
                className="grid md:grid-cols-3 gap-3 mb-8"
              >
                <input
                  placeholder="Full Name"
                  value={newOfficer.full_name}
                  onChange={e =>
                    setNewOfficer({
                      ...newOfficer,
                      full_name: e.target.value,
                    })
                  }
                  className="input"
                />

                <input
                  placeholder="Callsign"
                  value={newOfficer.callsign}
                  onChange={e =>
                    setNewOfficer({
                      ...newOfficer,
                      callsign: e.target.value,
                    })
                  }
                  className="input"
                />

                <input
                  placeholder="Badge Number"
                  value={newOfficer.badge_number}
                  onChange={e =>
                    setNewOfficer({
                      ...newOfficer,
                      badge_number: e.target.value,
                    })
                  }
                  className="input"
                />

                <select
                  value={newOfficer.rank}
                  onChange={e =>
                    setNewOfficer({
                      ...newOfficer,
                      rank: e.target.value,
                    })
                  }
                  className="input"
                >
                  {ranks.map(rank => (
                    <option key={rank}>
                      {rank}
                    </option>
                  ))}
                </select>

                <select
                  value={newOfficer.division}
                  onChange={e =>
                    setNewOfficer({
                      ...newOfficer,
                      division: e.target.value,
                    })
                  }
                  className="input"
                >
                  {divisions.map(division => (
                    <option key={division}>
                      {division}
                    </option>
                  ))}
                </select>

                <button className="bg-blue-600 rounded-xl">
                  Add Officer
                </button>
              </form>

              <div className="space-y-4">
                {filteredOfficers.map(officer => (
                  <div
                    key={officer.id}
                    className="bg-[#0f172a] border border-blue-900 rounded-xl p-4"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold">
                          {officer.full_name}
                        </h3>

                        <p className="text-gray-400">
                          {officer.rank} | {officer.callsign}
                        </p>

                        <p className="text-gray-400">
                          Badge: {officer.badge_number || 'N/A'}
                        </p>

                        <p className="text-gray-400">
                          Division: {officer.division || 'Patrol'}
                        </p>

                        <p>
                          Status: {displayStatus(officer)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <select
                          value={officer.status}
                          onChange={e =>
                            updateOfficer(officer.id, {
                              status: e.target.value,
                            })
                          }
                          className="bg-[#020617] border border-blue-900 rounded-xl px-3 py-2"
                        >
                          <option>Active</option>
                          <option>LOA</option>
                          <option>VACANT</option>
                          <option>Suspended</option>
                          <option>Under Investigation</option>
                        </select>

                        <button
                          onClick={() => removeOfficer(officer.id)}
                          className="bg-red-700 px-4 py-2 rounded-xl"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
        active
          ? 'bg-blue-600 text-white'
          : 'hover:bg-[#0f172a] text-gray-300'
      }`}
    >
      <span className="shrink-0">
        {icon}
      </span>

      <span className="text-left leading-tight">
        {text}
      </span>
    </button>
  )
}
