/**
 * GenerationConfig - 20 Custom API Input Parameters
 * 
 * This schema represents the complete configuration space for PRD generation.
 * Each parameter is strongly typed and validated at the boundary.
 * 
 * Design Principles:
 * 1. Schema-first: Structure defined before data
 * 2. Type-safe: Compile-time guarantees
 * 3. Validated: Runtime validation at boundaries
 * 4. Composable: Parameters can be mixed/matched
 * 5. Extensible: New parameters don't break existing code
 */

export type Temperature = number; // 0.0 - 2.0
export type TopK = number; // 1 - 40
export type TopP = number; // 0.0 - 1.0
export type MaxOutputTokens = number; // 1 - 8192
export type SafetyLevel = 'none' | 'low' | 'medium' | 'high';
export type Tone = 'professional' | 'casual' | 'technical' | 'executive' | 'academic';
export type WritingStyle = 'concise' | 'detailed' | 'narrative' | 'bullet-points';
export type AudienceExpertise = 'beginner' | 'intermediate' | 'expert' | 'mixed';
export type OutputFormat = 'json' | 'markdown' | 'html' | 'plain-text';
export type DiagramType = 'none' | 'flowchart' | 'sequence' | 'architecture' | 'all';
export type IncludeSection = boolean;
export type WordCountLimit = number; // 100 - 50000
export type Language = string; // ISO 639-1 code (e.g., 'en', 'es', 'fr')
export type Region = string; // ISO 3166-1 alpha-2 (e.g., 'US', 'EU', 'JP')
export type ComplianceStandard = 'none' | 'gdpr' | 'hipaa' | 'soc2' | 'iso27001';
export type IndustryVertical = 'fintech' | 'healthcare' | 'ecommerce' | 'saas' | 'gaming' | 'general';
export type PlatformConstraint = 'web' | 'mobile' | 'desktop' | 'cross-platform' | 'api-first';
export type IntegrationRequirement = string[]; // List of required integrations
export type ForbiddenTopics = string[]; // Topics the AI must avoid
export type MandatorySections = string[]; // Sections that must be included
export type ReferenceUrls = string[]; // URLs for additional context
export type ContextFiles = Array<{
  name: string;
  type: string;
  data: string;
  purpose?: 'reference' | 'example' | 'constraint';
}>;

export interface GenerationConfig {
  // === Core Product Definition (5 params) ===
  productName: string;
  problemStatement: string;
  targetAudience: string;
  primaryGoals: string[];
  keyFeatures: string[];
  
  // === AI Behavior Control (5 params) ===
  temperature: Temperature;           // Creativity vs determinism
  topK: TopK;                         // Diversity of token sampling
  topP: TopP;                         // Nucleus sampling threshold
  maxOutputTokens: MaxOutputTokens;   // Response length limit
  safetyLevel: SafetyLevel;           // Content filtering strictness
  
  // === Output Formatting (5 params) ===
  tone: Tone;                         // Voice and style
  writingStyle: WritingStyle;         // Structural preference
  outputFormat: OutputFormat;         // Serialization format
  includeDiagrams: DiagramType;       // Visual elements
  language: Language;                 // Output language
  
  // === Domain Constraints (5 params) ===
  industryVertical: IndustryVertical; // Domain-specific terminology
  platformConstraint: PlatformConstraint; // Technical platform focus
  complianceStandard: ComplianceStandard; // Regulatory requirements
  audienceExpertise: AudienceExpertise; // Assumed knowledge level
  region: Region;                     // Geographic considerations
  
  // === Advanced Controls (optional, 5+ params) ===
  wordCountLimit?: WordCountLimit;    // Approximate length
  forbiddenTopics?: ForbiddenTopics;  // Off-limits subjects
  mandatorySections?: MandatorySections; // Required sections
  referenceUrls?: ReferenceUrls;      // External context
  contextFiles?: ContextFiles;        // Uploaded files
  integrationRequirements?: IntegrationRequirement; // Third-party systems
  customInstructions?: string;        // Free-form guidance
  seed?: number;                      // For reproducible outputs
  stopSequences?: string[];           // Early termination triggers
}

/**
 * Default configuration - production-ready defaults
 */
export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  // Core
  productName: '',
  problemStatement: '',
  targetAudience: '',
  primaryGoals: [],
  keyFeatures: [],
  
  // AI Behavior
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 4096,
  safetyLevel: 'medium',
  
  // Output Formatting
  tone: 'professional',
  writingStyle: 'detailed',
  outputFormat: 'json',
  includeDiagrams: 'flowchart',
  language: 'en',
  
  // Domain Constraints
  industryVertical: 'general',
  platformConstraint: 'cross-platform',
  complianceStandard: 'none',
  audienceExpertise: 'intermediate',
  region: 'US',
  
  // Advanced (optional)
  wordCountLimit: 5000,
  forbiddenTopics: [],
  mandatorySections: ['vision', 'user-stories', 'requirements', 'risks'],
  referenceUrls: [],
  contextFiles: [],
  integrationRequirements: [],
};

