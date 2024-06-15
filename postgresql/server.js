const express = require("express");
const { Pool } = require("pg");

const PORT = 3000;

const pool = new Pool({
  connectionString:
    "postgresql://postgres:mysecretpassword@localhost:5432/message_boards",
});

async function init() {
  const app = express();

  app.get("/get", async (req, res) => {
    const client = await pool.connect();

    const [commentsRes, boardRes] = await Promise.all([
      client.query(
        "SELECT * FROM comments NATURAL LEFT JOIN rich_content WHERE board_id = $1",
        [req.query.search]
      ),
      client.query("SELECT * FROM boards WHERE board_id = $1", [
        req.query.search,
      ]),
    ]);

    res.json({
      status: 200,
      board: boardRes.rows[0] || {},
      posts: commentsRes.rows,
    });
  });

  app.use(express.static("./static"));

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

init();
