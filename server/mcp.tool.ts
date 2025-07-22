import {config} from 'dotenv';
import {TwitterApi} from "twitter-api-v2"
config();

console.log('API Key:', process.env.TWITTER_API_KEY);
console.log('API Secret:', process.env.TWITTER_API_SECRET ? 'Loaded' : 'Not found');
console.log('Access Token:', process.env.TWITTER_ACCESS_TOKEN ? 'Loaded' : 'Not found');
console.log('Access Secret:', process.env.TWITTER_ACCESS_TOKEN_SECRET ? 'Loaded' : 'Not found');

const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
} as any);

export async function createPost(status: string) {
    try {
        const newPost = await twitterClient.v2.tweet(status);
        return {
            content: [
                {
                    type: "text" as const,  // Added 'as const'
                    text: `Tweeted: ${status}`  // Fixed: ${} instead of $()
                }
            ]
        };
    } catch (error) {
        console.error('Error posting tweet:', error);
        return {
            content: [
                {
                    type: "text" as const,
                    text: `Failed to tweet: ${error}`
                }
            ]
        };
    }
}