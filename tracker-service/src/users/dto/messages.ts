export interface UserCreatedMessage {
  uuid: string;
  name: string;
  role: string;
}

export interface UserUpdatedMessage {
  uuid: string;
  role: string;
}

export interface UserDeletedMessage {
  uuid: string;
}
