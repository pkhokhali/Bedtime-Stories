export interface KVNamespaceGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  cacheTtl?: number;
}

export interface KVNamespacePutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: any;
}

export interface KVNamespaceGetWithMetadataResult<T, M> {
  value: T | null;
  metadata: M | null;
}

export interface KVNamespace {
  get(key: string, options?: { type?: 'text' }): Promise<string | null>;
  get<T = unknown>(key: string, options: { type: 'json' }): Promise<T | null>;
  get(key: string, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
  get(key: string, options: { type: 'stream' }): Promise<ReadableStream | null>;
  get(key: string, options?: any): Promise<any>;

  getWithMetadata<M = unknown>(
    key: string,
    options?: { type?: 'text' }
  ): Promise<KVNamespaceGetWithMetadataResult<string, M>>;
  getWithMetadata<T = unknown, M = unknown>(
    key: string,
    options: { type: 'json' }
  ): Promise<KVNamespaceGetWithMetadataResult<T, M>>;
  getWithMetadata<M = unknown>(
    key: string,
    options: { type: 'arrayBuffer' }
  ): Promise<KVNamespaceGetWithMetadataResult<ArrayBuffer, M>>;
  getWithMetadata<M = unknown>(
    key: string,
    options?: any
  ): Promise<KVNamespaceGetWithMetadataResult<any, M>>;

  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: KVNamespacePutOptions
  ): Promise<void>;

  delete(key: string): Promise<void>;
  list(options?: any): Promise<any>;
}

declare global {
  interface KVNamespace {
    get(key: string, options?: any): Promise<any>;
    getWithMetadata<M = unknown>(
      key: string,
      options?: any
    ): Promise<{ value: any; metadata: M | null }>;
    put(key: string, value: any, options?: any): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: any): Promise<any>;
  }
}
