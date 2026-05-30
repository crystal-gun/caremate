const headerClass = [
  'bg-white border-b border-gray-100',
  'px-4 py-4',
].join(' ')

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className={headerClass}>
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-blue-600">CareMate</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
