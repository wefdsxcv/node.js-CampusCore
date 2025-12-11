import { supabase } from "../infra/supabaseClient.js"; // Authチェック用
// UseCases
import { getAllQuestionsUsecase } from "../usecases/question/getAllQuestionsUsecase.js";
import { getQuestionsByTagUsecase } from "../usecases/question/getQuestionsByTagUsecase.js";
import { postQuestionUsecase } from "../usecases/question/postQuestionUsecase.js";
import { deleteQuestionUsecase } from "../usecases/question/deleteQuestionUsecase.js";
import { getRepliesUsecase } from "../usecases/reply/getRepliesUsecase.js";
import { postReplyUsecase } from "../usecases/reply/postReplyUsecase.js";
import { toggleLikeUsecase } from "../usecases/like/toggleLikeUsecase.js";

// ★ ヘルパー関数: トークンからユーザーを取得
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ---------------------------------------------------
// 1. 全件取得
// ---------------------------------------------------
export async function getAllQuestions(req, res) {
  try {
    // ログインユーザーIDの取得 (任意)
    const user = await getAuthenticatedUser(req);
    const userId = user ? user.id : null;

    const data = await getAllQuestionsUsecase(userId);
    res.status(200).json(data);
  } catch (err) {
    console.error("全件取得失敗:", err);
    res.status(500).json({ error: "質問一覧の取得に失敗しました" });
  }
}

// ---------------------------------------------------
// 2. タグ検索
// ---------------------------------------------------
export async function getQuestionsByTag(req, res) {
  try {
    const tag = req.params.tag;
    const data = await getQuestionsByTagUsecase(tag);
    res.status(200).json(data);
  } catch (err) {
    console.error("タグ検索失敗:", err);
    res.status(500).json({ error: "タグ検索に失敗しました" });
  }
}

// ---------------------------------------------------
// 3. 投稿処理
// ---------------------------------------------------
export async function postQuestion(req, res) {
  try {
    const { text, tags } = req.body;

    // Auth check
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "ログインしてください" });

    // バリデーション
    if (!text) return res.status(400).json({ error: "textが必要です" });

    const data = await postQuestionUsecase(text, tags, user.id);
    res.status(201).json(data);
  } catch (err) {
    console.error("投稿失敗:", err);
    res.status(500).json({ error: "質問投稿に失敗しました" });
  }
}

// ---------------------------------------------------
// 4. 返信一覧取得
// ---------------------------------------------------
export async function getReplies(req, res) {
  try {
    const questionId = req.params.id;
    const data = await getRepliesUsecase(questionId);
    res.status(200).json(data);
  } catch (err) {
    console.error("返信取得失敗:", err);
    res.status(500).json({ error: "返信の取得に失敗しました" });
  }
}

// ---------------------------------------------------
// 5. 返信投稿
// ---------------------------------------------------
export async function postReply(req, res) {
  try {
    const { text, question_id } = req.body;

    // Auth check
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "ログインしてください" });

    // バリデーション
    if (!text || !question_id) return res.status(400).json({ error: "データが不足しています" });

    const data = await postReplyUsecase(text, question_id, user.id);
    res.status(201).json(data);
  } catch (err) {
    console.error("返信投稿失敗:", err);
    res.status(500).json({ error: "返信の投稿に失敗しました" });
  }
}

// ---------------------------------------------------
// 6. 質問削除
// ---------------------------------------------------
export async function deletequestion(req, res) {
  try {
    const questionId = req.params.id;

    // Auth check
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "ログインしてください" });

    await deleteQuestionUsecase(questionId, user.id);
    res.status(200).json({ message: "削除しました" });

  } catch (err) {
    console.error("削除失敗:", err);
    if (err.message === "NOT_FOUND_OR_FORBIDDEN") {
      return res.status(403).json({ error: "削除権限がないか、すでに削除されています" });
    }
    res.status(500).json({ error: "削除に失敗しました" });
  }
}

// ---------------------------------------------------
// 7. イイネの切り替え
// ---------------------------------------------------
export async function toggleLike(req, res) {
  try {
    const questionId = parseInt(req.params.id);

    // Auth check
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "ログインしてください" });

    const data = await toggleLikeUsecase(user.id, questionId);
    res.status(200).json(data);
  } catch (err) {
    console.error("イイネ処理失敗:", err);
    res.status(500).json({ error: "処理に失敗しました" });
  }
}