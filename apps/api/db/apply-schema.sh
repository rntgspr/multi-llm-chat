#!/bin/bash
surreal sql \
  --endpoint http://localhost:8000 \
  --username root \
  --password root \
  --namespace multi_llm_chat \
  --database chat < schema.surql
