const csurf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const { Todo, User } = require("./models");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const path = require("path");

app.use(express.static(__dirname + "/public"));
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser("it's a secret"));
app.use(flash());
app.use(
  session({
    secret: "my-super-secret-key-too-asoiw",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(csurf("123456789iamasecret987654321look"));
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      password: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) return done(null, user);
          else done(null, false, { message: "Invalid password" });
        })
        .catch((err) => err);
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serialize user in session:", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.get("/", async function (req, res) {
  if (req.isAuthenticated()) {
    return res.redirect("/todos");
  }
  res.render("index", { csrfToken: req.csrfToken() });
});

app.get("/signup", (req, res) => {
  res.render("signup", { csrfToken: req.csrfToken() });
});

app.post("/users", async (req, res) => {
  if (req.body.firstName.length === 0 || req.body.email.length === 0) {
    req.flash("error", "First name, email and password required");
    return res.redirect("/signup");
  }
  const hashPwd = await bcrypt.hash(req.body.password, saltRounds);
  try {
    console.log("Creating user: ", req.body);
    let user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashPwd, // Assuming you validate the password elsewhere
    });
    console.log("User created:", user.dataValues);
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err) => err.message);
      req.flash("error", validationErrors);
      res.redirect("/signup");
    } else {
      // Handle other errors
      req.flash("error", "An error occurred during user creation.");
      res.redirect("/signup");
    }
  }
});

app.get("/login", (req, res) => {
  res.render("login", { csrfToken: req.csrfToken() });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/todos");
  }
);

app.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, res) {
    const overdue = await Todo.overdue(req.user.dataValues.id);
    const dueToday = await Todo.dueToday(req.user.dataValues.id);
    const dueLater = await Todo.dueLater(req.user.dataValues.id);
    const completedItems = await Todo.completedItems(req.user.dataValues.id);
    if (req.accepts("html")) {
      res.render("todos", {
        overdue,
        dueToday,
        dueLater,
        completedItems,
        csrfToken: req.csrfToken(),
      });
    } else {
      res.json({ overdue, dueToday, dueLater, completedItems });
    }
  }
);

app.get("/todos/:id", async function (req, res) {
  try {
    const todo = await Todo.findByPk(req.params.id);
    return res.json();
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  console.log("Creating a todo", req.body);
  try {
    const todo = await Todo.addTodo({
      title: req.body.title,
      dueDate: req.body.dueDate,
      userId: req.user.id,
    });
    if (req.accepts("html")) res.redirect("/todos");
    else res.json(todo);
  } catch (err) {
    console.log(err);
    res.status(422).json(err);
  }
});

app.put("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  console.log("Update todo of id:", req.params.id);
  const todo = await Todo.findByPk(req.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(req.body.completed);
    res.json(updatedTodo);
  } catch (err) {
    console.log(err);
    res.status(422).json(err);
  }
});

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, res) {
    console.log("We have to delete a Todo with ID: ", req.params.id);
    try {
      const deletedTodo = await Todo.removeItem(
        req.params.id,
        req.user.dataValues.id
      );
      res.send(true);
    } catch (err) {
      console.log(err);
      res.status(422).send(false);
    }
  }
);

module.exports = app;
