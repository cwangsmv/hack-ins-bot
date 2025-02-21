import { database as db } from '../common/database';
import type { BaseModel } from './index';

export type CloudProviderName = 'aws' | 'azure' | 'gcp' | 'hashicorp';
export enum AWSCredentialType {
  temp = 'temporary'
}
export interface AWSTemporaryCredential {
  type: AWSCredentialType.temp;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}
export interface IBaseCloudCredential {
  name: string;
  provider: CloudProviderName;
}
export interface AWSCloudCredential extends IBaseCloudCredential {
  provider: 'aws';
  credentials: AWSTemporaryCredential;
}
export interface GCPCloudCredential extends IBaseCloudCredential {
  provider: 'gcp';
  credentials: string;
}
export interface HashiCorpBaseCredential {
  access_token?: string;
  expires_at?: number;
}
export enum HashiCorpCredentialType {
  cloud = 'cloud',
  onPrem = 'onPrem',
};
export enum HashiCorpVaultAuthMethod {
  token = 'token',
  appRole = 'appRole',
}
export interface HCPCredential extends HashiCorpBaseCredential {
  client_id: string;
  client_secret: string;
  type: HashiCorpCredentialType.cloud;
};
export interface VaultAppRoleCredential extends HashiCorpBaseCredential {
  role_id: string;
  secret_id: string;
  authMethod: HashiCorpVaultAuthMethod.appRole;
  type: HashiCorpCredentialType.onPrem;
  serverAddress: string;
}
export interface VaultTokenCredential extends HashiCorpBaseCredential {
  authMethod: HashiCorpVaultAuthMethod.token;
  access_token: string;
  type: HashiCorpCredentialType.onPrem;
  serverAddress: string;
}
export type HashiCorpCredentials = HCPCredential | VaultAppRoleCredential | VaultTokenCredential;
export interface HashiCorpCredential extends IBaseCloudCredential {
  provider: 'hashicorp';
  credentials: HashiCorpCredentials;
}
export type BaseCloudCredential = AWSCloudCredential | GCPCloudCredential | HashiCorpCredential;
export type CloudProviderCredential = BaseModel & BaseCloudCredential;

export const name = 'Cloud Credential';
export const type = 'CloudCredential';
export const prefix = 'cloudCred';
export const canDuplicate = false;
export const canSync = false;

export const isCloudCredential = (model: Pick<BaseModel, 'type'>): model is CloudProviderCredential => (
  model.type === type
);

export function getProviderDisplayName(provider: CloudProviderName) {
  return {
    aws: 'AWS',
    azure: 'Azure',
    gcp: 'GCP',
    hashicorp: 'HashiCorp',
  }[provider] || '';
};

export function init(): Partial<BaseCloudCredential> {
  return {
    name: '',
    provider: undefined,
    credentials: undefined,
  };
}

export function migrate(doc: BaseCloudCredential) {
  return doc;
}

export function create(patch: Partial<CloudProviderCredential> = {}) {
  return db.docCreate<CloudProviderCredential>(type, patch);
}

export async function getById(id: string) {
  return db.getWhere<CloudProviderCredential>(type, { _id: id });
}

export function update(credential: CloudProviderCredential, patch: Partial<CloudProviderCredential>) {
  return db.docUpdate<CloudProviderCredential>(credential, patch);
}

export function remove(credential: CloudProviderCredential) {
  return db.remove(credential);
}

export function getByName(name: string, provider: CloudProviderName) {
  return db.find<CloudProviderCredential>(type, { name, provider });
}

export function all() {
  return db.all<CloudProviderCredential>(type);
}
