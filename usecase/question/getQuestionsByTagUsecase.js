import { questionRepository } from "../../repositories/questionRepository.js";

export async function getQuestionsByTagUsecase(tag) {
  // 多対多のリレーションを使った検索
  const { data, error } = await questionRepository.findByTagName(tag);
  if (error) throw error;

  // 整形処理
  return data.map(post => ({
    ...post,
    tags: post.question_tags ? post.question_tags.map(t => t.tag.name) : [],
    user_name: post.profile ? post.profile.name : '名無し'
  }));
}