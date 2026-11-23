import test from "node:test";
import assert from "node:assert/strict";
import { explainWithOptionalAi, ruleBasedExplanation } from "../src/lib/ai.mjs";

test("optional AI explanations remain local and deterministic without credentials",async()=>{
 const keys=["AI_API_URL","AI_API_KEY","AI_MODEL"],previous=keys.map(key=>process.env[key]);for(const key of keys)delete process.env[key];
 try{const rows=[{sku:"ABC",stock:2,avg_monthly:4,suggested_quantity:4,explanation:"test"}],expected=ruleBasedExplanation("replenishment",rows),result=await explainWithOptionalAi("replenishment",rows);assert.equal(result.mode,"RULE_BASED");assert.equal(result.explanation,expected);}finally{keys.forEach((key,index)=>previous[index]===undefined?delete process.env[key]:process.env[key]=previous[index]);}
});
test("optional AI refuses an insecure remote endpoint and falls back locally",async()=>{
 const previous=[process.env.AI_API_URL,process.env.AI_API_KEY,process.env.AI_MODEL];process.env.AI_API_URL="http://example.com/api";process.env.AI_API_KEY="test";process.env.AI_MODEL="model";
 try{const result=await explainWithOptionalAi("supplier-comparison",[{sku:"ABC",unit_price_cents:1200,score:88,supplier:"Demo",delivery_days:2,reliability:95}]);assert.equal(result.mode,"RULE_BASED");assert.match(result.explanation,/ABC/);}finally{["AI_API_URL","AI_API_KEY","AI_MODEL"].forEach((key,index)=>previous[index]===undefined?delete process.env[key]:process.env[key]=previous[index]);}
});
