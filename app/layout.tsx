import './globals.css';
import './accounts.css';
import AccountExperience from '@/components/AccountExperience';
import LocaleProvider from '@/components/LocaleProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'iGEM Perfume Booth',
  description: 'Quick perfume booth experience powered by an agent',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body><LocaleProvider><AccountExperience>{children}</AccountExperience></LocaleProvider></body>
    </html>
  );
}
