import { useEffect, useState } from 'react'
import { Shield, Info, FileText, Mail, Lock, Users, UserPlus, Trash2 } from 'lucide-react'
import { supabase } from './supabase'

export default function App() {
  const [page, setPage] = useState('about')
  const [officers, setOfficers] = useState([])
  const [loggedIn, setLoggedIn] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const [newOfficer, setNewOfficer] = useState({
    full_name: '',
    callsign: '',
    rank: '',
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

  async function loadOfficers() {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: true })

    console.log('SUPABASE DATA:', data)
    console.log('SUPABASE ERROR:', error)

    if (!error && data) setOfficers(data)
  }

  function login() {
    if (password === 'lspd123') {
      setLoggedIn(true)
      setAdmin(false)
      setPage('forms')
      setPassword('')
      return
    }

    if (password === 'admin123') {
      setLoggedIn(true)
      setAdmin(true)
      setPage('roster')
      setPassword('')
      return
    }

    alert('Incorrect password')
  }

  async function addOfficer(e) {
    e.preventDefault()

    const { error } = await supabase.from('officers').insert({
      full_name: newOfficer.full_name,
      callsign: newOfficer.callsign,
      rank: newOfficer.rank,
      status: 'Active',
      monthly_activity_completed: true,
      last_activity_check: new Date().toISOString(),
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setNewOfficer({ full_name: '', callsign: '', rank: '' })
    setMessage('Officer added and marked Active.')
    loadOfficers()
  }

  async function removeOfficer(id) {
    await supabase.from('officers').delete().eq('id', id)
    loadOfficers()
  }

  async function updateStatus(id, status) {
    await supabase.from('officers').update({ status }).eq('id', id)
    loadOfficers()
  }

  async function submitMonthlyCheck(e) {
    e.preventDefault()

    const officer = officers.find(
      o => o.callsign.toLowerCase() === monthlyForm.callsign.toLowerCase()
    )

    if (!officer) {
      setMessage('No officer found with that callsign.')
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
      setMessage(error.message)
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

    setMessage('Monthly activity check submitted.')
    loadOfficers()
  }

  function displayStatus(officer) {
    if (['VACANT', 'LOA', 'Suspended', 'Under Investigation'].includes(officer.status)) {
      return officer.status
    }

    return officer.monthly_activity_completed ? 'Active' : 'Inactive'
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] border-b border-blue-900">
        <div className="max-w-6xl mx-auto px-6 py-10 flex justify-between">
          <div className="flex gap-5">
            <div className="w-16 h-16 rounded-2xl border border-blue-500 bg-[#0f172a] flex items-center justify-center">
              <Shield className="text-blue-400" size={34} />
            </div>
            <div>
              <p className="uppercase tracking-[6px] text-blue-300 text-sm">Los Santos Police Department</p>
              <h1 className="text-5xl font-bold mt-2">LSPD Department Portal</h1>
              <p className="text-gray-300 mt-4">Serving Los Santos with professionalism, integrity, and dedication.</p>
            </div>
          </div>
          {loggedIn && (
            <button onClick={() => { setLoggedIn(false); setAdmin(false); setPage('about') }} className="border border-red-700 px-5 py-3 rounded-xl">
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-[260px_1fr] gap-6">
        <nav className="bg-[#061126] border border-[#13203a] rounded-2xl p-5">
          <p className="text-xs tracking-[4px] text-blue-300 uppercase mb-6">Navigation</p>
          <Nav icon={<Info />} text="About Us" active={page === 'about'} onClick={() => setPage('about')} />
          <Nav icon={<FileText />} text="Apply Here" active={page === 'apply'} onClick={() => setPage('apply')} />
          <Nav icon={<Mail />} text="Contact Us" active={page === 'contact'} onClick={() => setPage('contact')} />
          <Nav icon={<Lock />} text="Department Forms" active={page === 'forms'} onClick={() => loggedIn ? setPage('forms') : setPage('login')} />
          <Nav icon={<Users />} text="Master Roster" active={page === 'roster'} onClick={() => admin ? setPage('roster') : setPage('login')} />
        </nav>

        <section className="bg-[#061126] border border-[#13203a] rounded-2xl p-6">
          {message && <div className="mb-4 border border-blue-700 rounded-xl p-3 text-blue-200">{message}</div>}

          {page === 'about' && (
            <>
              <h2 className="text-4xl font-bold mb-4">About Us</h2>
              <p className="text-gray-300 mb-8">The Los Santos Police Department is committed to protecting the city and maintaining professional roleplay standards.</p>
              <div className="grid md:grid-cols-3 gap-5">
                <Card title="Mission" text="Provide fair, realistic, and professional law enforcement roleplay." />
                <Card title="Values" text="Integrity, discipline, accountability, teamwork, and respect." />
                <Card title="Community" text="Building trust through patrols, interaction, and leadership." />
              </div>
            </>
          )}

          {page === 'apply' && (
            <>
              <h2 className="text-4xl font-bold mb-4">Apply Here</h2>
              <p className="text-gray-300">Application system coming next.</p>
            </>
          )}

          {page === 'contact' && (
            <>
              <h2 className="text-4xl font-bold mb-4">Contact Us</h2>
              <p className="text-gray-300">Contact command staff through Discord.</p>
            </>
          )}

          {page === 'login' && (
            <>
              <h2 className="text-4xl font-bold mb-4">Login</h2>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full max-w-md bg-[#020617] border border-blue-900 rounded-xl px-4 py-3 mb-4" />
              <button onClick={login} className="block bg-blue-600 px-6 py-3 rounded-xl">Login</button>
              <p className="text-gray-400 mt-4">Department: lspd123 | Admin: admin123</p>
            </>
          )}

          {page === 'forms' && loggedIn && (
            <>
              <h2 className="text-4xl font-bold mb-6">Monthly Activity Check</h2>
              <form onSubmit={submitMonthlyCheck} className="grid gap-4">
                <input placeholder="Callsign" value={monthlyForm.callsign} onChange={e => setMonthlyForm({ ...monthlyForm, callsign: e.target.value })} className="input" />
                <input placeholder="Patrol Hours" type="number" value={monthlyForm.patrol_hours} onChange={e => setMonthlyForm({ ...monthlyForm, patrol_hours: e.target.value })} className="input" />
                <input placeholder="Supervisor" value={monthlyForm.supervisor} onChange={e => setMonthlyForm({ ...monthlyForm, supervisor: e.target.value })} className="input" />
                <input type="month" value={monthlyForm.submission_month} onChange={e => setMonthlyForm({ ...monthlyForm, submission_month: e.target.value })} className="input" />
                <textarea placeholder="Activity Summary" value={monthlyForm.activity_summary} onChange={e => setMonthlyForm({ ...monthlyForm, activity_summary: e.target.value })} className="input min-h-32" />
                <button className="bg-blue-600 px-6 py-3 rounded-xl">Submit Monthly Check</button>
              </form>
            </>
          )}

          {page === 'roster' && admin && (
            <>
              <h2 className="text-4xl font-bold mb-6">Master Roster</h2>

              <form onSubmit={addOfficer} className="grid md:grid-cols-4 gap-3 mb-8">
                <input placeholder="Full Name" value={newOfficer.full_name} onChange={e => setNewOfficer({ ...newOfficer, full_name: e.target.value })} className="input" />
                <input placeholder="Callsign" value={newOfficer.callsign} onChange={e => setNewOfficer({ ...newOfficer, callsign: e.target.value })} className="input" />
                <input placeholder="Rank" value={newOfficer.rank} onChange={e => setNewOfficer({ ...newOfficer, rank: e.target.value })} className="input" />
                <button className="bg-blue-600 rounded-xl">Add Officer</button>
              </form>

              <div className="space-y-4">
                {officers.map(officer => (
                  <div key={officer.id} className="bg-[#0f172a] border border-blue-900 rounded-xl p-4 flex justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">{officer.full_name}</h3>
                      <p className="text-gray-400">{officer.rank} | {officer.callsign}</p>
                      <p>Status: {displayStatus(officer)}</p>
                    </div>

                    <div className="flex gap-2">
                      <select value={officer.status} onChange={e => updateStatus(officer.id, e.target.value)} className="bg-[#020617] border border-blue-900 rounded-xl px-3">
                        <option>Active</option>
                        <option>LOA</option>
                        <option>VACANT</option>
                        <option>Suspended</option>
                        <option>Under Investigation</option>
                      </select>

                      <button onClick={() => removeOfficer(officer.id)} className="bg-red-700 px-4 rounded-xl">
                        <Trash2 size={18} />
                      </button>
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
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl mb-3 ${active ? 'bg-blue-600' : 'hover:bg-[#0f172a] text-gray-300'}`}>
      {icon}
      {text}
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
