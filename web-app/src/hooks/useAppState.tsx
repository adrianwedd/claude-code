'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppSettings, Project, Session, SystemStatus } from '@/types';

interface AppState {
  currentProject: Project | null;
  currentSession: Session | null;
  systemStatus: SystemStatus | null;
  settings: AppSettings;
  notifications: any[];
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'SET_SESSION'; payload: Session }
  | { type: 'SET_SYSTEM_STATUS'; payload: SystemStatus }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_NOTIFICATION'; payload: any }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  currentProject: null,
  currentSession: null,
  systemStatus: null,
  settings: {
    theme: 'system',
    editorTheme: 'vs-dark',
    fontSize: 14,
    autoSave: true,
    notifications: {
      desktop: true,
      sound: true,
      tts: false,
    },
    ai: {
      model: 'claude-3-sonnet',
      temperature: 0.7,
      maxTokens: 4000,
    },
  },
  notifications: [],
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROJECT':
      return {
        ...state,
        currentProject: action.payload,
      };

    case 'SET_SESSION':
      return {
        ...state,
        currentSession: action.payload,
      };

    case 'SET_SYSTEM_STATUS':
      return {
        ...state,
        systemStatus: action.payload,
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
}

interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    setProject: (project: Project) => void;
    setSession: (session: Session) => void;
    setSystemStatus: (status: SystemStatus) => void;
    updateSettings: (settings: Partial<AppSettings>) => void;
    addNotification: (notification: any) => void;
    removeNotification: (id: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
  };
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    setProject: (project: Project) => dispatch({ type: 'SET_PROJECT', payload: project }),
    setSession: (session: Session) => dispatch({ type: 'SET_SESSION', payload: session }),
    setSystemStatus: (status: SystemStatus) => dispatch({ type: 'SET_SYSTEM_STATUS', payload: status }),
    updateSettings: (settings: Partial<AppSettings>) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    addNotification: (notification: any) => dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
  };

  const value: AppStateContextType = {
    state,
    dispatch,
    actions,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}