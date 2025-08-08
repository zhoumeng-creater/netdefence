// 导出所有自定义hooks

export { useAuth } from './useAuth';
export { useWebSocket } from './useWebSocket';
export { useApi, useGet, usePost, usePut, useDelete } from './useApi';

// 其他常用hooks可以在这里添加
export { default as useLocalStorage } from './useLocalStorage';
export { default as useDebounce } from './useDebounce';
export { default as useThrottle } from './useThrottle';
export { default as useInterval } from './useInterval';
export { default as useTimeout } from './useTimeout';
export { default as useClickOutside } from './useClickOutside';
export { default as useKeyPress } from './useKeyPress';
export { default as useWindowSize } from './useWindowSize';
export { default as useScrollPosition } from './useScrollPosition';
export { default as usePrevious } from './usePrevious';