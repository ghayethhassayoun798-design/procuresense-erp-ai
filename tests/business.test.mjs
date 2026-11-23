import test from "node:test";
import assert from "node:assert/strict";
import { applyStockMovement, calculateOrderTotal, estimatedGrossMargin, replenishmentQuantity, remainingBalance, roleAllowed, scoreSupplierOffer, validatePayment } from "../src/lib/business.mjs";

test("order totals use integer cents and reject invalid lines", () => {
  assert.equal(calculateOrderTotal([{quantity:2,unitPriceCents:199},{quantity:3,unitPriceCents:50}]),548);
  assert.throws(()=>calculateOrderTotal([{quantity:-1,unitPriceCents:10}]),/Invalid/);
});
test("stock movement prevents a negative quantity", () => {
  assert.equal(applyStockMovement(7,-3),4);
  assert.throws(()=>applyStockMovement(2,-3),/negative/);
});
test("invoice balances and payments enforce the open balance", () => {
  assert.equal(remainingBalance(10000,3500),6500);
  assert.equal(validatePayment(10000,3500,2000),4500);
  assert.throws(()=>validatePayment(10000,3500,6501),/exceeds/);
});
test("replenishment targets the requested coverage and never orders below zero", () => {
  assert.equal(replenishmentQuantity(4,10,1.5),11);
  assert.equal(replenishmentQuantity(30,10,1.5),0);
  assert.throws(()=>replenishmentQuantity(-1,10),/Invalid/);
});
test("supplier score rewards price, quality and reliability transparently", () => {
  const prices=[1000,1500];
  assert.ok(scoreSupplierOffer({unit_price_cents:1000,reliability:95,quality:5,delivery_days:2},prices)>scoreSupplierOffer({unit_price_cents:1500,reliability:70,quality:3,delivery_days:10},prices));
});
test("gross margin and role gate match documented rules", () => {
  assert.equal(estimatedGrossMargin(10000,.62),3800);
  assert.equal(roleAllowed("ACCOUNTANT",["ADMIN","ACCOUNTANT"]),true);
  assert.equal(roleAllowed("BI_VIEWER",["ADMIN","ACCOUNTANT"]),false);
});

test("supplier scoring rejects empty or invalid comparison sets",()=>{
  assert.throws(()=>scoreSupplierOffer({unit_price_cents:10,reliability:80,quality:4,delivery_days:2},[]),/Invalid/);
  assert.throws(()=>scoreSupplierOffer({unit_price_cents:10,reliability:80,quality:4,delivery_days:2},[10,-1]),/Invalid/);
});
