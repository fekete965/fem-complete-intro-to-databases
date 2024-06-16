const express = require("express");
const { createClient } = require("redis");

async function init() {
  const PORT = 3000;

  const app = express();

  const client = await createClient()
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

  function cache(key, ttl, slowFn) {
    return async function cachedFn(...props) {
      const cachedResponse = await client.get(key);

      if (cachedResponse) {
        console.log("Hooray it is cached");
        return cachedResponse;
      }

      const result = await slowFn(...props);
      await client.set(key, result, {
        EX: ttl,
        NX: true,
      });

      return result;
    };
  }

  async function verySlowAndExpensivePostgreSQLQuery() {
    // here you would to a big ugly query for postgreSQL
    console.log("Oh no, a very expensive query!");

    const promise = new Promise((resolve) => {
      setTimeout(() => {
        resolve(new Date().toUTCString());
      }, 5000);
    });

    return promise;
  }

  const cachedFn = cache(
    "expensive:call",
    10,
    verySlowAndExpensivePostgreSQLQuery
  );

  app.get("/pageview", async (req, res) => {
    const views = await client.incr("pageviews");

    res
      .json({
        status: 200,
        views,
      })
      .end();
  });

  app.get("/get", async (req, res) => {
    const data = await cachedFn();

    res
      .json({
        status: 200,
        data,
      })
      .end();
  });

  app.use(express.static("./static"));

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

init();
