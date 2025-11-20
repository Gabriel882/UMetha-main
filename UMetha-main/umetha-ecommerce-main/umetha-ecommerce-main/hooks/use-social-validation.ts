import { useState, useCallback } from "react";

export interface SocialMediaData {
  username: string;
  followers?: number;
  subscribers?: number;
  avatar?: string;
  verified?: boolean;
  profile_pic?: string;
  bio?: string | null;
}

export interface ValidationState {
  isValidating: boolean;
  isValid: boolean;
  error: string | null;
  data: SocialMediaData | null;
}

export type ValidationStates = Record<string, ValidationState>;

export function useSocialValidation() {
  const [states, setStates] = useState<ValidationStates>({
    instagram: { isValidating: false, isValid: false, error: null, data: null },
    youtube: { isValidating: false, isValid: false, error: null, data: null },
    twitter: { isValidating: false, isValid: false, error: null, data: null },
    tiktok: { isValidating: false, isValid: false, error: null, data: null },
  });

  const setValidationState = (platform: string, newState: Partial<ValidationState>) => {
    setStates(prev => ({
      ...prev,
      [platform]: { ...prev[platform], ...newState },
    }));
  };

  const extractUsername = (raw: string): string => {
    let v = raw.trim();
    try {
      if (v.startsWith("http")) {
        const url = new URL(v);
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length) v = parts[parts.length - 1];
      }
    } catch {
      // ignore invalid URL
    }
    return v.replace(/^@+/, "").split(/[?#/]/)[0].trim();
  };

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
          const res = await fetch("/api/social-validation/instagram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });
          const json = await res.json();
          if (!res.ok || json.error) throw new Error(json.error || "Instagram validation failed");
          data = {
            username: json.username,
            followers: json.followers,
            profile_pic: json.profile_pic,
            verified: json.verified,
            bio: json.bio,
          };
          break;
        }
        case "youtube": {
          const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
          if (!apiKey) throw new Error("YouTube API key not configured");
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
          const bearer = process.env.NEXT_PUBLIC_TWITTER_BEARER;
          if (!bearer) throw new Error("Twitter token not configured");
          const res = await fetch(
            `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url,public_metrics,verified`,
            { headers: { Authorization: `Bearer ${bearer}` } }
          );
          const json = await res.json();
          if (json.errors) throw new Error(json.errors[0].detail || "Twitter validation failed");
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
          // Placeholder: mark valid if non-empty
          data = { username };
          break;
        }
        default:
          throw new Error("Unsupported platform");
      }

      setValidationState(platform, { isValidating: false, isValid: true, error: null, data });
    } catch (err: any) {
      console.error("Validation error:", platform, err);
      setValidationState(platform, {
        isValidating: false,
        isValid: false,
        error: err?.message || "Validation failed",
        data: null,
      });
    }
  }, []);

  const clearValidation = useCallback((platform: string) => {
    setValidationState(platform, { isValidating: false, isValid: false, error: null, data: null });
  }, []);

  const getValidationState = useCallback(
    (platform: string): ValidationState =>
      states[platform] || { isValidating: false, isValid: false, error: null, data: null },
    [states]
  );

  const getTotalFollowers = useCallback((): number => {
    return ["instagram", "youtube", "twitter", "tiktok"].reduce((sum, platform) => {
      const st = states[platform];
      if (!st || !st.isValid || !st.data) return sum;
      let total = sum;
      if (typeof st.data.followers === "number") total += st.data.followers;
      if (typeof st.data.subscribers === "number") total += st.data.subscribers;
      return total;
    }, 0);
  }, [states]);

  const formatFollowerCount = useCallback((n: number): string => {
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
