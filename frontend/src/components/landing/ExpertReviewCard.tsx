export interface ExpertReview {
  quote: string;
  name: string;
  title: string;
}

/** Expert endorsement (002 T013). */
export default function ExpertReviewCard({ review }: { review: ExpertReview }) {
  return (
    <figure className="flex h-full flex-col rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
      <blockquote className="flex-1 font-body text-body-md text-on-surface">
        “{review.quote}”
      </blockquote>
      <figcaption className="mt-stack-md border-t border-outline-variant pt-stack-sm">
        <p className="font-body text-body-md font-medium text-on-surface">{review.name}</p>
        <p className="font-body text-body-sm text-on-surface-variant">{review.title}</p>
      </figcaption>
    </figure>
  );
}
