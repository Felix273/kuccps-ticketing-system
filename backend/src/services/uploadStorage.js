const fs = require('fs');
const path = require('path');

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')
);

fs.mkdirSync(uploadDir, { recursive: true, mode: 0o750 });

function resolveUploadPath(filePath, root = uploadDir) {
  if (typeof filePath !== 'string' || !filePath) return null;

  const resolvedPath = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(root, filePath);
  const relativePath = path.relative(path.resolve(root), resolvedPath);
  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return resolvedPath;
}

async function removeUploadFile(filePath, requestId) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Upload cleanup failed:', { requestId, message: error.message });
    }
  }
}

module.exports = { uploadDir, resolveUploadPath, removeUploadFile };
