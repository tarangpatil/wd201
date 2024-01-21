const csurf = require("csurf");
const cookieParser = require("cookie-parser")
const express = require("express");
const app = express();
const { Todo } = require("./models");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(cookieParser("it's a secret"));
app.use(csurf({ cookie: true }));

app.get("/", async function (req, res) {
  const allTodos = await Todo.getTodos();
  if (req.accepts("html")) {
    const todaysDate = new Date().toISOString().split("T")[0];
    res.render("index", {
      overdue: allTodos.filter((todo) => todo.dueDate < todaysDate),
      dueToday: allTodos.filter((todo) => todo.dueDate === todaysDate),
      dueLater: allTodos.filter((todo) => todo.dueDate > todaysDate),
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json(allTodos);
  }
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
    res.redirect("/");
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
