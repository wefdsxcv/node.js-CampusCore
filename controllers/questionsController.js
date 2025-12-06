// controllers/questionsController.js
import { supabase } from "../db/supabaseClient.js";

// ---------------------------------------------------
// 1. 全件取得 (Get All Questions)
// ---------------------------------------------------
export async function getAllQuestions(req, res) {
  try {
    // A. まず質問データ一覧を取得
    // selectの中に 'like_count' が含まれるので、特別記述しなくても '*' で取得されます
    const { data: questions, error } = await supabase
      .from("questions")
      .select(`
        *,
        tags:question_tags(
          tag:tags(name)
        ),
        profile:user_profiles(name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // -------------------------------------------------
    // B. 「自分がイイネした質問ID」のリストを作る
    // -------------------------------------------------
    let myLikedQuestionIds = [];

    // トークンがある場合（ログインしている場合）のみチェック
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // ユーザー特定
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        // likesテーブルから、自分のuser_idに紐づくquestion_idだけ取ってくる
        const { data: myLikes } = await supabase
          .from("likes")
          .select("question_id")
          .eq("user_id", user.id);
        
        // [{question_id: 1}, {question_id: 5}] 
        //   ↓ mapで変換
        // [1, 5] というシンプルな配列にする
        if (myLikes) {
          myLikedQuestionIds = myLikes.map(like => like.question_id);
        }
      }
    }

    // -------------------------------------------------
    // C. データ整形 (Flutterに送る形を作る)
    // -------------------------------------------------
    const formattedData = questions.map(post => ({
      ...post,
      tags: post.tags ? post.tags.map(t => t.tag.name) : [],
      user_name: post.profile ? post.profile.name : '名無し',
      
      // ★ここが追加ポイント
      // DBのカラム(like_count)をそのまま使う。NULLなら0にする。
      like_count: post.like_count ?? 0, 
      
      // さっき作ったIDリストに含まれていれば true、なければ false
      is_liked: myLikedQuestionIds.includes(post.id)
    }));

    res.status(200).json(formattedData);

  } catch (err) {
    console.error("全件取得失敗:", err);
    res.status(500).json({ error: "質問一覧の取得に失敗しました" });
  }
}
// ---------------------------------------------------
// 2. タグ検索 (Get Questions By Tag)
// ---------------------------------------------------
export async function getQuestionsByTag(req, res) {
  try {
    const tag = req.params.tag;

    // 多対多のリレーションを使った検索 (タグ名でフィルタリング)
    // !inner を使うことで、そのタグを持つ質問だけを絞り込みます
    const { data, error } = await supabase
      .from("questions")
      .select(`
        *,
        question_tags!inner(
          tag:tags!inner(name)
        ),
        profile:user_profiles(name)
      `)
      .eq("question_tags.tag.name", tag)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 整形処理
    const formattedData = data.map(post => ({
      ...post,
      tags: post.question_tags ? post.question_tags.map(t => t.tag.name) : [],
      user_name: post.profile ? post.profile.name : '名無し'
    }));

    res.status(200).json(formattedData);

  } catch (err) {
    console.error("タグ検索失敗:", err);
    res.status(500).json({ error: "タグ検索に失敗しました" });
  }
}

// ---------------------------------------------------
// 3. 投稿処理 (Post Question) - 認証対応版
// ---------------------------------------------------
export async function postQuestion(req, res) {
  try {
    const { text, tags } = req.body;

    // ① ヘッダーからトークン取得 ("Bearer <token>" の形)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "ログインしてください（トークンなし）" });
    }

    // ② Supabaseにトークンを渡して、誰からのリクエストか特定する
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "トークンが無効です" });
    }

    // バリデーション
    if (!text) return res.status(400).json({ error: "textが必要です" });

    // ③ 質問を保存 (特定した user.id を使う)
    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .insert([{ text, user_id: user.id }])
      .select()
      .single();

    if (questionError) throw questionError;

    const questionId = questionData.id;

    // ④ タグ保存処理 (タグがあればループして保存)
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let tagId;

        // A. すでにタグがあるか検索
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagName)
          .single();

        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // B. なければ新規作成
          const { data: newTag, error: tagError } = await supabase
            .from("tags")
            .insert([{ name: tagName }])
            .select()
            .single();
          
          if (tagError) {
            console.error(`タグ作成エラー: ${tagName}`, tagError);
            continue; 
          }
          tagId = newTag.id;
        }

        // C. 中間テーブルに紐付け
        await supabase
          .from("question_tags")
          .insert([{ question_id: questionId, tag_id: tagId }]);
      }
    }

    // 成功レスポンス
    res.status(201).json({ ...questionData, tags }); 

  } catch (err) {
    console.error("投稿失敗:", err);
    res.status(500).json({ error: "質問投稿に失敗しました" });
  }
}



//4. 返信一覧取得 (Get Replies)
// URL: GET /questions/:id/replies
// ---------------------------------------------------
export async function getReplies(req, res) {
  try {
    const questionId = req.params.id; // URLの :id 部分を取得

    // repliesテーブルから取得し、user_profilesを結合して名前も取る
    const { data, error } = await supabase
      .from("replies")
      .select(`
        *,
        profile:user_profiles(name)
      `)
      .eq("question_id", questionId)
      .order("created_at", { ascending: true }); // チャットっぽく古い順で表示

    if (error) throw error;

    // Flutter用に整形 (user_name をフラットにする)
    const formattedData = data.map(reply => ({
      ...reply,
      user_name: reply.profile ? reply.profile.name : '名無し'
    }));

    res.status(200).json(formattedData);

  } catch (err) {
    console.error("返信取得失敗:", err);
    res.status(500).json({ error: "返信の取得に失敗しました" });
  }
}

// ---------------------------------------------------
// 5. 返信投稿 (Post Reply)
// URL: POST /questions/replies
// ---------------------------------------------------
export async function postReply(req, res) {
  try {
    const { text, question_id } = req.body;

    // ① ヘッダーからトークン取得
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "ログインしてください" });

    // ② ユーザー特定 (Supabase Auth)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: "トークンが無効です" });

    // バリデーション
    if (!text || !question_id) return res.status(400).json({ error: "データが不足しています" });

    // ③ 返信を保存 (特定した user.id を使う)
    const { data, error } = await supabase
      .from("replies")
      .insert([{ 
        text, 
        question_id, 
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);

  } catch (err) {
    console.error("返信投稿失敗:", err);
    res.status(500).json({ error: "返信の投稿に失敗しました" });
  }
}

// controllers/questionsController.js の一番下

// ---------------------------------------------------
// 6. 質問削除 (Delete Question)
// URL: DELETE /questions/:id
// ---------------------------------------------------
export async function deletequestion(req, res) {
  try {
    const questionId = req.params.id; // URLの :id 部分を取得

    // ① ヘッダーからトークン取得
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "ログインしてください" });

    // ② ユーザー特定(supabase秘密鍵でjwtトークンと検証。正しい場合、信頼。)
    //オブジェクト（data)の中のオブジェクト(user)をuserという変数に入れる。authErrorはエラーオブジェクト
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: "トークンが無効です" });

    // ③ 削除実行
    // Equal（イコール）」の略で、「〜と等しい」 という条件を指定するフィルタです。 SQLでの意味： WHERE カラム名 = 値
    //questionidはフロントから送られてきた質問id
    const { data, error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId)
      .eq("user_id", user.id)//をここで参照していると、、、questionテーブルの"user_id カラムが一致するものだけ消すと 
      .select(); // ★ select() を付けることで「削除されたデータ」が返ってきます

    if (error) throw error;

    // ④ 結果確認
    // dataが空っぽの場合＝「IDが存在しない」か「他人の投稿だった（user_idが不一致）」
    if (!data || data.length === 0) {
      return res.status(403).json({ error: "削除権限がないか、すでに削除されています" });
    }

    // 成功
    res.status(200).json({ message: "削除しました" });

  } catch (err) {
    console.error("削除失敗:", err);
    res.status(500).json({ error: "削除に失敗しました" });
  }
}


// ---------------------------------------------------
// 7. イイネの切り替え (Toggle Like)　toggle_like(_user_id uuid, _question_id bigint) db関数を作ったので、
// URL: POST /questions/:id/like
// ---------------------------------------------------
export async function toggleLike(req, res) {
  try {
    // URLの :id は文字列で来るので、DBに合わせて数値(Int)に変換します
    const questionId = parseInt(req.params.id);
    
    // ① トークンチェック（おなじみの流れ）
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "ログインしてください" });

    // ② ユーザー特定
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: "無効なトークン" });

    // ③ Supabaseの関数 (RPC) を呼び出す
    // .rpc('関数名', { 引数名: 値 }) という書き方です
    const { data, error } = await supabase.rpc('toggle_like', {
      _user_id: user.id,
      _question_id: questionId
    });

    if (error) throw error;

    // DB関数から返ってきた { "liked": true } などをそのままフロントへ返します
    res.status(200).json(data);

  } catch (err) {
    console.error("イイネ処理失敗:", err);
    res.status(500).json({ error: "処理に失敗しました" });
  }
}