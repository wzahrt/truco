import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-4xl font-bold">Truco</h1>
      <p>A real-time 4-player Truco game.</p>

      <Link
        href="/game"
        className="inline-block rounded bg-black px-4 py-2 text-white"
      >
        Play
      </Link>
    </main>
  );
}