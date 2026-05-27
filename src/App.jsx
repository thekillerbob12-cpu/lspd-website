import { useEffect, useState } from 'react'
import {
  Shield,
  Info,
  FileText,
  Mail,
  Lock,
  Users,
  ArrowLeft
} from 'lucide-react'

import { supabase } from './supabase'

export default function App() {
  const [currentPage, setCurrentPage] = useState('about')
  const [officers, setOfficers] = useState([])

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [passwordInput, setPasswordInput] = useState('')

  useEffect(() => {
    async function loadOfficers() {
      const { data, error } = await supabase
        .from('officers')
        .select('*')

      console.log('SUPABASE DATA:', data)
      console.log('SUPABASE ERROR:', error)

      if (data) {
        setOfficers(data)
      }
    }

    loadOfficers()
  }, [])

  function loginDepartment() {
    if (passwordInput === 'lspd123') {
      setIsLoggedIn(true)
      setCurrentPage('forms')
    } else if (passwordInput === 'admin123') {
      setIsLoggedIn(true)
      setIsAdmin(true)
      setCurrentPage('roster')
    } else {
      alert('Incorrect password')
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] border-b border-blue-900">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between">
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

                <p className="text-gray-300 mt-4 max-w-2xl">
                  Serving Los Santos with professionalism, integrity, and dedication.
                </p>
              </div>
            </div>

            <button className="border border-blue-700 px-5 py-3 rounded-xl hover:bg-blue-900 transition">
              Public Access
            </button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">

        {/* SIDEBAR */}
        <div className="bg-[#061126] border border-[#13203a] rounded-2xl p-5">
          <p className="text-xs tracking-[4px] text-blue-300 uppercase mb-6">
            Navigation
          </p>

          <div className="space-y-3">
            <NavButton
              icon={<Info size={18} />}
              text="About Us"
              active={currentPage === 'about'}
              onClick={() => setCurrentPage('about')}
            />

            <NavButton
              icon={<FileText size={18} />}
              text="Apply Here"
              active={currentPage === 'apply'}
              onClick={() => setCurrentPage('apply')}
            />

            <NavButton
              icon={<Mail size={18} />}
              text="Contact Us"
              active={currentPage === 'contact'}
              onClick={() => setCurrentPage('contact')}
            />

            <NavButton
              icon={<Lock size={18} />}
              text="Department Forms"
              active={currentPage === 'forms'}
              onClick={() => {
                if (isLoggedIn) {
                  setCurrentPage('forms')
                } else {
                  setCurrentPage('login')
                }
              }}
            />

            <NavButton
              icon={<Users size={18} />}
              text="Master Roster"
              active={currentPage === 'roster'}
              onClick={() => {
                if (isAdmin) {
                  setCurrentPage('roster')
                } else {
                  setCurrentPage('adminlogin')
                }
              }}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="bg-[#061126] border border-[#13203a] rounded-2xl p-6">

          {/* ABOUT */}
          {currentPage === 'about' && (
            <>
              <h2 className="text-4xl font-bold mb-4">About Us</h2>

              <p className="text-gray-300 mb-8">
                The Los Santos Police Department is committed to protecting the city,
                supporting the community, and maintaining professional roleplay standards.
              </p>

              <div className="grid md:grid-cols-3 gap-5 mb-10">
                <InfoCard
                  title="Mission"
                  text="Provide fair, realistic, and professional law enforcement roleplay across Los Santos."
                />

                <InfoCard
                  title="Values"
                  text="Integrity, discipline, accountability, teamwork, and respect for the community."
                />

                <InfoCard
                  title="Community"
                  text="Building trust through active patrols, public interaction, and reliable department leadership."
                />
              </div>

              <div className="mt-10">
                <h2 className="text-3xl font-bold mb-4">
                  Connected Officers
                </h2>

                {officers.length === 0 ? (
                  <div className="bg-[#0f172a] border border-blue-900 rounded-xl p-5 text-gray-400">
                    No officers found in database yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {officers.map((officer) => (
                      <div
                        key={officer.id}
                        className="bg-[#0f172a] border border-blue-900 rounded-xl p-4"
                      >
                        <h3 className="text-xl font-semibold">
                          {officer.name}
                        </h3>

                        <p className="text-gray-400">
                          Badge: {officer.badge_number}
                        </p>

                        <p className="text-gray-400">
                          Rank: {officer.rank}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* APPLY */}
          {currentPage === 'apply' && (
            <>
              <h2 className="text-4xl font-bold mb-4">
                Apply Here
              </h2>

              <p className="text-gray-300">
                Recruitment applications will be added soon.
              </p>
            </>
          )}

          {/* CONTACT */}
          {currentPage === 'contact' && (
            <>
              <h2 className="text-4xl font-bold mb-4">
                Contact Us
              </h2>

              <p className="text-gray-300">
                Contact Command Staff through Discord.
              </p>
            </>
          )}

          {/* LOGIN */}
          {currentPage === 'login' && (
            <LoginPage
              title="Department Login"
              passwordInput={passwordInput}
              setPasswordInput={setPasswordInput}
              loginDepartment={loginDepartment}
            />
          )}

          {/* ADMIN LOGIN */}
          {currentPage === 'adminlogin' && (
            <LoginPage
              title="Admin Login"
              passwordInput={passwordInput}
              setPasswordInput={setPasswordInput}
              loginDepartment={loginDepartment}
            />
          )}

          {/* FORMS */}
          {currentPage === 'forms' && isLoggedIn && (
            <>
              <h2 className="text-4xl font-bold mb-4">
                Department Forms
              </h2>

              <div className="space-y-4">
                <FormCard title="Incident Report" />
                <FormCard title="Arrest Report" />
                <FormCard title="Evidence Submission" />
              </div>
            </>
          )}

          {/* ROSTER */}
          {currentPage === 'roster' && isAdmin && (
            <>
              <h2 className="text-4xl font-bold mb-4">
                Master Roster
              </h2>

              <div className="space-y-4">
                {officers.map((officer) => (
                  <div
                    key={officer.id}
                    className="bg-[#0f172a] border border-blue-900 rounded-xl p-4"
                  >
                    <h3 className="text-xl font-semibold">
                      {officer.name}
                    </h3>

                    <p className="text-gray-400">
                      Badge: {officer.badge_number}
                    </p>

                    <p className="text-gray-400">
                      Rank: {officer.rank}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function NavButton({ icon, text, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition ${
        active
          ? 'bg-blue-600 text-white'
          : 'hover:bg-[#0f172a] text-gray-300'
      }`}
    >
      {icon}
      <span>{text}</span>
    </button>
  )
}

function InfoCard({ title, text }) {
  return (
    <div className="bg-[#0b1328] border border-blue-900 rounded-2xl p-6">
      <h3 className="text-2xl font-semibold mb-3">
        {title}
      </h3>

      <p className="text-gray-400 leading-relaxed">
        {text}
      </p>
    </div>
  )
}

function FormCard({ title }) {
  return (
    <div className="bg-[#0f172a] border border-blue-900 rounded-xl p-5">
      <h3 className="text-xl font-semibold">
        {title}
      </h3>
    </div>
  )
}

function LoginPage({
  title,
  passwordInput,
  setPasswordInput,
  loginDepartment
}) {
  return (
    <div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 text-blue-400 mb-6"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h2 className="text-4xl font-bold mb-6">
        {title}
      </h2>

      <div className="bg-[#0f172a] border border-blue-900 rounded-2xl p-6 max-w-md">
        <input
          type="password"
          placeholder="Enter Password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          className="w-full bg-[#020617] border border-blue-900 rounded-xl px-4 py-3 mb-4 outline-none"
        />

        <button
          onClick={loginDepartment}
          className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 font-semibold"
        >
          Login
        </button>

        <div className="mt-5 text-sm text-gray-400">
          Department Password: <span className="text-white">lspd123</span>
          <br />
          Admin Password: <span className="text-white">admin123</span>
        </div>
      </div>
    </div>
  )
}
