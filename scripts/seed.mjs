/**
 * MESSMATE seed script
 * ------------------------------------------------------------------
 * Creates:
 *   • 4 messes          (different localities, prices and rating profiles)
 *   • 1 administrator   (admin@messmate.test — reads every mess)
 *   • 10 students       (spread across the four messes)
 *   • 31 days of menus  (yesterday … +29 days × breakfast, lunch, dinner)
 *   • ratings, feedback and reports, back-dated to their meal times
 *
 * Ratings come from a seeded generator, so each mess keeps a stable average:
 * Shree Sai ≈ 4.5, Sunrise ≈ 4.2, Green Valley ≈ 3.4, Hilltop ≈ 1.9. Hilltop is
 * the demo mess whose meals fall under the 2.5 "needs attention" line.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (server-side only, never shipped to the
 * browser). Run after applying supabase/migrations/0001_messmate_init.sql:
 *
 *   npm run seed
 *
 * Idempotent: accounts are reused, menus and ratings upsert on their unique
 * keys, and comments/reports are matched against the database before inserting.
 * Timestamps are deliberately older than the rate-limit windows in
 * 0002_student_modules.sql, which fire for service-role inserts too.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "\nMissing configuration.\n" +
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local\n" +
      "(Supabase dashboard → Project Settings → API), then run `npm run seed` again.\n",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Messmate@123";

const ADMIN = {
  email: "admin@messmate.test",
  name: "Meera Joshi (Mess Secretary)",
};

const MEAL_TYPES = ["breakfast", "lunch", "dinner"];
const MEAL_HOURS = { breakfast: 8, lunch: 13, dinner: 20 };

/** 29 past days + today feed the 30-day charts; +1 more publishes tomorrow. */
const PAST_DAYS = 29;
const DAYS_OF_MENUS = PAST_DAYS + 2;

/**
 * `weights` is the share of 1★…5★ ratings, so the crowd average stays stable
 * across re-runs: [1★, 2★, 3★, 4★, 5★].
 */
