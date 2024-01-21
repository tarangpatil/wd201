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
    console.log('Grouped Todos Response parsed:',parseAbove);
    const dueTodayCount = parseAbove.length;
    const latestTodo = parseAbove[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCSRFToken(res);
    const markCompleteRes = await agent
      .put(`/todos/${latestTodo.id}/markAsCompleted`)
      .send({ _csrf: csrfToken });

    const parseAboveResponse = JSON.parse(markCompleteRes.text);
    expect(parseAboveResponse.completed).toBe(true);
  });

  // test("Fetches all todos in the database using /todos endpoint", async () => {
  //   await agent.post("/todos").send({
  //     title: "Buy xbox",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   await agent.post("/todos").send({
  //     title: "Buy ps3",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   const response = await agent.get("/todos");
  //   const parsedResponse = JSON.parse(response.text);

  //   expect(parsedResponse.length).toBe(4);
  //   expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  // });

  // test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
  //   // FILL IN YOUR CODE HERE
  //   // const res = await agent.delete("/todos/1");
  //   // expect(res.status).toBe(200);
  //   // const parsedResponse = await JSON.parse(res.text);
  //   // expect(parsedResponse).toBe(true);
  //   // const res2 = await agent.delete("/todos/2");
  //   // expect(res.status).toBe(200);
  //   // const parseRes2 = await JSON.parse(res2.text);
  //   // expect(parseRes2).toBe(true);
  //   // const getRes = await agent.get("/todos");
  //   // const getData = await JSON.parse(getRes.text);
  //   const response1 = await agent.get("/todos");
  //   const parsedResponse1 = JSON.parse(response1.text);
  //   expect(parsedResponse1.length).toBe(4);
  //   const response2 = await agent.post("/todos").send({
  //     title: "Buy milk",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   const parsedResponse2 = JSON.parse(response2.text);
  //   const todoID = parsedResponse2.id;
  //   const response4 = await agent.get("/todos");
  //   const parsedResponse4 = JSON.parse(response4.text);
  //   expect(parsedResponse4.length).toBe(5);
  //   await agent.delete(`/todos/${todoID}`).send();
  //   const response3 = await agent.get("/todos");
  //   const parsedResponse3 = JSON.parse(response3.text);
  //   expect(parsedResponse3.length).toBe(4);
  // });
});
