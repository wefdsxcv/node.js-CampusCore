
import { replyRepository } from "../../repositories/replyRepository.js";

export async function getRepliesUsecase(questionId) {
  const { data, error } = await replyRepository.findByQuestionId(questionId);
  if (error) throw error;

  // Flutter用に整形
  return data.map(reply => ({
    ...reply,
    user_name: reply.profile ? reply.profile.name : '名無し'
  }));
}