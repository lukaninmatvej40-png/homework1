// Задание 1.
// Дан массив пользователей:
// const users = [
//   { name: 'Alex', age: 24, isAdmin: false },
//   { name: 'Bob', age: 13, isAdmin: false },
//   { name: 'John', age: 31, isAdmin: true },
//   { name: 'Jane', age: 20, isAdmin: false },
//]
// Добавьте в конец массива двух пользователей:
// { name: 'Ann', age: 19, isAdmin: false },
// { name: 'Jack', age: 43, isAdmin: true }
const users = [
  { name: "Alex", age: 24, isAdmin: false },
  { name: "Bob", age: 13, isAdmin: false },
  { name: "John", age: 31, isAdmin: true },
  { name: "Jane", age: 20, isAdmin: false },
];

users.push(
  { name: "Leonel", age: 67, isAdmin: false },
  { name: "Neymar", age: 57, isAdmin: true },
);

console.log(users);

// Задание 2.
// Используя массив пользователей users из предыдущего задания, напишите функцию getUserAverageAge(users), которая возвращает средний возраст пользователей.
function getUserAverageAge(users) {
  let totalAge = 0;

  for (let i = 0; i < users.length; i++) {
    totalAge += users[i].age;
  }

  return totalAge / users.length;
}

console.log("Средний возраст: " + getUserAverageAge(users));

// Задание 3.
// Используя массив пользователей users из предыдущего задания, напишите функцию getAllAdmins(users), которая возвращает массив всех администраторов.
function getAllAdmins(users) {
  let admins = [];

  for (let i = 0; i < users.length; i++) {
    if (users[i].isAdmin === true) {
      admins.push(users[i]);
    }
  }

  return admins;
}

console.log("Администраторы:", getAllAdmins(users));

// Задание 4.
// Напишите функцию first(arr, n), которая возвращает первые n элементов массива. Если n == 0, возвращается пустой массив [], если n == undefined, то возвращается массив с первым элементом.
function first(arr, n) {
  if (n === undefined) {
    return [arr[0]];
  }

  if (n === 0) {
    return [];
  }

  let result = [];
  for (let i = 0; i < n && i < arr.length; i++) {
    result.push(arr[i]);
  }
  return result;
}

console.log(first([1, 2, 3, 4, 5], 3));
console.log(first([1, 2, 3, 4, 5], 0));
console.log(first([1, 2, 3, 4, 5]));
