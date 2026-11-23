import test from "node:test";
import assert from "node:assert/strict";
import { passwordHash, passwordMatches } from "../src/lib/auth.mjs";
import { roleAllowed } from "../src/lib/business.mjs";
import { movementSchema, orderCreateSchema, paymentSchema, productCreateSchema, userCreateSchema } from "../src/lib/schemas.mjs";

test("password hashes use unique salts and reject incorrect passwords",()=>{
 const first=passwordHash("Correct-Horse-42!"),second=passwordHash("Correct-Horse-42!");
 assert.notEqual(first,second);
 assert.equal(passwordMatches("Correct-Horse-42!",first),true);
 assert.equal(passwordMatches("wrong",first),false);
});
test("server role checks reject read-only and unrelated roles",()=>{
 assert.equal(roleAllowed("PURCHASING_MANAGER",["ADMIN","PURCHASING_MANAGER"]),true);
 assert.equal(roleAllowed("BI_VIEWER",["ADMIN","PURCHASING_MANAGER"]),false);
 assert.equal(roleAllowed("SALES_MANAGER",["ADMIN","ACCOUNTANT"]),false);
});
test("product validation accepts cents precision and rejects excessive decimals",()=>{
 assert.equal(productCreateSchema.parse({name:"Article",price:"12.50",minimum:"4"}).price,1250);
 assert.equal(productCreateSchema.safeParse({name:"Article",price:"12.501",minimum:4}).success,false);
 assert.equal(productCreateSchema.safeParse({name:" ",price:-1,minimum:-2}).success,false);
});
test("order schemas enforce valid lines and reject unrecognized properties",()=>{
 assert.equal(orderCreateSchema.safeParse({type:"sales",items:[{productId:1,quantity:2}]}).success,true);
 assert.equal(orderCreateSchema.safeParse({type:"sales",items:[{productId:1,quantity:0}]}).success,false);
 assert.equal(orderCreateSchema.safeParse({type:"sales",items:[],isAdmin:true}).success,false);
});
test("movement and payment schemas prevent zero, negative and fractional cents",()=>{
 assert.equal(movementSchema.safeParse({productId:1,quantity:0}).success,false);
 assert.equal(paymentSchema.safeParse({invoiceId:1,amount:"10.005"}).success,false);
 assert.equal(paymentSchema.parse({invoiceId:1,amount:"10.05"}).amount,1005);
});
test("user schema prevents administrator privilege escalation",()=>{
 const user={name:"Employee",email:"employee@example.test",password:"At-least-12-char",role:"ACCOUNTANT"};
 assert.equal(userCreateSchema.safeParse(user).success,true);
 assert.equal(userCreateSchema.safeParse({...user,role:"ADMIN"}).success,false);
});
