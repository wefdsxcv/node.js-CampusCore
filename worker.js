// worker.js
import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

//bullmqのworkerは
//node worker.js と起動した瞬間から内部でjobがないか無限ループしている。
const worker = new Worker(
  "notification", // Queue名と一致
  //jobが積まれると
  async (job) => {
    //job名を指定して
    if (job.name === "sendLikeNotification") {
    const { questionId } = job.data;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "target@example.com",
      subject: "いいね通知",
      text: `質問 ${questionId} にいいねしました！`,
    });

    console.log("メール送信完了");
    }
  },
  {
    connection: {
      host: "127.0.0.1",//自身のパスを表すアドレス。
      port: 6379,//port6379に接続
    },
  }
);