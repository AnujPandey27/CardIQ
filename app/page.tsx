export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-2xl font-bold tracking-tight">
            CardIQ
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#about" className="hover:text-slate-900">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log in
            </a>

            <a
              href="/signup"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            Smarter credit card decisions
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">
            Make every card spend count.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
            CardIQ helps you manage your credit cards, choose the right card
            for every purchase, and track the rewards and benefits you earn.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/signup"
              className="rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Get started →
            </a>

            <a
              href="#features"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Explore CardIQ
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              One place for your cards
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to get more from your cards.
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              Build your card portfolio, find the best card for a purchase,
              track spending and discover rewards opportunities.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <div className="text-2xl">✦</div>
              <h3 className="mt-5 text-xl font-semibold">
                Best Card
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Tell CardIQ what you are buying and find the card that can
                provide the best available value.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <div className="text-2xl">＋</div>
              <h3 className="mt-5 text-xl font-semibold">
                Card Portfolio
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Keep your credit cards organized in one place with their
                rewards, networks and key benefits.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <div className="text-2xl">↗</div>
              <h3 className="mt-5 text-xl font-semibold">
                Rewards Tracking
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Track purchases and understand the value you are earning from
                your credit card portfolio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              A smarter way to use your cards.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div>
              <div className="text-sm font-semibold text-slate-500">
                01
              </div>
              <h3 className="mt-3 text-xl font-semibold">
                Add your cards
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Build your personal credit card portfolio.
              </p>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-500">
                02
              </div>
              <h3 className="mt-3 text-xl font-semibold">
                Tell CardIQ what you need
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Enter a purchase or explore your available card benefits.
              </p>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-500">
                03
              </div>
              <h3 className="mt-3 text-xl font-semibold">
                Make better decisions
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Choose the card that offers the best available value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Ready to make every card spend count?
              </h2>

              <p className="mt-4 text-lg leading-8 text-slate-300">
                Create your CardIQ account and start building your smarter
                credit card portfolio.
              </p>
            </div>

            <a
              href="/signup"
              className="inline-flex shrink-0 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 hover:bg-slate-100"
            >
              Create your account →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="font-semibold text-slate-900">
            CardIQ
          </div>

          <div>
            Make every card spend count.
          </div>
        </div>
      </footer>
    </main>
  );
}
