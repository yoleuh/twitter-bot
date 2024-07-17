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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { tweetUrl } = req.body;

  if (!tweetUrl) {
    return res.status(400).json({ error: "Tweet URL is required." });
  }

  try {
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
    console.error("Twitter API Error:", error);
    if (error instanceof Error) {
      if ("code" in error) {
        // This is likely a Twitter API error
        const twitterError = error as { code: number; message: string };
        switch (twitterError.code) {
          case 88:
            res
              .status(429)
              .json({ error: "Rate limit exceeded. Please try again later." });
            break;
          case 144:
            res.status(404).json({
              error:
                "Tweet not found. The tweet may have been deleted or is not publicly accessible.",
            });
            break;
          default:
            res
              .status(500)
              .json({ error: `Twitter API error: ${twitterError.message}` });
        }
      } else {
        // This is a general error
        res
          .status(500)
          .json({ error: `Internal server error: ${error.message}` });
      }
    } else {
      // This is an unknown error
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
}
