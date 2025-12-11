import { questionRepository } from "../../repositories/questionRepository.js";
import { likeRepository } from "../../repositories/likeRepository.js";

export async function getAllQuestionsUsecase(userId) {
  // A. まず質問データ一覧を取得
  const { data: questions, error } = await questionRepository.findAll();
  if (error) throw error;

  // B. 「自分がイイネした質問ID」のリストを作る
  let myLikedQuestionIds = [];
  if (userId) {
    myLikedQuestionIds = await likeRepository.findLikedQuestionIdsByUserId(userId);
  }

  // C. データ整形
  return questions.map(post => ({
    ...post,
    tags: post.tags ? post.tags.map(t => t.tag.name) : [],
    user_name: post.profile ? post.profile.name : '名無し',
    like_count: post.like_count ?? 0, 
    is_liked: myLikedQuestionIds.includes(post.id)
  }));
}