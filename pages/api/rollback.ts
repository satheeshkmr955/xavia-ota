import moment from 'moment';
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import AdmZip from 'adm-zip';

import { DatabaseFactory } from '../../apiUtils/database/DatabaseFactory';
import { StorageFactory } from '../../apiUtils/storage/StorageFactory';
import { HashHelper } from '../../apiUtils/helpers/HashHelper';
import { getLogger } from '../../apiUtils/logger';

const logger = getLogger('Rollback');

export default async function rollbackHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { path, runtimeVersion, commitHash, commitMessage, channel } = req.body;

  if (!path) {
    res.status(400).json({ error: 'Missing path' });
    return;
  }

  if (!runtimeVersion) {
    res.status(400).json({ error: 'Missing runtimeVersion' });
    return;
  }

  if (!commitHash) {
    res.status(400).json({ error: 'Missing commitHash' });
    return;
  }

  if (!channel) {
    res.status(400).json({ error: 'Missing channel' });
    return;
  }

  try {
    const storage = StorageFactory.getStorage();

    const timestamp = moment().utc().format('YYYYMMDDHHmmss');
    const newPath = `updates/${runtimeVersion}/${timestamp}.zip`;

    let updateId: string = crypto.randomUUID();

    try {
      // Attempt to transform ZIP for a "Clean" Rollback
      const transformed = await transformZipForRollback(storage, path);
      await storage.uploadFile(newPath, transformed.buffer);
      updateId = transformed.updateId;
    } catch (err) {
      logger.error('ZIP transformation failed, falling back to simple copy:', err);
      // Fallback: Original logic
      await storage.copyFile(path, newPath);
    }

    await DatabaseFactory.getDatabase().createRelease({
      path: newPath,
      runtimeVersion,
      timestamp: moment().utc().toString(),
      commitHash,
      commitMessage: `ROLLBACK: ${commitMessage}`,
      updateId,
      channel,
      rolloutPercentage: 100,
    });

    res.status(200).json({ success: true, newPath });
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({ error: 'Rollback failed' });
  }
}

/**
 * Replaces the hash in an Expo bundle path with a new UUID-based hash.
 * @param oldPath Example: "_expo/static/js/android/index-b3752d65cfaad71ebd50cb07c61ac122.hbc"
 * @returns The new path with a UUID hash
 */
function generateRollbackBundlePath(oldPath: string): string {
  const newHash = crypto.randomUUID().replace(/-/g, '');

  const lastDashIndex = oldPath.lastIndexOf('-');
  const lastDotIndex = oldPath.lastIndexOf('.');

  if (lastDashIndex === -1 || lastDotIndex === -1) {
    throw new Error(`Invalid bundle path format: ${oldPath}`);
  }

  const prefix = oldPath.substring(0, lastDashIndex + 1); // Up to "index-"
  const extension = oldPath.substring(lastDotIndex); // ".hbc"

  return `${prefix}${newHash}${extension}`;
}

/**
 * Reusable logic to transform a ZIP into an Expo-recognized Rollback bundle
 */
async function transformZipForRollback(storage: any, path: string) {
  const originalBuffer = await storage.downloadFile(path);
  const zip = new AdmZip(originalBuffer);
  const metadataEntry = zip.getEntry('metadata.json');

  if (!metadataEntry) throw new Error('metadata.json not found');

  const metadata = JSON.parse(metadataEntry.getData().toString('utf8'));
  const platforms = ['android', 'ios'] as const;

  for (const platform of platforms) {
    const oldBundlePath = metadata.fileMetadata[platform]?.bundle;
    if (!oldBundlePath) continue;

    const newBundlePath = generateRollbackBundlePath(oldBundlePath);
    const bundleData = zip.getEntry(oldBundlePath)?.getData();

    if (bundleData) {
      zip.addFile(newBundlePath, bundleData);
      zip.deleteFile(oldBundlePath);
      metadata.fileMetadata[platform].bundle = newBundlePath;
    }
  }

  // 1. Minify metadata
  const metadataJsonBuffer = Buffer.from(JSON.stringify(metadata));
  zip.addFile('metadata.json', metadataJsonBuffer);

  // 2. Generate Deterministic ID
  const updateHash = HashHelper.createHash(metadataJsonBuffer, 'sha256', 'hex');
  const updateId = HashHelper.convertSHA256HashToUUID(updateHash);

  return { buffer: zip.toBuffer(), updateId };
}
