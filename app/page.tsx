import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export default async function Home() {
  // Use Admin client for health check to bypass RLS policies
  const supabase = createAdminClient()

  // count: 'exact', head: true returns count property and null data
  const { count, error } = await supabase.from('contacts').select('*', { count: 'exact', head: true })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Hello, CRM</h1>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Supabase Status{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[40ch] text-sm opacity-50`}>
            {error ? (
              <span className="text-red-500 font-bold">Error: {error.message}</span>
            ) : (
              <span className="text-green-500 font-bold">
                Connected. Table &quot;contacts&quot; found. Row count: {count}
              </span>
            )}
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              (Checked via Service Role to bypass RLS)
            </span>
          </p>
        </div>
      </div>
    </main>
  )
}
