import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  HiOutlineBolt,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { useChat } from '../context/ChatContext'

export default function SettingsPage() {
  const { settings, setSettings } = useChat()
  const [form, setForm] = useState(settings)

  const handleSave = () => {
    setSettings(form)
    toast.success('Preferences saved')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="page-header-band">
        <div className="page-kicker mb-4">
          <HiOutlineSparkles className="h-4 w-4" />
          Retrieval controls
        </div>
        <h2 className="flex items-center gap-3 text-3xl font-black text-text-primary sm:text-4xl">
          <HiOutlineCog6Tooth className="h-8 w-8 text-primary" />
          Tune how the assistant behaves.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
          Adjust retrieval depth and streaming to keep answers tighter, faster, or more exhaustive
          depending on the type of question you are asking.
        </p>
      </div>

      <section className="section-card p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-lg font-black text-text-primary">
          <HiOutlineDocumentText className="h-5 w-5 text-primary" />
          Retrieval parameters
        </h3>

        <div className="mt-8 space-y-8">
          <div className="rounded-[1.5rem] bg-white/72 p-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <label className="text-sm font-bold text-text-primary">Top-K results</label>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-primary">
                {form.topK} chunks
              </span>
            </div>
            <p className="text-sm leading-7 text-text-secondary">
              Lower values keep answers focused. Higher values give the model more context but can make
              responses broader or longer.
            </p>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={form.topK}
              onChange={(event) => setForm({ ...form, topK: parseInt(event.target.value, 10) })}
              className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full accent-primary"
              style={{
                background: `linear-gradient(to right, #dd5b38 ${((form.topK - 1) / 14) * 100}%, #eadccf ${((form.topK - 1) / 14) * 100}%)`,
              }}
            />
            <div className="mt-2 flex justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
              <span>1 focused</span>
              <span>15 broader</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-white/72 p-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <label className="text-sm font-bold text-text-primary">Chunk size</label>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-accent">
                {form.chunkSize} chars
              </span>
            </div>
            <p className="text-sm leading-7 text-text-secondary">
              Smaller chunks are more precise. Larger chunks preserve more surrounding context for each match.
            </p>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={form.chunkSize}
              onChange={(event) => setForm({ ...form, chunkSize: parseInt(event.target.value, 10) })}
              className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full accent-accent"
              style={{
                background: `linear-gradient(to right, #0f766e ${((form.chunkSize - 200) / 1800) * 100}%, #eadccf ${((form.chunkSize - 200) / 1800) * 100}%)`,
              }}
            />
            <div className="mt-2 flex justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
              <span>200 precise</span>
              <span>2000 broader</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-card p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-lg font-black text-text-primary">
          <HiOutlineBolt className="h-5 w-5 text-primary" />
          Experience
        </h3>

        <div className="mt-6 flex items-center justify-between gap-6 rounded-[1.5rem] bg-white/72 p-5">
          <div className="flex-1">
            <label className="block text-sm font-bold text-text-primary">Real-time streaming</label>
            <p className="mt-2 text-sm leading-7 text-text-secondary">
              Show answers token by token for a more conversational feel while the model is still generating.
            </p>
          </div>

          <button
            onClick={() => setForm({ ...form, stream: !form.stream })}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              form.stream ? 'bg-primary' : 'bg-surface-lighter'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.stream ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      <div className="section-card flex gap-3 p-5">
        <HiOutlineInformationCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm leading-7 text-text-secondary">
          `Top-K` changes the number of retrieved chunks on the next question. `Chunk size` affects
          only newly uploaded files because existing embeddings are already stored.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="rounded-full bg-text-primary px-8 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-1"
        >
          Save preferences
        </button>
      </div>
    </div>
  )
}
