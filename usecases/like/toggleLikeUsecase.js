import { likeRepository } from "../../repositories/likeRepository.js";

export async function toggleLikeUsecase(userId, questionId) {
  // ③ RPC呼び出し
  const { data, error } = await likeRepository.toggleLike(userId, questionId);
  if (error) throw error;

  // 👇 ここがキュー投入 Queue.add()でjob追加."sendLikeNotification"はjob名
  await notificationQueue.add("sendLikeNotification", {
    //jobのデータ worker側で job.data.userId で受け取れる。
    userId,
    questionId,
  });

  return data;
}