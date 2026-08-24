import type { Metadata } from 'next';
import { SettingsView } from '@/components/cabinet/SettingsView';

export const metadata: Metadata = { title: 'Sozlamalar', robots: { index: false, follow: false } };

export default function SettingsPage() {
  return <SettingsView />;
}
