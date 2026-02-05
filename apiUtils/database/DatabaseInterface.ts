export interface Release {
  id: string;
  runtimeVersion: string;
  path: string;
  timestamp: string;
  commitHash: string;
  commitMessage: string;
  updateId?: string;
  channel?: string;
  rolloutPercentage?: number;
  isHalted?: boolean;
}

export interface Tracking {
  id: string;
  releaseId: string;
  downloadTimestamp: string;
  platform: string;
}

export interface TrackingMetrics {
  platform: string;
  count: number;
}

export interface DatabaseInterface {
  createRelease(release: Omit<Release, 'id'>): Promise<Release>;
  getRelease(id: string): Promise<Release | null>;
  getReleaseByPath(path: string): Promise<Release | null>;
  listReleases(): Promise<Release[]>;
  createTracking(tracking: Omit<Tracking, 'id'>): Promise<Tracking>;
  getReleaseTrackingMetrics(releaseId: string): Promise<TrackingMetrics[]>;
  getReleaseTrackingMetricsForAllReleases(): Promise<TrackingMetrics[]>;
  getLatestReleaseRecordForRuntimeVersion(runtimeVersion: string): Promise<Release | null>;
  getLatestActiveRelease?(runtimeVersion: string, channel: string): Promise<Release | null>;
  updateReleaseStatus?(id: string, isHalted: boolean): Promise<void>;
  updateRolloutPercentage?(id: string, rolloutPercentage: number): Promise<void>;
  getReleaseByUpdateId?(updateId: string): Promise<Release | null>;
}
