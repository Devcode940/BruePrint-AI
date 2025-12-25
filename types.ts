
export interface UserStory {
  role: string;
  action: string;
  benefit: string;
}

export interface SubTask {
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface FunctionalRequirement {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  subTasks: SubTask[];
}

export interface RoadmapItem {
  phase: string;
  duration: string;
  milestones: string[];
}

export interface Risk {
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface PRDComment {
  id: string;
  sectionId: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface FileContext {
  name: string;
  type: string;
  data: string; // base64 for images, text content for text files
}

export interface PRDData {
  id: string;
  productName: string;
  vision: string;
  problemStatement: string;
  marketContext: string;
  targetAudience: string[];
  goals: string[];
  userStories: UserStory[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: string[];
  successMetrics: string[];
  risks: Risk[];
  technicalConstraints: string[];
  roadmap: RoadmapItem[];
}

export interface RoadmapInputPhase {
  name: string;
  keyGoals: string;
}

export interface PRDFormInputs {
  name: string;
  description: string;
  targetAudience: string;
  primaryGoals: string;
  keyFeatures: string;
  roadmapPhases: RoadmapInputPhase[];
  contextFiles: FileContext[];
}

export class GeminiError extends Error {
  constructor(public status: string, message: string) {
    super(message);
    this.name = 'GeminiError';
  }
}
