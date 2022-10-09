export interface Message {
  message: string;
  data: Record<string, any>;
}

export interface UserCreatedMessage extends Message {
  message: 'user-created';
  data: {
    uuid: string;
    name: string;
    role: string;
  };
}

export interface UserUpdatedMessage extends Message {
  message: 'user-updated';
  data: {
    uuid: string;
    role: string;
  };
}

export interface UserDeletedMessage extends Message {
  message: 'user-deleted';
  data: {
    uuid: string;
  };
}

export type UserStreamMessages =
  | UserCreatedMessage
  | UserDeletedMessage
  | UserUpdatedMessage;
