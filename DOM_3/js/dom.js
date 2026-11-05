import { TODO_KEYS } from "./constants.js";

export const form = document.querySelector(".form");
export const input = document.querySelector(".input");
export const todosContainer = document.querySelector(".todos");

export const createTodoElement = (text, todoId, isCompleted = false) => {
  const li = document.createElement("li");
  li.className = "todo";
  li.dataset.id = todoId;

  if (isCompleted) {
    li.classList.add("completed");
  }

  const textDiv = document.createElement("div");
  textDiv.className = "todo-text";
  textDiv.textContent = text;

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "todo-actions";

  const completeBtn = document.createElement("button");
  completeBtn.className = "button-complete button";
  completeBtn.innerHTML = "&#10004;";
  completeBtn.type = "button";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "button-delete button";
  deleteBtn.innerHTML = "&#10006;";
  deleteBtn.type = "button";

  actionsDiv.append(completeBtn, deleteBtn);
  li.append(textDiv, actionsDiv);

  return li;
};

export const renderTodos = (todos, todosContainer, createTodoElement) => {
  todosContainer.innerHTML = "";

  todos.forEach((todo) => {
    const todoElement = createTodoElement(
      todo[TODO_KEYS.text],
      todo[TODO_KEYS.id],
      todo[TODO_KEYS.is_completed],
    );
    todosContainer.append(todoElement);
  });
};
