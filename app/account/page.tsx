          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Account settings
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Manage settings that apply to your entire CardIQ account.
          </p>
        </section>

        {/* Login account */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Login account
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              These details belong to your CardIQ account, not an individual
              regional profile.
            </p>
          </div>

          <div>
            <label
              htmlFor="account-email"
              className="mb-2 block text-sm font-medium"
            >
              Email address
            </label>

            <input
              id="account-email"
              type="email"
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 text-sm text-[var(--muted)]"
            />

            <p className="mt-2 text-xs text-[var(--muted)]">
              Your login email is shared across all profiles on this account.
            </p>
          </div>
        </section>

        {/* Security */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Security
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Manage security for your entire CardIQ account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resettingPassword}
            className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
          >
            {resettingPassword
              ? "Sending..."
              : "Reset password"}
          </button>

          {message && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          )}
        </section>

        {/* Danger Zone */}
        <section className="rounded-2xl border border-red-200 bg-[var(--card)] p-6 shadow-sm dark:border-red-900 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Danger zone
            </h2>

            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Permanently deleting your account will remove the entire CardIQ
              account and its associated profiles and card data.
            </p>
          </div>

          <button
            type="button"
            disabled
            className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-400 opacity-60 dark:border-red-900"
          >
            Delete account
          </button>

          <p className="mt-3 text-xs text-[var(--muted)]">
            Account deletion will be enabled after the secure server-side
            deletion flow is implemented.
          </p>
        </section>

        <footer className="mt-12 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <span>CardIQ</span>
            <span>Make every card spend count.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
