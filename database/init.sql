-- =============================================================
--  MediDispense — Database Init
--  PostgreSQL 16
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE user_role         AS ENUM ('admin','caregiver','nurse','patient');
CREATE TYPE device_status     AS ENUM ('online','offline','maintenance','unlinked');
CREATE TYPE dose_event        AS ENUM ('DOSE_TAKEN','DOSE_MISSED','DISPENSE_FAIL','HEARTBEAT','REFILL');
CREATE TYPE dose_status       AS ENUM ('CONFIRMED','NOT_CONFIRMED','NA','FAILED');
CREATE TYPE alert_type        AS ENUM ('missed_dose','low_supply','device_offline','dispense_fail','unauthorized_access','refill_needed');
CREATE TYPE alert_severity    AS ENUM ('info','warning','critical');
CREATE TYPE notif_channel     AS ENUM ('sms','email','push','in_app');
CREATE TYPE notif_status      AS ENUM ('pending','sent','failed','read');
CREATE TYPE gender_type       AS ENUM ('male','female','other','prefer_not_to_say');

-- USERS
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(180)  UNIQUE NOT NULL,
    phone           VARCHAR(20)   UNIQUE,
    password_hash   TEXT          NOT NULL,
    role            user_role     NOT NULL DEFAULT 'caregiver',
    avatar_url      TEXT,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN       NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- PATIENTS
CREATE TABLE patients (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name           VARCHAR(120)  NOT NULL,
    date_of_birth       DATE          NOT NULL,
    gender              gender_type   NOT NULL,
    national_id         VARCHAR(30)   UNIQUE,
    phone               VARCHAR(20),
    email               VARCHAR(180),
    address             TEXT,
    county              VARCHAR(80),
    ward                VARCHAR(80),
    next_of_kin_name    VARCHAR(120),
    next_of_kin_phone   VARCHAR(20),
    diagnoses           TEXT[],
    allergies           TEXT[],
    notes               TEXT,
    biometric_template  BYTEA,
    photo_url           TEXT,
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_by          UUID          REFERENCES users(id),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- PATIENT-CAREGIVER ASSIGNMENTS
CREATE TABLE patient_caregivers (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (patient_id, user_id)
);

-- DEVICES (ESP32 units)
CREATE TABLE devices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_code         VARCHAR(20)   UNIQUE NOT NULL,
    label               VARCHAR(80),
    firmware_version    VARCHAR(20),
    mac_address         VARCHAR(17)   UNIQUE,
    lora_dev_eui        VARCHAR(32)   UNIQUE,
    status              device_status NOT NULL DEFAULT 'unlinked',
    last_seen_at        TIMESTAMPTZ,
    battery_pct         SMALLINT      CHECK (battery_pct BETWEEN 0 AND 100),
    pills_remaining     SMALLINT      DEFAULT 0,
    signal_dbm          SMALLINT,
    rtc_synced          BOOLEAN       DEFAULT FALSE,
    location_lat        NUMERIC(9,6),
    location_lng        NUMERIC(9,6),
    notes               TEXT,
    registered_by       UUID          REFERENCES users(id),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- DEVICE-PATIENT LINKS
CREATE TABLE device_patient_links (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id     UUID NOT NULL REFERENCES devices(id)  ON DELETE CASCADE,
    patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    linked_by     UUID          REFERENCES users(id),
    linked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unlinked_at   TIMESTAMPTZ,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Only one active link per device
CREATE UNIQUE INDEX uq_active_device_link
    ON device_patient_links (device_id)
    WHERE is_active = TRUE;

-- MEDICATIONS CATALOGUE
CREATE TABLE medications (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(120) NOT NULL,
    generic_name  VARCHAR(120),
    dosage_form   VARCHAR(60),
    strength      VARCHAR(40),
    manufacturer  VARCHAR(120),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRESCRIPTIONS
CREATE TABLE prescriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_id   UUID NOT NULL REFERENCES medications(id),
    prescribed_by   VARCHAR(120),
    dose_quantity   SMALLINT    NOT NULL DEFAULT 1,
    dose_times      TIME[],
    start_date      DATE        NOT NULL,
    end_date        DATE,
    days_of_week    SMALLINT[],
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_by      UUID        REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DOSE EVENTS (from ESP32 via LoRa/MQTT)
CREATE TABLE dose_events (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id               UUID REFERENCES devices(id),
    patient_id              UUID REFERENCES patients(id),
    prescription_id         UUID REFERENCES prescriptions(id),
    event_type              dose_event  NOT NULL,
    status                  dose_status NOT NULL,
    scheduled_at            TIMESTAMPTZ,
    dispensed_at            TIMESTAMPTZ,
    confirmed_at            TIMESTAMPTZ,
    pills_dispensed         SMALLINT    DEFAULT 1,
    pills_remaining_after   SMALLINT,
    biometric_id            VARCHAR(40),
    lora_packet_raw         TEXT,
    rssi                    SMALLINT,
    snr                     NUMERIC(5,2),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ALERTS
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID REFERENCES patients(id),
    device_id       UUID REFERENCES devices(id),
    dose_event_id   UUID REFERENCES dose_events(id),
    alert_type      alert_type     NOT NULL,
    severity        alert_severity NOT NULL,
    title           VARCHAR(200)   NOT NULL,
    message         TEXT           NOT NULL,
    is_resolved     BOOLEAN        NOT NULL DEFAULT FALSE,
    resolved_by     UUID           REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- NOTIFICATIONS (SMS/email sent to caregivers)
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id        UUID REFERENCES alerts(id),
    user_id         UUID REFERENCES users(id),
    channel         notif_channel  NOT NULL,
    recipient       VARCHAR(200)   NOT NULL,
    subject         VARCHAR(200),
    body            TEXT           NOT NULL,
    status          notif_status   NOT NULL DEFAULT 'pending',
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    retry_count     SMALLINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID REFERENCES users(id),
    action        VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(60),
    entity_id     UUID,
    old_values    JSONB,
    new_values    JSONB,
    ip_address    INET,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REFRESH TOKENS
CREATE TABLE refresh_tokens (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    TEXT UNIQUE NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL,
    revoked_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_dose_events_patient    ON dose_events (patient_id, created_at DESC);
CREATE INDEX idx_dose_events_device     ON dose_events (device_id,  created_at DESC);
CREATE INDEX idx_alerts_patient         ON alerts      (patient_id, is_resolved);
CREATE INDEX idx_notifications_user     ON notifications(user_id,   status);
CREATE INDEX idx_audit_logs_user        ON audit_logs  (user_id,    created_at DESC);
CREATE INDEX idx_prescriptions_patient  ON prescriptions(patient_id, is_active);
