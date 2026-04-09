-- =============================================================================
-- Multi-LLM Chat Database Schema
-- SurrealDB Schema Definition
-- =============================================================================

-- =============================================================================
-- USER TABLE
-- =============================================================================
DEFINE TABLE user SCHEMAFULL;

DEFINE FIELD name ON TABLE user TYPE string;
DEFINE FIELD email ON TABLE user TYPE string;
DEFINE FIELD avatar ON TABLE user TYPE option<string>;
DEFINE FIELD createdAt ON TABLE user TYPE datetime DEFAULT time::now();
DEFINE FIELD updatedAt ON TABLE user TYPE option<datetime>;

-- Indexes
DEFINE INDEX idx_user_email ON TABLE user COLUMNS email UNIQUE;

-- =============================================================================
-- ROOM TABLE
-- =============================================================================
DEFINE TABLE room SCHEMAFULL;

DEFINE FIELD name ON TABLE room TYPE string;
DEFINE FIELD createdBy ON TABLE room TYPE string;
DEFINE FIELD participants ON TABLE room TYPE array<string> DEFAULT [];
DEFINE FIELD assistants ON TABLE room TYPE array<string> DEFAULT [];
DEFINE FIELD createdAt ON TABLE room TYPE datetime DEFAULT time::now();
DEFINE FIELD updatedAt ON TABLE room TYPE option<datetime>;

-- Indexes
DEFINE INDEX idx_room_createdBy ON TABLE room COLUMNS createdBy;

-- =============================================================================
-- MESSAGE TABLE
-- =============================================================================
DEFINE TABLE message SCHEMAFULL;

DEFINE FIELD roomId ON TABLE message TYPE string;
DEFINE FIELD userId ON TABLE message TYPE string;
DEFINE FIELD content ON TABLE message TYPE string;
DEFINE FIELD isHidden ON TABLE message TYPE bool DEFAULT false;
DEFINE FIELD timestamp ON TABLE message TYPE datetime DEFAULT time::now();
DEFINE FIELD metadata ON TABLE message TYPE option<object>;

-- Indexes
DEFINE INDEX idx_message_roomId ON TABLE message COLUMNS roomId;
DEFINE INDEX idx_message_userId ON TABLE message COLUMNS userId;
DEFINE INDEX idx_message_timestamp ON TABLE message COLUMNS timestamp;
DEFINE INDEX idx_message_room_timestamp ON TABLE message COLUMNS roomId, timestamp;

-- =============================================================================
-- ASSISTANT TABLE
-- =============================================================================
DEFINE TABLE assistant SCHEMAFULL;

DEFINE FIELD name ON TABLE assistant TYPE string;
DEFINE FIELD model ON TABLE assistant TYPE string;
DEFINE FIELD provider ON TABLE assistant TYPE string;
DEFINE FIELD config ON TABLE assistant TYPE object DEFAULT {};
DEFINE FIELD createdAt ON TABLE assistant TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_assistant_provider ON TABLE assistant COLUMNS provider;

-- =============================================================================
-- INVITE TABLE
-- =============================================================================
DEFINE TABLE invite SCHEMAFULL;

DEFINE FIELD code ON TABLE invite TYPE string;
DEFINE FIELD roomId ON TABLE invite TYPE string;
DEFINE FIELD expiresAt ON TABLE invite TYPE datetime;
DEFINE FIELD usedBy ON TABLE invite TYPE option<string>;
DEFINE FIELD createdAt ON TABLE invite TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_invite_code ON TABLE invite COLUMNS code UNIQUE;
DEFINE INDEX idx_invite_roomId ON TABLE invite COLUMNS roomId;
DEFINE INDEX idx_invite_expiresAt ON TABLE invite COLUMNS expiresAt;