const MESSES = [
  {
    name: "Sunrise Hostel Mess",
    location: "Warje, Pune",
    address: "Sunrise Boys Hostel, Warje Malwadi Road, Pune 411058",
    price_per_meal: 62,
    weights: [1, 2, 6, 36, 55],
    students: [
      { email: "aarav@messmate.test", name: "Aarav Sharma" },
      { email: "diya@messmate.test", name: "Diya Patel" },
      { email: "kabir@messmate.test", name: "Kabir Nair" },
    ],
    menu: {
      breakfast: [
        ["Poha", "Jalebi", "Boiled Egg", "Banana", "Masala Chai"],
        ["Idli", "Coconut Chutney", "Sambar", "Sprouts", "Filter Coffee"],
        ["Aloo Paratha", "Curd", "Butter", "Tomato Chutney", "Adrak Chai"],
        ["Misal Pav", "Farsan", "Onion & Lemon", "Buttermilk", "Chai"],
        ["Upma", "Sabudana Vada", "Curd", "Papaya", "Masala Chai"],
        ["Puri Bhaji", "Boiled Egg", "Banana", "Milk", "Chai"],
        ["Oats Porridge", "Sprouts Salad", "Boiled Egg", "Banana", "Filter Coffee"],
        ["Dhokla", "Khaman", "Green Chutney", "Coconut Chutney", "Masala Chai"],
      ],
      lunch: [
        ["Roti", "Dal Tadka", "Jeera Rice", "Aloo Gobi", "Curd", "Salad"],
        ["Roti", "Rajma Masala", "Steamed Rice", "Bhindi Fry", "Buttermilk", "Papad"],
        ["Roti", "Chana Masala", "Lemon Rice", "Cabbage Poriyal", "Curd", "Salad"],
        ["Roti", "Dal Palak", "Veg Pulao", "Baingan Bharta", "Raita", "Salad"],
        ["Roti", "Kadhi Pakoda", "Steamed Rice", "Aloo Matar", "Pickle", "Salad"],
        ["Roti", "Dal Fry", "Veg Biryani", "Paneer Tikka Masala", "Raita", "Gulab Jamun"],
        ["Roti", "Sambar", "Steamed Rice", "Beans Usili", "Curd", "Salad"],
        ["Roti", "Chole Masala", "Jeera Rice", "Rasam", "Salad", "Fruit Custard"],
      ],
      dinner: [
        ["Roti", "Paneer Butter Masala", "Steamed Rice", "Veg Kofta", "Salad"],
        ["Roti", "Mix Veg Sabzi", "Moong Dal Khichdi", "Tomato Chutney", "Curd"],
        ["Roti", "Sev Tamatar Sabzi", "Steamed Rice", "Paneer Bhurji", "Salad"],
        ["Roti", "Dal Makhani", "Jeera Rice", "Aloo Jeera", "Salad"],
        ["Roti", "Veg Kolhapuri", "Steamed Rice", "Moong Dal", "Curd"],
        ["Pav Bhaji", "Masala Rice", "Onion Salad", "Kheer"],
        ["Roti", "Masoor Dal", "Steamed Rice", "Lauki Sabzi", "Salad"],
        ["Bhakri", "Unda Masala", "Curd Rice", "Boondi Raita"],
      ],
    },
    comments: [
      "Dal was perfectly seasoned — please keep this recipe.",
      "Rotis were a little dry at dinner, the paneer masala made up for it.",
      "The lunch queue moved fast today, service was well organised.",
    ],
  },
  {
    name: "Green Valley Hostel Mess",
    location: "Aundh, Pune",
    address: "Green Valley Hostel, Baner Road, Aundh, Pune 411045",
    price_per_meal: 48,
    weights: [4, 12, 38, 32, 14],
    students: [
      { email: "ishita@messmate.test", name: "Ishita Deshmukh" },
      { email: "rohan@messmate.test", name: "Rohan Kale" },
    ],
    menu: {
      breakfast: [
        ["Bread Omelette", "Milk Tea", "Banana"],
        ["Dalia", "Curd", "Fruit"],
        ["Aloo Paratha", "Achar", "Chai"],
        ["Idli", "Sambar", "Coconut Chutney"],
        ["Poha", "Sev", "Lemon", "Tea"],
        ["Upma", "Coconut Chutney", "Chai"],
        ["Sandalwadi Pav", "Egg Curry", "Chai"],
        ["Corn Flakes", "Milk", "Boiled Egg"],
      ],
      lunch: [
        ["Roti", "Dal", "Rice", "Aloo Bhaji", "Salad"],
        ["Roti", "Rajma", "Rice", "Cabbage Sabzi"],
        ["Roti", "Mix Dal", "Jeera Rice", "Gobi"],
        ["Rice", "Sambar", "Vetha Kari", "Curd"],
        ["Roti", "Chana Masala", "Rice", "Papad"],
        ["Veg Pulao", "Raita", "Boondi"],
        ["Roti", "Kadhi", "Rice", "Pickle"],
        ["Thali", "Roti", "Dal", "Sabzi", "Rice", "Sweet"],
      ],
      dinner: [
        ["Roti", "Paneer Masala", "Rice", "Salad"],
        ["Roti", "Dal Tadka", "Rice", "Aloo Matar"],
        ["Pav Bhaji", "Salad", "Kadhi"],
        ["Roti", "Aloo Gobhi", "Rice", "Curd"],
        ["Khichdi", "Kadhi", "Papad"],
        ["Roti", "Chole", "Rice", "Salad"],
        ["Rice", "Veg Curry", "Dal", "Curd"],
        ["Bread Pakora", "Masala Chai", "Sprouts"],
      ],
    },
    comments: [
      "Portion sizes have shrunk this month.",
      "Vegetables were fresh on Monday, not so much on Thursday.",
      "Breakfast chai has become watery.",
    ],
  },
  {
    name: "Shree Sai Chatralaya",
    location: "Karve Nagar, Pune",
    address: "Shree Sai Chatralaya, ITM Road, Karve Nagar, Pune 411052",
    price_per_meal: 75,
    weights: [0, 2, 10, 33, 55],
    students: [
      { email: "ananya@messmate.test", name: "Ananya Iyer" },
      { email: "vikram@messmate.test", name: "Vikram Singh" },
      { email: "sara@messmate.test", name: "Sara Sheikh" },
    ],
    menu: {
      breakfast: [
        ["Masala Dosa", "Sambar", "Three Chutneys", "Filter Coffee"],
        ["Rava Upma", "Medu Vada", "Coconut Chutney", "Milk"],
        ["Idli", "Vada", "Sambar", "Podi", "Filter Coffee"],
        ["Poha with Peanuts", "Kande Pohe", "Lassi", "Banana"],
        ["Appam", "Coconut Milk Stew", "Vegetable Kurma"],
        ["Poori with Potato Kurma", "Kesari", "Chai"],
        ["Set Dosa", "Egg Curry", "Filter Coffee"],
        ["Uttapam", "Tomato Chutney", "Curd", "Fruit Bowl"],
      ],
      lunch: [
        ["Ghee Rice", "Sambar", "Beans Poriyal", "Curd", "Papad", "Payasam"],
        ["Roti", "Paneer Labdar", "Jeera Rice", "Palak Dal", "Raita"],
        ["Veg Thali", "Four Sabzi", "Dal", "Roti", "Rice", "Sweet"],
        ["Coconut Rice", "Veg Chutney", "Mor Kuzhambu", "Boondi"],
        ["Lemon Rice", "Rajma Gash", "Cucumber Salad", "Curd"],
        ["Bisi Bele Bath", "Kosambari", "Potato Chips", "Buttermilk"],
        ["Roti", "Dal Makhani", "Veg Kolhapuri", "Jeera Rice", "Gulab Jamun"],
        ["Sambhar Rice", "Vada Curry", "Cabbage Thoran", "Payasam"],
      ],
      dinner: [
        ["Malai Kofta", "Butter Roti", "Steamed Rice", "Salad", "Gajar Halwa"],
        ["Chole Kulche", "Dahi", "Onion Salad", "Masala Chaas"],
        ["Palak Paneer", "Roomali Roti", "Dal Tadka", "Raita"],
        ["Veg Biryani", "Kanjhi", "Boondi Raita", "Soya Cubes"],
        ["Rasam Rice", "Thandai", "Bhindi Masala", "Roti"],
        ["Paneer Bhurji", "Paratha", "Curd", "Achar"],
        ["Tomato Rice", "Veg Kofta", "Papad", "Ice Cream"],
        ["Dal Baati Churma", "Gujiya", "Kachumber"],
      ],
    },
    comments: [
      "Best mess food in the area — the ghee rice is worth every rupee.",
      "The dosa counter has improved a lot since the new cook joined.",
      "Friday's sweet dish was the highlight of the week.",
    ],
  },
  {
    name: "Hilltop Boys Hostel Mess",
    location: "Baner, Pune",
    address: "Hilltop Boys Hostel, Mumbai-Pandharpur Road, Baner, Pune 411045",
    price_per_meal: 40,
    weights: [40, 35, 15, 7, 3],
    students: [
      { email: "neha@messmate.test", name: "Neha Bhosale" },
      { email: "farhan@messmate.test", name: "Farhan Qureshi" },
    ],
    menu: {
      breakfast: [
        ["Bread Butter", "Tea"],
        ["Poha", "Chai"],
        ["Aloo Paratha", "Achar"],
        ["Idli", "Sambar"],
        ["Dalia", "Milk"],
        ["Bread Omelette", "Tea"],
        ["Upma", "Chai"],
        ["Poha", "Banana"],
      ],
      lunch: [
        ["Roti", "Dal", "Aloo Sabzi"],
        ["Rice", "Dal", "Pickle"],
        ["Roti", "Rajma", "Salad"],
        ["Rice", "Veg Curry"],
        ["Roti", "Chana", "Curd"],
        ["Rice", "Sambar", "Vadi"],
        ["Roti", "Dal Fry"],
        ["Rice", "Curd", "Papad"],
      ],
      dinner: [
        ["Roti", "Dal", "Aloo Bhaji"],
        ["Rice", "Paneer Curry"],
        ["Roti", "Mix Sabzi", "Dal"],
        ["Rice", "Sambar"],
        ["Bread Sabzi", "Tea"],
        ["Roti", "Rajma"],
        ["Rice", "Veg Kofta"],
        ["Khichdi", "Kadhi"],
      ],
    },
    comments: [
      "Dinner came 45 minutes late again this week.",
      "Rice was undercooked and the dal was cold.",
      "Please check the drinking water cooler, it has been out of order.",
    ],
  },
];

