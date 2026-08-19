export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              CardIQ
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your smarter credit card companion
            </p>
          </div>

          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50">
            Add card
          </button>
        </header>

        <section className="flex flex-1 items-center justify-center py-20">
          <div className="max-w-xl text-center">
            <p className="mb-3 text-sm font-medium text-slate-500">
              CardIQ
            </p>

            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Make every card spend count.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600">
              Manage your cards, discover the best card for each purchase,
              and track the rewards you earn.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                Add your first card
              </button>

              <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-slate-50">
                Explore CardIQ
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
