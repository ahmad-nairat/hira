export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 border-b border-lt-border" />
      <div className="bg-surface-2 h-[420px]" />
      <div className="max-w-[1180px] mx-auto px-6 py-16">
        <div className="skel h-9 w-40 rounded-lg mb-8" />
        <div className="skel h-12 rounded-2xl mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skel h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
