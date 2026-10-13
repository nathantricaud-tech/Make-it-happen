import {createClient,type Client,type InValue} from '@libsql/client/web';
import schema from './database-schema.json';
export class AppDatabase {
 private client?:Client;
 private ready?:Promise<void>;
 constructor(client?:Client){this.client=client;}
 private async connection(){
  if(!this.client){if(!process.env.TURSO_DATABASE_URL)throw new Error('DATABASE_UNAVAILABLE');this.client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});}
  const client=this.client;
  if(!this.ready)this.ready=client.batch(schema,'write').then(()=>{}).catch(e=>{this.ready=undefined;throw e});
  await this.ready;return client;
 }
 prepare(sql:string){return new AppStatement(this,sql);}
 async execute(sql:string,args:InValue[]){return (await this.connection()).execute({sql,args});}
 async batch(statements:AppStatement[]){const results=await (await this.connection()).batch(statements.map(s=>({sql:s.sql,args:s.args})),'write');return results.map(r=>({results:r.rows,meta:{changes:r.rowsAffected}}));}
}
export class AppStatement {
 constructor(private db:AppDatabase,public sql:string,public args:InValue[]=[]){ }
 bind(...args:InValue[]){return new AppStatement(this.db,this.sql,args);}
 async first<T=Record<string,any>>():Promise<T|null>{const r=await this.db.execute(this.sql,this.args);return r.rows[0] as T||null;}
 async all<T=Record<string,any>>(){const r=await this.db.execute(this.sql,this.args);return {results:r.rows as T[]};}
 async run(){const r=await this.db.execute(this.sql,this.args);return {meta:{changes:r.rowsAffected}};}
}
export const database=new AppDatabase();
