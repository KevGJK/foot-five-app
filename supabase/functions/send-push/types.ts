export interface PushDevice {

  profile_id: string;

  token: string;

  platform: string;

}

export interface PushNotification {

  id: string;

  title: string;

  message: string;

  type: string;

  action: string | null;

  action_id: string | null;

}