import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Scientific Publications — World Sports Rankings',
}

// ── Add publications here — no code knowledge needed ─────────────────────────
// Each publication: title, authors, year, venue (journal/book/conference), and
// an optional link (DOI or URL). Group them under the relevant section.
type Publication = {
  title: string
  authors: string
  year: string
  venue: string
  link?: string  // optional: DOI or URL
}

type PubSection = {
  heading: string
  items: Publication[]
}

const SECTIONS: PubSection[] = [
  {
    heading: 'Journal Articles',
    items: [
      {
        title: "Understanding media's leverage in the national elite sport ecosystems",
        authors: 'Nassif, N., & El-Khoury, J. R.',
        year: '2026',
        venue: 'Frontiers in Sports and Active Living, 8, 1788596',
        link: 'https://doi.org/10.3389/fspor.2026.1788596',
      },
      {
        title: 'For a New World Ranking of Countries in Elite Sport — Correlation Between Competition Level and Bibliometrics in Olympic Sports',
        authors: 'Nassif, N., & Millet, G. P.',
        year: '2025',
        venue: 'Frontiers in Sports and Active Living, 7, 1489652',
      },
      {
        title: 'International Comparison and Implications of National Sports Power Evaluation Index System',
        authors: 'Huang, H., & Liu, W.',
        year: '2025',
        venue: 'Journal of Shanghai University of Sport, 49(3), 24–34',
      },
      {
        title: 'Relaciones Internacionales y rendimiento deportivo: Un análisis del medallero olímpico desde el Índice de Poder Mundial',
        authors: 'Pulleiro Méndez, C., & Morales Ruvalcaba, D.',
        year: '2025',
        venue: 'Movimento, 31, e31030',
      },
      {
        title: 'Media and Women Elite Athletes in the Arab World: Current Status and Perspectives for Developments',
        authors: 'Nassif, N., & El-Khoury, J. R.',
        year: '2022',
        venue: 'Asian Journal of Sport History & Culture, 1–15',
      },
      {
        title: "The World Sport Power Index: Measuring States' Capacities to use Sport as an Instrument of Soft Power",
        authors: 'Nassif, N.',
        year: '2022',
        venue: 'Siyasat Arabiya, 10(57), 46–57',
      },
      {
        title: '世界竞技体育强国排名系统的解读与启示 (Interpretation and Implications of the WRCES System)',
        authors: 'Dong, G., Xiao, L., & Wang, R.',
        year: '2021',
        venue: 'China Sport Science and Technology, 57(9)',
      },
      {
        title: 'Medir el éxito de una política nacional de deporte de élite (Measuring Success of a National Elite Sport Policy)',
        authors: 'Nassif, N.',
        year: '2019',
        venue: 'Revista Española de Educación Física y Deportes, (426), 465–473',
      },
      {
        title: '¿Qué factores conducen a una política exitosa de deportes de élite? (What Are the Factors Leading to a Successful National Elite Sport Policy?)',
        authors: 'Nassif, N.',
        year: '2019',
        venue: 'Revista Española de Educación Física y Deportes, (426), 474–481',
      },
      {
        title: 'World Ranking of Countries in Elite Sport',
        authors: 'Nassif, N.',
        year: '2018',
        venue: 'Rivista di Diritto ed Economia dello Sport, 14(2), 55–75',
      },
    ],
  },
  {
    heading: 'Books & Book Chapters',
    items: [
      {
        title: "Le sport au-dessus des conflits, l'arbitre d'un monde sous tension? [Livre blanc]",
        authors: 'École de Guerre Économique & Sports Management School',
        year: '2026',
        venue: 'École de Guerre Économique',
        link: 'https://www.ege.fr/sites/ege.fr/files/media_files/sport_livre-blanc_executive-summary_25_26_V3.pdf',
      },
      {
        title: 'National Success in Elite Sport: Exploring the Factors that Lead to Success',
        authors: 'Nassif, N., & Raspaud, M.',
        year: '2023',
        venue: 'Palgrave Macmillan, Cham',
        link: 'https://doi.org/10.1007/978-3-031-38997-9',
      },
      {
        title: 'Pour une analyse plus inclusive de la performance des pays dans les Jeux olympiques : le World Ranking of Countries in Elite Sport',
        authors: 'Nassif, N., & Chaudel, V.',
        year: '2025',
        venue: "Bilan & Perspectives Paris 2024, Cahiers d'Études Olympiques, éditions désiris, 131–142",
      },
      {
        title: 'Swedish elite sport: External evaluation',
        authors: 'Storm, R. K., Kollerup, J. T., & Klaus, N.',
        year: '2024',
        venue: 'External evaluation report',
      },
      {
        title: 'Measurement of Countries’ Performances and Successes in Elite Sport: The World Ranking of Countries in Elite Sport',
        authors: 'Nassif, N., & Raspaud, M.',
        year: '2023',
        venue: 'In: National Success in Elite Sport. Palgrave Macmillan, Cham',
        link: 'https://doi.org/10.1007/978-3-031-38997-9_1',
      },
      {
        title: 'Correlations Between Sport Results, Population, GDP, Area, and Research Rankings',
        authors: 'Nassif, N., & Raspaud, M.',
        year: '2023',
        venue: 'In: National Success in Elite Sport. Palgrave Macmillan, Cham',
        link: 'https://doi.org/10.1007/978-3-031-38997-9_3',
      },
      {
        title: "Why Do Population and GDP Per Capita not Have an Impact on Countries' Performances in Elite Sport?",
        authors: 'Nassif, N., & Raspaud, M.',
        year: '2023',
        venue: 'In: National Success in Elite Sport. Palgrave Macmillan, Cham',
        link: 'https://doi.org/10.1007/978-3-031-38997-9_4',
      },
      {
        title: "What Are the Factors Leading to Countries' Success in Elite Sport and How Are They Related?",
        authors: 'Nassif, N., & Raspaud, M.',
        year: '2023',
        venue: 'In: National Success in Elite Sport. Palgrave Macmillan, Cham',
        link: 'https://doi.org/10.1007/978-3-031-38997-9_5',
      },
      {
        title: 'Expertise of the NSGBs, NOCs, NSFs, and SAs in Implementing Elite Sport Policies',
        authors: 'Nassif, N., & Raspaud, M.',
        year: '2023',
        venue: 'In: National Success in Elite Sport. Palgrave Macmillan, Cham',
        link: 'https://doi.org/10.1007/978-3-031-38997-9_6',
      },
      {
        title: "Creating a Global Index Measuring Countries' Levels of Fitness: The “World's Fittest Countries Ranking”",
        authors: 'Nassif, N., & Keyrouz, K.',
        year: '2022',
        venue: 'In: Physical Education and Sport for Children, Youth and Adults — Researches, Best Practices, Situation. International Federation of Physical Education, 265–276',
      },
      {
        title: 'Using Sport as a National Soft Power Strategy: The Case of Mixed Martial Arts in Bahrain',
        authors: 'Nassif, N.',
        year: '2022',
        venue: 'In: Routledge Handbook of Sport in the Middle East (Reiche, D., & Brannagan, P. M., Eds.). Routledge, 104–114',
      },
      {
        title: 'Developing a National Elite Sport Policy in an Arab Country: The Case of Lebanon',
        authors: 'Nassif, N.',
        year: '2019',
        venue: 'In: Sports, Society, and Politics in the Middle East. Oxford University Press, 139–157',
      },
    ],
  },
  {
    heading: 'Conference Proceedings',
    items: [
      {
        title: 'Olympic Program 2050 – Retaining the universality of the Olympic Games under a shifting global economy',
        authors: 'Nassif, N.',
        year: '2024',
        venue: '11th International Sport Business Symposium (Aug 8, 2024), 17–18',
      },
      {
        title: "Measuring the Impact That Universities Have on Countries' Success in Elite Sport",
        authors: 'Nassif, N.',
        year: '2023',
        venue: 'FISU World Conference, Chengdu, China (Jul 29–31, 2023). FISU Edition, p. 241',
      },
      {
        title: 'Factors Required For the Implementation of a Successful National Elite Sport Policy',
        authors: 'Nassif, N.',
        year: '2023',
        venue: '4th World Association for Sport Management World Conference, Doha, Qatar (Mar 5–8, 2023), 95–96',
      },
      {
        title: "Towards the creation of an index that measures countries' power in sport",
        authors: 'Nassif, N., & Raspaud, M.',
        year: '2022',
        venue: 'Sport & the European Union Conference, Lausanne (Jun 16–17, 2022), 39–40',
      },
      {
        title: "The Role of Universities in Countries' Success in Elite Sport",
        authors: 'Nassif, N.',
        year: '2021',
        venue: '18th Annual Scientific Conference of the Montenegrin Sports Academy / 16th FIEP European Congress, 6–7',
      },
      {
        title: 'Performance Index for Countries in Elite Sport',
        authors: 'Nassif, N.',
        year: '2018',
        venue: "International Scientific Congress 'Values, Traditions and Innovations of Modern Sport', Minsk, Belarus (Apr 18–20, 2018), 10–11",
      },
      {
        title: 'Analysis of the factors determining countries’ performances in elite sport',
        authors: 'Nassif, N.',
        year: '2018',
        venue: "International Scientific Congress 'Values, Traditions and Innovations of Modern Sport', Minsk, Belarus (Apr 18–20, 2018), 8–9",
      },
    ],
  },
]
// ─────────────────────────────────────────────────────────────────────────────

export default function ScientificPublicationsPage() {
  const total = SECTIONS.reduce((n, s) => n + s.items.length, 0)

  return (
    <div className="min-h-screen bg-wsr-light">
      <div className="bg-wsr-navy text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-extrabold">Scientific Publications</h1>
        <p className="text-white/60 text-sm mt-2">
          Peer-reviewed research behind the WSR methodology — {total} publications
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="section-title mb-5">{section.heading}</h2>
            <div className="space-y-4">
              {section.items.map((pub, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <p className="font-semibold text-wsr-navy leading-snug mb-1">
                    {pub.link
                      ? <a href={pub.link} target="_blank" rel="noopener noreferrer" className="hover:text-wsr-blue hover:underline">{pub.title}</a>
                      : pub.title
                    }
                  </p>
                  <p className="text-sm text-gray-500">{pub.authors} ({pub.year})</p>
                  <p className="text-xs text-gray-400 mt-1 italic">{pub.venue}</p>
                  {pub.link && (
                    <a href={pub.link} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-wsr-blue hover:underline">
                      View publication →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="text-center pt-2">
          <Link href="/" className="text-sm text-wsr-blue hover:underline">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
