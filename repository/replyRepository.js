import { supabase } from "../infra/supabaseClient.js";

export const replyRepository = {
  // 質問IDに紐づく返信を取得
  async findByQuestionId(questionId) {
    return await supabase
      .from("replies")
      .select(`
        *,
        profile:user_profiles(name)
      `)
      .eq("question_id", questionId)
      .order("created_at", { ascending: true });
  },

  // 返信作成
  async create(text, questionId, userId) {
    return await supabase
      .from("replies")
      .insert([{ 
        text, 
        question_id: questionId, 
        user_id: userId 
      }])
      .select()
      .single();
  }
};