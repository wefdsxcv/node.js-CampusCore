import { replyRepository } from "../../repositories/replyRepository.js";

export async function postReplyUsecase(text, questionId, userId) {
  // ③ 返信を保存
  const { data, error } = await replyRepository.create(text, questionId, userId);
  if (error) throw error;

  // ★ TODO: ここに通知キューへのJob追加処理を書く (Step 2で実装予定)
  // await notificationQueue.add('reply', { senderId: userId, questionId, ... });

  return data;
}