import { motion as Motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiClock,
  FiFileText,
  FiSearch,
  FiSliders,
  FiUpload,
} from 'react-icons/fi'
import {
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { RiRobot2Line } from 'react-icons/ri'

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.68, ease: 'easeOut' } },
}

const pillars = [
  {
    title: 'Upload cleanly',
    text: 'Bring in reports, logs, receipts, notes, and images without turning the interface into a complicated workflow.',
    icon: FiUpload,
    badge: 'Ingestion',
  },
  {
    title: 'Retrieve precisely',
    text: 'Prioritize the chunks that actually match the question so users get the relevant part first, not the whole story.',
    icon: FiSearch,
    badge: 'Retrieval',
  },
  {
    title: 'Answer directly',
    text: 'Return short, grounded responses that stay close to the exact thing the user asked for.',
    icon: HiOutlineChatBubbleLeftRight,
    badge: 'Response',
  },
]

const workflow = [
  {
    step: '01',
    title: 'Document enters the pipeline',
    text: 'Text is extracted from the uploaded file and prepared for indexing.',
    icon: FiFileText,
  },
  {
    step: '02',
    title: 'Chunks are selected with context',
    text: 'Relevant pieces are ranked so precise matches rise before broad summaries.',
    icon: HiOutlineChartBar,
  },
  {
    step: '03',
    title: 'Answer returns in a tighter form',
    text: 'The model is prompted to answer first, stay concise, and avoid unnecessary narration.',
    icon: HiOutlineBolt,
  },
]

const compactStats = [
  { value: 'Short answers', label: 'Direct by default' },
  { value: 'Source aware', label: 'Context before generation' },
  { value: 'Adjustable', label: 'Chunk size and Top-K' },
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      <section className="home-stage min-h-screen px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="hero-grid absolute inset-0 opacity-45" />
        <div className="glow-orb left-[-5rem] top-20 h-72 w-72 bg-primary/18" />
        <div className="glow-orb glow-orb-secondary right-[-4rem] top-24 h-80 w-80 bg-accent/18" />
        <div className="home-ribbon hidden xl:block" />

        <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center">
          <div className="grid w-full items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
            <Motion.div initial="hidden" animate="visible" variants={reveal} className="max-w-2xl">
              <div className="page-kicker mb-6">
                <HiOutlineSparkles className="h-4 w-4" />
                Elegant retrieval, refined answers
              </div>

              <h1 className="headline-display text-text-primary">
                Ask less.
                <span className="headline-gradient block pt-3">Get exactly what matters.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-text-secondary sm:text-xl">
                A lighter, more detailed interface for your RAG app that feels premium, stays easy to
                use, and keeps the focus on accurate document answers instead of visual clutter.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 rounded-full bg-text-primary px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-text-primary/15 transition-all hover:-translate-y-1"
                >
                  Open chat
                  <FiArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/74 px-8 py-3.5 text-sm font-bold text-text-primary shadow-lg shadow-white/35 transition-all hover:-translate-y-1"
                >
                  <FiUpload className="h-4 w-4" />
                  Upload documents
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                {['Simple workflow', 'Grounded context', 'Cleaner responses'].map((item) => (
                  <span key={item} className="metric-pill text-sm font-semibold text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-primary pulse-dot" />
                    {item}
                  </span>
                ))}
              </div>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.12 }}
              className="blueprint-card p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
                    <RiRobot2Line className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-primary">Precision answer cockpit</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Designed for exact retrieval</p>
                  </div>
                </div>

                <div className="metric-pill px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                  <span className="h-2 w-2 rounded-full bg-success halo-ring" />
                  Direct mode
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.04fr_0.96fr]">
                <div className="section-card-muted p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Answer preview</p>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <FiClock className="h-3.5 w-3.5" />
                      concise output
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="ml-auto max-w-[92%] rounded-[1.4rem] rounded-tr-md bg-text-primary px-4 py-3 text-sm leading-6 text-white shadow-sm">
                      What was the work done in week 7?
                    </div>
                    <div className="max-w-[92%] rounded-[1.4rem] rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-text-secondary shadow-sm">
                      Week 7 work done:
                      <div className="mt-2 soft-divider" />
                      <div className="mt-3">Implemented the required tasks listed under Week 7 in the project log, without extra narrative.</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="feature-cloud section-card-muted p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">What improves accuracy</p>
                    <div className="mt-4 grid gap-3">
                      {[
                        ['Smarter chunk choice', 'Exact matches like week numbers and phrases are ranked higher.'],
                        ['Shorter answer prompt', 'The model is told to answer first and skip background.'],
                        ['User chunk size', 'Upload settings now affect how new documents are actually chunked.'],
                      ].map(([title, text]) => (
                        <div key={title} className="rounded-2xl border border-white/70 bg-white/76 p-3">
                          <p className="text-sm font-bold text-text-primary">{title}</p>
                          <p className="mt-1 text-xs leading-5 text-text-secondary">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="editorial-strip grid sm:grid-cols-3 lg:grid-cols-1">
                    {compactStats.map((item) => (
                      <div key={item.label} className="p-4">
                        <p className="text-lg font-black text-text-primary">{item.value}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            className="mb-12 max-w-2xl"
          >
            <div className="page-kicker mb-5">
              <HiOutlineDocumentText className="h-4 w-4" />
              Core experience
            </div>
            <h2 className="text-4xl font-black text-text-primary sm:text-5xl">
              More attractive, but still simple to work with.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">
              The design stays light and elegant while giving each part of the product clearer purpose,
              stronger hierarchy, and more visual detail.
            </p>
          </Motion.div>

          <div className="grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar, index) => (
              <Motion.article
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08, duration: 0.55 }}
                className="section-card lift-card p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    {pillar.badge}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/16 to-accent/16 text-primary">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-8 text-2xl font-black text-text-primary">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{pillar.text}</p>
              </Motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl section-card overflow-hidden px-6 py-10 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="page-kicker mb-5">
                <HiOutlineBolt className="h-4 w-4" />
                Precision workflow
              </div>
              <h2 className="text-3xl font-black text-text-primary sm:text-4xl">
                The system now favors direct, context-based responses again.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-text-secondary">
                Specific queries should no longer drift into long storytelling. The backend now ranks
                tighter matches first and prompts the model to answer the exact ask more cleanly.
              </p>
            </div>

            <div className="grid gap-4">
              {workflow.map((item, index) => (
                <Motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.1, duration: 0.55 }}
                  className="section-card-muted lift-card flex gap-4 p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-text-primary text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{item.step}</p>
                    <h3 className="mt-2 text-xl font-black text-text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-text-secondary">{item.text}</p>
                  </div>
                </Motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 pt-14 sm:px-6 lg:px-8">
        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          className="mx-auto max-w-6xl rounded-[2rem] bg-text-primary px-6 py-12 text-center text-white shadow-2xl shadow-text-primary/15 sm:px-10"
        >
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/65">Ready to work</p>
          <h2 className="mt-4 text-3xl font-black sm:text-5xl">
            Elegant outside, more precise underneath.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
            Upload a document, ask a focused question, and the app now aims to return the answer you
            actually wanted instead of a long explanatory story.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/upload"
              className="rounded-full bg-white px-7 py-3 text-sm font-bold text-text-primary transition-transform hover:-translate-y-1"
            >
              Start with upload
            </Link>
            <Link
              to="/chat"
              className="rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-1"
            >
              Ask your documents
            </Link>
          </div>
        </Motion.div>
      </section>
    </div>
  )
}
