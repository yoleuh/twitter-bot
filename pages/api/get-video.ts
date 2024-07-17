import type { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
  appKey: process.env.TWITTER_CONSUMER_KEY!,
  appSecret: process.env.TWITTER_CONSUMER_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { tweetUrl } = req.body;
      const tweetId = tweetUrl.split("/").pop()!;

      const tweet = await client.v1.singleTweet(tweetId, {
        tweet_mode: "extended",
        include_entities: true,
      });

      if (tweet.extended_entities?.media?.[0]?.video_info) {
        const videoVariants =
          tweet.extended_entities.media[0].video_info.variants;
        const mp4Variants = videoVariants.filter(
          (variant) => variant.content_type === "video/mp4"
        );
        const highestQualityVariant = mp4Variants.reduce((prev, current) =>
          prev.bitrate! > current.bitrate! ? prev : current
        );

        res.status(200).json({ videoUrl: highestQualityVariant.url });
      } else {
        res.status(404).json({ error: "No video found in this tweet." });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while processing your request." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
