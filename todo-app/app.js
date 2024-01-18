const express = require("express");
const app = express();
const { Todo } = require("./models");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.get("/todos", async function (req, res) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Todo.findAll();
    res.json(todos);
  } catch (err) {
    console.log(err);
  }
});

app.get("/todos/:id", async function (req, res) {
  try {
    const todo = await Todo.findByPk(req.params.id);
    return res.json(todo);
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

app.post("/todos", async (req, res) => {
  console.log("Creating a todo", req.body);
  try {
    const todo = await Todo.addTodo({
      title: req.body.title,
      dueDate: req.body.dueDate,
      completed: false,
    });
    res.json(todo);
  } catch (err) {
    console.log(err);
    res.status(422).json(err);
  }
});

app.put("/todos/:id/markAsCompleted", async (req, res) => {
  console.log("Update todo of id:", req.params.id);
  const todo = await Todo.findByPk(req.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    res.json(updatedTodo);
  } catch (err) {
    console.log(err);
    res.status(422).json(err);
  }
});

app.delete("/todos/:id", async function (req, res) {
  console.log("We have to delete a Todo with ID: ", req.params.id);
  try {
    const todo = await Todo.findByPk(req.params.id);
    await todo.destroy();
    res.send(true);
  } catch (err) {
    console.log(err);
    res.status(422).send(false);
  }
});

module.exports = app;
