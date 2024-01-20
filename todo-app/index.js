(async () => {
    const app = require("./app");
    const { Todo } = require("./models");
    if ((await Todo.getTodos()).length === 0) {
        await Todo.addTodo({ title: "Do DSA", dueDate: "2023-03-31" });
        await Todo.addTodo({ title: "Make projects", dueDate: "2023-03-31" });
    }
    app.listen(3000);
})();
