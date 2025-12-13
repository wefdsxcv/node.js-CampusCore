import { likeRepository } from "../../repositories/likeRepository.js";

export async function toggleLikeUsecase(userId, questionId) {
  // ③ RPC呼び出し
  const { data, error } = await likeRepository.toggleLike(userId, questionId);
  if (error) throw error;

  // ★ TODO: ここに通知キューへのJob追加処理を書く (Step 3で実装予定)
  // RPC側での通知作成をやめ、ここでQueueに入れる設計に変更予定

  return data;
}