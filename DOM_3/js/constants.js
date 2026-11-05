export const TODO_KEYS = {
  id: "id",
  text: "text",
  is_completed: "is_completed",
};

export const STORAGE_KEY = "todos";

export const errTodoNotFound = (todoId) => `Todo with id ${todoId} not found`;
