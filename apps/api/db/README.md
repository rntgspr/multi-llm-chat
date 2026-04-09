# Database Schema

## Overview

SurrealQL schema definition for the multi-LLM chat application.

## Tables

- **user**: User accounts with email validation
- **room**: Chat rooms with member lists
- **message**: Chat messages with metadata
- **assistant**: AI assistant configurations
- **invite**: Room invitation codes with expiration

## Usage

### Apply Schema

```bash
cd apps/api/db
./apply-schema.sh
```

### Validate Schema

```bash
# List all tables
echo "INFO FOR DB;" | surreal sql \
  --endpoint http://localhost:8000 \
  --username root \
  --password root \
  --namespace multi_llm_chat \
  --database chat

# Inspect specific table
echo "INFO FOR TABLE user;" | surreal sql \
  --endpoint http://localhost:8000 \
  --username root \
  --password root \
  --namespace multi_llm_chat \
  --database chat
```

## Schema Features

- **SCHEMAFULL**: All tables enforce strict schema validation
- **Type safety**: Each field has a defined type (string, datetime, array, object, etc.)
- **Constraints**: ASSERT clauses ensure data integrity (e.g., email validation)
- **Defaults**: Automatic timestamp generation for createdAt fields
- **Indexes**: Optimized queries for common access patterns (email, roomId, userId, timestamp)
- **Unique constraints**: Email and invite codes must be unique

## Requirements

- SurrealDB server running on http://localhost:8000
- SurrealDB CLI version 2.6.5 or higher (must match server version)
- Namespace: `multi_llm_chat`
- Database: `chat`
- Credentials: root/root
