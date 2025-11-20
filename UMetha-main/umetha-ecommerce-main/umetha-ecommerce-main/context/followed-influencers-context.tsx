"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";

type InfluencerId = number;

type FollowedInfluencer = {
  id: InfluencerId;
  name: string;
  avatar: string;
  category: string;
  followedAt: Date;
};

interface FollowedInfluencersContextType {
  followedInfluencers: FollowedInfluencer[];
  isFollowing: (influencerId: InfluencerId) => boolean;
  follow: (influencer: Omit<FollowedInfluencer, "followedAt">) => void;
  unfollow: (influencerId: InfluencerId) => void;
  getFollowCount: () => number;
}

const FollowedInfluencersContext =
  createContext<FollowedInfluencersContextType | undefined>(undefined);

export function FollowedInfluencersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [followedInfluencers, setFollowedInfluencers] = useState<
    FollowedInfluencer[]
  >([]);
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();

  // Load followed influencers from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("followedInfluencers");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const restored = parsed.map((inf: any) => ({
          ...inf,
          followedAt: new Date(inf.followedAt),
        }));

        setFollowedInfluencers(restored);
      } catch (e) {
        console.error("Invalid followedInfluencers data", e);
        localStorage.removeItem("followedInfluencers");
      }
    }

    setLoaded(true);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        "followedInfluencers",
        JSON.stringify(followedInfluencers)
      );
    }
  }, [followedInfluencers, loaded]);

  const isFollowing = (influencerId: InfluencerId) => {
    return followedInfluencers.some((i) => i.id === influencerId);
  };

  const follow = (influencer: Omit<FollowedInfluencer, "followedAt">) => {
    if (isFollowing(influencer.id)) return;

    setFollowedInfluencers((prev) => [
      ...prev,
      {
        ...influencer,
        followedAt: new Date(),
      },
    ]);

    toast({
      title: "Subscribed!",
      description: `You're now following ${influencer.name}`,
      duration: 3000,
    });
  };

  const unfollow = (influencerId: InfluencerId) => {
    const influencer = followedInfluencers.find(
      (i) => i.id === influencerId
    );
    if (!influencer) return;

    setFollowedInfluencers((prev) =>
      prev.filter((i) => i.id !== influencerId)
    );

    toast({
      title: "Unsubscribed",
      description: `You've unfollowed ${influencer.name}`,
      duration: 3000,
    });
  };

  const getFollowCount = () => followedInfluencers.length;

  return (
    <FollowedInfluencersContext.Provider
      value={{
        followedInfluencers,
        isFollowing,
        follow,
        unfollow,
        getFollowCount,
      }}
    >
      {children}
    </FollowedInfluencersContext.Provider>
  );
}

export const useFollowedInfluencers = () => {
  const context = useContext(FollowedInfluencersContext);
  if (!context) {
    throw new Error(
      "useFollowedInfluencers must be used inside a FollowedInfluencersProvider"
    );
  }
  return context;
};
