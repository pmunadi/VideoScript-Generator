
export interface ScriptScene {
  scene: string;
  narasi: string;
  kalimatKunci: string[];
  visual: string;
}

export interface GeneratorState {
  isGenerating: boolean;
  error: string | null;
  script: ScriptScene[] | null;
}

export interface UserInput {
  name: string;
  file: File | null;
}
