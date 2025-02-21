export interface CloudServiceError {
  errorCode: string;
  errorMessage: string;
}
export interface CloudServiceResult<T extends Record<string, any>> {
  success: boolean;
  result?: T | null;
  error?: CloudServiceError;
}
export interface ICloudService {
  authenticate(...args: any[]): Promise<any>;
  getSecret(secretName: string, config: any): Promise<any>;
  getUniqueCacheKey(secretName: string, config?: any): string;
}

export type AWSSecretType = 'kv' | 'plaintext';
export interface AWSSecretConfig {
  SecretId: string;
  VersionId?: string;
  VersionStage?: string;
  SecretType: AWSSecretType;
  SecretKey?: string;
};

export interface GCPSecretConfig {
  secretName: string;
  version?: string;
}
export interface HCPSecretConfig {
  // we only support HCP static vault secret
  type: 'static';
  organizationId: string;
  projectId: string;
  appName: string;
  secretName: string;
  version?: string | number;
}
export interface HashiCorpVaultKVV1SecretConfig {
  kvVersion: 'v1';
  secretEnginePath: string;
  secretName: string;
  secretKey?: string;
}
export interface HashiCorpVaultKVV2SecretConfig {
  kvVersion: 'v2';
  secretEnginePath: string;
  secretName: string;
  secretKey?: string;
  version?: string | number;
}
export type HashiCorpSecretConfig = HCPSecretConfig | HashiCorpVaultKVV1SecretConfig | HashiCorpVaultKVV2SecretConfig;

export type ExternalVaultConfig = AWSSecretConfig | GCPSecretConfig | HashiCorpSecretConfig;
