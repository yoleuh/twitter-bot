import { useState } from "react";
import Head from "next/head";

export default function Home() {
  const [tweetUrl, setTweetUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setVideoUrl("");

    try {
      const response = await fetch("/api/get-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tweetUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setVideoUrl(data.videoUrl);
      } else {
        setError(`API Error: ${data.error || response.statusText}`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Network Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <Head>
        <title>Twitter Video Downloader</title>
        <meta name="description" content="Download Twitter videos easily" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Twitter Video Downloader
        </h1>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <input
            type="text"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            placeholder="Enter Tweet URL"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Get Video
          </button>
        </form>

        {videoUrl && (
          <div className="mt-8 text-center">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
            >
              Download Video
            </a>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-500 text-center">
            <p>Error Details:</p>
            <p>{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
