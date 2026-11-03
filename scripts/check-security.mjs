/**
 * MESSMATE security checks
 * ------------------------------------------------------------------
 * Talks to Supabase over the public REST API with the *anon* key only — the
 * same power a visitor's browser has — and proves that row-level security
 * still keeps students inside their own data.
 *
 *   npm run check:security        (needs .env.local with the local keys)
 *
 * Exits non-zero if any check fails, so it can gate a deploy.
 */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !ANON_KEY) {
  console.error(
    "\nMissing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Copy .env.example to .env.local first.\n",
  );
  process.exit(1);
}

const PASSWORD = "Messmate@123";
const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass: Boolean(pass), detail });
}

function client() {
  return createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(email) {
  const supabase = client();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { supabase, user: data.user };
}

async function run() {
  const anonymous = client();
  const student = await signIn("diya@messmate.test");
  const admin = await signIn("admin@messmate.test");

  /* 1. Anonymous visitors only see what discovery needs. */
  const anonFeedback = await anonymous.from("feedback").select("id");
  record(
    "Anonymous readers cannot read feedback rows",
    !anonFeedback.error && (anonFeedback.data ?? []).length === 0,
    `${(anonFeedback.data ?? []).length} rows`,
  );

  const anonRatings = await anonymous.from("ratings").select("id");
  record(
    "Anonymous readers cannot read ratings rows",
    !anonRatings.error && (anonRatings.data ?? []).length === 0,
    `${(anonRatings.data ?? []).length} rows`,
  );

  const anonReports = await anonymous.from("reports").select("id");
  record(
    "Anonymous readers cannot read reports rows",
    !anonReports.error && (anonReports.data ?? []).length === 0,
    `${(anonReports.data ?? []).length} rows`,
  );

  const anonProfiles = await anonymous.from("profiles").select("id");
  record(
    "Anonymous readers cannot read profiles",
    !anonProfiles.error && (anonProfiles.data ?? []).length === 0,
    `${(anonProfiles.data ?? []).length} rows`,
  );

  const directory = await anonymous.rpc("mess_directory_stats", {
    p_mess_ids: [],
  });
  record(
    "Anonymous discovery RPC is callable",
    !directory.error,
    directory.error?.message ?? "ok",
  );

  /* 2. Students only see their own ratings, comments and reports. */
  const ratings = await student.supabase.from("ratings").select("user_id");
  const ratingRows = ratings.data ?? [];
  record(
    "Student sees only their own ratings",
    !ratings.error &&
      ratingRows.length > 0 &&
      ratingRows.every((row) => row.user_id === student.user.id),
    `${ratingRows.length} rows, ${new Set(ratingRows.map((r) => r.user_id)).size} users`,
  );

  const feedback = await student.supabase.from("feedback").select("user_id");
  const feedbackRows = feedback.data ?? [];
  record(
    "Student sees only their own feedback",
    !feedback.error &&
      feedbackRows.every((row) => row.user_id === student.user.id),
    `${feedbackRows.length} rows`,
  );

  const reports = await student.supabase.from("reports").select("user_id");
  const reportRows = reports.data ?? [];
  record(
    "Student sees only their own reports",
    !reports.error && reportRows.every((row) => row.user_id === student.user.id),
    `${reportRows.length} rows`,
  );

  const profiles = await student.supabase
    .from("profiles")
    .select("*")
    .limit(10);
  const profileRows = profiles.data ?? [];
  record(
    "Student sees only their own profile",
    !profiles.error &&
      profileRows.length === 1 &&
      profileRows[0].id === student.user.id,
    `${profileRows.length} rows`,
  );

  const profileKeys = Object.keys(profileRows[0] ?? {});
  record(
    "Profile rows carry no password material",
    !profileKeys.some((key) => /password|secret|token/i.test(key)),
    profileKeys.join(", "),
  );

  /* 3. Cross-tenant writes are rejected. */
  const ownMess = profileRows[0]?.mess_id ?? null;
  const foreignMenus = await student.supabase
    .from("menus")
    .select("id, mess_id")
    .neq("mess_id", ownMess)
    .limit(1);
  const foreignMenu = (foreignMenus.data ?? [])[0];

  if (foreignMenu) {
    const write = await student.supabase.from("ratings").insert({
      user_id: student.user.id,
      menu_id: foreignMenu.id,
      stars: 5,
    });
    record(
      "Student cannot rate another mess's meal",
      Boolean(write.error),
      write.error?.message ?? "write unexpectedly succeeded",
    );
  } else {
    record("Student cannot rate another mess's meal", false, "no foreign menu found to probe");
  }

  const spoofedFeedback = await student.supabase.from("feedback").insert({
    user_id: admin.user.id,
    menu_id: foreignMenu?.id ?? "00000000-0000-0000-0000-000000000000",
    comment: "spoofed comment",
  });
  record(
    "Student cannot write feedback as somebody else",
    Boolean(spoofedFeedback.error),
    spoofedFeedback.error?.message ?? "write unexpectedly succeeded",
  );

  /* 4. Students cannot triage reports. */
  const adminReport = await admin.supabase
    .from("reports")
    .select("id, user_id")
    .neq("user_id", student.user.id)
    .limit(1);
  const target = (adminReport.data ?? [])[0];

  if (target) {
    const update = await student.supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", target.id)
      .select("id");
    record(
      "Student cannot change a report's status",
      Boolean(update.error) || (update.data ?? []).length === 0,
      update.error?.message ?? `${(update.data ?? []).length} rows updated`,
    );
  } else {
    record("Student cannot change a report's status", false, "no report to probe");
  }

  /* 5. Auth internals are not exposed over the REST API. */
  const usersTable = await student.supabase.from("users").select("id").limit(1);
  record(
    "auth.users is not readable from the API",
    Boolean(usersTable.error),
    usersTable.error?.message ?? "read unexpectedly succeeded",
  );

  /* 6. Positive control: the admin really can see everybody. */
  const adminRatings = await admin.supabase.from("ratings").select("user_id").limit(1000);
  const adminRows = adminRatings.data ?? [];
  record(
    "Administrator sees ratings from multiple students",
    !adminRatings.error &&
      new Set(adminRows.map((row) => row.user_id)).size > 1,
    `${adminRows.length} rows, ${new Set(adminRows.map((r) => r.user_id)).size} students`,
  );

  const adminProfiles = await admin.supabase.from("profiles").select("id").limit(1000);
  record(
    "Administrator sees every profile",
    !adminProfiles.error && (adminProfiles.data ?? []).length > 4,
    `${(adminProfiles.data ?? []).length} profiles`,
  );

  /* 7. Signed-out introspection must not leak the session. */
  const signedOutUser = await anonymous.auth.getUser();
  record(
    "Anonymous client has no session",
    !signedOutUser.data.user,
    signedOutUser.data.user?.email ?? "no session",
  );
}

function print() {
  const width = Math.max(...results.map((result) => result.name.length));
  console.log("\nMESSMATE security checks\n");
  for (const result of results) {
    const mark = result.pass ? "PASS" : "FAIL";
    console.log(
      `  ${mark.padEnd(5)} ${result.name.padEnd(width)}  ${result.detail}`,
    );
  }

  const failed = results.filter((result) => !result.pass).length;
  console.log(
    `\n  ${results.length - failed}/${results.length} checks passed.\n`,
  );
  return failed;
}

run()
  .then(() => {
    const failed = print();
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error("\nSecurity checks could not run:", error.message);
    process.exit(1);
  });
