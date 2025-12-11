import { supabase } from "../infra/supabaseClient.js";

export const tagRepository = {
  // タグ名で検索
  async findByName(tagName) {
    return await supabase
      .from("tags")
      .select("id")
      .eq("name", tagName)
      .single();
  },

  // タグ新規作成
  async create(tagName) {
    return await supabase
      .from("tags")
      .insert([{ name: tagName }])
      .select()
      .single();
  },

  // 中間テーブルへの紐付け
  async linkToQuestion(questionId, tagId) {
    return await supabase
      .from("question_tags")
      .insert([{ question_id: questionId, tag_id: tagId }]);
  }
};