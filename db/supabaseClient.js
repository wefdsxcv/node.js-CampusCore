// db/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

import dotenv from "dotenv";
dotenv.config();//env読み込み
//.env に書いた値は Node.js は自動で読み込まない のでこれ

// .env に書かれた値を読み込む
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase クライアント生成
export const supabase = createClient(supabaseUrl, supabaseKey);
