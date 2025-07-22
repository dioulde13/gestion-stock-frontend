import './globals.css';
import { ReactNode } from 'react';
import ClientLayoutWrapper from './components/ClientLayoutWrapper';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
