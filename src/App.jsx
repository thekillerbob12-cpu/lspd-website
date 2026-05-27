import { useEffect, useState } from 'react'
import {
  Shield,
 Info,
  FileText,
  Mail,
  Lock,
  Users,
  Trash2,
  ClipboardCheck
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

const adminUsers = [
  {
    username: 'R.parish@lspd.gov',
    password: 'LSPDHC302',
    role: 'Chief of Police',
  },
  {
    username: 'J.malone@lspd.gov',
    password: 'LSPDHC301',
    role: 'Assistant Chief',
  },
  {
    username: 'A.alastor1@lspd.gov',
    password: 'LSPDHC303',
    role: 'Deputy Chief',
  },
  {
    username: 'A.alastor2@lspd.gov',
    password: 'LSPDHC304',
    role: 'Commander',
  },
  {
    username: 'admin@lspd.gov',
    password: 'adminpass100!',
    role: 'System Administrator',
  },
]

export default function App() {
  const [page, setPage] = useState('about')
  const [officers, setOfficers] = useState([])
  const [accessLevel, setAccessLevel] = useState('public')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedInUser, setLoggedInUser] = useState('')

  const [message, setMessage] = useState('')

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
    loadOfficers()
  }, [])

  function showMessage(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  async function loadOfficers() {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) setOfficers(data)
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
    showMessage('Officer updated.')
    loadOfficers()
  }

  async function updateStatus(id, status) {
    await updateOfficer(id, { status })
  }

  async function submitMonthlyCheck(e) {
    e.preventDefault()

    const officer = officers.find(
      o => o.callsign.toLowerCase() === monthlyForm.callsign.toLowerCase()
    )

    if (!officer) {
      showMessage('No officer found.')
      return
    }

    const { error } = await supabase.from('monthly_checks').insert({
      officer_id: officer.id,
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
    loadOfficers()
  }

  function displayStatus(officer) {
    if (
      ['VACANT', 'LOA', 'Suspended', 'Under Investigation']
        .includes(officer.status)
    ) {
      return officer.status
    }

    return officer.monthly_activity_completed
      ? 'Active'
      : 'Inactive'
  }

  const departmentForms = [
    { title: 'Incident Report', url: 'https://docs.google.com/' },
    { title: 'Arrest Report', url: 'https://docs.google.com/' },
    { title: 'Use of Force Report', url: 'https://docs.google.com/' },
    { title: 'Leave of Absence Request', url: 'https://docs.google.com/' },
    { title: 'Ride Along Request', url: 'https://docs.google.com/' },
    { title: 'Complaint Form', url: 'https://docs.google.com/' },
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
                Serving Los Santos with professionalism,
                integrity, and dedication.
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

          {page === 'about' && (
            <>
              <h2 className="text-4xl font-bold mb-4">
                About Us
              </h2>

              <p className="text-gray-300">
                The Los Santos Police Department is committed
                to protecting the city and maintaining
                professional roleplay standards.
              </p>
            </>
          )}

          {page === 'apply' && (
            <>
              <h2 className="text-4xl font-bold mb-4">
                Apply Here
              </h2>

              <p className="text-gray-300">
                Recruitment applications coming soon.
              </p>
            </>
          )}

          {page === 'contact' && (
            <>
              <h2 className="text-4xl font-bold mb-4">
                Contact Us
              </h2>

              <p className="text-gray-300">
                Contact command staff through Discord.
              </p>
            </>
          )}

          {page === 'login' && (
            <>
              <h2 className="text-4xl font-bold mb-4">
                Department Login
              </h2>

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

              <p className="text-gray-400 mt-4">
                Officer Login:
                <br />
                officer@lspd.gov / lspd123
              </p>
            </>
          )}

          {page === 'monthly' && canAccessOfficerPages() && (
            <>
              <h2 className="text-4xl font-bold mb-6">
                Monthly Activity Check
              </h2>

              <form onSubmit={submitMonthlyCheck} className="grid gap-4">
                <input placeholder="Callsign" value={monthlyForm.callsign} onChange={e => setMonthlyForm({ ...monthlyForm, callsign: e.target.value })} className="input" />
                <input placeholder="Patrol Hours" type="number" value={monthlyForm.patrol_hours} onChange={e => setMonthlyForm({ ...monthlyForm, patrol_hours: e.target.value })} className="input" />
                <input placeholder="Supervisor" value={monthlyForm.supervisor} onChange={e => setMonthlyForm({ ...monthlyForm, supervisor: e.target.value })} className="input" />
                <input type="month" value={monthlyForm.submission_month} onChange={e => setMonthlyForm({ ...monthlyForm, submission_month: e.target.value })} className="input" />

                <textarea
                  placeholder="Activity Summary"
                  value={monthlyForm.activity_summary}
                  onChange={e =>
                    setMonthlyForm({
                      ...monthlyForm,
                      activity_summary: e.target.value
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
              <h2 className="text-4xl font-bold mb-6">
                Master Roster
              </h2>

              {/* KEEP YOUR EXISTING ROSTER CODE HERE */}
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
      <span className="shrink-0">{icon}</span>
      <span className="text-left leading-tight">{text}</span>
    </button>
  )
}
