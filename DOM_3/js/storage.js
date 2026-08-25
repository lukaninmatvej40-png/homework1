import { STORAGE_KEY } from "./constants.js";

export const getTodosFromLocalStorage = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const setTodosToLocalStorage = (todos) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
};
