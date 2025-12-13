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

  // 返信作成     不要
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
  },
  // ★ [追加] トランザクション付き作成 (返信 + Outbox)
  // DBの create_reply_with_outbox 関数を呼び出します
  async createWithOutbox(text, questionId, userId, outboxPayload) {
    const { data, error } = await supabase.rpc('create_reply_with_outbox', {
      _text: text,
      _question_id: questionId,
      _user_id: userId,
      _outbox_payload: outboxPayload // 通知不要なら null を渡す
    });

    if (error) throw error;
    return { data, error: null }; // insert().select() と形を合わせるため
  }
};