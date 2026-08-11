import { createHash, randomBytes } from "crypto";

export function hashInviteCode(inviteCode: string) {
  return createHash("sha256").update(inviteCode.trim()).digest("hex");
}

export function createInviteCode() {
  return `PROPHY-BETA-${randomBytes(9).toString("base64url").toUpperCase()}`;
}
