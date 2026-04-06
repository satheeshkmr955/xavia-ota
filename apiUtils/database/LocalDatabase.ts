import { Pool } from 'pg';

import { DatabaseInterface, Release, Tracking, TrackingMetrics } from './DatabaseInterface';
import { Tables } from './DatabaseFactory';

export class PostgresDatabase implements DatabaseInterface {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    });
  }
  async getLatestReleaseRecordForRuntimeVersion(runtimeVersion: string): Promise<Release | null> {
    const query = `
      SELECT id, runtime_version as "runtimeVersion", path, timestamp, commit_hash as "commitHash"
      FROM ${Tables.RELEASES} WHERE runtime_version = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const { rows } = await this.pool.query(query, [runtimeVersion]);
    return rows[0] || null;
  }
  async getLatestActiveRelease(runtimeVersion: string, channel: string): Promise<Release | null> {
    const query = `
      SELECT id, runtime_version as "runtimeVersion", path, timestamp, commit_hash as "commitHash", commit_message as "commitMessage", update_id as "updateId", channel as "channel", rollout_percentage as "rolloutPercentage", is_halted as "isHalted", path as "path"
      FROM ${Tables.RELEASES} WHERE runtime_version = $1 
      AND channel = $2 AND is_halted = false
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const { rows } = await this.pool.query(query, [runtimeVersion, channel]);
    return rows[0] || null;
  }
  async updateReleaseStatus(id: string, isHalted: boolean): Promise<void> {
    const query = `
      UPDATE ${Tables.RELEASES}
      SET is_halted = $1
      WHERE id = $2
    `;
    await this.pool.query(query, [isHalted, id]);
  }
  async updateRolloutPercentage(id: string, rolloutPercentage: number): Promise<void> {
    const query = `
      UPDATE ${Tables.RELEASES}
      SET rollout_percentage = $1
      WHERE id = $2
    `;
    await this.pool.query(query, [rolloutPercentage, id]);
  }
  async getReleaseByPath(path: string): Promise<Release | null> {
    const query = `
      SELECT id, runtime_version as "runtimeVersion", path, timestamp, commit_hash as "commitHash"
      FROM ${Tables.RELEASES} WHERE path = $1
    `;
    const { rows } = await this.pool.query(query, [path]);
    return rows[0] || null;
  }

  async createTracking(tracking: Omit<Tracking, 'id'>): Promise<Tracking> {
    const query = `
      INSERT INTO ${Tables.RELEASES_TRACKING} (release_id, platform)
      VALUES ($1, $2)
      RETURNING id, release_id as "releaseId", download_timestamp as "downloadTimestamp", platform
    `;
    const values = [tracking.releaseId, tracking.platform];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async getReleaseTrackingMetrics(releaseId: string): Promise<TrackingMetrics[]> {
    const query = `
      SELECT platform, COUNT(*) as count
      FROM ${Tables.RELEASES_TRACKING}
      WHERE release_id = $1
      GROUP BY platform
    `;
    const { rows } = await this.pool.query(query, [releaseId]);
    return rows.map((row) => ({
      platform: row.platform,
      count: Number(row.count),
    }));
  }

  async getReleaseTrackingMetricsForAllReleases(): Promise<TrackingMetrics[]> {
    const query = `
      SELECT platform, COUNT(*) as count
      FROM ${Tables.RELEASES_TRACKING}
      GROUP BY platform
    `;
    const { rows } = await this.pool.query(query);
    return rows.map((row) => ({
      platform: row.platform,
      count: Number(row.count),
    }));
  }

  async createRelease(release: Omit<Release, 'id'>): Promise<Release> {
    const query = `
      INSERT INTO ${Tables.RELEASES} (runtime_version, path, timestamp, commit_hash, commit_message, update_id, channel, rollout_percentage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, runtime_version as "runtimeVersion", path, timestamp, commit_hash as "commitHash", update_id as "updateId", channel as "channel", rollout_percentage as "rolloutPercentage", is_halted as "isHalted"
    `;

    const values = [
      release.runtimeVersion,
      release.path,
      release.timestamp,
      release.commitHash,
      release.commitMessage,
      release.updateId,
      release.channel,
      release.rolloutPercentage,
    ];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async getRelease(id: string): Promise<Release | null> {
    const query = `
      SELECT id, runtime_version as "runtimeVersion", path, timestamp, commit_hash as "commitHash", commit_message as "commitMessage", update_id as "updateId", channel as "channel", rollout_percentage as "rolloutPercentage", is_halted as "isHalted", path as "path"
      FROM ${Tables.RELEASES} WHERE id = $1
    `;

    const { rows } = await this.pool.query(query, [id]);
    return rows[0] || null;
  }

  async getReleaseByUpdateId(updateId: string): Promise<Release | null> {
    if (!updateId) return null;

    const query = `
      SELECT 
        id, 
        runtime_version as "runtimeVersion", 
        path, 
        timestamp, 
        commit_hash as "commitHash", 
        update_id as "updateId", 
        channel as "channel", 
        is_halted as "isHalted"
      FROM ${Tables.RELEASES} 
      WHERE update_id = $1
      LIMIT 1
    `;

    const { rows } = await this.pool.query(query, [updateId]);
    return rows[0] || null;
  }

  async listReleases(): Promise<Release[]> {
    const query = `
      SELECT id, runtime_version as "runtimeVersion", path, timestamp, commit_hash as "commitHash", commit_message as "commitMessage", is_halted as "isHalted", channel as "channel", rollout_percentage as "rolloutPercentage"  
      FROM ${Tables.RELEASES}
      ORDER BY timestamp DESC
    `;

    const { rows } = await this.pool.query(query);
    return rows;
  }
}
