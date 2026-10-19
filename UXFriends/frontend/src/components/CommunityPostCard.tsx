import React from "react";
import { Heart, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { Card } from "./Card";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";

export interface CommunityPostCardProps {
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  timestamp: string;
  category: string;
  title: string;
  excerpt: string;
  tags: string[];
  likes: number;
  comments: number;
  liked?: boolean;
  onClick?: () => void;
}

export function CommunityPostCard({
  author,
  timestamp,
  category,
  title,
  excerpt,
  tags,
  likes,
  comments,
  liked = false,
  onClick,
}: CommunityPostCardProps) {
  return (
    <Card hover onClick={onClick}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={author.name} src={author.avatar} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">{author.name}</div>
              <div className="text-sm text-slate-500">
                {author.role} • {timestamp}
              </div>
            </div>
            <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <Badge variant="secondary" size="sm" className="mb-3">
        {category}
      </Badge>

      <h4 className="font-semibold text-slate-900 mb-2">{title}</h4>
      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{excerpt}</p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
        <button
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            liked
              ? "text-red-500 font-semibold"
              : "text-slate-500 hover:text-red-500"
          }`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Heart className={`w-5 h-5 ${liked ? "fill-red-500" : ""}`} />
          <span>{likes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-purple-600 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span>{comments}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors mr-auto">
          <Share2 className="w-5 h-5" />
          <span>مشاركة</span>
        </button>
      </div>
    </Card>
  );
}
