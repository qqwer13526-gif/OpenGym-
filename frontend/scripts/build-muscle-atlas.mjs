import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const frontend=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(frontend,'features/muscle-atlas/source');
const readText=async file=>(await readFile(file,'utf8')).replace(/\r\n?/g,'\n');
let html=await readText(path.join(source,'preview.html'));
for(const name of ['enhancements.css','simple.css','planner.css','cool.css']){
 const tag='<link rel="stylesheet" href="'+name+'">';
 if(!html.includes(tag))throw Error('Missing stylesheet reference: '+name);
 html=html.replace(tag,'<style>\n'+await readText(path.join(source,name))+'\n</style>');
}
for(const name of ['data.js','catalogue.js','plan-engine.js','planner.js']){
 const tag='<script src="'+name+'"></script>';
 if(!html.includes(tag))throw Error('Missing script reference: '+name);
 html=html.replace(tag,'<script>\n'+await readText(path.join(source,name))+'\n</script>');
}
const output=path.join(frontend,'public/fitpilot-atlas/index.html');
if(process.argv.includes('--check')){
 if(await readText(output)!==html)throw Error('Published atlas is stale. Run node scripts/build-muscle-atlas.mjs');
 console.log('PASS: published atlas matches editable source');
}else{
 await mkdir(path.dirname(output),{recursive:true});await writeFile(output,html,'utf8');
 console.log('Built public/fitpilot-atlas/index.html');
}
