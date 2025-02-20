import type { AWSGetSecretConfig } from '../../../main/ipc/cloud-service-integration/aws-service';
import type { CloudServiceSecretOption } from '../../../main/ipc/cloud-service-integration/cloud-service';
import type { GCPGetSecretConfig } from '../../../main/ipc/cloud-service-integration/gcp-servcie';
import type { GCPSecretConfig } from '../../../main/ipc/cloud-service-integration/types';
import type { AWSSecretConfig, ExternalVaultConfig } from '../../../main/ipc/cloud-service-integration/types';
import type { CloudProviderCredential, CloudProviderName } from '../../../models/cloud-credential';

export const getExternalVault = async (provider: CloudProviderName, providerCredential: CloudProviderCredential, secretConfig: ExternalVaultConfig) => {
  switch (provider) {
    case 'aws':
      return getAWSSecret(secretConfig as AWSSecretConfig, providerCredential);
    case 'gcp':
      return getGCPSecret(secretConfig as GCPSecretConfig, providerCredential);
    default:
      return '';
  }
};

export const getAWSSecret = async (secretConfig: AWSSecretConfig, providerCredential: CloudProviderCredential) => {
  const {
    SecretId, VersionId, VersionStage, SecretKey,
    SecretType = 'plaintext',
  } = secretConfig;
  if (!SecretId) {
    throw new Error('Get secret from AWS failed: Secret Name or ARN is required');
  }
  const getSecretOption: CloudServiceSecretOption<AWSGetSecretConfig> = {
    provider: 'aws',
    secretId: SecretId,
    config: {
      VersionId, VersionStage,
    },
    credentials: providerCredential.credentials,
  };
  const secretResult = await window.main.cloudService.getSecret(getSecretOption);
  const { success, error, result } = secretResult;
  if (success && result) {
    const { SecretString } = result!;
    let parsedJSON;
    if (SecretType === 'plaintext' || !SecretKey) {
      return SecretString;
    } else {
      try {
        parsedJSON = JSON.parse(SecretString || '{}');
      } catch (error) {
        throw new Error(`Get secret from AWS failed: Secret value ${SecretString} can not parsed to key/value pair, please change Secret Type to plaintext`);
      }
      if (SecretKey in parsedJSON) {
        return parsedJSON[SecretKey];
      }
      throw new Error(`Get secret from AWS failed: Secret key ${SecretKey} does not exist in key/value secret ${SecretString}`);
    }
  } else {
    throw new Error(`Get secret from AWS failed: ${error?.errorMessage}`);
  }
};

export const getGCPSecret = async (secretConfig: GCPSecretConfig, providerCredential: CloudProviderCredential) => {
  const { secretName, version } = secretConfig;
  if (!secretName) {
    throw new Error('Get secret from GCP failed: Secret Name is required');
  }
  const getSecretOption: CloudServiceSecretOption<GCPGetSecretConfig> = {
    provider: 'gcp',
    secretId: secretName,
    credentials: providerCredential.credentials,
    config: { version },
  };
  const secretResult = await window.main.cloudService.getSecret(getSecretOption);
  const { success, error, result } = secretResult;
  if (success && result) {
    return result.value;
  } else {
    throw new Error(`Get secret from GCP failed: ${error?.errorMessage}`);
  }
};
