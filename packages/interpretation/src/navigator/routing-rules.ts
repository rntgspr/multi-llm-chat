import type { AssistantId, Message, RoutingPlan } from '@synergy/types'
import type { ConversationContext } from './navigator'

interface RoutingRule {
  name: string
  condition: (message: Message, context: ConversationContext) => boolean
  assistants: AssistantId[]
  priority: number
}

/**
 * Predefined routing rules.
 * Rules are checked in priority order (higher first).
 */
const rules: RoutingRule[] = [
  {
    name: 'code-keywords',
    priority: 100,
    assistants: ['code-assistant'],
    condition: (message) => {
      const text = getMessageText(message).toLowerCase()
      const codeKeywords = [
        'code',
        'function',
        'error',
        'bug',
        'debug',
        'programming',
        'javascript',
        'typescript',
        'python',
        'java',
        'react',
        'api',
        'database',
        'sql',
        'git',
        'deploy',
        'dockerfile',
        'npm',
        'package',
        'import',
        'export',
        'class',
        'interface',
        'type',
        'async',
        'await',
        'promise',
        'array',
        'object',
        'string',
        'number',
        'boolean',
        'null',
        'undefined',
        'const',
        'let',
        'var',
        'if',
        'else',
        'for',
        'while',
        'switch',
        'case',
        'return',
        'throw',
        'try',
        'catch',
        'finally',
      ]
      return codeKeywords.some((kw) => text.includes(kw))
    },
  },
  {
    name: 'creative-keywords',
    priority: 90,
    assistants: ['creative-assistant'],
    condition: (message) => {
      const text = getMessageText(message).toLowerCase()
      const creativeKeywords = [
        'write a story',
        'create a poem',
        'brainstorm',
        'creative',
        'imagine',
        'fiction',
        'narrative',
        'character',
        'plot',
        'setting',
        'dialogue',
        'write me',
        'compose',
        'invent',
        'design',
        'artistic',
      ]
      return creativeKeywords.some((kw) => text.includes(kw))
    },
  },
  {
    name: 'code-block-present',
    priority: 95,
    assistants: ['code-assistant'],
    condition: (message) => {
      const text = getMessageText(message)
      return text.includes('```') || text.includes('`')
    },
  },
]

/**
 * Extracts text content from a message
 */
function getMessageText(message: Message): string {
  return message.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join(' ')
}

/**
 * Applies routing rules to determine which assistant should respond
 * @returns RoutingPlan if a rule matches, null otherwise
 */
export function applyRules(message: Message, context: ConversationContext): RoutingPlan | null {
  // Sort rules by priority (descending)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    if (rule.condition(message, context)) {
      // Filter to only available assistants
      const availableAssistants = rule.assistants.filter((id) => context.availableAssistants.includes(id))

      if (availableAssistants.length > 0) {
        return {
          assistants: availableAssistants,
          reasoning: `Matched rule: ${rule.name}`,
          shouldBlock: true,
        }
      }
    }
  }

  return null
}

/**
 * Registers a custom routing rule
 */
export function registerRule(rule: RoutingRule): void {
  rules.push(rule)
}

/**
 * Gets all registered rules
 */
export function getRules(): RoutingRule[] {
  return [...rules]
}
