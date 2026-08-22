import { redirect } from "next/navigation";

/**
 * The old profile route.
 *
 * Kept as a redirect rather than deleted: it was linked from the workspace header for the
 * whole of the previous version, so it is in people's history and bookmarks. Account is
 * the same information plus progress and history, so nothing is lost by landing there.
 */
export default function ProfilePage() {
  redirect("/account");
}
