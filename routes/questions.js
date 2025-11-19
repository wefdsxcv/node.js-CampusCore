// routes/questions.js
import express from "express";
//まとめてimportしてる
import {
  getAllQuestions,
  getQuestionsByTag,
  postQuestion,
  getReplies,   // 追加
  postReply,    // 追加
} from "../controllers/questionsController.js";

//express.Router() で Routerオブジェクト
const router = express.Router();

// /questions 全件取得
router.get("/", getAllQuestions);

// /questions/tag/:tag タグ検索
router.get("/tag/:tag", getQuestionsByTag);

// /questions 投稿
router.post("/", postQuestion);

// GET /questions/:id/replies  (ある質問に対する返信一覧)
router.get("/:id/replies", getReplies);

// POST /questions/replies (返信を投稿)
router.post("/replies", postReply);


//route定義をまとめたものをrouterとしてexportしておく（このファイルは router をデフォルトエクスポート している。デフォルトエクスポートの場合、インポート側で好きな名前をつけられる）
export default router;
