import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){ const {adminOverview}=await import('../lib/accounts/admin');const {getAccountPool}=await import('../lib/accounts/database');try {const data=await adminOverview('qa-account-');console.log('Administrator SQL verified; page size:',data.pageSize);}finally{await getAccountPool().end();}}
main().catch(e=>{console.error(e.name,e.message);process.exitCode=1;});

