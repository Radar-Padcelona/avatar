export interface AvatarState {
  avatarId: string;
  voiceId: string;
}

export interface AvatarConfig {
  name: string;
  avatarId: string;
  voiceId: string;
  description: string;
}

export interface ServerResponse {
  token?: string;
  error?: string;
  status?: string;
  timestamp?: string;
}
