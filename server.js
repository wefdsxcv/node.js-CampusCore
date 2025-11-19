// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import questionsRoutes from "./routes/questions.js"; //ここでルート定義まとめてある。

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 質問関連API
app.use("/questions", questionsRoutes);

// process.env.PORT がRenderから渡されるポート番号です
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ サーバー起動中：http://localhost:${PORT}`);
});
