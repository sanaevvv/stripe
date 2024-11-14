import { Ratelimit } from "@upstash/ratelimit";
import redis from "./redis";

const ratelimit = new Ratelimit({
  redis, //  Redisクライアントのインスタンス。レート制限の状態を保存するために使用されます。
  limiter: Ratelimit.slidingWindow(3, '60 s'), // レート制限のルール:60秒間に最大3回のリクエストを許可
});

export default ratelimit
