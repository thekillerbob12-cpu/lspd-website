import { useEffect, useState } from 'react'
import { Shield, Info, FileText, Mail, Lock, Users } from 'lucide-react'
import { supabase } from './supabase'

export default function App() {
  const [officers, setOfficers] = useState([])

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
            <NavButton icon={<Info size={18} />} text="About Us" active />
            <NavButton icon={<FileText size={18} />} text="Apply Here" />
            <NavButton icon={<Mail size={18} />} text="Contact Us" />
            <NavButton icon={<Lock size={18} />} text="Department Forms" />
            <NavButton icon={<Users size={18} />} text="Master Roster" />
          </div>
        </div>

        {/* CONTENT */}
        <div className="bg-[#061126] border border-[#13203a] rounded-2xl p-6">
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

          {/* DATABASE TEST */}
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
        </div>
      </div>
    </div>
  )
}

function NavButton({ icon, text, active }) {
  return (
    <button
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
