import fs from 'node:fs';
const id=process.env.CLOUDFLARE_D1_ID,bucket=process.env.CLOUDFLARE_R2_BUCKET,origin=process.env.APP_ORIGIN;
if(!id||! /^[a-f0-9-]{36}$/.test(id)||/^0{8}-/.test(id))throw Error('Set CLOUDFLARE_D1_ID to your real D1 database ID.');
if(!bucket||! /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket))throw Error('Set CLOUDFLARE_R2_BUCKET.');
if(!origin||new URL(origin).origin!==origin||!origin.startsWith('https://'))throw Error('Set APP_ORIGIN to the final HTTPS origin without trailing slash.');
const config=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8'));
config.d1_databases[0].database_id=id;config.r2_buckets[0].bucket_name=bucket;config.vars={APP_ORIGIN:origin};
fs.writeFileSync('wrangler.jsonc',JSON.stringify(config,null,2)+'\n');
