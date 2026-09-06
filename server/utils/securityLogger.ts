import { promises as fs } from "fs";
import path from "path";
import { format } from "date-fns";

// Security log configuration
const SECURITY_LOG_CONFIG = {
  logDirectory: path.resolve(process.cwd(), "logs/security"),
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 5,
  logLevels: {
    INFO: "INFO",
    WARNING: "WARNING",
    ERROR: "ERROR",
    CRITICAL: "CRITICAL"
  }
};

// Ensure log directory exists
async function ensureLogDirectory() {
  try {
    await fs.mkdir(SECURITY_LOG_CONFIG.logDirectory, { recursive: true });
  } catch (error) {
    console.error("Failed to create security log directory:", error);
  }
}

// Rotate log files if they exceed the size limit
async function rotateLogs() {
  try {
    const files = await fs.readdir(SECURITY_LOG_CONFIG.logDirectory);
    const logFiles = files.filter(file => file.startsWith("security-") && file.endsWith(".log"));

    if (logFiles.length >= SECURITY_LOG_CONFIG.maxLogFiles) {
      // Sort files by modification time (oldest first)
      const sortedFiles = await Promise.all(
        logFiles.map(async file => {
          const stats = await fs.stat(path.join(SECURITY_LOG_CONFIG.logDirectory, file));
          return { file, mtime: stats.mtime };
        })
      );

      sortedFiles.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

      // Delete the oldest file
      await fs.unlink(path.join(SECURITY_LOG_CONFIG.logDirectory, sortedFiles[0].file));
    }
  } catch (error) {
    console.error("Failed to rotate security logs:", error);
  }
}

// Write a log entry
async function writeLog(level: string, message: string, metadata?: any) {
  try {
    await ensureLogDirectory();
    await rotateLogs();

    const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    const logEntry = {
      timestamp,
      level,
      message,
      metadata: metadata || {}
    };

    const logFile = path.join(SECURITY_LOG_CONFIG.logDirectory, `security-${format(new Date(), "yyyy-MM-dd")}.log`);
    const logContent = `${JSON.stringify(logEntry)}\n`;

    // Append to log file
    await fs.appendFile(logFile, logContent);

    // Check if log file exceeds size limit
    const stats = await fs.stat(logFile);
    if (stats.size > SECURITY_LOG_CONFIG.maxLogSize) {
      await rotateLogs();
    }
  } catch (error) {
    console.error("Failed to write security log:", error);
  }
}

// Security log methods
export const securityLogger = {
  info: (message: string, metadata?: any) => writeLog(SECURITY_LOG_CONFIG.logLevels.INFO, message, metadata),
  warning: (message: string, metadata?: any) => writeLog(SECURITY_LOG_CONFIG.logLevels.WARNING, message, metadata),
  error: (message: string, metadata?: any) => writeLog(SECURITY_LOG_CONFIG.logLevels.ERROR, message, metadata),
  critical: (message: string, metadata?: any) => writeLog(SECURITY_LOG_CONFIG.logLevels.CRITICAL, message, metadata)
};