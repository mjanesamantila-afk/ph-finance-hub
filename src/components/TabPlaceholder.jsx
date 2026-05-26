export default function TabPlaceholder({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {description && <p className="mt-1 text-slate-500">{description}</p>}
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
        Coming in Phase 4.
      </div>
    </div>
  )
}
