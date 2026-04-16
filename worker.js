// worker.js
import { Worker } from "bullmq";
import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);



//bullmqのworkerは
//node worker.js と起動した瞬間から内部でjobがないか無限ループしている。
const worker = new Worker(
  "notification", // Queue名と一致
  //jobが積まれると
  async (job) => {
    //job名を指定して
    if (job.name === "sendLikeNotification") {
     const { userId ,questionId } = job.data;
     const result = await resend.emails.send({
        from: "onboarding@resend.dev",   // ← テスト用
        to: process.env.TEST_Gmail,     // ← ここに送信先
        subject: "Resend テスト通知",
        text: `${userId}さんに、質問 ${questionId} にいいねされました！`,
      });

      console.log("メール送信完了（Resend）", result);
   
    }
  },
  {
    connection: {
      host: "127.0.0.1",//自身のパスを表すアドレス。
      port: 6379,//port6379に接続
    },
  }
);