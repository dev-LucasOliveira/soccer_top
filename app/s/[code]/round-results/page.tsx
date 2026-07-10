"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoundResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();

  useEffect(() => {
    params.then((p) => {
      router.replace(`/s/${p.code}/status`);
    });
  }, [params, router]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-center text-on-pitch-muted">Redirecionando...</p>
    </main>
  );
}
