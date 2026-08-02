import { rawBase44 } from "@/api/rawBase44Client";
import { claimReviewEntityAdapter } from "@/api/claimReviewEntityAdapter";

const entities = new Proxy(rawBase44.entities, {
  get(target, property, receiver) {
    if (property === "ClaimReview") return claimReviewEntityAdapter;
    return Reflect.get(target, property, receiver);
  },
});

/**
 * Application client. ClaimReview calls are routed through a compatibility
 * adapter so existing screens use the enhanced database architecture without
 * being rewritten all at once. All other SDK resources remain unchanged.
 */
export const base44 = new Proxy(rawBase44, {
  get(target, property, receiver) {
    if (property === "entities") return entities;
    return Reflect.get(target, property, receiver);
  },
});
