import { supabase } from "../infra/supabaseClient.js";

export const questionRepository = {
  // 全件取得
  async findAll() {
    return await supabase
      .from("questions")
      .select(`
        *,
        tags:question_tags(
          tag:tags(name)
        ),
        profile:user_profiles(name)
      `)
      .order("created_at", { ascending: false });
  },

  // タグ検索
  async findByTagName(tagName) {
    return await supabase
      .from("questions")
      .select(`
        *,
        question_tags!inner(
          tag:tags!inner(name)
        ),
        profile:user_profiles(name)
      `)
      .eq("question_tags.tag.name", tagName)
      .order("created_at", { ascending: false });
  },

  // 新規作成
  async create(text, userId) {
    return await supabase
      .from("questions")
      .insert([{ text, user_id: userId }])
      .select()
      .single();
  },

  // 削除
  async deleteByIdAndUser(questionId, userId) {
    return await supabase
      .from("questions")
      .delete()
      .eq("id", questionId)
      .eq("user_id", userId)
      .select();
  },

  // question_idを元に検索。　取得。
  async findById(id) {
    return await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single();
  }
};