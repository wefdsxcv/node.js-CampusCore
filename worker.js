// worker.js
import { Worker } from "bullmq";

//bullmqのworkerは
//node worker.js と起動した瞬間から内部でjobがないか無限ループしている。
const worker = new Worker(
  "notification", // Queue名と一致
  //jobが積まれると
  async (job) => {
    //job名を指定して
    if (job.name === "sendLikeNotification") {
      console.log("通知処理:", job.data);

      
    }
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  }
);