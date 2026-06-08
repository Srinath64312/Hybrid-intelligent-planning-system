import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('../src');
const destDir = path.resolve('public/src_py');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === '__pycache__') continue;

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  if (fs.existsSync(srcDir)) {
    // Clean old copied files to prevent stale code
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }
    copyDir(srcDir, destDir);
    console.log('Successfully copied Python source files to public/src_py');
  } else {
    console.error('Source directory not found:', srcDir);
    process.exit(1);
  }
} catch (err) {
  console.error('Error copying python files:', err);
  process.exit(1);
}
