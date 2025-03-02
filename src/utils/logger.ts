enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const currentLevel = (process.env.LOG_LEVEL as string) || "INFO";
const levelMap: Record<string, LogLevel> = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR,
};

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (levelMap[currentLevel] <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (levelMap[currentLevel] <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (levelMap[currentLevel] <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (levelMap[currentLevel] <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
};
