// Задача 1.
// Создайте объект person с несколькими свойствами, содержащими информацию о вас. Затем выведите значения этих свойств в консоль.
// 1. Создаем объект person
let person = {
  firstName: "Леонеля",
  lastName: "Пепси",
  age: 67,
  city: "Дубай",
  profession: "Разработчик",
  hobby: "Футбол",
};

console.log(person.firstName);
console.log(person.lastName);
console.log(person.age);
console.log(person.city);
console.log(person.profession);
console.log(person.hobby);

// Задача 2.
// Создайте функцию isEmpty, которая проверяет является ли переданный объект пустым. Если объект пуст - верните true, в противном случае false.
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

console.log(isEmpty({}));
console.log(isEmpty({ name: "Месси" }));
console.log(isEmpty({ age: 67 }));

// Задача 3.
// Создайте объект task с несколькими свойствами: title, description, isCompleted.
// Напишите функцию cloneAndModify(object, modifications), которая с помощью оператора spread создает копию объекта и применяет изменения из объекта modifications.
// Затем с помощью цикла for in выведите все свойства полученного объекта.
let task = {
  title: "Купить продукты",
  description: "Месси, Суарез, Неймар",
  isCompleted: false,
};

function cloneAndModify(object, modifications) {
  return { ...object, ...modifications };
}

let modifiedTask = cloneAndModify(task, {
  isCompleted: true,
  priority: "CR7",
});

console.log("Исходный объект");
for (let key in task) {
  console.log(key + ": " + task[key]);
}

console.log("\nИзмененный объект");
for (let key in modifiedTask) {
  console.log(key + ": " + modifiedTask[key]);
}

// Задача 4.
// Создайте функцию callAllMethods, которая принимает объект и вызывает все его методы.

// Пример использования:
// const myObject = {
//     method1() {
//         console.log('Метод 1 вызван');
//     },
//     method2() {
//         console.log('Метод 2 вызван');
//     },
//     property: 'Это не метод'
// };
// callAllMethods(myObject);
function callAllMethods(obj) {
  for (let key in obj) {
    if (typeof obj[key] === "function") {
      obj[key]();
    }
  }
}

const myObject = {
  method1() {
    console.log("Метод 1 вызван");
  },
  method2() {
    console.log("Метод 2 вызван");
  },
  property: "Это не метод",
};

callAllMethods(myObject);
