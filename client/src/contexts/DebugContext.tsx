import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface DebugRequest {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  environmentId?: string;
}

export interface DebugResponse {
  id: string;
  requestId: string;
  timestamp: Date;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
  hostedRunUrl?: string;
}

export interface DebugError {
  id: string;
  requestId: string;
  timestamp: Date;
  message: string;
  stack?: string;
}

interface DebugContextType {
  requests: DebugRequest[];
  responses: DebugResponse[];
  errors: DebugError[];
  addRequest: (request: DebugRequest) => void;
  addResponse: (response: DebugResponse) => void;
  addError: (error: DebugError) => void;
  clearAll: () => void;
  isEnabled: boolean;
  toggleDebug: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

const MAX_ENTRIES = 50; // Keep last 50 entries to prevent memory bloat

export function DebugProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<DebugRequest[]>([]);
  const [responses, setResponses] = useState<DebugResponse[]>([]);
  const [errors, setErrors] = useState<DebugError[]>([]);
  const [isEnabled, setIsEnabled] = useState(true); // Enabled by default

  const addRequest = useCallback((request: DebugRequest) => {
    if (!isEnabled) return;
    setRequests(prev => [...prev, request].slice(-MAX_ENTRIES));
  }, [isEnabled]);

  const addResponse = useCallback((response: DebugResponse) => {
    if (!isEnabled) return;
    setResponses(prev => [...prev, response].slice(-MAX_ENTRIES));
  }, [isEnabled]);

  const addError = useCallback((error: DebugError) => {
    if (!isEnabled) return;
    setErrors(prev => [...prev, error].slice(-MAX_ENTRIES));
  }, [isEnabled]);

  const clearAll = useCallback(() => {
    setRequests([]);
    setResponses([]);
    setErrors([]);
  }, []);

  const toggleDebug = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  return (
    <DebugContext.Provider
      value={{
        requests,
        responses,
        errors,
        addRequest,
        addResponse,
        addError,
        clearAll,
        isEnabled,
        toggleDebug,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error("useDebug must be used within a DebugProvider");
  }
  return context;
}
