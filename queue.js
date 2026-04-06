// queue.js
import { Queue } from "bullmq";

//notification（キューの名前）キューを作って、exportできるようにする。
// ここでたくさんキューを作ってexportする用のファイルとしておけば、import { notificationQueue } from "./queue.js";
//APIの中でawait notificationQueue.add(job名)でいけて楽。
export const notificationQueue = new Queue("notification", {
  //ローカルで動くredis(docker)につなぐためのポート番号。127.0.0.1 → 自分のPCを指すIPアドレス。当たり前だがデプロイする時などはここは変わる。
    connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});
