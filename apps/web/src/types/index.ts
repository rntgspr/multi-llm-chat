/**
 * Re-export all types from @multi-llm/types
 * and add backward compatibility aliases
 */
export * from '@multi-llm/types'

// Legacy aliases for backward compatibility
// TODO: Remove these after full migration
// Re-export orchestrator types as aliases for navigator
export type {
  NavigationRule as OrchestrationRule,
  NavigatorConfig as OrchestratorConfig,
  NavigatorDecision as OrchestratorDecision,
  SenderType as LegacySenderType,
} from '@multi-llm/types'
