"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Rule {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function RuleCard({
  rule,
  deleteAction,
}: {
  rule: Rule;
  deleteAction: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(rule.title);
  const [content, setContent] = useState(rule.content);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, title, content }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white mb-3 focus:outline-none focus:border-gray-500"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white mb-3 focus:outline-none focus:border-gray-500 resize-y"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setTitle(rule.title);
              setContent(rule.content);
              setEditing(false);
            }}
            className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-medium text-lg">{rule.title}</h3>
          <pre className="text-gray-400 text-sm mt-2 whitespace-pre-wrap font-sans">
            {rule.content}
          </pre>
          <p className="text-xs text-gray-600 mt-3">
            Added {new Date(rule.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Edit
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={rule.id} />
            <button className="text-sm text-red-400 hover:text-red-300 transition">
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
