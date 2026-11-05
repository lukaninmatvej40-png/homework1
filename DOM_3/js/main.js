"use strict";

import { TODO_KEYS } from "./constants.js";
import { getTodosFromLocalStorage } from "./storage.js";
import { createTodo, completeTodoById, deleteTodoById } from "./service.js";
import {
  form,
  input,
  todosContainer,
  createTodoElement,
  renderTodos,
} from "./dom.js";

let todos = [];

const handleCreateTodo = (todos, text) => {
  if (!text || text.trim() === "") {
    alert("Введите текст задачи!");
    return null;
  }

  const newTodo = createTodo(todos, text.trim());
  const todoId = newTodo[TODO_KEYS.id];

  const todoElement = createTodoElement(
    newTodo[TODO_KEYS.text],
    todoId,
    newTodo[TODO_KEYS.is_completed],
  );

  todosContainer.append(todoElement);
  input.value = "";

  return newTodo;
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value;
  handleCreateTodo(todos, text);
});

todosContainer.addEventListener("click", (event) => {
  const todoElement = event.target.closest(".todo");

  if (!todoElement) {
    return;
  }

  const todoId = Number(todoElement.dataset.id);

  if (event.target.matches(".button-complete")) {
    const updatedTodo = completeTodoById(todos, todoId);
    if (updatedTodo) {
      todoElement.classList.toggle("completed");
      console.log(`Задача ${todoId} выполнена`);
    }
  }

  if (event.target.matches(".button-delete")) {
    deleteTodoById(todos, todoId);
    todoElement.remove();
    console.log(`Задача ${todoId} удалена`);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const savedTodos = getTodosFromLocalStorage();
  todos = savedTodos;
  renderTodos(todos, todosContainer, createTodoElement);
  console.log(`Загружено ${todos.length} задач из LocalStorage`);
});

console.log("Todo приложение запущено");
console.log("Разделено на модули!");
