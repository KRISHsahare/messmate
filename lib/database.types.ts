/**
 * Hand-written types for the MESSMATE Postgres schema.
 * Keep in sync with supabase/migrations/*.sql, or regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
 */

export type UserRole = "student" | "admin";
export type MealType = "breakfast" | "lunch" | "dinner";
export type ReportCategory = "delay" | "cleanliness" | "quality" | "other";
export type ReportStatus = "open" | "in_progress" | "resolved";

export type Mess = {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  /** Flat rate for one meal in rupees; null when the mess hasn't published it. */
  price_per_meal: number | null;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  role: UserRole;
  mess_id: string | null;
  created_at: string;
};

export type Menu = {
  id: string;
  mess_id: string;
  date: string;
  meal_type: MealType;
  items: string[];
  created_at: string;
};

export type Rating = {
  id: string;
  user_id: string;
  menu_id: string;
  stars: number;
  created_at: string;
};

export type Feedback = {
  id: string;
  user_id: string;
  menu_id: string;
  comment: string;
  created_at: string;
};

export type Report = {
  id: string;
  user_id: string;
  mess_id: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  created_at: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      messes: Table<
        Mess,
        {
          id?: string;
          name: string;
          location?: string | null;
          address?: string | null;
          price_per_meal?: number | null;
          created_at?: string;
        },
        {
          name?: string;
          location?: string | null;
          address?: string | null;
          price_per_meal?: number | null;
        }
      >;
      profiles: Table<
        Profile,
        {
          id: string;
          name: string;
          role?: UserRole;
          mess_id?: string | null;
          created_at?: string;
        },
        {
          name?: string;
          role?: UserRole;
          mess_id?: string | null;
        }
      >;
      menus: Table<
        Menu,
        {
          id?: string;
          mess_id: string;
          date: string;
          meal_type: MealType;
          items?: string[];
          created_at?: string;
        },
        {
          mess_id?: string;
          date?: string;
          meal_type?: MealType;
          items?: string[];
        }
      >;
      ratings: Table<
        Rating,
        {
          id?: string;
          user_id: string;
          menu_id: string;
          stars: number;
          created_at?: string;
        },
        {
          stars?: number;
        }
      >;
      feedback: Table<
        Feedback,
        {
          id?: string;
          user_id: string;
          menu_id: string;
          comment: string;
          created_at?: string;
        },
        {
          comment?: string;
        }
      >;
      reports: Table<
        Report,
        {
          id?: string;
          user_id: string;
          mess_id: string;
          category: ReportCategory;
          description: string;
          status?: ReportStatus;
          created_at?: string;
        },
        {
          category?: ReportCategory;
          description?: string;
          status?: ReportStatus;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      // Aggregates only — see supabase/migrations/0002_student_modules.sql
      meal_rating_summary: {
        Args: { menu_ids: string[] };
        Returns: {
          menu_id: string;
          avg_stars: number;
          rating_count: number;
        }[];
      };
      // Public directory aggregates — raw ratings never leave the database.
      // See supabase/migrations/0003_admin_multimess.sql
      mess_directory_stats: {
        Args: { p_mess_ids: string[] };
        Returns: {
          mess_id: string;
          avg_stars: number | null;
          rating_count: number;
          comment_count: number;
          meal_count: number;
        }[];
      };
      mess_rating_breakdown: {
        Args: { p_mess_id: string };
        Returns: {
          meal_type: MealType;
          avg_stars: number | null;
          rating_count: number;
          one_star: number;
          two_star: number;
          three_star: number;
          four_star: number;
          five_star: number;
        }[];
      };
      mess_recent_reviews: {
        Args: { p_mess_id: string; p_limit?: number };
        Returns: {
          created_at: string;
          stars: number | null;
          comment: string;
          meal_type: MealType;
          menu_date: string;
          author_label: string;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      meal_type: MealType;
      report_category: ReportCategory;
      report_status: ReportStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
