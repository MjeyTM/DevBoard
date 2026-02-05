import { useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createNote, createTask } from "../data/api";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";

const schema = z.object({
  kind: z.enum(["task", "note"]),
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(["Feature", "Bug", "Fix", "Chore", "Refactor", "Research"]).optional(),
});

type FormValues = z.infer<typeof schema>;

export const QuickAddDialog = ({ label = "New" }: { label?: string }) => {
  const [open, setOpen] = useState(false);
  const { projectId } = useParams();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kind: "task", title: "", description: "", type: "Feature" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!projectId) return;
    if (values.kind === "task") {
      await createTask({
        projectId,
        title: values.title,
        description: values.description,
        type: values.type ?? "Feature",
      });
    } else {
      await createNote({
        projectId,
        title: values.title,
        content: values.description,
      });
    }
    form.reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" disabled={!projectId}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-base-content/70">Type</label>
            <Select {...form.register("kind")}
              onChange={(event) => form.setValue("kind", event.target.value as "task" | "note")}
            >
              <option value="task">Task</option>
              <option value="note">Note</option>
            </Select>
          </div>
          {form.watch("kind") === "task" && (
            <div className="space-y-1">
              <label className="text-xs text-base-content/70">Task Type</label>
              <Select {...form.register("type")}
                onChange={(event) =>
                  form.setValue("type", event.target.value as FormValues["type"])
                }
              >
                <option value="Feature">Feature</option>
                <option value="Bug">Bug</option>
                <option value="Fix">Fix</option>
                <option value="Chore">Chore</option>
                <option value="Refactor">Refactor</option>
                <option value="Research">Research</option>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-base-content/70">Title</label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-base-content/70">Description</label>
            <Textarea rows={4} {...form.register("description")} />
          </div>
          <Button type="submit" className="w-full">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
