import { join, parse } from "path";
import { mkdir, readdir, stat } from "fs/promises";

import { logger } from "./logger";

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error;
    }
  }
}

export async function getFilesWithExtension(
  dirPath: string,
  extension: string
): Promise<string[]> {
  try {
    const files = await readdir(dirPath);
    const filteredFiles: string[] = [];

    for (const file of files) {
      const filePath = join(dirPath, file);
      const fileStat = await stat(filePath);

      if (fileStat.isFile() && file.endsWith(extension)) {
        filteredFiles.push(filePath);
      }
    }

    return filteredFiles;
  } catch (error) {
    logger.error(`Failed to read directory: ${dirPath}`, error);
    return [];
  }
}

export function getOutputPath(
  inputPath: string,
  outputDir: string,
  newExtension: string
): string {
  const { name } = parse(inputPath);
  return join(outputDir, `${name}.${newExtension}`);
}
