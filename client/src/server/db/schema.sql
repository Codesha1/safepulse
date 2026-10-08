CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('NURSE','PARENT')),
  full_name TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  reset_token_hash TEXT,
  reset_expires INTEGER,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS nurses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  school_name TEXT, phone TEXT
);
CREATE TABLE IF NOT EXISTS parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT, phone TEXT, preferred_contact TEXT, emergency_contact TEXT
);
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  diabetes_type TEXT,
  diagnosis_date TEXT,
  parent_id INTEGER REFERENCES parents(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- Free text entered by the nurse. SafePulse never turns it into automatic recommendations.
CREATE TABLE IF NOT EXISTS medical_information (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  allergies TEXT, conditions TEXT, hypo_history TEXT, hyper_history TEXT,
  medication_info TEXT, food_restrictions TEXT, activity_considerations TEXT,
  emergency_instructions TEXT, physician_contact TEXT, care_plan_notes TEXT
);
CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL DEFAULT 'lunch',
  source TEXT NOT NULL DEFAULT 'upload',
  estimate_mode TEXT NOT NULL DEFAULT 'demo',
  image_key TEXT,
  detected_foods TEXT NOT NULL,
  carbs REAL NOT NULL, protein REAL NOT NULL, fat REAL NOT NULL, fiber REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('GREEN','YELLOW','RED')),
  reason_en TEXT, reason_ar TEXT,
  suggestions TEXT NOT NULL DEFAULT '[]',
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meals_student ON meals(student_id, created_at);
CREATE TABLE IF NOT EXISTS glucose_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  value_mgdl INTEGER NOT NULL,
  context TEXT NOT NULL DEFAULT 'other',
  recorded_at TEXT NOT NULL,
  recorded_by INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_glucose_student ON glucose_readings(student_id, recorded_at);
CREATE TABLE IF NOT EXISTS schedule_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL, end_time TEXT,
  subject TEXT NOT NULL, classroom TEXT,
  activity_type TEXT NOT NULL DEFAULT 'class'
);
CREATE INDEX IF NOT EXISTS idx_schedule_student ON schedule_events(student_id, day_of_week);
CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL, exam_date TEXT NOT NULL, exam_time TEXT NOT NULL, exam_type TEXT
);
CREATE INDEX IF NOT EXISTS idx_exams_student ON exams(student_id, exam_date);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  meal_id INTEGER REFERENCES meals(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title_en TEXT NOT NULL, title_ar TEXT NOT NULL,
  body_en TEXT NOT NULL, body_ar TEXT NOT NULL,
  suggestion_en TEXT, suggestion_ar TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);
CREATE TABLE IF NOT EXISTS ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  meal_id INTEGER REFERENCES meals(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS wellness_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  category TEXT NOT NULL, items TEXT NOT NULL, generated_at TEXT NOT NULL,
  UNIQUE(student_id, category)
);
-- Meal photos live in the database too, so they survive on hosts with a temporary disk.
CREATE TABLE IF NOT EXISTS meal_images (
  key TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
