import { describe, expect, it } from "vitest";
import {
  parseDirectParticipantNames,
  participantFeedbackSourceFromMutation,
} from "@/app/actions/shared-action-utils";

describe("shared action participant parsing", () => {
  it("keeps quick-add exact names that contain hyphens as one participant", () => {
    expect(parseDirectParticipantNames("크리티컬멤버A-moqzcrpd")).toEqual([
      "크리티컬멤버A-moqzcrpd",
    ]);
  });

  it("splits manual multi-name input only by explicit delimiters", () => {
    expect(parseDirectParticipantNames("장영실, 이순신\n허준")).toEqual([
      "장영실",
      "이순신",
      "허준",
    ]);
  });

  it("classifies quick mutation sources separately from manual input", () => {
    expect(participantFeedbackSourceFromMutation("quick-assign")).toBe("quick");
    expect(participantFeedbackSourceFromMutation("quick-add")).toBe("quick");
    expect(participantFeedbackSourceFromMutation("manual-add")).toBe("manual");
  });
});
