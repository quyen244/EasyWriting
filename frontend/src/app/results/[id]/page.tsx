"use client";

/**
 * A stored result, opened from history or from an activity row.
 *
 * Renders the same `ResultDashboard` the grader renders inline — the point of addressing
 * a result by id is that old feedback stays exactly as useful as new feedback, not that
 * it gets a lesser read-only view.
 */

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import AppShell from "@/components/app/AppShell";
import {
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/components/app/Primitives";
import ProtectedRoute from "@/components/ProtectedRoute";
import ResultDashboard from "@/components/result/ResultDashboard";
import { useLocale } from "@/hooks/useLocale";
import {
  ApiError,
  getResult,
  recommendedModuleFor,
  weakestCriterion,
  type GradingResult,
} from "@/lib/api";

function StoredResultView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale, formatDate } = useLocale();

  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Re-fetching on locale change is the point, not an accident: feedback prose is
      // composed at read time, so an old result switches language with the interface.
      setResult(await getResult(params.id, locale));
    } catch (caught) {
      setError(caught instanceof ApiError ? t("result.notFound") : t("common.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }, [params.id, locale, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const weakest = result ? weakestCriterion(result.criteria) : null;
  const moduleId = result && weakest ? recommendedModuleFor(result.task_type, weakest.code) : null;

  return (
    <AppShell>
      <PageHeader
        eyebrow={t("result.eyebrow")}
        title={t("result.overallBand")}
        description={result ? formatDate(result.created_at) : undefined}
        actions={
          <Button variant="secondary" onClick={() => router.push("/account")}>
            {t("result.backToAccount")}
          </Button>
        }
      />

      {loading && <LoadingState message={t("common.loading")} />}

      {!loading && error && (
        <ErrorState
          title={t("common.somethingWentWrong")}
          message={error}
          action={
            <Button onClick={() => router.push("/account")}>
              {t("result.backToAccount")}
            </Button>
          }
        />
      )}

      {!loading && result && (
        <ResultDashboard
          result={result}
          actions={
            <>
              <Button onClick={() => router.push("/workspace")}>
                {t("result.actionTryAgain")}
              </Button>
              {moduleId && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/practice/writing/${moduleId}`)}
                >
                  {t("result.actionPractice")}
                </Button>
              )}
              <Button variant="ghost" onClick={() => router.push("/workspace")}>
                {t("result.actionBack")}
              </Button>
            </>
          }
        />
      )}
    </AppShell>
  );
}

export default function StoredResultPage() {
  return (
    <ProtectedRoute>
      <StoredResultView />
    </ProtectedRoute>
  );
}
