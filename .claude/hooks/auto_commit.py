#!/usr/bin/env python
"""Auto-commit + push hook for this repository.

Wired to the `Stop` event in .claude/settings.json, so it runs after Claude finishes
a turn. If the working tree is dirty it stages everything, commits under the project
owner's identity, and pushes. If nothing changed it exits silently.

Design rules this script must keep:

  * The commit author AND committer are always Nguyen Van Quyen
    <23521329@gm.uit.edu.vn>, pinned via `git -c` + GIT_COMMITTER_* so it cannot be
    overridden by whatever git config happens to be active.
  * No AI/assistant attribution ever appears in the message, trailers, or identity.
  * It NEVER blocks the session: every failure path still exits 0. A failed push is
    reported and forgotten, not retried in a loop.
  * It refuses to commit anything that looks like a secret, even though .gitignore
    should already exclude those -- defense in depth, since `git add -A` is broad.

Run it by hand with --dry-run to see what it would do without touching git.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

AUTHOR_NAME = "Nguyễn Văn Quyền"
AUTHOR_EMAIL = "23521329@gm.uit.edu.vn"

REPO_ROOT = Path(__file__).resolve().parents[2]

# Anything matching these is treated as a secret and aborts the commit. .gitignore
# should already catch them; this is the backstop for a mis-edited ignore file.
SECRET_BASENAMES = {".env", "id_rsa", "id_ed25519", ".npmrc", ".pypirc"}
SECRET_SUFFIXES = (".pem", ".key", ".p12", ".pfx", ".keystore")

MAX_SCOPES_IN_SUBJECT = 3
MAX_FILES_IN_BODY = 20


def git(*args: str, check: bool = False) -> subprocess.CompletedProcess[str]:
    """Run a git command inside the repo, returning the completed process."""
    return subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=check,
    )


def log(message: str) -> None:
    # ASCII only: Windows consoles default to a codepage that chokes on other glyphs.
    print(f"[auto-commit] {message}", flush=True)


def find_secrets(paths: list[str]) -> list[str]:
    flagged = []
    for path in paths:
        name = path.rsplit("/", 1)[-1]
        if name == ".env.example":
            continue
        if name in SECRET_BASENAMES or name.startswith(".env."):
            flagged.append(path)
        elif path.lower().endswith(SECRET_SUFFIXES):
            flagged.append(path)
    return flagged


def build_message(paths: list[str]) -> str:
    """Compose a commit message mechanically from the staged paths.

    A hook has no idea *why* the change was made, so the subject states scope and
    size rather than pretending to describe intent. The body lists the actual files
    so `git log -1 --stat` is not the only way to see what moved.
    """
    scopes = sorted({p.split("/")[0] for p in paths})
    if len(scopes) <= MAX_SCOPES_IN_SUBJECT:
        scope_text = ",".join(scopes)
    else:
        shown = ",".join(scopes[:MAX_SCOPES_IN_SUBJECT])
        scope_text = f"{shown}+{len(scopes) - MAX_SCOPES_IN_SUBJECT}"

    count = len(paths)
    subject = f"chore({scope_text}): update {count} file{'s' if count != 1 else ''}"

    body_lines = [f"- {p}" for p in paths[:MAX_FILES_IN_BODY]]
    if count > MAX_FILES_IN_BODY:
        body_lines.append(f"- ... and {count - MAX_FILES_IN_BODY} more")

    return subject + "\n\n" + "\n".join(body_lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report what would be committed without staging, committing, or pushing.",
    )
    parser.add_argument(
        "--no-push",
        action="store_true",
        help="Commit locally but skip the push.",
    )
    args = parser.parse_args()

    # Claude Code sends a JSON payload on stdin. Nothing here needs it, but draining
    # it keeps the writing end from seeing a broken pipe.
    if not sys.stdin.isatty():
        try:
            sys.stdin.read()
        except Exception:
            pass

    if git("rev-parse", "--git-dir").returncode != 0:
        log("not a git repository; skipping")
        return 0

    status = git("status", "--porcelain")
    if status.returncode != 0:
        log(f"git status failed; skipping ({status.stderr.strip()[:200]})")
        return 0

    if not status.stdout.strip():
        return 0  # Clean tree -- the common case. Stay quiet.

    if args.dry_run:
        pending = [line[3:] for line in status.stdout.splitlines() if line[3:]]
        log(f"DRY RUN: {len(pending)} path(s) would be staged")
        for path in pending[:MAX_FILES_IN_BODY]:
            log(f"  {path}")
        return 0

    if git("add", "-A").returncode != 0:
        log("git add failed; skipping")
        return 0

    staged = git("diff", "--cached", "--name-only")
    paths = [p for p in staged.stdout.splitlines() if p.strip()]
    if not paths:
        log("nothing staged after add; skipping")
        return 0

    secrets = find_secrets(paths)
    if secrets:
        git("reset")  # Unstage rather than leave a loaded gun for the next run.
        log(f"ABORTED: refusing to commit possible secret(s): {', '.join(secrets[:5])}")
        log("check .gitignore, then commit manually if this was intentional")
        return 0

    env = os.environ.copy()
    env["GIT_COMMITTER_NAME"] = AUTHOR_NAME
    env["GIT_COMMITTER_EMAIL"] = AUTHOR_EMAIL

    commit = subprocess.run(
        [
            "git",
            "-c", f"user.name={AUTHOR_NAME}",
            "-c", f"user.email={AUTHOR_EMAIL}",
            "commit",
            "-m", build_message(paths),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    if commit.returncode != 0:
        detail = (commit.stderr or commit.stdout).strip().splitlines()
        log(f"commit failed: {detail[0][:200] if detail else 'unknown error'}")
        return 0

    sha = git("rev-parse", "--short", "HEAD").stdout.strip()
    log(f"committed {sha} ({len(paths)} file(s))")

    if args.no_push:
        return 0

    push = git("push")
    if push.returncode != 0:
        detail = (push.stderr or push.stdout).strip().splitlines()
        log(f"push failed (commit is safe locally): {detail[-1][:200] if detail else '?'}")
        return 0

    log("pushed to origin")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # Never let a hook crash take down the session.
        print(f"[auto-commit] unexpected error, ignoring: {type(exc).__name__}: {exc}")
        sys.exit(0)
