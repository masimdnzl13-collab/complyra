import "server-only";
import type { OrganizationDoc, OrganizationEmailPreferences } from "@/lib/firestore/schema";

const DEFAULT_EMAIL_PREFERENCES: OrganizationEmailPreferences = {
  notificationsEnabled: true,
  deadlineReminders: true,
  regulatoryNews: true,
  renewalReminders: true,
};

/** Orgs created before P14 don't have `emailPreferences` stored yet — this is the one place that gap is papered over. */
export function resolveEmailPreferences(organization: OrganizationDoc): OrganizationEmailPreferences {
  return organization.emailPreferences ?? DEFAULT_EMAIL_PREFERENCES;
}

export function canSendDeadlineReminder(organization: OrganizationDoc): boolean {
  const prefs = resolveEmailPreferences(organization);
  return prefs.notificationsEnabled && prefs.deadlineReminders;
}

export function canSendRenewalReminder(organization: OrganizationDoc): boolean {
  const prefs = resolveEmailPreferences(organization);
  return prefs.notificationsEnabled && prefs.renewalReminders;
}

export function canSendRegulatoryNews(organization: OrganizationDoc): boolean {
  const prefs = resolveEmailPreferences(organization);
  return prefs.notificationsEnabled && prefs.regulatoryNews;
}
