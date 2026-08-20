export interface LearnerReview {
  quote: string;
  name: string;
  /** Band movement, e.g. "6.0 → 7.5". */
  progress: string;
}

/** Learner testimonial (002 T013). */
export default function LearnerReviewCard({ review }: { review: LearnerReview }) {
  return (
    <figure className="flex h-full flex-col rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
      <p className="text-label-caps uppercase text-secondary">Band {review.progress}</p>
      <blockquote className="mt-stack-sm flex-1 font-body text-body-md text-on-surface">
        “{review.quote}”
      </blockquote>
      <figcaption className="mt-stack-md font-body text-body-sm text-on-surface-variant">
        {review.name}
      </figcaption>
    </figure>
  );
}
