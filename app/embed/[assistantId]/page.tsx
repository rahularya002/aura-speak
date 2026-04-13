import { EmbedAssistantChat } from "@/components/embed/EmbedAssistantChat";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ assistantId: string }>;
}) {
  const { assistantId: raw } = await params;
  const assistantId = decodeURIComponent(raw ?? "default");
  return <EmbedAssistantChat assistantId={assistantId} />;
}
