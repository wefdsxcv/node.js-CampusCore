学校のアプリ開発の授業（創成D)のサーバー側のコードです。 node.jsのフォルダ構成について。 route/ route定義をまとめる　 contoroller/ 実際の処理ロジックを書く。 db/ db設定用の処理（今回はsupabaseに接続するため、supabaseクライアントを生成）

プロジェクト直下　server.js サーバー起動用ファイル。route/ のroute定義をimport プロジェクト直下 .env db/に直接api keyやら書くとよくないので、.envに書いておく。.envから参照（import dotenv from "dotenv";そのためにこれが必要）