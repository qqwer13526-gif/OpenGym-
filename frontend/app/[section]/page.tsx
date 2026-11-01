import {notFound} from 'next/navigation';
import FitPilot, {Section} from '../../components/FitPilot';
export function generateStaticParams(){return ['analysis','library','plan','calories'].map(section=>({section}))}
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!['analysis','library','plan','calories'].includes(section))notFound();return <FitPilot section={section as Section}/>}
