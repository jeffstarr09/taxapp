import ChallengeClient from "./ChallengeClient";

export async function generateStaticParams() {
  return [{ id: "_placeholder" }];
}

export const dynamicParams = process.env.BUILD_TARGET !== "mobile";

export default function ChallengePage() {
  return <ChallengeClient />;
}