/**
 * Validation schema using Zod-like approach (without external dependency)
 */
export function validateGenerationConfig(config: Partial<GenerationConfig>): {
  valid: boolean;
  errors: Array<{ field: keyof GenerationConfig; message: string }>;
  sanitized: GenerationConfig;
} {
  const errors: Array<{ field: keyof GenerationConfig; message: string }> = [];
  const sanitized = { ...DEFAULT_GENERATION_CONFIG, ...config } as GenerationConfig;
  
  // Core validations
  if (!sanitized.productName || sanitized.productName.trim().length === 0) {
    errors.push({ field: 'productName', message: 'Product name is required' });
  }
  
  if (!sanitized.problemStatement || sanitized.problemStatement.trim().length < 20) {
    errors.push({ field: 'problemStatement', message: 'Problem statement must be at least 20 characters' });
  }
  
  // Range validations
  if (sanitized.temperature < 0 || sanitized.temperature > 2) {
    errors.push({ field: 'temperature', message: 'Temperature must be between 0 and 2' });
    sanitized.temperature = Math.max(0, Math.min(2, sanitized.temperature));
  }
  
  if (sanitized.topK < 1 || sanitized.topK > 40) {
    errors.push({ field: 'topK', message: 'TopK must be between 1 and 40' });
    sanitized.topK = Math.max(1, Math.min(40, sanitized.topK));
  }
  
  if (sanitized.topP < 0 || sanitized.topP > 1) {
    errors.push({ field: 'topP', message: 'TopP must be between 0 and 1' });
    sanitized.topP = Math.max(0, Math.min(1, sanitized.topP));
  }
  
  if (sanitized.maxOutputTokens < 1 || sanitized.maxOutputTokens > 8192) {
    errors.push({ field: 'maxOutputTokens', message: 'MaxOutputTokens must be between 1 and 8192' });
    sanitized.maxOutputTokens = Math.max(1, Math.min(8192, sanitized.maxOutputTokens));
  }
  
  if (sanitized.wordCountLimit && (sanitized.wordCountLimit < 100 || sanitized.wordCountLimit > 50000)) {
    errors.push({ field: 'wordCountLimit', message: 'WordCountLimit must be between 100 and 50000' });
  }
  
  // Array validations
  if (sanitized.primaryGoals.length === 0) {
    errors.push({ field: 'primaryGoals', message: 'At least one primary goal is required' });
  }
  
  if (sanitized.keyFeatures.length === 0) {
    errors.push({ field: 'keyFeatures', message: 'At least one key feature is required' });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Transform config into optimized prompt structure
 * This separates schema from data - the key insight!
 */
export function configToPromptStructure(config: GenerationConfig): {
  systemPrompt: string;
  userPrompt: string;
  constraints: string[];
} {
  const systemPrompt = `You are an expert product manager specializing in ${config.industryVertical} products for ${config.region} market.
Your audience has ${config.audienceExpertise} level expertise.
Write in a ${config.tone} tone using ${config.writingStyle} style.
Language: ${config.language}.
Compliance requirements: ${config.complianceStandard === 'none' ? 'None' : config.complianceStandard}.
Platform focus: ${config.platformConstraint}.`;

  const userPrompt = `Create a comprehensive Product Requirements Document for:

**Product Name:** ${config.productName}

**Problem Statement:** ${config.problemStatement}

**Target Audience:** ${config.targetAudience}

**Primary Goals:**
${config.primaryGoals.map((goal, i) => `${i + 1}. ${goal}`).join('\n')}

**Key Features:**
${config.keyFeatures.map((feature, i) => `${i + 1}. ${feature}`).join('\n')}`;

  const constraints: string[] = [
    `Output format: ${config.outputFormat}`,
    `Include diagrams: ${config.includeDiagrams}`,
    `Maximum tokens: ${config.maxOutputTokens}`,
    `Safety level: ${config.safetyLevel}`,
    `Temperature: ${config.temperature}`,
    `TopK: ${config.topK}`,
    `TopP: ${config.topP}`,
  ];
  
  if (config.wordCountLimit) {
    constraints.push(`Approximate word count: ${config.wordCountLimit}`);
  }
  
  if (config.forbiddenTopics && config.forbiddenTopics.length > 0) {
    constraints.push(`DO NOT discuss: ${config.forbiddenTopics.join(', ')}`);
  }
  
  if (config.mandatorySections && config.mandatorySections.length > 0) {
    constraints.push(`Must include sections: ${config.mandatorySections.join(', ')}`);
  }
  
  if (config.referenceUrls && config.referenceUrls.length > 0) {
    constraints.push(`Reference materials: ${config.referenceUrls.join(', ')}`);
  }
  
  if (config.integrationRequirements && config.integrationRequirements.length > 0) {
    constraints.push(`Required integrations: ${config.integrationRequirements.join(', ')}`);
  }
  
  if (config.customInstructions) {
    constraints.push(`Custom instructions: ${config.customInstructions}`);
  }

  return {
    systemPrompt,
    userPrompt,
    constraints
  };
}
