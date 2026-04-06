import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseFactory } from '../../apiUtils/database/DatabaseFactory';
import { invalidateCDNCache, syncRolloutToEdge } from '../../apiUtils/helpers/cloudFrontHelper';

export default async function rolloutPercentageHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id, rolloutPercentage } = req.body;

  if (typeof id !== 'string' || typeof rolloutPercentage !== 'number') {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  try {
    await syncRolloutToEdge({ percentage: rolloutPercentage });

    await DatabaseFactory.getDatabase().updateRolloutPercentage?.(id, rolloutPercentage);

    await invalidateCDNCache();
    res.status(200).json({
      message: 'Rollout percentage updated successfully',
    });
  } catch (error) {
    console.error('Failed to update rollout percentage status:', error);
    res.status(500).json({ error: 'Failed to update percentage status' });
  }
}
