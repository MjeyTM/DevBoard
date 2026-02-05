import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProject } from "../../data/api";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "archived"]),
  techStack: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const ProjectFormDialog = () => {
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", status: "active", techStack: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await createProject({
      name: values.name,
      description: values.description,
      status: values.status,
      techStack: values.techStack
        ?.split(",")
        .map((item: string) => item.trim())
        .filter(Boolean),
    });
    form.reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">New</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-base-content/70">Name</label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-base-content/70">Description</label>
            <Textarea rows={3} {...form.register("description")} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-base-content/70">Status</label>
            <Select {...form.register("status")}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-base-content/70">Tech Stack (comma separated)</label>
            <Input {...form.register("techStack")} />
          </div>
          <Button type="submit" className="w-full">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
