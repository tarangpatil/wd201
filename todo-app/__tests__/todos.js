const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;
function extractCSRFToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCSRFToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCSRFToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parseAbove = JSON.parse(groupedTodosResponse.text);
    console.log("Grouped Todos Response parsed:", parseAbove);
    const dueTodayCount = parseAbove.length;
    const latestTodo = parseAbove[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCSRFToken(res);
    const markCompleteRes = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({ _csrf: csrfToken, completed: true });

    const parseAboveResponse = JSON.parse(markCompleteRes.text);
    expect(parseAboveResponse.completed).toBe(true);
  });

  test("Fetches all todos in the database using /todos endpoint", async () => {
    const response = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const todos = JSON.parse(response.text);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(todos)).toBe(true);

    // Add a condition to check the length of the array
    if (todos.length > 0) {
      // Add additional assertions based on your application logic
      // For example, you might want to check the structure of each todo in the array
      expect(todos[0]).toHaveProperty("id");
      expect(todos[0]).toHaveProperty("title");
      // Add more assertions as needed
    } else {
      // Handle the case where there are no todos (adjust as per your application logic)
      console.warn("No todos found in the response.");
    }
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // Create a todo to be deleted
    const res = await agent.get("/");
    const csrfToken = extractCSRFToken(res);
    console.log(csrfToken);
    const createResponse = await agent
      .post("/todos")
      .send({
        title: "To be deleted",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      })
      .set("accept", "application/json");
    expect(createResponse.ok).toBe(true);
    const createResponseParsed = JSON.parse(createResponse.text);
    const deleteReq = await agent
      .delete(`/todos/${createResponseParsed.id}`)
      .send({ _csrf: csrfToken });
    expect(deleteReq.text).toBe("true");
  });
});
