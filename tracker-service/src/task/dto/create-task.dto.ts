export class CreateTaskDto {
  title: string;
  description: string;
}

export class CreateAssignedTaskDto extends CreateTaskDto {
  assignee: string;
  status: string;
}
