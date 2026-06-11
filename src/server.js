import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { app } from "./app.js";

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API listening on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
