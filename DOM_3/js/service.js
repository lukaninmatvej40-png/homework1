import { TODO_KEYS, errTodoNotFound } from "./constants.js";
import { setTodosToLocalStorage } from "./storage.js";

const getNewTodoId = (todos) =>
  todos.reduce((maxId, todo) => Math.max(maxId, todo[TODO_KEYS.id]), 0) + 1;

export const createTodo = (todos, text) => {
  const newTodo = {
    [TODO_KEYS.id]: getNewTodoId(todos),
    [TODO_KEYS.text]: text,
    [TODO_KEYS.is_completed]: false,
  };
  todos.push(newTodo);
  setTodosToLocalStorage(todos);
  return newTodo;
};

export const completeTodoById = (todos, todoId) => {
  const todo = todos.find((todo) => todo[TODO_KEYS.id] === todoId);

  if (!todo) {
    console.error(errTodoNotFound(todoId));
    return null;
  }
  todo[TODO_KEYS.is_completed] = !todo[TODO_KEYS.is_completed];
  setTodosToLocalStorage(todos);
  return todo;
};

export const deleteTodoById = (todos, todoId) => {
  const todoIndex = todos.findIndex((todo) => todo[TODO_KEYS.id] === todoId);
  if (todoIndex === -1) {
    console.error(errTodoNotFound(todoId));
    return todos;
  }
  todos.splice(todoIndex, 1);
  setTodosToLocalStorage(todos);
  return todos;
};
