import MailingListAdminClient from "@/components/org/MailingListAdminClient";
import { readMailingList } from "@/lib/org/mailing-list-file";

export const metadata = {
  title: "Mailing List",
  description: "Newsletter signups from the site footer.",
};

export default function AdminMailingListPage() {
  const initialSubscribers = readMailingList();
  return <MailingListAdminClient initialSubscribers={initialSubscribers} />;
}
