import { database as db } from '../common/database';
import type { BaseModel } from './index';

export type CloudProviderName = 'aws' | 'azure' | 'gcp';
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
interface IBaseCloudCredential {
  name: string;
  provider: CloudProviderName;
}
export interface AWSCloudCredential extends IBaseCloudCredential {
  name: string;
  provider: 'aws';
  credentials: AWSTemporaryCredential;
}
export type BaseCloudCredential = AWSCloudCredential;
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
