"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { getTask, updateTask } from "../../../actions/tasks";
import { Toast } from "../../../components/Toast";

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (Number.isNaN(id)) {
      showError("Invalid task ID.");
      setLoading(false);
      return;
    }

    async function load() {
      const { data, error } = await getTask(id);
      if (error) {
        showError(error);
      } else if (data) {
        setTitle(data.title);
      }
      setLoading(false);
    }
    load();
  }, [id, showError]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || Number.isNaN(id)) return;

    setSaving(true);

    const { error } = await updateTask(id, { title: trimmed });

    setSaving(false);

    if (error) {
      showError(error);
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-full flex-1 bg-[#F9FAFB] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl bg-[#FFFFFF] p-6 shadow-sm">
          <Link
            href="/"
            className="mb-6 inline-block text-sm font-medium text-[#3B82F6] hover:underline"
          >
            ← Back to tasks
          </Link>

          <h1 className="mb-6 text-xl font-semibold text-gray-900">
            Edit Task
          </h1>

          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="w-full rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </form>
          )}
        </div>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
