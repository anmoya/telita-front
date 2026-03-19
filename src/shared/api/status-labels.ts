/**
 * Status Labels Service
 * Fetches localized status labels from the backend API
 * Endpoint: GET /v1/status-labels (public, no auth required)
 */

export interface StatusLabel {
  code: string;
  label: string;
  description: string;
}

export interface StatusLabelsByEntity {
  sale: StatusLabel[];
  cut_job: StatusLabel[];
  scrap: StatusLabel[];
}

export type EntityType = "sale" | "cut_job" | "scrap";

const cache: { labels: StatusLabelsByEntity | null; fetchedAt: number } = {
  labels: null,
  fetchedAt: 0,
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all status labels from the backend
 * Uses caching to avoid repeated API calls
 */
export async function fetchStatusLabels(apiUrl: string): Promise<StatusLabelsByEntity> {
  const now = Date.now();
  
  if (cache.labels && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.labels;
  }

  const response = await fetch(`${apiUrl}/status-labels`);
  
  if (!response.ok) {
    return { sale: [], cut_job: [], scrap: [] };
  }

  const labels = (await response.json()) as StatusLabelsByEntity;
  
  cache.labels = labels;
  cache.fetchedAt = now;
  
  return labels;
}

/**
 * Get the Spanish label for a given status code and entity type
 * Returns the original code if no label is found
 */
export function getStatusLabel(
  labels: StatusLabelsByEntity,
  entityType: EntityType,
  statusCode: string
): string {
  const entityLabels = labels[entityType];
  
  if (!entityLabels) {
    return statusCode;
  }

  const found = entityLabels.find((label) => label.code === statusCode);
  
  return found?.label ?? statusCode;
}

/**
 * Clear the status labels cache
 * Useful when you need to force a fresh fetch
 */
export function clearStatusLabelsCache(): void {
  cache.labels = null;
  cache.fetchedAt = 0;
}
