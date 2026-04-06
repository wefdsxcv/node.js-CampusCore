import { notificationQueue } from "./queue.js";

await notificationQueue.add("sendLikeNotification", {
  userId: "dummy-user",
  questionId: 123,
});

console.log("ジョブ追加完了");