/** Reports spread over every mess and every triage status. */
const REPORT_PLAN = [
  { mess: "Hilltop Boys Hostel Mess", index: 0, category: "delay", status: "open", daysAgo: 0, description: "Dinner was served 45 minutes late three nights this week." },
  { mess: "Hilltop Boys Hostel Mess", index: 1, category: "quality", status: "open", daysAgo: 1, description: "Rice was undercooked and the dal was cold at lunch." },
  { mess: "Hilltop Boys Hostel Mess", index: 0, category: "cleanliness", status: "in_progress", daysAgo: 4, description: "The drinking water cooler has not been cleaned since Monday." },
  { mess: "Green Valley Hostel Mess", index: 0, category: "quality", status: "open", daysAgo: 2, description: "Breakfast poha is far too dry compared with last month." },
  { mess: "Green Valley Hostel Mess", index: 1, category: "other", status: "in_progress", daysAgo: 6, description: "Please add a salad counter at lunch." },
  { mess: "Sunrise Hostel Mess", index: 0, category: "cleanliness", status: "resolved", daysAgo: 9, description: "Tables were not wiped after dinner on Sunday." },
  { mess: "Sunrise Hostel Mess", index: 1, category: "delay", status: "resolved", daysAgo: 12, description: "Lunch was late by twenty minutes on Tuesday." },
  { mess: "Shree Sai Chatralaya", index: 2, category: "other", status: "open", daysAgo: 3, description: "Weekend breakfast should start an hour later." },
  { mess: "Shree Sai Chatralaya", index: 0, category: "quality", status: "resolved", daysAgo: 15, description: "Paneer was stale the week before last — fixed now." },
];

