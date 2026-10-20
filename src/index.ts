import app from "./app.js";
import { config } from "./config.js";
import { testConnection } from "./db/index.js";

const port = Number(config.api.port ?? 8080);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  void testConnection();
});
