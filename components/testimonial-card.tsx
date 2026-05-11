export function TestimonialCard({
  name,
  context,
  body,
}: {
  name: string;
  context?: string;
  body: string;
}) {
  return (
    <figure className="flex flex-col rounded-2xl border border-subtle bg-surface p-7 sm:p-8">
      <svg
        aria-hidden
        viewBox="0 0 32 24"
        className="h-6 w-6 text-accent"
        fill="currentColor"
      >
        <path d="M0 24V14C0 6.3 4.5 1.1 12 0v4.5C8 5.5 5.5 8.5 5.3 12H10v12H0Zm22 0V14C22 6.3 26.5 1.1 34 0v4.5c-4 1-6.5 4-6.7 7.5H32v12H22Z" />
      </svg>
      <blockquote className="mt-4 text-base leading-relaxed">{body}</blockquote>
      <figcaption className="mt-6 pt-5 border-t border-subtle">
        <p className="font-medium">{name}</p>
        {context && <p className="mt-0.5 text-sm text-muted">{context}</p>}
      </figcaption>
    </figure>
  );
}
