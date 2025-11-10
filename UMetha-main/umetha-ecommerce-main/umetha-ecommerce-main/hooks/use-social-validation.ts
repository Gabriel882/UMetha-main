import { useState, useCallback } from "react";

// Types for validation state
interface SocialMediaData {
  username: string;
  followers?: number;
  subscribers?: number;
  avatar?: string;
  verified?: boolean;
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean;
  error: string | null;
  data: SocialMediaData | null;
}

// Hook return type: a map from platform name to its validation state
type ValidationStates = Record<string, ValidationState>;

export function useSocialValidation() {
  const [states, setStates] = useState<ValidationStates>({
    instagram: { isValidating: false, isValid: false, error: null, data: null },
    youtube: { isValidating: false, isValid: false, error: null, data: null },
    twitter: { isValidating: false, isValid: false, error: null, data: null },
    tiktok: { isValidating: false, isValid: false, error: null, data: null },
  });

  // Helper: extract username from URL or raw string
  const extractUsername = (raw: string): string => {
    let v = raw.trim();
    // If URL, parse pathname
    try {
      if (v.startsWith("http")) {
        const url = new URL(v);
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length) {
          v = parts[parts.length - 1];
        }
      }
    } catch (e) {
      // Not a URL
    }
    // Remove leading @, query strings, trailing slashes
    v = v.replace(/^@+/, "").split(/[?#/]/)[0].trim();
    return v;
  };

  const setValidationState = (platform: string, newState: Partial<ValidationState>) => {
    setStates((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], ...newState },
    }));
  };

  // Main validate function
  const validateUsername = useCallback(async (platform: string, raw: string) => {
    const username = extractUsername(raw);
    if (!username) {
      setValidationState(platform, { error: "No valid username", isValid: false, data: null });
      return;
    }

    setValidationState(platform, { isValidating: true, error: null });

    try {
      let data: SocialMediaData | null = null;

      switch (platform) {
        case "instagram": {
          // Use Instagram Graph API (requires a token)
          const token = process.env.NEXT_PUBLIC_INSTAGRAM_TOKEN;
          if (!token) throw new Error("Instagram token not configured");
          const res = await fetch(
            `https://graph.instagram.com/${username}?fields=id,username,account_type,followers_count,profile_picture_url&access_token=${token}`
          );
          const json = await res.json();
          if (json.error) throw new Error(json.error.message || "Instagram error");
          data = {
            username: json.username,
            followers: json.followers_count,
            avatar: json.profile_picture_url,
          };
          break;
        }
        case "youtube": {
          const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
          if (!apiKey) throw new Error("YouTube API key not configured");
          // fetch channel by username or id
          const res = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?forUsername=${username}&part=snippet,statistics&key=${apiKey}`
          );
          const json = await res.json();
          if (!json.items || json.items.length === 0) throw new Error("Channel not found");
          const item = json.items[0];
          data = {
            username: item.snippet.title,
            subscribers: parseInt(item.statistics.subscriberCount),
            avatar: item.snippet.thumbnails?.default?.url,
          };
          break;
        }
        case "twitter": {
          // Example: using Twitter API v2 Bearer Token
          const bearer = process.env.NEXT_PUBLIC_TWITTER_BEARER;
          if (!bearer) throw new Error("Twitter token not configured");
          const res = await fetch(
            `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url,public_metrics,verified`,
            { headers: { Authorization: `Bearer ${bearer}` } }
          );
          const json = await res.json();
          if (json.errors) throw new Error(json.errors[0].detail || "Twitter error");
          const user = json.data;
          data = {
            username: user.username,
            followers: user.public_metrics.followers_count,
            avatar: user.profile_image_url,
            verified: user.verified,
          };
          break;
        }
        case "tiktok": {
          // TikTok official API is restricted; fallback: no validation or scraper logic
          // For now, just mark valid if non-empty
          data = {
            username,
          };
          break;
        }
        default:
          throw new Error("Unsupported platform");
      }

      setValidationState(platform, { isValidating: false, isValid: true, error: null, data });
    } catch (err: any) {
      console.error("Validation error", platform, err);
      setValidationState(platform, {
        isValidating: false,
        isValid: false,
        error: err.message || "Validation failed",
        data: null,
      });
    }
  }, []);

  const clearValidation = useCallback((platform: string) => {
    setValidationState(platform, { isValidating: false, isValid: false, error: null, data: null });
  }, []);

  const getValidationState = useCallback(
    (platform: string) => {
      return states[platform] || { isValidating: false, isValid: false, error: null, data: null };
    },
    [states]
  );

  const getTotalFollowers = useCallback(() => {
    // Sum across platforms
    let total = 0;
    for (const platform of ["instagram", "youtube", "twitter", "tiktok"]) {
      const st = states[platform];
      if (st && st.isValid && st.data) {
        if (typeof st.data.followers === "number") total += st.data.followers;
        if (typeof st.data.subscribers === "number") total += st.data.subscribers;
      }
    }
    return total;
  }, [states]);

  const formatFollowerCount = useCallback((n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return n.toString();
  }, []);

  return {
    validateUsername,
    getValidationState,
    clearValidation,
    getTotalFollowers,
    formatFollowerCount,
  };
}

