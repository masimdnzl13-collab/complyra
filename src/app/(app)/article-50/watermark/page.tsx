import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { firestorePaths, type Article50Artifact } from "@/lib/firestore/schema";
import type { WatermarkChecklistData } from "@/lib/article50/types";
import { constructMetadata } from "@/lib/construct-metadata";
import { regulationDeadlines } from "@/config/site";
import { WatermarkChecklistForm } from "@/components/article50/watermark-checklist-form";

export const metadata = constructMetadata({ title: "Watermark checklist", path: "/article-50/watermark", noIndex: true });

export default async function WatermarkChecklistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.userDoc) redirect("/onboarding");

  const orgId = user.userDoc.organizationId;
  const snap = await getAdminFirestore()
    .collection(firestorePaths.article50Artifacts(orgId))
    .where("area", "==", "watermark_checklist")
    .where("isCurrent", "==", true)
    .limit(1)
    .get();

  const doc = snap.docs[0];
  const existing = doc
    ? { id: doc.id, status: (doc.data() as Article50Artifact).status, ...(doc.data() as Article50Artifact).data } as WatermarkChecklistData & {
        id: string;
        status: "draft" | "reviewed";
      }
    : null;

  const deadline = regulationDeadlines.find((d) => d.id === "watermarking")!;

  return <WatermarkChecklistForm watermarkDeadline={deadline.date} existing={existing} />;
}
