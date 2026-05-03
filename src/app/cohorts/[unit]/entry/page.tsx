import { redirect } from "next/navigation";
import {
  LoginScreen,
  safeListEntryOperatingUnits,
} from "@/app/meetup-dashboard";
import { isAuthenticatedForUnit } from "@/lib/auth";
import { cleanReturnPath, cohortAwarePath } from "@/lib/cohort-routes";

type EntryPageProps = {
  params: Promise<{ unit: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function singleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function CohortEntryPage({
  params,
  searchParams,
}: EntryPageProps) {
  const [{ unit }, query] = await Promise.all([params, searchParams]);
  const returnPath = cleanReturnPath(
    singleParam(query.returnPath) || cohortAwarePath(unit, "/")
  );

  if (await isAuthenticatedForUnit(unit)) {
    redirect(returnPath);
  }

  const units = await safeListEntryOperatingUnits();

  return (
    <LoginScreen
      authStatus={singleParam(query.auth)}
      adminAuthStatus=""
      units={units}
      selectedUnitSlug={unit}
      returnPath={returnPath}
    />
  );
}
