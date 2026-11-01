import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title: 'FitPilot AI · 让每一次训练更有方向', description: '智能健身辅助工作台 · Day 1 原型'};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="zh-CN"><body>{children}</body></html>}
