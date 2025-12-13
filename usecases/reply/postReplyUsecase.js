import { replyRepository } from "../../repositories/replyRepository.js";
// 質問の投稿者を確認するために必要
import { questionRepository } from "../../repositories/questionRepository.js"; 

export async function postReplyUsecase(text, questionId, userId) {
  // 1. 質問情報を取得（通知先＝質問の投稿者 を特定するため）
  // ※ questionRepository.findById が必要です
  const { data: questionData, error: qError } = await questionRepository.findById(questionId);
  
  if (qError || !questionData) {
    throw new Error("質問が見つかりません");
  }

  // 2. Outbox用ペイロードの準備
  let outboxPayload = null;

  // 「自分の投稿への返信」ではない場合のみ通知データを作る
  if (questionData.user_id !== userId) {
    outboxPayload = {
      type: "reply",
      senderId: userId,               // 返信した人 (あなた)
      receiverId: questionData.user_id, // 通知を受け取る人 (質問者)
      questionId: questionId
    };
  }

  // 3. トランザクション実行 (RPC経由)
  // 返信の保存と、Outboxへの保存が同時に行われます
  const { data: replyData, error } = await replyRepository.createWithOutbox(
    text, 
    questionId, 
    userId, 
    outboxPayload
  );

  if (error) throw error;

  return replyData;
}