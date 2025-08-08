// ============= 用户相关类型 =============
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  USER = 'user',
  GUEST = 'guest'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  profile?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  nickname?: string;
  bio?: string;
  level: number;
  experience: number;
  achievements: string[];
  statistics: UserStatistics;
}

export interface UserStatistics {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  coursesCompleted: number;
  chessUploaded: number;
}

// ============= 认证相关类型 =============
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  email: string;
  confirmPassword: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ============= 游戏相关类型 =============
export enum GameRole {
  ATTACKER = 'attacker',
  DEFENDER = 'defender',
  MONITOR = 'monitor'
}

export interface GameLayer {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  defense: number;
  status: 'normal' | 'warning' | 'critical' | 'compromised';
}

export interface GameResource {
  name: string;
  value: number;
  max: number;
  icon: string;
  regeneration?: number;
}

export interface GameTactic {
  id: string;
  name: string;
  description: string;
  cost: Record<string, number>;
  cooldown?: number;
  effects: TacticEffect[];
  requirements?: string[];
}

export interface TacticEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special';
  target: 'self' | 'enemy' | 'all';
  layer?: string;
  value: number;
  duration?: number;
}

export interface GameState {
  id: string;
  currentRole: GameRole;
  currentRound: number;
  maxRound: number;
  layers: Record<string, GameLayer>;
  resources: Record<GameRole, Record<string, GameResource>>;
  selectedTactic: GameTactic | null;
  intelligence: IntelligenceItem[];
  actionLog: ActionLogEntry[];
  chainEffects: ChainEffect[];
  eventQueue: GameEvent[];
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  winner?: GameRole;
}

export interface IntelligenceItem {
  id: string;
  type: 'recon' | 'trap' | 'detection' | 'shared' | 'event';
  content: string;
  source: GameRole | 'system';
  round: number;
  timestamp: string;
}

export interface ActionLogEntry {
  id: string;
  message: string;
  type: GameRole | 'system';
  round: number;
  timestamp: string;
  details?: any;
}

export interface ChainEffect {
  type: 'cascade' | 'persistent' | 'delayed';
  target?: string;
  duration?: number;
  value?: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  probability: number;
  condition?: (state: GameState) => boolean;
  effect: (state: GameState) => string;
}

// ============= 棋谱相关类型 =============
export enum ChessType {
  OFFICIAL = 'official',
  TEACHING = 'teaching',
  USER = 'user',
  COMPETITION = 'competition'
}

export enum ChessVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted'
}

export interface ChessRecord {
  id: string;
  title: string;
  description: string;
  type: ChessType;
  content: GameState; // 完整的游戏状态记录
  moves: ChessMove[]; // 每一步的操作记录
  author: User;
  visibility: ChessVisibility;
  tags: string[];
  rating: number;
  playCount: number;
  comments: ChessComment[];
  createdAt: string;
  updatedAt: string;
}

export interface ChessMove {
  round: number;
  role: GameRole;
  tactic: GameTactic;
  result: any;
  timestamp: string;
  analysis?: string;
}

export interface ChessComment {
  id: string;
  userId: string;
  username: string;
  content: string;
  rating?: number;
  createdAt: string;
}

export interface ChessUploadData {
  title: string;
  description: string;
  type: ChessType;
  content: string; // JSON string
  tags: string[];
  visibility: ChessVisibility;
}

// ============= 课程相关类型 =============
export enum CourseCategory {
  BASIC = 'basic',
  ATTACK = 'attack',
  DEFENSE = 'defense',
  ANALYSIS = 'analysis',
  PRACTICE = 'practice'
}

export enum CourseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  instructor: User;
  difficulty: CourseDifficulty;
  duration: number; // 分钟
  price: number;
  thumbnail?: string;
  chapters: CourseChapter[];
  relatedEvents: SecurityEvent[];
  relatedChess: ChessRecord[];
  enrollment: number;
  rating: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CourseChapter {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  content: ChapterContent[];
  quiz?: CourseQuiz;
  practice?: ChessRecord;
}

