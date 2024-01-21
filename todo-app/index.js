(async () => {
  const app = require("./app");
  const { Todo } = require("./models");
  const allPriorTodos = await Todo.getTodos();
  if (allPriorTodos.length < 6) {
    allPriorTodos.forEach(async (todo) => {
      await todo.destroy();
    });
    await Todo.addTodo({ title: "Do DSA", dueDate: "2023-03-31" });
    await Todo.addTodo({ title: "Make projects", dueDate: "2023-03-31" });
    await Todo.addTodo({ title: "Complete L8 and L9", dueDate: "2024-01-21" });
    await Todo.addTodo({ title: "Brush teeth", dueDate: "2024-01-21" });
    await Todo.addTodo({ title: "Complete WD201", dueDate: "2024-03-31" });
    await Todo.addTodo({ title: "Get Internship", dueDate: "2024-03-31" });
  }
  app.listen(3000);
})();