/** 0…1 deterministic generator so re-seeding produces the same dataset. */
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Today's date in India, as YYYY-MM-DD, regardless of the runner's timezone. */
function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/**
 * A back-dated ISO timestamp for a meal on a menu date, always clamped to the
 * past so seeded rows never trip the submission rate-limit triggers.
 */
function mealTimestamp(menuDate, mealType, minMinutesAgo = 90) {
  const [year, month, day] = menuDate.split("-").map(Number);
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const servedAt =
    Date.UTC(year, month - 1, day, MEAL_HOURS[mealType], 0, 0) - istOffsetMs;
  const oldestSafe = Date.now() - minMinutesAgo * 60_000;

  return new Date(Math.min(servedAt, oldestSafe)).toISOString();
}

function pickStars(weights, value) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let accumulator = 0;

  for (let index = 0; index < weights.length; index += 1) {
    accumulator += weights[index];
    if (value * total < accumulator) return index + 1;
  }
  return weights.length;
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** Creates the auth user, or reuses an existing one with the same email. */
async function ensureUser({ email, name }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });

  if (!error && data.user) return data.user.id;

  const existing = await findUserByEmail(email);
  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name },
      },
    );
    if (updateError) throw updateError;
    return existing.id;
  }

  throw error ?? new Error(`Could not create ${email}`);
}

