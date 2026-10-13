import nextEnv from '@next/env';
import { Pool } from 'pg';
import { readFile,writeFile } from 'node:fs/promises';
import path from 'node:path';
nextEnv.loadEnvConfig(process.cwd());
const email=process.argv[2]?.trim().toLowerCase();
if(!email)throw new Error('请提供已注册的管理员邮箱。');
const pool=new Pool({connectionString:process.env.AUTH_DATABASE_URL||process.env.DATABASE_URL,max:1});
try {
  const result=await pool.query('SELECT id FROM perfume_user WHERE lower(email)=$1',[email]);
  if(result.rows.length!==1)throw new Error('没有找到唯一对应的已注册账号，请先注册后再配置。');
  for(const folder of ['aroma-agent','perfume_agent','perfume_agent_hardware']) {
    const file=path.resolve('..',folder,'.env.local');
    const source=await readFile(file,'utf8');
    const lines=source.split(/\r?\n/).filter(line=>!line.startsWith('ADMIN_USER_IDS=')).filter(Boolean);
    lines.push(`ADMIN_USER_IDS=${result.rows[0].id}`);
    await writeFile(file,lines.join('\n')+'\n','utf8');
  }
  console.log('指定账号的本地管理员权限已配置；没有修改生产环境。');
} finally {await pool.end();}
