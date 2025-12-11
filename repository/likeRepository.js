import { supabase } from "../infra/supabaseClient.js";

export const likeRepository = {
  // 自分がいいねした質問ID一覧を取得
  async findLikedQuestionIdsByUserId(userId) {
    const { data } = await supabase
      .from("likes")
      .select("question_id")
      .eq("user_id", userId);
      
    if (data) {
      return data.map(like => like.question_id);
    }
    return [];
  },

  // いいね切り替え (RPC呼び出し)
  async toggleLike(userId, questionId) {
    return await supabase.rpc('toggle_like', {
      _user_id: userId,
      _question_id: questionId
    });
  }
};