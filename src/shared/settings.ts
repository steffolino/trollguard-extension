export type RemoteProvider = 'none' | 'perspective';

export interface TrollGuardSettings {
  remoteProvider: RemoteProvider;
  remoteApiKey: string;
}

const DEFAULTS: TrollGuardSettings = {
  remoteProvider: 'none',
  remoteApiKey: '',
};

export async function getSettings(): Promise<TrollGuardSettings> {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return {
    remoteProvider: (stored['remoteProvider'] as RemoteProvider) ?? 'none',
    remoteApiKey: (stored['remoteApiKey'] as string) ?? '',
  };
}

export async function saveSettings(patch: Partial<TrollGuardSettings>): Promise<void> {
  await chrome.storage.sync.set(patch);
}
