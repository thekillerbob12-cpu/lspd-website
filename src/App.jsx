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
