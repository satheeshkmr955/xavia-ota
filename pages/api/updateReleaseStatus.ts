import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseFactory } from '../../apiUtils/database/DatabaseFactory';

export default async function updateReleaseStatusHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id, isHalted } = req.body;

  if (typeof id !== 'string' || typeof isHalted !== 'boolean') {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  try {
    await DatabaseFactory.getDatabase().updateReleaseStatus?.(id, isHalted);

    res.status(200).json({
      message: 'Release status updated successfully',
    });
  } catch (error) {
    console.error('Failed to update release status:', error);
    res.status(500).json({ error: 'Failed to update release status' });
  }
}
