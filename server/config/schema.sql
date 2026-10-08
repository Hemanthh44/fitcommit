-- FitCommit PostgreSQL DDL Schema
-- Strictly based on FitCommit UML ER Diagram & Class Diagram (ICS-312)

-- 1. ENUMS (PostgreSQL native)
DO $$ BEGIN
    CREATE TYPE account_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM ('VALID', 'EXPIRED', 'PENDING');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE equipment_status_enum AS ENUM ('AVAILABLE', 'OCCUPIED', 'OUT_OF_SERVICE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'BASE_MEMBER', -- 'BASE_MEMBER', 'PREMIUM_MEMBER', 'TRAINER', 'ADMIN'
    height NUMERIC(5,2) NOT NULL,          -- cm
    weight NUMERIC(5,2) NOT NULL,          -- kg
    fitness_goal VARCHAR(100) NOT NULL,    -- 'Weight Loss', 'Muscle Gain', 'Endurance', 'General Fitness'
    account_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MEMBERSHIPS & SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS memberships (
    membership_id SERIAL PRIMARY KEY,
    membership_name VARCHAR(50) NOT NULL, -- 'Base', 'Premium'
    price NUMERIC(10,2) NOT NULL,
    tier VARCHAR(20) NOT NULL,            -- 'BASE', 'PREMIUM'
    features TEXT NOT NULL                -- JSON array of features
);

CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    membership_id INT REFERENCES memberships(membership_id),
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    subscription_status VARCHAR(20) DEFAULT 'VALID' -- 'VALID', 'EXPIRED', 'PENDING'
);

