export interface FungiBinding {
  pilz: {
    type: 'uri';
    value: string;
  };
  lat_name: {
    type: 'literal';
    value: string;
  };
  synonym: {
    type: 'literal';
    value: string;
  };
  image?: {
    type: 'literal';
    value: string;
  };
  edibility?: {
    type: 'literal';
    value: string;
  };
}

export interface FungiResult {
  pilz: string;
  latName: string;
  synonym: string;
  qId: string;
  image?: string;
  edibility?: string[];
}

export interface ApiResponse {
  head: {
    vars: string[];
  };
  results: {
    bindings: FungiBinding[];
  };
  meta?: {
    'query-time-ms': number;
    'result-size-total': number;
  };
}

export type Language = 'de' | 'en';

export interface SearchState {
  query: string;
  language: Language;
}
