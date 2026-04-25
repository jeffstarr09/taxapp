import ProfileClient from "./ProfileClient";

export async function generateStaticParams() {
  return [{ username: "_placeholder" }];
}

export const dynamicParams = process.env.BUILD_TARGET !== "mobile";

export default function PublicProfilePage() {
  return <ProfileClient />;
}
