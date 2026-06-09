import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1717000000000 implements MigrationInterface {
  name = 'InitialSchema1717000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`psychologists\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`email\` VARCHAR(255) NOT NULL,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`full_name\` VARCHAR(255) NOT NULL,
        \`crp\` VARCHAR(50) NOT NULL,
        \`state\` CHAR(2) NOT NULL,
        \`phone\` VARCHAR(20) NULL,
        \`avatar_path\` VARCHAR(500) NULL,
        \`bio\` VARCHAR(300) NULL,
        \`approach\` VARCHAR(50) NULL,
        \`specialties\` JSON NOT NULL DEFAULT (JSON_ARRAY()),
        \`session_duration_min\` TINYINT UNSIGNED NOT NULL DEFAULT 50,
        \`session_price_cents\` INT UNSIGNED NOT NULL DEFAULT 0,
        \`gap_between_sessions_min\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
        \`min_booking_advance_hours\` SMALLINT UNSIGNED NOT NULL DEFAULT 24,
        \`min_cancellation_advance_hours\` SMALLINT UNSIGNED NOT NULL DEFAULT 24,
        \`cancellation_policy\` VARCHAR(500) NULL,
        \`public_booking_enabled\` TINYINT(1) NOT NULL DEFAULT 1,
        \`public_booking_slug\` VARCHAR(100) NOT NULL,
        \`public_show_price\` TINYINT(1) NOT NULL DEFAULT 0,
        \`public_require_approval\` TINYINT(1) NOT NULL DEFAULT 0,
        \`email_confirmed\` TINYINT(1) NOT NULL DEFAULT 0,
        \`email_confirm_token\` VARCHAR(100) NULL,
        \`password_reset_token\` VARCHAR(100) NULL,
        \`password_reset_expires_at\` DATETIME NULL,
        \`login_attempts\` TINYINT UNSIGNED NOT NULL DEFAULT 0,
        \`locked_until\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_psychologists_email\` (\`email\`),
        UNIQUE KEY \`UQ_psychologists_slug\` (\`public_booking_slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\` CHAR(36) NOT NULL,
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`token_hash\` VARCHAR(255) NOT NULL,
        \`expires_at\` DATETIME NOT NULL,
        \`revoked_at\` DATETIME NULL,
        \`user_agent\` VARCHAR(500) NULL,
        \`ip_address\` VARCHAR(45) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_refresh_tokens_psychologist\` (\`psychologist_id\`),
        INDEX \`idx_refresh_tokens_hash\` (\`token_hash\`),
        CONSTRAINT \`FK_refresh_tokens_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`schedule_availability\` (
        \`id\` CHAR(36) NOT NULL,
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`day_of_week\` TINYINT UNSIGNED NOT NULL,
        \`start_time\` TIME NOT NULL,
        \`end_time\` TIME NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_availability_psychologist\` (\`psychologist_id\`),
        CONSTRAINT \`FK_availability_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`subscriptions\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`plan\` ENUM('free','pro','clinic') NOT NULL DEFAULT 'free',
        \`status\` ENUM('trialing','active','past_due','cancelled') NOT NULL DEFAULT 'trialing',
        \`trial_ends_at\` DATETIME NULL,
        \`current_period_starts_at\` DATETIME NULL,
        \`current_period_ends_at\` DATETIME NULL,
        \`cancel_at_period_end\` TINYINT(1) NOT NULL DEFAULT 0,
        \`stripe_customer_id\` VARCHAR(255) NULL,
        \`stripe_subscription_id\` VARCHAR(255) NULL,
        \`cancelled_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_subscriptions_psychologist\` (\`psychologist_id\`),
        CONSTRAINT \`FK_subscriptions_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`patients\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`full_name\` VARCHAR(255) NOT NULL,
        \`birth_date\` DATE NOT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL,
        \`gender\` VARCHAR(50) NULL,
        \`marital_status\` VARCHAR(50) NULL,
        \`occupation\` VARCHAR(100) NULL,
        \`referral_source\` VARCHAR(50) NULL,
        \`emergency_contact_name\` VARCHAR(255) NULL,
        \`emergency_contact_phone\` VARCHAR(20) NULL,
        \`notes\` TEXT NULL,
        \`status\` ENUM('active','paused','archived') NOT NULL DEFAULT 'active',
        \`session_price_cents\` INT UNSIGNED NULL,
        \`tags\` JSON NOT NULL DEFAULT (JSON_ARRAY()),
        \`avatar_path\` VARCHAR(500) NULL,
        \`started_at\` DATE NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_patients_psychologist\` (\`psychologist_id\`),
        INDEX \`idx_patients_status\` (\`psychologist_id\`, \`status\`),
        CONSTRAINT \`FK_patients_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(
      `ALTER TABLE \`patients\` ADD FULLTEXT INDEX \`idx_patients_name\` (\`full_name\`)`
    )

    await queryRunner.query(`
      CREATE TABLE \`session_recurrences\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`frequency\` ENUM('weekly','biweekly','monthly') NOT NULL,
        \`start_date\` DATE NOT NULL,
        \`end_date\` DATE NULL,
        \`day_of_week\` TINYINT UNSIGNED NOT NULL,
        \`time_of_day\` TIME NOT NULL,
        \`duration_min\` SMALLINT UNSIGNED NOT NULL,
        \`modality\` ENUM('in_person','online') NOT NULL,
        \`location\` VARCHAR(255) NULL,
        \`price_cents\` INT UNSIGNED NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_recurrences_psychologist\` (\`psychologist_id\`),
        INDEX \`idx_recurrences_patient\` (\`patient_id\`),
        CONSTRAINT \`FK_recurrences_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`),
        CONSTRAINT \`FK_recurrences_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`sessions\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`recurrence_id\` CHAR(36) NULL,
        \`scheduled_at\` DATETIME NOT NULL,
        \`duration_min\` SMALLINT UNSIGNED NOT NULL,
        \`modality\` ENUM('in_person','online') NOT NULL,
        \`location\` VARCHAR(255) NULL,
        \`price_cents\` INT UNSIGNED NOT NULL,
        \`status\` ENUM('scheduled','confirmed','completed','missed','cancelled_patient','cancelled_psychologist','rescheduled') NOT NULL DEFAULT 'scheduled',
        \`cancellation_fee_cents\` INT UNSIGNED NULL,
        \`notes\` TEXT NULL,
        \`cancelled_at\` DATETIME NULL,
        \`completed_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_sessions_psychologist_date\` (\`psychologist_id\`, \`scheduled_at\`),
        INDEX \`idx_sessions_patient\` (\`patient_id\`),
        INDEX \`idx_sessions_recurrence\` (\`recurrence_id\`),
        CONSTRAINT \`FK_sessions_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_sessions_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_sessions_recurrence\` FOREIGN KEY (\`recurrence_id\`)
          REFERENCES \`session_recurrences\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`schedule_blocks\` (
        \`id\` CHAR(36) NOT NULL,
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`starts_at\` DATETIME NOT NULL,
        \`ends_at\` DATETIME NOT NULL,
        \`title\` VARCHAR(100) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_schedule_blocks_psychologist\` (\`psychologist_id\`, \`starts_at\`, \`ends_at\`),
        CONSTRAINT \`FK_schedule_blocks_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`medical_records\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`session_id\` CHAR(36) NULL,
        \`content_encrypted\` LONGBLOB NOT NULL,
        \`private_notes_encrypted\` LONGBLOB NULL,
        \`mood_score\` TINYINT UNSIGNED NULL,
        \`techniques_used\` JSON NOT NULL DEFAULT (JSON_ARRAY()),
        \`next_steps\` JSON NOT NULL DEFAULT (JSON_ARRAY()),
        \`version\` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_medical_records_patient\` (\`patient_id\`),
        INDEX \`idx_medical_records_session\` (\`session_id\`),
        CONSTRAINT \`FK_medical_records_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`),
        CONSTRAINT \`FK_medical_records_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`),
        CONSTRAINT \`FK_medical_records_session\` FOREIGN KEY (\`session_id\`)
          REFERENCES \`sessions\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`medical_record_versions\` (
        \`id\` CHAR(36) NOT NULL,
        \`record_id\` CHAR(36) NOT NULL,
        \`version\` SMALLINT UNSIGNED NOT NULL,
        \`content_encrypted\` LONGBLOB NOT NULL,
        \`edited_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_record_versions_record\` (\`record_id\`),
        CONSTRAINT \`FK_record_versions_record\` FOREIGN KEY (\`record_id\`)
          REFERENCES \`medical_records\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`therapeutic_plans\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`version\` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        \`short_term_goals_encrypted\` LONGBLOB NULL,
        \`mid_term_goals_encrypted\` LONGBLOB NULL,
        \`long_term_goals_encrypted\` LONGBLOB NULL,
        \`diagnosis_hypothesis_encrypted\` LONGBLOB NULL,
        \`cid10\` VARCHAR(10) NULL,
        \`strategies_encrypted\` LONGBLOB NULL,
        \`superseded_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_therapeutic_plans_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`),
        CONSTRAINT \`FK_therapeutic_plans_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`anamneses\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`chief_complaint_encrypted\` LONGBLOB NULL,
        \`history_encrypted\` LONGBLOB NULL,
        \`medications_encrypted\` LONGBLOB NULL,
        \`general_health_encrypted\` LONGBLOB NULL,
        \`family_history_encrypted\` LONGBLOB NULL,
        \`therapeutic_goals_encrypted\` LONGBLOB NULL,
        \`custom_fields\` JSON NOT NULL DEFAULT (JSON_ARRAY()),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_anamneses_patient\` (\`patient_id\`),
        CONSTRAINT \`FK_anamneses_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`),
        CONSTRAINT \`FK_anamneses_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`clinical_documents\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`document_type\` ENUM('attendance_declaration','psychological_report','referral','attendance_certificate') NOT NULL,
        \`r2_object_key\` VARCHAR(500) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_clinical_documents_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`),
        CONSTRAINT \`FK_clinical_documents_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`patient_documents\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`r2_object_key\` VARCHAR(500) NOT NULL,
        \`file_name\` VARCHAR(255) NOT NULL,
        \`file_size_bytes\` INT UNSIGNED NOT NULL,
        \`mime_type\` VARCHAR(50) NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_patient_documents_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`),
        CONSTRAINT \`FK_patient_documents_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`charges\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`amount_cents\` INT UNSIGNED NOT NULL,
        \`due_date\` DATE NOT NULL,
        \`status\` ENUM('pending','paid','expired','cancelled') NOT NULL DEFAULT 'pending',
        \`stripe_payment_intent_id\` VARCHAR(255) NULL,
        \`stripe_payment_link\` TEXT NULL,
        \`paid_at\` DATETIME NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_charges_psychologist_status\` (\`psychologist_id\`, \`status\`),
        CONSTRAINT \`FK_charges_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`),
        CONSTRAINT \`FK_charges_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`payments\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`amount_cents\` INT UNSIGNED NOT NULL,
        \`paid_at\` DATE NOT NULL,
        \`method\` ENUM('pix','cash','debit_card','credit_card','transfer','other') NOT NULL,
        \`notes\` TEXT NULL,
        \`charge_id\` CHAR(36) NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_payments_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`),
        CONSTRAINT \`FK_payments_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`),
        CONSTRAINT \`FK_payments_charge\` FOREIGN KEY (\`charge_id\`)
          REFERENCES \`charges\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`payment_sessions\` (
        \`payment_id\` CHAR(36) NOT NULL,
        \`session_id\` CHAR(36) NOT NULL,
        PRIMARY KEY (\`payment_id\`, \`session_id\`),
        CONSTRAINT \`FK_payment_sessions_payment\` FOREIGN KEY (\`payment_id\`)
          REFERENCES \`payments\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_payment_sessions_session\` FOREIGN KEY (\`session_id\`)
          REFERENCES \`sessions\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`communication_templates\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NULL,
        \`category\` ENUM('reminder','cancellation','billing','onboarding','sensitive') NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`body\` TEXT NOT NULL,
        \`is_system\` TINYINT(1) NOT NULL DEFAULT 0,
        \`channel\` ENUM('whatsapp','email','both') NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_comm_templates_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`communication_logs\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`patient_id\` CHAR(36) NOT NULL,
        \`template_id\` CHAR(36) NULL,
        \`channel\` ENUM('whatsapp','email') NOT NULL,
        \`type\` ENUM('automated','manual','billing') NOT NULL,
        \`status\` ENUM('sent','failed') NOT NULL,
        \`body_snapshot\` TEXT NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_comm_logs_psychologist\` FOREIGN KEY (\`psychologist_id\`)
          REFERENCES \`psychologists\` (\`id\`),
        CONSTRAINT \`FK_comm_logs_patient\` FOREIGN KEY (\`patient_id\`)
          REFERENCES \`patients\` (\`id\`),
        CONSTRAINT \`FK_comm_logs_template\` FOREIGN KEY (\`template_id\`)
          REFERENCES \`communication_templates\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await queryRunner.query(`
      CREATE TABLE \`audit_logs\` (
        \`id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`psychologist_id\` CHAR(36) NOT NULL,
        \`action\` VARCHAR(100) NOT NULL,
        \`resource_type\` VARCHAR(50) NOT NULL,
        \`resource_id\` CHAR(36) NOT NULL,
        \`ip_address\` VARCHAR(45) NULL,
        \`metadata\` JSON NOT NULL DEFAULT (JSON_OBJECT()),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_audit_logs_psychologist_date\` (\`psychologist_id\`, \`created_at\` DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`audit_logs\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`communication_logs\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`communication_templates\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`payment_sessions\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`payments\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`charges\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`patient_documents\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`clinical_documents\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`anamneses\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`therapeutic_plans\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`medical_record_versions\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`medical_records\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`schedule_blocks\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`sessions\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`session_recurrences\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`patients\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`subscriptions\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`schedule_availability\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`refresh_tokens\``)
    await queryRunner.query(`DROP TABLE IF EXISTS \`psychologists\``)
  }
}
