import React from 'react';

import type { GCPSecretConfig } from '../../../../main/ipc/cloud-service-integration/types';
import type { NunjucksParsedTag } from '../../../../templating/utils';
import { HelpTooltip } from '../../help-tooltip';

export interface GCPSecretManagerFormProps {
  formData: GCPSecretConfig;
  onChange: (newConfig: GCPSecretConfig) => void;
  activeTagData: NunjucksParsedTag;
}

export const GCPSecretManagerForm = (props: GCPSecretManagerFormProps) => {
  const { formData, onChange } = props;
  const {
    secretName,
    version = 'latest',
  } = formData;
  const handleOnChange = (name: keyof GCPSecretConfig, newValue: string) => {
    const newConfig = {
      ...formData,
      [name]: newValue,
    };
    onChange(newConfig as unknown as GCPSecretConfig);

  };
  return (
    <form id='gcp-secret-manager-form'>
      <div className="form-row">
        <div className="form-control">
          <label>
            Secret Name
            <input
              name='secretName'
              defaultValue={secretName}
              onChange={e => handleOnChange('secretName', e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="form-row">
        <div className="form-control">
          <label>
            Version
            <HelpTooltip className="space-left">
              Optional version of the secret to retrieve, by default as latest.
            </HelpTooltip>
            <input
              name='version'
              defaultValue={version}
              onChange={e => handleOnChange('version', e.target.value)}
            />
          </label>
        </div>
      </div>
    </form>
  );
};
