"use client";

import { Content } from "@/types/lms";
import { useDeleteContentMutation, useModuleContentsQuery } from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function ModuleContentList({
  moduleId,
  canManage = false
}: {
  moduleId: string;
  canManage?: boolean;
}) {
  const { data = [], isLoading } = useModuleContentsQuery(moduleId);
  const deleteContent = useDeleteContentMutation();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading module content...</p>;
  }

  if (!data.length) {
    return <p className="text-sm text-slate-500">No content added to this module yet.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((content: Content) => (
        <Card key={content.content_id} className="border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{content.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-600">
                {content.type} • Order {content.order_index}
              </p>
              {content.description ? (
                <p className="mt-3 text-sm text-slate-600 line-clamp-3">{content.description.replace(/<[^>]+>/g, "")}</p>
              ) : null}
            </div>
            {canManage ? (
              <Button
                variant="secondary"
                onClick={() => deleteContent.mutate({ contentId: content.content_id, moduleId })}
                disabled={deleteContent.isPending}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
