import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


interface Announcement {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  created_at: string;
}

export function useAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {

      // Fetch announcements visible to user
      const { data: annData } = await supabase
        .from("announcements")
        .select("id, title, message, link_url, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (annData) setAnnouncements(annData);

      // Fetch read status
      const { data: readData } = await supabase
        .from("user_announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id);

      if (readData) setReadIds(new Set(readData.map((r) => r.announcement_id)));
    };

    fetchData();

    // Realtime subscription for new announcements
    const channel = supabase
      .channel("announcements-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        (payload) => {
          const newAnn = payload.new as Announcement;
          setAnnouncements((prev) => [newAnn, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (announcementId: string) => {
    if (!user || readIds.has(announcementId)) return;
    await supabase
      .from("user_announcement_reads")
      .insert({ user_id: user.id, announcement_id: announcementId });
    setReadIds((prev) => new Set([...prev, announcementId]));
  };

  const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length;

  return { announcements, readIds, unreadCount, markAsRead };
}
