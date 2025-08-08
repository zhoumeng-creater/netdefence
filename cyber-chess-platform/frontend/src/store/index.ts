import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { 
  AuthState, 
  User, 
  AuthToken,
  GameState,
  GameRole,
  ChessRecord,
  Course,
  SecurityEvent,
  DashboardStats
} from '@/types';

// ============= Auth Slice =============
const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: AuthToken }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      // 保存到localStorage
      localStorage.setItem('token', action.payload.token.accessToken);
      localStorage.setItem('refreshToken', action.payload.token.refreshToken);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      // 清除localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// ============= Game Slice =============
interface GameSliceState {
  currentGame: GameState | null;
  games: GameState[];
  loading: boolean;
  error: string | null;
  selectedRole: GameRole | null;
  isMultiplayer: boolean;
  roomId: string | null;
}

const initialGameState: GameSliceState = {
  currentGame: null,
  games: [],
  loading: false,
  error: null,
  selectedRole: null,
  isMultiplayer: false,
  roomId: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState: initialGameState,
  reducers: {
    setCurrentGame: (state, action: PayloadAction<GameState>) => {
      state.currentGame = action.payload;
    },
    updateGameState: (state, action: PayloadAction<Partial<GameState>>) => {
      if (state.currentGame) {
        state.currentGame = { ...state.currentGame, ...action.payload };
      }
    },
    setSelectedRole: (state, action: PayloadAction<GameRole>) => {
      state.selectedRole = action.payload;
    },
    setMultiplayer: (state, action: PayloadAction<{ isMultiplayer: boolean; roomId?: string }>) => {
      state.isMultiplayer = action.payload.isMultiplayer;
      state.roomId = action.payload.roomId || null;
    },
    resetGame: (state) => {
      state.currentGame = null;
      state.selectedRole = null;
      state.isMultiplayer = false;
      state.roomId = null;
    },
    setGameLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setGameError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// ============= Chess Slice =============
interface ChessSliceState {
  records: ChessRecord[];
  currentRecord: ChessRecord | null;
  replayMode: boolean;
  replayPosition: number;
  filters: any;
  loading: boolean;
  error: string | null;
}

const initialChessState: ChessSliceState = {
  records: [],
  currentRecord: null,
  replayMode: false,
  replayPosition: 0,
  filters: {},
  loading: false,
  error: null,
};

const chessSlice = createSlice({
  name: 'chess',
  initialState: initialChessState,
  reducers: {
    setChessRecords: (state, action: PayloadAction<ChessRecord[]>) => {
      state.records = action.payload;
    },
    addChessRecord: (state, action: PayloadAction<ChessRecord>) => {
      state.records.unshift(action.payload);
    },
    updateChessRecord: (state, action: PayloadAction<ChessRecord>) => {
      const index = state.records.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    },
    deleteChessRecord: (state, action: PayloadAction<string>) => {
      state.records = state.records.filter(r => r.id !== action.payload);
    },
    setCurrentRecord: (state, action: PayloadAction<ChessRecord | null>) => {
      state.currentRecord = action.payload;
      state.replayPosition = 0;
    },
    setReplayMode: (state, action: PayloadAction<boolean>) => {
      state.replayMode = action.payload;
    },
    setReplayPosition: (state, action: PayloadAction<number>) => {
      state.replayPosition = action.payload;
    },
    setChessFilters: (state, action: PayloadAction<any>) => {
      state.filters = action.payload;
    },
    setChessLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setChessError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// ============= Course Slice =============
interface CourseSliceState {
  courses: Course[];
  currentCourse: Course | null;
  enrolledCourses: string[];
  filters: any;
  loading: boolean;
  error: string | null;
}

const initialCourseState: CourseSliceState = {
  courses: [],
  currentCourse: null,
  enrolledCourses: [],
  filters: {},
  loading: false,
  error: null,
};

const courseSlice = createSlice({
  name: 'course',
  initialState: initialCourseState,
  reducers: {
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
    },
    addCourse: (state, action: PayloadAction<Course>) => {
      state.courses.unshift(action.payload);
    },
    updateCourse: (state, action: PayloadAction<Course>) => {
      const index = state.courses.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },
    deleteCourse: (state, action: PayloadAction<string>) => {
      state.courses = state.courses.filter(c => c.id !== action.payload);
    },
    setCurrentCourse: (state, action: PayloadAction<Course | null>) => {
      state.currentCourse = action.payload;
    },
    setEnrolledCourses: (state, action: PayloadAction<string[]>) => {
      state.enrolledCourses = action.payload;
    },
    enrollCourse: (state, action: PayloadAction<string>) => {
      if (!state.enrolledCourses.includes(action.payload)) {
        state.enrolledCourses.push(action.payload);
      }
    },
    setCourseFilters: (state, action: PayloadAction<any>) => {
      state.filters = action.payload;
    },
    setCourseLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCourseError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// ============= Event Slice =============
interface EventSliceState {
  events: SecurityEvent[];
  currentEvent: SecurityEvent | null;
  filters: any;
  loading: boolean;
  error: string | null;
}

const initialEventState: EventSliceState = {
  events: [],
  currentEvent: null,
  filters: {},
  loading: false,
  error: null,
};

const eventSlice = createSlice({
  name: 'event',
  initialState: initialEventState,
  reducers: {
    setEvents: (state, action: PayloadAction<SecurityEvent[]>) => {
      state.events = action.payload;
    },
    addEvent: (state, action: PayloadAction<SecurityEvent>) => {
      state.events.unshift(action.payload);
    },
    updateEvent: (state, action: PayloadAction<SecurityEvent>) => {
      const index = state.events.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
    deleteEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter(e => e.id !== action.payload);
    },
    setCurrentEvent: (state, action: PayloadAction<SecurityEvent | null>) => {
      state.currentEvent = action.payload;
    },
    setEventFilters: (state, action: PayloadAction<any>) => {
      state.filters = action.payload;
    },
    setEventLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setEventError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// ============= Admin Slice =============
interface AdminSliceState {
  dashboardStats: DashboardStats | null;
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialAdminState: AdminSliceState = {
  dashboardStats: null,
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState: initialAdminState,
  reducers: {
    setDashboardStats: (state, action: PayloadAction<DashboardStats>) => {
      state.dashboardStats = action.payload;
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    updateUserInList: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUserFromList: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(u => u.id !== action.payload);
    },
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    setAdminLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAdminError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// ============= UI Slice =============
interface UIState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  activeModal: string | null;
  notifications: Notification[];
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

const initialUIState: UIState = {
  theme: 'dark',
  sidebarCollapsed: false,
  activeModal: null,
  notifications: [],
  loading: {
    global: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
  },
});

// ============= Configure Store =============
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    game: gameSlice.reducer,
    chess: chessSlice.reducer,
    course: courseSlice.reducer,
    event: eventSlice.reducer,
    admin: adminSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略这些action types的序列化检查
        ignoredActions: ['game/updateGameState', 'chess/setCurrentRecord'],
        // 忽略这些field paths的序列化检查
        ignoredActionPaths: ['payload.condition', 'payload.effect'],
        ignoredPaths: ['game.currentGame.eventQueue'],
      },
    }),
});

// ============= Export Actions =============
export const authActions = authSlice.actions;
export const gameActions = gameSlice.actions;
export const chessActions = chessSlice.actions;
export const courseActions = courseSlice.actions;
export const eventActions = eventSlice.actions;
export const adminActions = adminSlice.actions;
export const uiActions = uiSlice.actions;

// ============= Export Types =============
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ============= Export Hooks =============
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;