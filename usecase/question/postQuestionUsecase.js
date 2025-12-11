import { questionRepository } from "../../repositories/questionRepository.js";
import { tagRepository } from "../../repositories/tagRepository.js";

export async function postQuestionUsecase(text, tags, userId) {
  // ③ 質問を保存
  const { data: questionData, error: questionError } = await questionRepository.create(text, userId);
  if (questionError) throw questionError;

  const questionId = questionData.id;

  // ④ タグ保存処理 (ループ処理等はここに残す)
  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      let tagId;
      // A. すでにタグがあるか検索
      const { data: existingTag } = await tagRepository.findByName(tagName);

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // B. なければ新規作成
        const { data: newTag, error: tagError } = await tagRepository.create(tagName);
        if (tagError) {
          console.error(`タグ作成エラー: ${tagName}`, tagError);
          continue; 
        }
        tagId = newTag.id;
      }

      // C. 中間テーブルに紐付け
      await tagRepository.linkToQuestion(questionId, tagId);
    }
  }

  return { ...questionData, tags };
}