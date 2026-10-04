import ArchiveEntryFormPage from "../../components/ArchiveEntryFormPage.js";
import { createClient } from "../../lib/supabase/server.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contribute",
  description: "Add a story and photograph to the Khmer Wedding Tradition Archive.",
};

export default async function ContributePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <ArchiveEntryFormPage isAuthenticated={Boolean(user)} />;
}
