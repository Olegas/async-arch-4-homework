export interface TaskCreatedMessage {
  uuid: string;
  title: string;
  description: string;
}

export interface TaskAssignedMessage {
  uuid: string;
  assignee: string;
}

export interface TaskCompletedMessage {
  uuid: string;
  assignee: string;
}