export interface ChapterContent {
  type: 'video' | 'document' | 'code' | 'simulation';
  title: string;
  url?: string;
  content?: string;
  duration?: number;
}

export interface CourseQuiz {
  id: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number | number[];
  explanation?: string;
  points: number;
}

// ============= 安全事件相关类型 =============
export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  severity: EventSeverity;
  category: string[];
  podcastUrl?: string;
  articleUrl?: string; // 微信公众号链接
  relatedChess: ChessRecord[];
  tags: string[];
  impact: string;
  mitigation: string;
  references: EventReference[];
  createdAt: string;
  updatedAt: string;
}

export interface EventReference {
  title: string;
  url: string;
  type: 'article' | 'video' | 'paper' | 'tool';
}

// ============= 用户进度相关类型 =============
export interface UserProgress {
  id: string;
  userId: string;
  courseId?: string;
  chessId?: string;
  chapterId?: string;
  progress: number; // 0-100
  score?: number;
  attempts: number;
  lastAccess: string;
  completedAt?: string;
  notes?: ProgressNote[];
}

export interface ProgressNote {
  id: string;
  content: string;
  timestamp: string;
  chapterRef?: string;
  moveRef?: number;
}

// ============= 管理后台相关类型 =============
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalChess: number;
  totalEvents: number;
  recentActivities: Activity[];
  systemHealth: SystemHealth;
  userGrowth: GrowthData[];
  popularContent: PopularItem[];
}

export interface Activity {
  id: string;
  type: 'user' | 'course' | 'chess' | 'event' | 'system';
  action: string;
  user?: string;
  details: string;
  timestamp: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  storage: number;
  activeConnections: number;
  errors: number;
  latency: number;
}

export interface GrowthData {
  date: string;
  users: number;
  courses: number;
  games: number;
}

export interface PopularItem {
  id: string;
  type: 'course' | 'chess' | 'event';
  title: string;
  views: number;
  rating: number;
  trend: 'up' | 'down' | 'stable';
}

// ============= API响应类型 =============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// ============= WebSocket事件类型 =============
export interface SocketEvent {
  type: string;
  payload: any;
  timestamp: string;
}

export interface GameSocketEvent extends SocketEvent {
  type: 'game:start' | 'game:move' | 'game:end' | 'game:update' | 'game:chat';
  gameId: string;
  playerId: string;
}

// ============= 表单类型 =============
export interface ChessUploadForm {
  title: string;
  description: string;
  type: ChessType;
  file?: File;
  jsonContent?: string;
  tags: string[];
  visibility: ChessVisibility;
}

export interface CourseCreateForm {
  title: string;
  description: string;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  duration: number;
  price: number;
  thumbnail?: File;
  chapters: CourseChapterForm[];
}

export interface CourseChapterForm {
  title: string;
  description: string;
  order: number;
  contentItems: ChapterContentForm[];
}

export interface ChapterContentForm {
  type: 'video' | 'document' | 'code';
  title: string;
  file?: File;
  url?: string;
  content?: string;
}

export interface EventCreateForm {
  title: string;
  description: string;
  eventDate: string;
  severity: EventSeverity;
  category: string[];
  podcastUrl?: string;
  articleUrl?: string;
  tags: string[];
  impact: string;
  mitigation: string;
}

// ============= 过滤器类型 =============
export interface ChessFilter {
  type?: ChessType;
  visibility?: ChessVisibility;
  author?: string;
  tags?: string[];
  rating?: [number, number];
  dateRange?: [string, string];
  sortBy?: 'date' | 'rating' | 'playCount';
  order?: 'asc' | 'desc';
}

export interface CourseFilter {
  category?: CourseCategory;
  difficulty?: CourseDifficulty;
  instructor?: string;
  priceRange?: [number, number];
  rating?: [number, number];
  sortBy?: 'date' | 'rating' | 'enrollment' | 'price';
  order?: 'asc' | 'desc';
}

export interface EventFilter {
  severity?: EventSeverity;
  category?: string[];
  dateRange?: [string, string];
  tags?: string[];
  hasChess?: boolean;
  sortBy?: 'date' | 'severity';
  order?: 'asc' | 'desc';
}