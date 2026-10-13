import type {Metadata} from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
export const metadata:Metadata={title:'Make it happen — Chaque petit pas compte',description:'Tes cours, ton rythme, tes progrès. Un espace de révision pour apprendre, pratiquer et avancer ensemble.',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg',apple:'/icon-192.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr" data-theme="dark" suppressHydrationWarning><body>{children}</body></html>}
