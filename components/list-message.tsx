export function ListMessage({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <div className="border-b border-card-border bg-off-white-muted/70 px-4 py-2.5">
      <p className="text-sm italic leading-snug text-text-muted">
        &ldquo;{message}&rdquo;
      </p>
    </div>
  );
}
