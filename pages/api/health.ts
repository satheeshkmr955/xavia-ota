import { NextApiRequest, NextApiResponse } from 'next';

export default function HealthHandler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
