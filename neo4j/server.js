const express = require("express");
const neo4j = require("neo4j-driver");

const PORT = 3000;

const connectionString = "bolt://localhost:7687";

const driver = neo4j.driver(connectionString);

async function init() {
  const app = express();

  app.get("/get", async (req, res) => {
    const session = driver.session();
    const result = await session.run(
      `
      MATCH path = shortestPath(
        (First:Person { name: $person1 })-[*]-(Second:Person { name: $person2 })
      )
      UNWIND nodes(path) as node
      RETURN coalesce(node.name, node.title) as text;
    `,
      {
        person1: req.body.person1,
        person2: req.body.person2,
      }
    );

    res
      .json({
        status: 200,
        path: result.records.map((rec) => record.get("text")),
      })
      .end();

    await session.close();
  });

  app.use(express.static("./static"));

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

init();
