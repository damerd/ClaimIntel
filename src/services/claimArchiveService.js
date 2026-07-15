import { base44 } from "@/api/base44Client";
import { AppError, normalizeError } from "@/lib/appError";

const REVIEW_LIMIT = 100;

export async function listClaimReviews() {
  try {
    return await base44.entities.ClaimReview.list("-created_date", REVIEW_LIMIT);
  } catch (error) {
    throw normalizeError(error, "Claim reports could not be loaded. Refresh the page and try again.");
  }
}

export async function getClaimReview(reviewId) {
  if (!reviewId) {
    throw new AppError("A report identifier is required.", {
      code: "REVIEW_ID_REQUIRED",
      userMessage: "The requested report could not be identified.",
    });
  }

  try {
    const reviews = await base44.entities.ClaimReview.filter({ id: reviewId });
    return reviews[0] ?? null;
  } catch (error) {
    throw normalizeError(error, "The claim report could not be loaded. Refresh the page and try again.");
  }
}

export async function archiveClaimReview(reviewId) {
  try {
    return await base44.entities.ClaimReview.update(reviewId, { status: "archived" });
  } catch (error) {
    throw normalizeError(error, "The report could not be archived. Try again.");
  }
}

export async function deleteClaimReview(reviewId) {
  try {
    return await base44.entities.ClaimReview.delete(reviewId);
  } catch (error) {
    throw normalizeError(error, "The report could not be deleted. Try again.");
  }
}
