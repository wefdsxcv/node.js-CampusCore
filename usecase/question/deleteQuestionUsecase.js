import { questionRepository } from "../../repositories/questionRepository.js";

export async function deleteQuestionUsecase(questionId, userId) {
  // ③ 削除実行
  const { data, error } = await questionRepository.deleteByIdAndUser(questionId, userId);
  if (error) throw error;

  // ④ 結果確認
  if (!data || data.length === 0) {
    throw new Error("NOT_FOUND_OR_FORBIDDEN"); // コントローラーで識別するためのエラー
  }

  return { message: "削除しました" };
}