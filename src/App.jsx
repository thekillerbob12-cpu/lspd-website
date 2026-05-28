import { useEffect, useState } from 'react'
import {
  Info,
  FileText,
  Mail,
  Lock,
  Users,
  Trash2,
  Megaphone,
  Newspaper,
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

const adminUsers = [
  { username: 'J.malone@lspd.gov', password: 'LSPDHC301', role: 'Chief of Police' },
  { username: 'R.parish@lspd.gov', password: 'LSPDHC302', role: 'Assistant Chief' },
  { username: 'A.alastor1@lspd.gov', password: 'LSPDHC303', role: 'Deputy Chief' },
  { username: 'A.alastor2@lspd.gov', password: 'LSPDHC304', role: 'Commander' },
  { username: 'admin@lspd.gov', password: 'adminpass100!', role: 'System Administrator' },
]

const departmentForms = [
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
  const [newsPosts, setNewsPosts] = useState([])
  const [activeBanner, setActiveBanner] = useState(null)

  const [accessLevel, setAccessLevel] = useState('public')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedInUser, setLoggedInUser] = useState('')
  const [message, setMessage] = useState('')

  const [rosterSearch, setRosterSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [divisionFilter, setDivisionFilter] = useState('All')
  const [rankFilter, setRankFilter] = useState('All')

  const [newsForm, setNewsForm] = useState({
    title: '',
    body: '',
    image_url: '',
  })

  const [bannerMessage, setBannerMessage] = useState('')

  const [newOfficer, setNewOfficer] = useState({
    full_name: '',
    callsign: '',
    badge_number: '',
    rank: 'Officer',
    division: 'Patrol',
    promotion_date: '',
    notes: '',
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
      loadNewsPosts(),
      loadActiveBanner(),
    ])
  }

  async function loadOfficers() {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) setOfficers(data)
  }

  async function loadNewsPosts() {
    const { data, error } = await supabase
      .from('department_news')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setNewsPosts(data)
  }

  async function loadActiveBanner() {
    const { data, error } = await supabase
      .from('message_banners')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!error && data && data.length > 0) {
      setActiveBanner(data[0])
    }
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

  function canAccessAdminPages() {
    return accessLevel === 'supervisor'
  }

  function displayStatus(officer) {
    return officer.status || 'Active'
  }

  const filteredOfficers = officers.filter(officer => {
    const search = rosterSearch.toLowerCase()

    const matchesSearch =
      officer.full_name?.toLowerCase().includes(search) ||
      officer.callsign?.toLowerCase().includes(search) ||
      officer.badge_number?.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'All' || officer.status === statusFilter

    const matchesDivision =
      divisionFilter === 'All' || officer.division === divisionFilter

    const matchesRank =
      rankFilter === 'All' || officer.rank === rankFilter

    return matchesSearch && matchesStatus && matchesDivision && matchesRank
  })

  async function addNewsPost(e) {
    e.preventDefault()

    if (!newsForm.title || !newsForm.body) {
      showMessage('Please add a title and message for the news post.')
      return
    }

    const { error } = await supabase.from('department_news').insert({
      title: newsForm.title,
      body: newsForm.body,
      image_url: newsForm.image_url || null,
      posted_by: loggedInUser || 'Website Admin',
    })

    if (error) {
      showMessage(error.message)
      return
    }

    setNewsForm({ title: '', body: '', image_url: '' })
    showMessage('Department news post published.')
    loadNewsPosts()
  }

  async function removeNewsPost(id) {
    await supabase.from('department_news').delete().eq('id', id)
    showMessage('News post removed.')
    loadNewsPosts()
  }

  async function publishBanner(e) {
    e.preventDefault()

    if (!bannerMessage) {
      showMessage('Please enter a banner message.')
      return
    }

    const { error } = await supabase.from('message_banners').insert({
      message: bannerMessage,
      posted_by: loggedInUser || 'Website Admin',
    })

    if (error) {
      showMessage(error.message)
      return
    }

    setBannerMessage('')
    showMessage('Message banner published.')
    loadActiveBanner()
  }

  async function clearBanner() {
    if (!activeBanner?.id) return

    await supabase.from('message_banners').delete().eq('id', activeBanner.id)
    setActiveBanner(null)
    showMessage('Message banner cleared.')
  }

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
    const { error } = await supabase
      .from('officers')
      .update(updates)
      .eq('id', id)

    if (error) {
      showMessage(error.message)
      return
    }

    showMessage('Officer updated.')
    loadOfficers()
  }

  async function updateOfficerStatus(officer, newStatus) {
    await updateOfficer(officer.id, { status: newStatus })
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="relative overflow-hidden border-b border-blue-900 bg-[#020617]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#1e3a8a] opacity-95"></div>

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

      {activeBanner && (
        <div className="bg-blue-950 border-b border-blue-700">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
            <Megaphone className="text-blue-300" size={22} />
            <p className="text-blue-100 font-semibold">
              {activeBanner.message}
            </p>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-[260px_1fr] gap-6">
        <nav className="bg-[#061126] border border-[#13203a] rounded-2xl p-5">
          <p className="text-xs tracking-[4px] text-blue-300 uppercase mb-6">
            Navigation
          </p>

          <Nav icon={<Info />} text="About Us" active={page === 'about'} onClick={() => setPage('about')} />
          <Nav icon={<FileText />} text="Apply Here" active={page === 'apply'} onClick={() => setPage('apply')} />
          <Nav icon={<Mail />} text="Contact Us" active={page === 'contact'} onClick={() => setPage('contact')} />
          <Nav icon={<Newspaper />} text="Department News" active={page === 'news'} onClick={() => setPage('news')} />
          <Nav icon={<Megaphone />} text="Message Banner" active={page === 'banner'} onClick={() => canAccessAdminPages() ? setPage('banner') : setPage('login')} />
          <Nav icon={<Lock />} text="Department Forms" active={page === 'forms'} onClick={() => canAccessAdminPages() ? setPage('forms') : setPage('login')} />
          <Nav icon={<Users />} text="Master Roster" active={page === 'roster'} onClick={() => canAccessAdminPages() ? setPage('roster') : setPage('login')} />
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
                <ImageCard image="/patrol.jpg" title="Patrol Operations" text="Active patrol units maintain public safety and visible law enforcement presence across the city." />
                <ImageCard image="/command.jpg" title="Command Leadership" text="Command staff oversees department standards, training, discipline, and operational readiness." />
                <ImageCard image="/community.jpg" title="Community Engagement" text="LSPD works to build trust through professionalism, responsiveness, and respectful public contact." />
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

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <a href="https://discord.gg/GznXtDbPqA" target="_blank" rel="noreferrer" className="bg-[#0f172a] border border-blue-900 rounded-2xl p-6 hover:bg-blue-950 transition">
                  <h3 className="text-2xl font-bold mb-2">LSPD Discord</h3>
                  <p className="text-gray-400 mb-4">Official Los Santos Police Department communications server.</p>
                  <p className="text-blue-300 font-semibold">discord.gg/GznXtDbPqA</p>
                </a>

                <a href="https://discord.gg/RaERpXvuVH" target="_blank" rel="noreferrer" className="bg-[#0f172a] border border-blue-900 rounded-2xl p-6 hover:bg-blue-950 transition">
                  <h3 className="text-2xl font-bold mb-2">Royalty County Roleplay Discord</h3>
                  <p className="text-gray-400 mb-4">Official main community Discord server.</p>
                  <p className="text-blue-300 font-semibold">discord.gg/RaERpXvuVH</p>
                </a>
              </div>

              <div className="bg-[#0f172a] border border-blue-900 rounded-2xl p-6">
                <h3 className="text-3xl font-bold mb-4">Department Leadership</h3>

                <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                  <Leader title="Chief of Police" name="Jack Malone" />
                  <Leader title="Assistant Chief" name="Ryan Parish" />
                  <Leader title="Deputy Chief" name="Ashley Alastor" />
                  <Leader title="Watch Commander" name="Alaina Alastor" />
                  <Leader title="Website Inquiries" name="Bryce Parish (spedsped.)" wide />
                </div>
              </div>
            </>
          )}

          {page === 'news' && (
            <>
              <h2 className="text-4xl font-bold mb-4">Department News</h2>
              <p className="text-gray-300 mb-6">
                Public updates and information from the Los Santos Police Department.
              </p>

              {canAccessAdminPages() && (
                <form onSubmit={addNewsPost} className="bg-[#0f172a] border border-blue-900 rounded-2xl p-5 mb-8">
                  <h3 className="text-2xl font-bold mb-4">Create News Post</h3>

                  <input
                    placeholder="Post Title"
                    value={newsForm.title}
                    onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                    className="input mb-4"
                  />

                  <input
                    placeholder="Image URL"
                    value={newsForm.image_url}
                    onChange={e => setNewsForm({ ...newsForm, image_url: e.target.value })}
                    className="input mb-4"
                  />

                  <textarea
                    placeholder="Post Message"
                    value={newsForm.body}
                    onChange={e => setNewsForm({ ...newsForm, body: e.target.value })}
                    className="input min-h-32 mb-4"
                  />

                  <button className="bg-blue-600 px-6 py-3 rounded-xl">
                    Publish News
                  </button>
                </form>
              )}

              <div className="space-y-5">
                {newsPosts.length === 0 ? (
                  <p className="text-gray-400">No department news has been posted yet.</p>
                ) : (
                  newsPosts.map(post => (
                    <div key={post.id} className="bg-[#0f172a] border border-blue-900 rounded-2xl overflow-hidden">
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-64 object-cover"
                        />
                      )}

                      <div className="p-6">
                        <h3 className="text-3xl font-bold mb-2">{post.title}</h3>
                        <p className="text-gray-400 mb-4">
                          Posted by {post.posted_by || 'LSPD Command'} • {new Date(post.created_at).toLocaleString()}
                        </p>
                        <p className="text-gray-300 whitespace-pre-line">{post.body}</p>

                        {canAccessAdminPages() && (
                          <button
                            onClick={() => removeNewsPost(post.id)}
                            className="mt-5 bg-red-700 px-4 py-2 rounded-xl"
                          >
                            Remove Post
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {page === 'banner' && canAccessAdminPages() && (
            <>
              <h2 className="text-4xl font-bold mb-4">Message Banner</h2>
              <p className="text-gray-300 mb-6">
                Publish a department-wide message that appears directly under the website header.
              </p>

              <form onSubmit={publishBanner} className="bg-[#0f172a] border border-blue-900 rounded-2xl p-5 mb-6">
                <textarea
                  placeholder="Banner Message"
                  value={bannerMessage}
                  onChange={e => setBannerMessage(e.target.value)}
                  className="input min-h-32 mb-4"
                />

                <button className="bg-blue-600 px-6 py-3 rounded-xl">
                  Publish Banner
                </button>
              </form>

              {activeBanner && (
                <div className="bg-[#0f172a] border border-blue-900 rounded-2xl p-5">
                  <h3 className="text-2xl font-bold mb-3">Current Banner</h3>
                  <p className="text-gray-300 mb-4">{activeBanner.message}</p>

                  <button
                    onClick={clearBanner}
                    className="bg-red-700 px-4 py-2 rounded-xl"
                  >
                    Clear Banner
                  </button>
                </div>
              )}
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

          {page === 'forms' && canAccessAdminPages() && (
            <>
              <h2 className="text-4xl font-bold mb-4">Department Forms</h2>

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

          {page === 'roster' && canAccessAdminPages() && (
            <>
              <h2 className="text-4xl font-bold mb-6">Master Roster</h2>

              <div className="grid md:grid-cols-4 gap-3 mb-6">
                <input
                  placeholder="Search..."
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  className="input"
                />

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

                <button className="bg-blue-600 rounded-xl">Add Officer</button>
              </form>

              <div className="space-y-4">
                {filteredOfficers.map(officer => (
                  <div key={officer.id} className="bg-[#0f172a] border border-blue-900 rounded-xl p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold">{officer.full_name}</h3>
                        <p className="text-gray-400">{officer.rank} | {officer.callsign}</p>
                        <p className="text-gray-400">Badge: {officer.badge_number || 'N/A'}</p>
                        <p className="text-gray-400">Division: {officer.division || 'Patrol'}</p>
                        <p>Status: {displayStatus(officer)}</p>

                        {officer.notes && (
                          <p className="text-gray-400 mt-2">Notes: {officer.notes}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <select
                          value={officer.status}
                          onChange={e => updateOfficerStatus(officer, e.target.value)}
                          className="bg-[#020617] border border-blue-900 rounded-xl px-3 py-2"
                        >
                          <option>Active</option>
                          <option>Inactive</option>
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
        active ? 'bg-blue-600 text-white' : 'hover:bg-[#0f172a] text-gray-300'
      }`}
    >
      <span>{icon}</span>
      <span>{text}</span>
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
      <img src={image} alt={title} className="h-44 w-full object-cover opacity-85" />

      <div className="p-5">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{text}</p>
      </div>
    </div>
  )
}

function Leader({ title, name, wide }) {
  return (
    <div className={`border border-blue-900 rounded-xl p-4 ${wide ? 'md:col-span-2' : ''}`}>
      <p className="font-bold text-white">{title}</p>
      <p>{name}</p>
    </div>
  )
}
