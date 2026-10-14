'use client';
import {useEffect,useState} from 'react';
import {Lang} from '@/lib/i18n';
import dynamic from 'next/dynamic';
const ResourceLibrary=dynamic(()=>import('./resource-library'));
const Calculators=dynamic(()=>import('./calculators'));
export default function PublicLearningTool({tool}:{tool:'resources'|'calculator'}){const [lang,setLang]=useState<Lang>('fr');useEffect(()=>{document.documentElement.lang=lang},[lang]);const names={fr:['Mon espace','Ressources','Calculatrice','Langue'],en:['My workspace','Resources','Calculator','Language'],de:['Mein Lernraum','Lernressourcen','Rechner','Sprache'],es:['Mi espacio','Recursos','Calculadora','Idioma']}[lang];return <div className="public-learning-tool"><header><a href="/" className="public-wordmark">Make it happen.</a><nav><a href="/">{names[0]}</a><a href="/resources" aria-current={tool==='resources'?'page':undefined}>{names[1]}</a><a href="/calculator" aria-current={tool==='calculator'?'page':undefined}>{names[2]}</a></nav><select aria-label={names[3]} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="fr">FR</option><option value="en">EN</option><option value="de">DE</option><option value="es">ES</option></select></header><main>{tool==='resources'?<ResourceLibrary lang={lang}/>:<Calculators lang={lang}/>}</main></div>}
