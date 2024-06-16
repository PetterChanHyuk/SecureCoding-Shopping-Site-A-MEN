import { ESLint } from 'eslint';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// __dirname을 ESM 환경에서 사용하기 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 검사할 디렉토리 설정
const directoryPath = path.join(__dirname, 'client/src');

// 폴더 내부 파일을 검사하는 함수
async function checkFilesInDirectory(directory) {
  const eslint = new ESLint();

  const files = await fs.promises.readdir(directory);
  const filePaths = await Promise.all(files.map(async file => {
    const filePath = path.join(directory, file);
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      return checkFilesInDirectory(filePath);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.vue')) {
      return [filePath];
    } else {
      return [];
    }
  }));

  const allFiles = filePaths.flat();
  if (allFiles.length === 0) {
    return;
  }

  const results = await eslint.lintFiles(allFiles);

  results.forEach(result => {
    if (result.errorCount > 0 || result.warningCount > 0) {
      console.log(`\nFile: ${result.filePath}`);
      result.messages.forEach(msg => {
        console.log(`- ${msg.ruleId}: ${msg.message} (Line: ${msg.line}, Column: ${msg.column})`);
      });
    }
  });

  const errorCount = results.reduce((total, result) => total + result.errorCount, 0);
  const warningCount = results.reduce((total, result) => total + result.warningCount, 0);

  console.log(`\nTotal Errors: ${errorCount}`);
  console.log(`Total Warnings: ${warningCount}`);
}

// 디렉토리 내부 파일 검사 시작
checkFilesInDirectory(directoryPath).catch(err => {
  console.error('Error:', err);
});
