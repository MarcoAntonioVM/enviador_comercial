-- ============================================================================
-- SISTEMA DE AUTOMATIZACIÓN DE ENVÍO DE CREDENCIALES
-- Schema FINAL con utf8_general_ci
-- MySQL 8.0+
-- ============================================================================

-- =========================
-- USUARIOS
-- =========================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'commercial', 'viewer') NOT NULL DEFAULT 'commercial',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- SECTORES
-- =========================
CREATE TABLE sectors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- PROSPECTOS
-- =========================
CREATE TABLE prospects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    company VARCHAR(255),
    sector_id INT,
    phone VARCHAR(50),
    status ENUM('active', 'inactive', 'bounced', 'spam_reported', 'unsubscribed') NOT NULL DEFAULT 'active',
    consent_status ENUM('unknown','granted','revoked') NOT NULL DEFAULT 'unknown',
    consented_at TIMESTAMP NULL,
    unsubscribed_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL,
    UNIQUE KEY unique_prospect_email (email),
    INDEX idx_status_sector (status, sector_id),
    INDEX idx_consent_deleted (consent_status, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- PLANTILLAS DE EMAIL
-- =========================
CREATE TABLE email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    sector_id INT,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    variables JSON,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sector (sector_id),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- REMITENTES
-- =========================
CREATE TABLE senders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    reply_to VARCHAR(255),
    signature TEXT,
    smtp_config JSON,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    daily_limit INT NOT NULL DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_default (is_default),
    CONSTRAINT chk_senders_daily_limit CHECK (daily_limit > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- CAMPAÑAS
-- =========================
CREATE TABLE campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id INT NOT NULL,
    sender_id INT NOT NULL,
    sector_id INT,
    type ENUM('individual', 'massive', 'scheduled') NOT NULL DEFAULT 'massive',
    scheduled_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    total_recipients INT NOT NULL DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE RESTRICT,
    FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE RESTRICT,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_created_at (created_at),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- DESTINATARIOS DE CAMPAÑA
-- =========================
CREATE TABLE campaign_recipients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    prospect_id INT NOT NULL,
    personalized_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_campaign_prospect (campaign_id, prospect_id),
    INDEX idx_campaign (campaign_id),
    INDEX idx_prospect (prospect_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- DOCUMENTOS
-- =========================
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    sector_id INT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sector (sector_id),
    INDEX idx_uploaded_by (uploaded_by),
    CONSTRAINT chk_documents_file_size CHECK (file_size IS NULL OR file_size >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- DOCUMENTOS POR CAMPAÑA
-- =========================
CREATE TABLE campaign_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    document_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_campaign_document (campaign_id, document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- ENVÍOS DE EMAIL
-- =========================
CREATE TABLE email_sends (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    prospect_id INT NOT NULL,
    sender_id INT NOT NULL,
    tracking_id VARCHAR(100) NOT NULL UNIQUE,
    message_id VARCHAR(255),
    provider_response JSON,
    status ENUM('queued', 'sent', 'delivered', 'bounced', 'failed', 'spam_reported') NOT NULL DEFAULT 'queued',
    retry_count INT NOT NULL DEFAULT 0,
    last_retry_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE RESTRICT,
    INDEX idx_campaign_status (campaign_id, status),
    INDEX idx_campaign_sent_at (campaign_id, sent_at),
    INDEX idx_sender_status (sender_id, status),
    INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- CREDENCIALES
-- =========================
CREATE TABLE credentials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email_send_id INT NOT NULL,
    username VARCHAR(255),
    credential_type VARCHAR(100),
    expires_at TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_send_id) REFERENCES email_sends(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_send (email_send_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- CONFIGURACIÓN
-- =========================
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- LOGS
-- =========================
CREATE TABLE automation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_name VARCHAR(255) NOT NULL,
    job_type ENUM('scheduled_send', 'cleanup', 'stats_update', 'webhook_processing') NOT NULL,
    status ENUM('started', 'completed', 'failed') NOT NULL,
    details JSON,
    error_message TEXT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job_type (job_type),
    INDEX idx_status (status),
    INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- =========================
-- DATOS INICIALES
-- =========================
INSERT INTO sectors (name, description, active) VALUES
('General', 'Sector general para prospectos sin categoría específica', TRUE);

INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('email_daily_limit', '2000', 'number', 'Límite global de envíos diarios'),
('brevo_api_key', '', 'string', 'API Key de Brevo'),
('brevo_webhook_secret', '', 'string', 'Secret para validar webhooks'),
('tracking_domain', '', 'string', 'Dominio de tracking'),
('default_timezone', 'America/Mexico_City', 'string', 'Zona horaria del sistema');
