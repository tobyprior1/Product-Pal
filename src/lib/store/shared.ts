import { toast } from "@/hooks/use-toast";

/** The demo tree is a read-only example and is never written to the database. */
export const notifySampleReadOnly = () => {
  toast({
    title: "Sample tree is read-only",
    description: "Create a tree in a project to make and save your own changes.",
  });
};

export const showErrorToast = (description: string) => {
  toast({
    title: "Error",
    description,
    variant: "destructive",
  });
};

/** Short "HH:MM" stamp used in auto-generated snapshot labels. */
export const snapshotTimeLabel = (date = new Date()) =>
  `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

export const deepCloneNodes = <T,>(nodes: T): T => JSON.parse(JSON.stringify(nodes));
