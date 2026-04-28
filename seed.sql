-- =============================================================
--  MediDispense — Seed Data
-- =============================================================

-- Default admin user (password: Admin!2025)
INSERT INTO users (full_name, email, phone, password_hash, role, email_verified)
VALUES (
    'System Admin',
    'admin@medidispense.co.ke',
    '+254700000000',
    '$2b$12$exampleHashedPasswordForAdmin2025xxxxxxxxxxxxxxxxxxxx',
    'admin',
    TRUE
);

-- Sample caregiver
INSERT INTO users (full_name, email, phone, password_hash, role, email_verified)
VALUES (
    'Job Kerosi',
    'j.kerosi@must.ac.ke',
    '+254711000001',
    '$2b$12$exampleHashedPasswordForCare2025xxxxxxxxxxxxxxxxxxxx',
    'caregiver',
    TRUE
);

-- Medication catalogue
INSERT INTO medications (name, generic_name, dosage_form, strength, manufacturer) VALUES
    ('Metformin',    'Metformin HCl',   'tablet',  '500mg',  'Generic'),
    ('Amlodipine',   'Amlodipine',      'tablet',  '5mg',    'Generic'),
    ('Lisinopril',   'Lisinopril',      'tablet',  '10mg',   'Generic'),
    ('Aspirin',      'Acetylsalicylic', 'tablet',  '75mg',   'Generic'),
    ('Atorvastatin', 'Atorvastatin',    'tablet',  '20mg',   'Generic');

-- Sample device
INSERT INTO devices (device_code, label, firmware_version, status, pills_remaining, registered_by)
SELECT 'MD001', 'Meru Ward A — Bed 3', '1.0.0', 'online', 15, id
FROM users WHERE email = 'admin@medidispense.co.ke';

-- Sample patient
INSERT INTO patients (
    full_name, date_of_birth, gender, national_id, phone,
    county, ward, diagnoses, next_of_kin_name, next_of_kin_phone,
    created_by
)
SELECT
    'Antony Ombati', '1957-03-14', 'male', '12345678',
    '+254722000001', 'Meru', 'Meru Central',
    ARRAY['Hypertension', 'Diabetes T2'],
    'Mary Ombati', '+254733000001', id
FROM users WHERE email = 'admin@medidispense.co.ke';

-- Assign caregiver to patient
INSERT INTO patient_caregivers (patient_id, user_id, is_primary)
SELECT p.id, u.id, TRUE
FROM patients p, users u
WHERE p.full_name = 'Antony Ombati'
  AND u.email = 'j.kerosi@must.ac.ke';

-- Link device to patient
INSERT INTO device_patient_links (device_id, patient_id, linked_by)
SELECT d.id, p.id, u.id
FROM devices d, patients p, users u
WHERE d.device_code = 'MD001'
  AND p.full_name   = 'Antony Ombati'
  AND u.email       = 'admin@medidispense.co.ke';

-- Prescriptions for sample patient
INSERT INTO prescriptions (patient_id, medication_id, prescribed_by, dose_quantity, dose_times, start_date, is_active, created_by)
SELECT
    p.id, m.id, 'Dr. Njiru', 1,
    ARRAY['07:00', '13:00', '19:00']::TIME[],
    CURRENT_DATE, TRUE, u.id
FROM patients p, medications m, users u
WHERE p.full_name = 'Antony Ombati'
  AND m.name      = 'Metformin'
  AND u.email     = 'admin@medidispense.co.ke';

INSERT INTO prescriptions (patient_id, medication_id, prescribed_by, dose_quantity, dose_times, start_date, is_active, created_by)
SELECT
    p.id, m.id, 'Dr. Njiru', 1,
    ARRAY['09:00']::TIME[],
    CURRENT_DATE, TRUE, u.id
FROM patients p, medications m, users u
WHERE p.full_name = 'Antony Ombati'
  AND m.name      = 'Amlodipine'
  AND u.email     = 'admin@medidispense.co.ke';