/** Writes a batch in chunks so PostgREST never rejects an oversized payload. */
async function writeBatch(table, rows, { onConflict, returning } = {}) {
  const created = [];

  for (let index = 0; index < rows.length; index += 300) {
    const chunk = rows.slice(index, index + 300);
    let query = onConflict
      ? supabase.from(table).upsert(chunk, { onConflict })
      : supabase.from(table).insert(chunk);

    if (returning) query = query.select(returning);

    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    if (returning) created.push(...(data ?? []));
  }

  return created;
}

async function main() {
  console.log("→ Seeding MESSMATE…");

  // 1. Messes first, so the auth trigger has something to attach students to.
  const seededMesses = [];
  for (const mess of MESSES) {
    const { data: existing, error: lookupError } = await supabase
      .from("messes")
      .select("id")
      .eq("name", mess.name)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const payload = {
      name: mess.name,
      location: mess.location,
      address: mess.address,
      price_per_meal: mess.price_per_meal,
    };

    if (existing) {
      const { error } = await supabase
        .from("messes")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
      seededMesses.push({ ...mess, id: existing.id });
    } else {
      const { data, error } = await supabase
        .from("messes")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      seededMesses.push({ ...mess, id: data.id });
    }
  }
  console.log(`  ✓ ${seededMesses.length} messes ready (₹40–₹75 per meal)`);

  // 2. Accounts.
  const adminId = await ensureUser(ADMIN);
  const students = [];
  for (const mess of seededMesses) {
    for (const student of mess.students) {
      students.push({
        id: await ensureUser(student),
        email: student.email,
        name: student.name,
        messId: mess.id,
      });
    }
  }
  console.log(
    `  ✓ auth users ready (1 admin, ${students.length} students in ${seededMesses.length} messes)`,
  );

  // 3. Profiles — the trigger already created students; fix names and messes.
  const { error: profilesError } = await supabase.from("profiles").upsert(
    [
      { id: adminId, name: ADMIN.name, role: "admin", mess_id: seededMesses[0].id },
      ...students.map((student) => ({
        id: student.id,
        name: student.name,
        role: "student",
        mess_id: student.messId,
      })),
    ],
    { onConflict: "id" },
  );
  if (profilesError) throw profilesError;
  console.log("  ✓ profiles linked to their messes");

  // 4. Menus: the 30 days behind today (for the admin charts) plus tomorrow.
  const today = todayInIndia();
  const startDate = addDays(today, -PAST_DAYS);
  const menuRows = [];

  for (const mess of seededMesses) {
    for (let offset = 0; offset < DAYS_OF_MENUS; offset += 1) {
      const date = addDays(startDate, offset);
      const template = offset % mess.menu.breakfast.length;

      for (const mealType of MEAL_TYPES) {
        menuRows.push({
          mess_id: mess.id,
          date,
          meal_type: mealType,
          items: mess.menu[mealType][template],
        });
      }
    }
  }

  const menus = await writeBatch("menus", menuRows, {
    onConflict: "mess_id,date,meal_type",
    returning: "id, mess_id, date, meal_type",
  });
  console.log(
    `  ✓ ${menuRows.length} menu rows (${seededMesses.length} messes × ${DAYS_OF_MENUS} days × 3 meals)`,
  );

  // 5. Ratings. Past days get a near-full crowd; tomorrow stays unrated.
  const rand = seededRandom(20261103);
  const ratingRows = [];

  for (const menu of menus) {
    if (menu.date > today) continue;

    const mess = seededMesses.find((entry) => entry.id === menu.mess_id);
    const crowd = students.filter((student) => student.messId === menu.mess_id);

    for (const student of crowd) {
      // Published but not yet eaten: tomorrow keeps its average empty.
      if (menu.date === today && rand() < 0.4) continue;
      if (menu.date < today && rand() < 0.55) continue;

      ratingRows.push({
        user_id: student.id,
        menu_id: menu.id,
        stars: pickStars(mess.weights, rand()),
        created_at: mealTimestamp(menu.date, menu.meal_type),
      });
    }
  }

  await writeBatch("ratings", ratingRows, { onConflict: "user_id,menu_id" });
  console.log(`  ✓ ${ratingRows.length} ratings (per-mess rating profiles applied)`);

  // 6. Written feedback, matched before re-inserting so re-runs stay clean.
  const ratedByStudent = new Map();
  for (const rating of ratingRows) {
    const list = ratedByStudent.get(rating.user_id) ?? [];
    list.push(rating.menu_id);
    ratedByStudent.set(rating.user_id, list);
  }

  const { data: existingFeedback, error: feedbackLookupError } = await supabase
    .from("feedback")
    .select("user_id, menu_id");
  if (feedbackLookupError) throw feedbackLookupError;

  const seenComments = new Set(
    (existingFeedback ?? []).map((row) => `${row.user_id}:${row.menu_id}`),
  );

  const menuById = new Map(menus.map((menu) => [menu.id, menu]));
  const feedbackRows = [];

  for (const mess of seededMesses) {
    const crowd = students.filter((student) => student.messId === mess.id);

    mess.comments.forEach((comment, index) => {
      const student = crowd[index % crowd.length];
      const rated = (ratedByStudent.get(student.id) ?? [])
        .map((menuId) => menuById.get(menuId))
        .filter((menu) => menu && menu.date <= today)
        .sort((a, b) => (a.date < b.date ? 1 : -1));

      const target = rated[index];
      if (!target || seenComments.has(`${student.id}:${target.id}`)) return;

      seenComments.add(`${student.id}:${target.id}`);
      feedbackRows.push({
        user_id: student.id,
        menu_id: target.id,
        comment,
        created_at: mealTimestamp(target.date, target.meal_type, 130 + index * 20),
      });
    });
  }

  await writeBatch("feedback", feedbackRows);
  console.log(`  ✓ ${feedbackRows.length} new feedback comments`);

  // 7. Reports in every status so the admin inbox has something to triage.
  const { data: existingReports, error: reportsLookupError } = await supabase
    .from("reports")
    .select("user_id, description");
  if (reportsLookupError) throw reportsLookupError;

  const seenReports = new Set(
    (existingReports ?? []).map((row) => `${row.user_id}:${row.description}`),
  );

  const reportRows = [];
  for (const plan of REPORT_PLAN) {
    const mess = seededMesses.find((entry) => entry.name === plan.mess);
    const crowd = students.filter((student) => student.messId === mess.id);
    const student = crowd[plan.index % crowd.length];
    if (!student || seenReports.has(`${student.id}:${plan.description}`)) continue;

    seenReports.add(`${student.id}:${plan.description}`);
    reportRows.push({
      user_id: student.id,
      mess_id: mess.id,
      category: plan.category,
      description: plan.description,
      status: plan.status,
      created_at: new Date(
        Date.now() - plan.daysAgo * 86_400_000 - 75 * 60_000,
      ).toISOString(),
    });
  }

  await writeBatch("reports", reportRows);
  console.log(`  ✓ ${reportRows.length} new reports (open / in progress / resolved)`);

  const summary = [];
  for (const mess of seededMesses) {
    const { data } = await supabase.rpc("mess_directory_stats", {
      p_mess_ids: [mess.id],
    });
    const stats = data?.[0];
    summary.push(
      `    ${mess.name.padEnd(26)} ₹${String(mess.price_per_meal).padEnd(4)} ` +
        `${stats?.avg_stars ?? "–"}★ over ${stats?.rating_count ?? 0} ratings`,
    );
  }

  console.log(`
Done. Log in at http://localhost:3000/login

  Admin    ${ADMIN.email}    ${PASSWORD}
  Students (all ${PASSWORD}):
    ${students.map((student) => student.email).join("\n    ")}

  Directory averages:
${summary.join("\n")}
`);
}

main().catch((error) => {
  console.error("\nSeed failed:", error.message ?? error);
  console.error(
    "If a relation or function is missing, apply supabase/migrations in order " +
      "(0001 → 0002 → 0003) first.\n",
  );
  process.exit(1);
});
