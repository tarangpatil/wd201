/* eslint-disable no-undef */
let todoList = require("../todo");
const todos = todoList();

describe("Todolist Test", () => {
    beforeAll(() => {
        const formattedDate = (d) => {
            return d.toISOString().split("T")[0];
        };
        const todayDate = new Date();
        const today = formattedDate(todayDate);
        const yesterday = formattedDate(
            new Date(new Date().setDate(todayDate.getDate() - 1)),
        );
        const tomorrow = formattedDate(
            new Date(new Date().setDate(todayDate.getDate() + 1)),
        );

        todos.add({
            title: "Submit assignment",
            dueDate: yesterday,
            completed: false,
        });
        todos.add({ title: "Pay rent", dueDate: today, completed: true });
        todos.add({
            title: "Service Vehicle",
            dueDate: today,
            completed: false,
        });
        todos.add({ title: "File taxes", dueDate: tomorrow, completed: false });
        todos.add({
            title: "Pay electric bill",
            dueDate: tomorrow,
            completed: false,
        });
    });

    test("Create new todo item", () => {
        todos.add({
            title: "Test",
            completed: false,
            dueDate: new Date().toISOString().split("T")[0],
        });
        expect(todos.all.length).toBe(6);
    });

    test("Mark item as complete", () => {
        expect(todos.all[0].completed).toBe(false);
        todos.markAsComplete(0);
        expect(todos.all[0].completed).toBe(true);
        todos.markAsComplete(3);
        expect(todos.all[3].completed).toBe(true);
    });

    test("Test overdue", () => {
        expect(todos.overdue().length).toBe(1);
    });

    test("Test due today", () => {
        expect(todos.dueToday().length).toBe(3);
    });

    test("Test due later", () => {
        expect(todos.dueLater().length).toBe(2);
    });
});
