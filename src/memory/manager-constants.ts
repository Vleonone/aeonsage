/**
 * Memory Index Manager - Constants
 *
 * Centralized constants to avoid duplication and improve maintainability.
 */

/** Database key for storing memory index metadata */
export const META_KEY = "memory_index_meta_v1";

/** Maximum characters for search result snippets */
export const SNIPPET_MAX_CHARS = 700;

/** Database table names */
export const VECTOR_TABLE = "chunks_vec";
export const FTS_TABLE = "chunks_fts";
export const EMBEDDING_CACHE_TABLE = "embedding_cache";

/** Debounce time for session file changes (ms) */
export const SESSION_DIRTY_DEBOUNCE_MS = 5000;

/** Embedding batch processing limits */
export const EMBEDDING_BATCH_MAX_TOKENS = 8000;
export const EMBEDDING_APPROX_CHARS_PER_TOKEN = 1;
export const EMBEDDING_INDEX_CONCURRENCY = 4;

/** Retry configuration for embedding operations */
export const EMBEDDING_RETRY_MAX_ATTEMPTS = 3;
export const EMBEDDING_RETRY_BASE_DELAY_MS = 500;
export const EMBEDDING_RETRY_MAX_DELAY_MS = 8000;

/** Batch failure threshold before disabling batch mode */
export const BATCH_FAILURE_LIMIT = 2;

/** File reading chunk size for session delta processing */
export const SESSION_DELTA_READ_CHUNK_BYTES = 64 * 1024;

/** Timeout configurations (ms) */
export const VECTOR_LOAD_TIMEOUT_MS = 30_000;
export const EMBEDDING_QUERY_TIMEOUT_REMOTE_MS = 60_000;
export const EMBEDDING_QUERY_TIMEOUT_LOCAL_MS = 5 * 60_000;
export const EMBEDDING_BATCH_TIMEOUT_REMOTE_MS = 2 * 60_000;
export const EMBEDDING_BATCH_TIMEOUT_LOCAL_MS = 10 * 60_000;

/** Default batch configuration */
export const DEFAULT_BATCH_CONFIG = {
  enabled: false,
  wait: false,
  concurrency: 1,
  pollIntervalMs: 5000,
  timeoutMs: 5 * 60 * 1000,
};

/** Default cache configuration */
export const DEFAULT_CACHE_CONFIG = {
  enabled: true,
  maxEntries: 1000,
};

/** Default vector configuration */
export const DEFAULT_VECTOR_CONFIG = {
  enabled: true,
  available: null as boolean | null,
};

/** Default FTS configuration */
export const DEFAULT_FTS_CONFIG = {
  enabled: true,
  available: false,
};
