"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("cardiq-theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      document.documentElement.classList.toggle("dark", prefersDark);
      setDarkMode(prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !darkMode;

    setDarkMode(nextTheme);

    document.documentElement.classList.toggle("dark", nextTheme);

    localStorage.setItem(
      "cardiq-theme",
      nextTheme ? "dark" : "light"
    );
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900 transition-colors duration-500 dark:bg-slate-950 dark:text-white">

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition-colors duration-500 dark:border-slate-800/70 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">

          {/* Logo */}
          <a
            href="/"
            className="text-2xl font-bold tracking-tight text-slate-950 transition-colors dark:text-white"
          >
            CardIQ
          </a>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-slate-950 dark:hover:text-white"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="transition-colors hover:text-slate-950 dark:hover:text-white"
            >
              How it works
            </a>

            <a
              href="#about"
              className="transition-colors hover:text-slate-950 dark:hover:text-white"
            >
              About
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle light and dark mode"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {darkMode ? "☀" : "☾"}
            </button>

            {/* Login */}
            <a
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:block"
            >
              Log in
            </a>

            {/* Signup */}
            <a
              href="/signup"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>


      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-73px)] items-center overflow-hidden px-6 py-24 md:py-32 lg:px-8">

        <div className="mx-auto w-full max-w-7xl">

          {/* Badge */}
          <div className="mb-8 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Smarter credit card decisions
          </div>

          {/* Heading */}
          <h1 className="max-w-5xl text-5xl font-bold tracking-[-0.045em] text-slate-950 transition-colors duration-500 dark:text-white md:text-7xl lg:text-8xl">
            Make every card
            <br />
            spend count.
          </h1>

          {/* Description */}
          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600 transition-colors dark:text-slate-300 md:text-xl">
            CardIQ helps you manage your credit cards, choose the right card
            for every purchase, and track the rewards and benefits you earn.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap gap-4">

            <a
              href="/signup"
              className="rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Get started →
            </a>

            <a
              href="#features"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Explore CardIQ
            </a>

          </div>
        </div>
      </section>


      {/* Features */}
      <section
        id="features"
        className="border-y border-slate-200 bg-white transition-colors duration-500 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8 md:py-36">

          <div className="max-w-3xl">

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              One place for your cards
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-5xl">
              Everything you need to get more from your cards.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Build your card portfolio, find the best card for a purchase,
              track spending and discover rewards opportunities.
            </p>

          </div>


          {/* Feature cards */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">

            {/* Best Card */}
            <div className="group rounded-3xl border border-slate-200 bg-slate-50 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white">
                ✦
              </div>

              <h3 className="mt-7 text-xl font-semibold text-slate-950 dark:text-white">
                Best Card
              </h3>

              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                Tell CardIQ what you are buying and find the card that can
                provide the best available value.
              </p>

            </div>


            {/* Card Portfolio */}
            <div className="group rounded-3xl border border-slate-200 bg-slate-50 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white">
                ＋
              </div>

              <h3 className="mt-7 text-xl font-semibold text-slate-950 dark:text-white">
                Card Portfolio
              </h3>

              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                Keep your credit cards organized in one place with their
                rewards, networks and key benefits.
              </p>

            </div>


            {/* Rewards */}
            <div className="group rounded-3xl border border-slate-200 bg-slate-50 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white">
                ↗
              </div>

              <h3 className="mt-7 text-xl font-semibold text-slate-950 dark:text-white">
                Rewards Tracking
              </h3>

              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                Track purchases and understand the value you are earning from
                your credit card portfolio.
              </p>

            </div>

          </div>
        </div>
      </section>


      {/* How it works */}
      <section
        id="how-it-works"
        className="min-h-screen bg-[#f7f8fa] transition-colors duration-500 dark:bg-slate-950"
      >
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8 md:py-36">

          <div className="max-w-3xl">

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              How it works
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-5xl">
              A smarter way to use your cards.
            </h2>

          </div>


          {/* Steps */}
          <div className="mt-16 grid gap-12 md:grid-cols-3">

            {/* Step 1 */}
            <div>
              <div className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                01
              </div>

              <h3 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
                Add your cards
              </h3>

              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                Build your personal credit card portfolio.
              </p>
            </div>


            {/* Step 2 */}
            <div>
              <div className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                02
              </div>

              <h3 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
                Tell CardIQ what you need
              </h3>

              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                Enter a purchase or explore your available card benefits.
              </p>
            </div>


            {/* Step 3 */}
            <div>
              <div className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                03
              </div>

              <h3 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
                Make better decisions
              </h3>

              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                Choose the card that offers the best available value.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* CTA */}
      <section
        id="about"
        className="bg-slate-950 text-white transition-colors duration-500 dark:bg-white dark:text-slate-950"
      >
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8 md:py-36">

          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-center">

            <div className="max-w-2xl">

              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                Ready to make every card spend count?
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-300 dark:text-slate-600">
                Create your CardIQ account and start building your smarter
                credit card portfolio.
              </p>

            </div>


            <a
              href="/signup"
              className="inline-flex shrink-0 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
            >
              Create your account →
            </a>

          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white transition-colors duration-500 dark:border-slate-800 dark:bg-slate-950">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-10 text-sm text-slate-500 lg:px-8 md:flex-row md:items-center md:justify-between">

          <div className="font-semibold text-slate-900 dark:text-white">
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
