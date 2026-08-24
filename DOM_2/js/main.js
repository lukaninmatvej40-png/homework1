"use strict";

const todoKeys = {
  id: "id",
  text: "text",
  is_completed: "is_completed",
};

const todos = [];

const errTodoNotFound = (todoId) => `Todo with id ${todoId} not found`;

const getNewTodoId = (todos) =>
  todos.reduce((maxId, todo) => Math.max(maxId, todo[todoKeys.id]), 0) + 1;

const createTodo = (todos, text) => {
  const newTodo = {
    [todoKeys.id]: getNewTodoId(todos),
    [todoKeys.text]: text,
    [todoKeys.is_completed]: false,
  };
  todos.push(newTodo);
  return newTodo;
};

const completeTodoById = (todos, todoId) => {
  const todo = todos.find((todo) => todo[todoKeys.id] === todoId);

  if (!todo) {
    console.error(errTodoNotFound(todoId));
    return null;
  }
  todo[todoKeys.is_completed] = !todo[todoKeys.is_completed];
  return todo;
};

const deleteTodoById = (todos, todoId) => {
  const todoIndex = todos.findIndex((todo) => todo[todoKeys.id] === todoId);
  if (todoIndex === -1) {
    console.error(errTodoNotFound(todoId));
    return todos;
  }
  todos.splice(todoIndex, 1);
  return todos;
};

const form = document.querySelector(".form");
const input = document.querySelector(".input");
const todosContainer = document.querySelector(".todos");

const createTodoElement = (text, todoId) => {
  const li = document.createElement("li");
  li.className = "todo";
  li.dataset.id = todoId;

  const textDiv = document.createElement("div");
  textDiv.className = "todo-text";
  textDiv.textContent = text;

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "todo-actions";

  const completeBtn = document.createElement("button");
  completeBtn.className = "button-complete button";
  completeBtn.innerHTML = "&#10004;"; // ✓
  completeBtn.type = "button";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "button-delete button";
  deleteBtn.innerHTML = "&#10006;"; // ✗
  deleteBtn.type = "button";

  actionsDiv.append(completeBtn, deleteBtn);
  li.append(textDiv, actionsDiv);

  return li;
};

const handleCreateTodo = (todos, text) => {
  if (!text || text.trim() === "") {
    alert("Введите текст задачи!");
    return null;
  }

  const newTodo = createTodo(todos, text.trim());
  const todoId = newTodo[todoKeys.id];
  const todoElement = createTodoElement(newTodo[todoKeys.text], todoId);

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

console.log("Todo приложение запущено");
console.log("Кликни на галочку или крестик у задачи");
