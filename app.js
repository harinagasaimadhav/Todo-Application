const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let db = null;

//initialize database and server
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at: http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: '${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

// checking query has status
const checkStatusProperty = (queryRequest) => {
  return queryRequest.status !== undefined;
};

// checking query has priority
const checkPriorityProperty = (queryRequest) => {
  return queryRequest.priority !== undefined;
};

// checking query has priority and status properties
const checkPriorityAndStatusProperties = (queryRequest) => {
  return (
    queryRequest.priority !== undefined && queryRequest.status !== undefined
  );
};

// checking query has search value
const checkSearchProperty = (queryRequest) => {
  return queryRequest.search_q !== "";
};

// API's
// get list of all todo's based on query
app.get(`/todos/`, async (req, res) => {
  const { status, priority, search_q = "" } = req.query;
  let getTodoListQuery = "";

  switch (true) {
    case checkStatusProperty(req.query):
      getTodoListQuery = `
            SELECT *
            FROM todo
            WHERE status = '${status}' 
            AND todo LIKE '%${search_q}%';`;
      break;
    case checkPriorityProperty(req.query):
      getTodoListQuery = `
            SELECT *
            FROM todo
            WHERE priority = '${priority}'
            AND todo LIKE '%${search_q}%';`;
      break;
    case checkPriorityAndStatusProperties(req.query):
      getTodoListQuery = `
            SELECT *
            FROM todo
            WHERE status = '${status}'
            AND todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case checkSearchProperty(req.query):
      getTodoListQuery = ` 
            SELECT *
            FROM todo
            WHERE todo LIKE '%${search_q}%';`;
  }

  const todoList = await db.all(getTodoListQuery);
  res.send(todoList);
});

// get a todo with todo id
app.get(`/todos/:todoId/`, async (req, res) => {
  const { todoId } = req.params;
  const getTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  res.send(todo);
});

// app todo to database
app.post(`/todos/`, async (req, res) => {
  const { id, todo, priority, status } = req.body;
  const addTodoQuery = `
        INSERT INTO todo (id, todo, priority, status)
        VALUES ( ${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(addTodoQuery);
  res.send("Todo Successfully Added");
});

// update todo
app.put(`/todos/:todoId/`, async (req, res) => {
  const { todoId } = req.params;
  let updateColumn = "";
  const requestBody = req.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
  }

  const getPreviousTodo = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const previousTodo = await db.get(getPreviousTodo);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
  } = req.body;

  const updateTodoQuery = `
    UPDATE todo
    SET 
        status = '${status}',
        priority = '${priority}',
        todo = '${todo}'
    WHERE id = ${todoId};`;

  await db.run(updateTodoQuery);
  res.send(`${updateColumn} Updated`);
});

// delete a todo from db
app.delete(`/todos/:todoId/`, async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoQuery = `
        DELETE FROM todo
        WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  res.send("Todo Deleted");
});

module.exports = app;
