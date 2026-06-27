"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { API_BASE as API } from "@/src/config/api";
import { timeAgo } from "@/src/utils/dateFormatters";
import { AVATAR_GRADIENTS } from "@/src/constants/avatarGradients";
import type { Comment, CommentUser } from "@/src/types/comment";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommentsProps {
  conditionId?: string;
  eventId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[hash];
}

function countAll(comments: Comment[]): number {
  return comments.reduce((acc, c) => acc + 1 + countAll(c.replies), 0);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="#f43f5e">
      <path d="M10 17.5s-6.5-4.06-8.5-8.06C.4 6.7 1.8 4 4.5 4c1.7 0 2.9 1 3.5 2 .6-1 1.8-2 3.5-2 2.7 0 4.1 2.7 3 5.44-2 4-8.5 8.06-8.5 8.06z"/>
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
      <path d="M10 17.5s-6.5-4.06-8.5-8.06C.4 6.7 1.8 4 4.5 4c1.7 0 2.9 1 3.5 2 .6-1 1.8-2 3.5-2 2.7 0 4.1 2.7 3 5.44-2 4-8.5 8.06-8.5 8.06z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
function ReplyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
      <path d="M12 5l5 5-5 5M17 10H6.5C4 10 2.5 8.5 2.5 6.5V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M17 3L2 9.5l6 2.3M17 3l-6.5 14-2.7-5.2M17 3L8.3 11.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v8A1.5 1.5 0 0 1 15.5 14H8l-4 3v-3H4.5A1.5 1.5 0 0 1 3 12.5v-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}
function SortIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 5h10M5 8h6M7 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 32 }: { user: CommentUser; size?: number }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.username}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = user.username.slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size, height: size,
        background: avatarGradient(user.id),
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({
  onSubmit,
  placeholder = "Share your prediction…",
  autoFocus = false,
  compact = false,
  onCancel,
}: {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
  onCancel?: () => void;
}) {
  const { authenticated, user } = usePrivy();
  const [value, setValue] = useState("");
  const [posting, setPosting] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!value.trim() || posting) return;
    setPosting(true);
    try {
      await onSubmit(value.trim());
      setValue("");
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
    if (e.key === "Escape" && onCancel) onCancel();
  };

  if (!authenticated) {
    return (
      <div
        className="rounded-xl border border-white/[0.06] px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: "#ffffff0a" }}
      >
        <span className="text-[12px] text-gray-500">Sign in to join the discussion</span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>
          Log in
        </span>
      </div>
    );
  }

  return (
    
    <div className={`flex gap-3 ${compact ? "" : "items-start"}`}>
      {!compact && (
        <Avatar user={{ id: user?.id ?? "me", username: user?.email?.address ?? "You", slug: "", avatarUrl: null }} size={32} />
      )}
      <div className="flex-1 min-w-0">
        <div
          className="rounded-xl border transition-colors"
          style={{
            background: "#ffffff0a",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={compact ? 1 : 2}
            maxLength={600}
            className="w-full bg-transparent resize-none outline-none px-3.5 pt-3 text-[13px] text-gray-200 placeholder:text-gray-600"
            style={{ minHeight: compact ? 38 : 56 }}
          />
          <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1">
            <span className="text-[10px] text-gray-700">{value.length > 0 ? `${value.length}/600` : "⌘+Enter to post"}</span>
            <div className="flex items-center gap-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-[11px] font-medium text-gray-500 hover:text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || posting}
                className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}
              >
                {posting ? "Posting…" : (
                  <>
                    <SendIcon /> Post
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single Comment ───────────────────────────────────────────────────────────

function CommentItem({
  comment,
  onLike,
  onReply,
  depth = 0,
}: {
  comment: Comment;
  onLike: (id: string) => void;
  onReply: (body: string, parentId?: string) => Promise<void>;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

    const handleReplySubmit = async (body: string) => {
    await onReply(body, comment.id);
    setReplying(false);
    };

  return (
    <div className={depth > 0 ? "mt-3" : ""}>
      <div className="flex gap-3 group">
        <Avatar user={comment.user} size={depth > 0 ? 26 : 32} />

        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div
            className="rounded-xl px-3.5 py-2.5"
            style={{ background: depth > 0 ? "rgba(255,255,255,0.025)" : "#ffffff0a", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12.5px] font-semibold text-gray-200">{comment.user.username}</span>
              <span className="text-[10.5px] text-gray-600">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {comment.body}
            </p>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-4 mt-1.5 px-1">
            <button
              onClick={() => onLike(comment.id)}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer"
              style={{ color: comment.likedByMe ? "#f43f5e" : "#6b7280" }}
            >
              <HeartIcon filled={comment.likedByMe} />
              {comment.likes > 0 && <span className="tabular-nums">{comment.likes}</span>}
            </button>

            <button
              onClick={() => setReplying((r) => !r)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
            >
              <ReplyIcon /> Reply
            </button>

            {comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies((s) => !s)}
                className="text-[11px] font-medium text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
              >
                {showReplies ? "Hide" : "Show"} {comment.replies.length} repl{comment.replies.length === 1 ? "y" : "ies"}
              </button>
            )}
          </div>

          {/* Reply composer */}
          {replying && (
            <div className="mt-2.5">
              <Composer
                compact
                autoFocus
                placeholder={`Reply to ${comment.user.username}…`}
                onSubmit={handleReplySubmit}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}

          {/* Nested replies */}
          {showReplies && comment.replies.length > 0 && (
            <div className="mt-1 pl-1 border-l border-white/[0.06] ml-3">
              <div className="pl-3">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} onLike={onLike} onReply={onReply} depth={depth + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="flex-1">
        <div className="rounded-xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="h-2.5 w-24 rounded mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="h-2.5 w-3/4 rounded mb-1.5" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-2.5 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Sort options ─────────────────────────────────────────────────────────────

type SortKey = "newest" | "top";

function sortComments(comments: Comment[], sort: SortKey): Comment[] {
  const sorted = [...comments];
  if (sort === "top") sorted.sort((a, b) => b.likes - a.likes);
  else sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return sorted;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Comments({ conditionId, eventId }: CommentsProps) {
  const { authenticated, getAccessToken } = usePrivy();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [sort, setSort]         = useState<SortKey>("newest");
    console.log("Comments props", {
    conditionId,
    eventId,
    });

  const targetParam = conditionId ? `conditionId=${conditionId}` : `eventId=${eventId}`;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (authenticated) {
        const token = await getAccessToken();
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`${API}/api/comments?${targetParam}`, { headers });
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      setComments(Array.isArray(data) ? data : data.comments ?? []);
    } catch (e) {
      setError("Couldn't load comments. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [targetParam, authenticated]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const postComment = async (body: string, parentId?: string) => {
    const token = await getAccessToken();
    console.log({
    conditionId,
    eventId,
    body,
    });
    const res = await fetch(`${API}/api/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...(conditionId ? { conditionId } : { eventId }),
        body,
        ...(parentId ? { parentId } : {}),
      }),
    });
    if (!res.ok) throw new Error("Failed to post comment");
    const newComment: Comment = await res.json();

    setComments((prev) => {
      if (!parentId) return [newComment, ...prev];
      // Insert into the matching parent's replies
      const insert = (list: Comment[]): Comment[] =>
        list.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...c.replies, newComment] }
            : { ...c, replies: insert(c.replies) }
        );
      return insert(prev);
    });
  };

  const handleLike = async (id: string) => {
    // Optimistic update
    const toggle = (list: Comment[]): Comment[] =>
      list.map((c) =>
        c.id === id
          ? { ...c, likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) }
          : { ...c, replies: toggle(c.replies) }
      );
    setComments((prev) => toggle(prev));

    try {
      const token = await getAccessToken();
      await fetch(`${API}/api/comments/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Revert on failure
      setComments((prev) => toggle(prev));
    }
  };

  const total = countAll(comments);
  const visibleComments = sortComments(comments, sort);

  return (
    <div
      className="rounded-2xl border border-white/[0.06] overflow-hidden"
      style={{ background: "#0f0f12" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <ChatIcon />
          <h3 className="text-[14px] font-bold text-white">Discussion</h3>
          {!loading && total > 0 && (
            <span className="text-[11px] font-semibold text-gray-600 tabular-nums">{total}</span>
          )}
        </div>

        {!loading && comments.length > 1 && (
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
            {(["newest", "top"] as SortKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all capitalize"
                style={sort === s ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" } : { color: "#6b7280" }}
              >
                {s === "top" && <SortIcon />}
                {s === "newest" ? "Newest" : "Top"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-5 pt-4 pb-3">
        <Composer onSubmit={(body) => postComment(body)} />
      </div>

      {/* List */}
      <div className="px-5 pb-5 flex flex-col gap-4">
        {loading ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-[12px] text-gray-600 mb-2">{error}</p>
            <button
              onClick={fetchComments}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}
            >
              Retry
            </button>
          </div>
        ) : visibleComments.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-2xl mb-2 opacity-40">💬</div>
            <p className="text-[13px] text-gray-500 font-medium">No comments yet</p>
            <p className="text-[11px] text-gray-700 mt-1">Be the first to share your take.</p>
          </div>
        ) : (
          visibleComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onLike={handleLike} onReply={postComment} />
          ))
        )}
      </div>
    </div>
  );
}
