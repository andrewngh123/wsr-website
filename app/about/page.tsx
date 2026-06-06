import { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about the WRCES methodology and the team behind World Sports Rankings.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  // Andrew's sports-data-analytics experience started in 2017 — keep it current.
  const analyticsYears = new Date().getFullYear() - 2017

  return (
    <div className="min-h-screen">
      {/* Header */}
      <PageHeader title="About Us" subtitle="The science behind the rankings" />

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">
        {/* About WSR */}
        <section>
          <h2 className="section-title">World Sports Rankings</h2>
          <p className="text-gray-600 leading-relaxed mt-3">
            World Sports Rankings (WSR) is a platform evaluating the local and international sport
            policies and strategies implemented by National Sports Governing Bodies, sports leagues,
            National Olympic Committees, National Sports Federations and International Sports
            Federations.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            WSR bases its services on scientific countries sport rankings, created by{' '}
            <strong>Nadim Nassif</strong>, Associate Professor in Physical Education and Sports from
            Notre Dame University-Louaize (NDU). These rankings are updated on a yearly basis by the
            International Center for Sport Policy &amp; Governance (ICSPG), a think tank hosted by NDU.
          </p>
        </section>

        {/* Our Team */}
        <section>
          <h2 className="section-title">Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-6">
            {[
              {
                name: 'Nadim Nassif',
                role: 'Founder',
                photo: '/staff/Dr.Nadim.png',
                bio: 'Associate professor of Physical Education and Sports, Department of Psychology, Education & Physical Education, Faculty of Humanities, Notre Dame University, Lebanon.',
              },
              {
                name: 'Andrew Alnghayoui',
                role: 'Data Analyst',
                photo: '/staff/Andrew.png',
                bio: `More than ${analyticsYears} years of experience in sports data analytics, MBA Sports Management Graduate from UCAM (Murcia, Spain). B.E. in Mechanical Engineering at NDU, Lebanon.`,
              },
              {
                name: 'Maya Gabriel',
                role: 'Project Assistant',
                photo: '/staff/Maya.png',
                bio: 'Dual B.A. in Advertising and Marketing and in Physical Education and Sport at NDU, Lebanon. MSc. in Olympic Studies, Olympic Education, Organization and Management of Olympic Events. University of Peloponnese — Greece.',
              },
            ].map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-36 h-36 rounded-full object-cover shadow-md ring-4 ring-wsr-light"
                />
                <h3 className="font-bold text-wsr-navy mt-4">{member.name}</h3>
                <p className="text-wsr-blue text-sm font-medium">{member.role}</p>
                <p className="text-gray-500 text-sm leading-relaxed mt-3">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* About WRCES */}
        <section>
          <h2 className="section-title">About the WRCES</h2>
          <p className="text-gray-600 leading-relaxed mt-3">
            The World Ranking of Countries in Elite Sport (WRCES) is a research-based annual ranking,
            started in 2014, aiming at evaluating the performances of all the countries having National
            Olympic Committees (NOCs) in all the sports recognized by SportAccord, and others, not yet
            recognized, but having a significant media popularity.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            The WRCES attributes coefficients for each sport based on two variables:
          </p>
          <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1 text-sm">
            <li><strong>Popularity</strong> — to what extent a sport is covered in each country&apos;s sports media platforms</li>
            <li><strong>Universality</strong> — how widely a sport is practiced around the world</li>
          </ul>
        </section>

        {/* Methodology highlights */}
        <section>
          <h2 className="section-title">Methodology</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[
              { title: '206 Countries', desc: 'All countries with National Olympic Committees are ranked.' },
              { title: 'All Sports', desc: 'Covers all sports recognized by SportAccord and beyond.' },
              { title: 'Para-Sports', desc: 'Inclusive of para-sports competitions.' },
              { title: 'Annual Update', desc: 'Rankings updated every year with fresh competition data.' },
            ].map((item) => (
              <div key={item.title} className="bg-wsr-light rounded-lg p-5 border border-gray-100">
                <h3 className="font-bold text-wsr-navy text-sm mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Affiliates */}
        <section>
          <h2 className="section-title">Our Affiliates</h2>
          <div className="flex flex-wrap gap-6 items-center mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ndu_logo1.png" alt="NDU Logo" className="h-16 object-contain" />
            <a href="https://www.ndu.edu.lb/international-center-for-sport-policy-and-governance/home" target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ICSPG-final-logo.png" alt="ICSPG Logo" className="h-16 object-contain" />
            </a>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-wsr-navy text-white rounded-xl p-8">
          <h2 className="text-xl font-bold mb-3">Contact Us</h2>
          <p className="text-white/70 text-sm mb-4">
            For inquiries about the rankings or WSR&apos;s services, reach out to us directly.
          </p>
          <a href="mailto:nnassif@ndu.edu.lb" className="btn-primary inline-block text-sm">
            nnassif@ndu.edu.lb
          </a>
        </section>
      </div>
    </div>
  )
}