-- 4. GYMS, GYM SUBSCRIPTIONS & QR ATTENDANCE
CREATE TABLE IF NOT EXISTS gyms (
    gym_id SERIAL PRIMARY KEY,
    gym_name VARCHAR(150) NOT NULL,
    location VARCHAR(255) NOT NULL,
    qr_code VARCHAR(100) UNIQUE DEFAULT 'FITCOMMIT-GYM-001',
    capacity INT DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gym_subscriptions (
    gym_subscription_id SERIAL PRIMARY KEY,
    subscription_id INT REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
    gym_id INT REFERENCES gyms(gym_id),
    access_status VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS gym_attendance (
    attendance_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    gym_id INT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'CHECKED_IN', -- 'CHECKED_IN', 'CHECKED_OUT'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_status ON gym_attendance(user_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_gym_status ON gym_attendance(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in ON gym_attendance(check_in_time);

-- Enforce at most ONE active gym session per user per gym at database level
CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_active_session 
ON gym_attendance(user_id, gym_id) 
WHERE status IN ('ACTIVE', 'CHECKED_IN') AND check_out_time IS NULL;

-- 5. EQUIPMENT, SENSORS & ALTERNATIVE SUGGESTIONS
CREATE TABLE IF NOT EXISTS gym_equipment (
    equipment_id SERIAL PRIMARY KEY,
    gym_id INT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    equipment_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS equipment_sensors (
    sensor_id SERIAL PRIMARY KEY,
    equipment_id INT REFERENCES gym_equipment(equipment_id) ON DELETE CASCADE,
    occupancy_status VARCHAR(20) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'OCCUPIED', 'OUT_OF_SERVICE'
    battery_level INT DEFAULT 98,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alternative_exercise_suggestions (
    suggestion_id SERIAL PRIMARY KEY,
    equipment_id INT REFERENCES gym_equipment(equipment_id) ON DELETE CASCADE,
    suggested_exercise_name VARCHAR(100) NOT NULL,
    muscle_group VARCHAR(100) NOT NULL,
    instructions TEXT NOT NULL
);

-- 6. PAYMENTS (Simulated PCI-DSS compliance)
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    subscription_id INT REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
    payment_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CARD_SIMULATION',
    transaction_status VARCHAR(50) DEFAULT 'SUCCESS',
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. HEALTH & BIOMETRICS (BMI & MACRONUTRIENTS)
CREATE TABLE IF NOT EXISTS bmi_records (
    bmi_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    height NUMERIC(5,2) NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    bmi_value NUMERIC(4,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    record_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS macronutrient_targets (
    macro_target_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    bmi_id INT REFERENCES bmi_records(bmi_id) ON DELETE SET NULL,
    daily_calories INT NOT NULL,
    protein_intake INT NOT NULL, -- grams
    carb_intake INT NOT NULL,    -- grams
    fat_intake INT NOT NULL,     -- grams
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. FITNESS PLANNING & COMMITMENT-BASED PROGRESS
CREATE TABLE IF NOT EXISTS workout_plans (
    workout_plan_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    trainer_id INT,
    plan_name VARCHAR(120) NOT NULL,
    difficulty_level VARCHAR(50) NOT NULL,
    target_goal VARCHAR(100) NOT NULL,
    schedule TEXT NOT NULL,      -- JSON schedule
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commitment_rules (
    commitment_rule_id SERIAL PRIMARY KEY,
    workout_plan_id INT REFERENCES workout_plans(workout_plan_id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    adjustment_factor NUMERIC(3,2) DEFAULT 1.00,
    min_completion_rate INT DEFAULT 70
);

CREATE TABLE IF NOT EXISTS diet_plans (
    diet_plan_id SERIAL PRIMARY KEY,
    membership_id INT REFERENCES memberships(membership_id),
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    diet_name VARCHAR(120) NOT NULL,
    calorie_target INT NOT NULL,
    meal_structure TEXT NOT NULL, -- JSON meals
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progress_logs (
    progress_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    workout_plan_id INT REFERENCES workout_plans(workout_plan_id) ON DELETE SET NULL,
    log_date DATE DEFAULT CURRENT_DATE,
    calories_burned INT DEFAULT 0,
    steps INT DEFAULT 0,
    workout_completed BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- 9. TRAINERS & ALLOCATIONS
CREATE TABLE IF NOT EXISTS trainers (
    trainer_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    trainer_name VARCHAR(120) NOT NULL,
    specialization VARCHAR(120) NOT NULL,
    contact_email VARCHAR(180) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS trainer_allocations (
    allocation_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    trainer_id INT REFERENCES trainers(trainer_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainer_messages (
    message_id SERIAL PRIMARY KEY,
    allocation_id INT REFERENCES trainer_allocations(allocation_id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL, -- 'USER' or 'TRAINER'
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SUPPLEMENT DISCOUNTS
CREATE TABLE IF NOT EXISTS supplement_discounts (
    discount_id SERIAL PRIMARY KEY,
    membership_id INT REFERENCES memberships(membership_id),
    product_name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    discount_percentage INT NOT NULL,
    code VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS supplement_redemptions (
    redemption_id SERIAL PRIMARY KEY,
    discount_id INT REFERENCES supplement_discounts(discount_id),
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'WORKOUT', 'DIET', 'TRAINER', 'EQUIPMENT', 'SUBSCRIPTION'
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. AI MEAL NUTRITION TRACKING & LOGS
CREATE TABLE IF NOT EXISTS meals (
    meal_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    meal_type VARCHAR(50) DEFAULT 'LUNCH', -- 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'
    meal_name VARCHAR(150) NOT NULL,
    meal_date DATE DEFAULT CURRENT_DATE,
    image_url TEXT,
    calories INT NOT NULL DEFAULT 0,
    protein_g INT NOT NULL DEFAULT 0,
    carbs_g INT NOT NULL DEFAULT 0,
    fat_g INT NOT NULL DEFAULT 0,
    fiber_g INT NOT NULL DEFAULT 0,
    ai_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meal_items (
    item_id SERIAL PRIMARY KEY,
    meal_id INT REFERENCES meals(meal_id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    quantity VARCHAR(80) NOT NULL,
    calories INT NOT NULL DEFAULT 0,
    protein_g INT NOT NULL DEFAULT 0,
    carbs_g INT NOT NULL DEFAULT 0,
    fat_g INT NOT NULL DEFAULT 0,
    fiber_g INT NOT NULL DEFAULT 0,
    confidence VARCHAR(20) DEFAULT 'high' -- 'high', 'medium', 'low'
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON meal_items(meal_id);

