"use client";

import { useClerk, useSignIn, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function GithubAppCallback() {
  // GitHub apps have a unique oauth pattern the user starts the process from
  // github.com instead of from your application

  // Clerk's SDK doesn't have first-class support for this, but the following
  // snippet patches in the necessary behavior.

  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();

  const searchParams = useSearchParams();
  const oauthCode = searchParams.get("code") as string;
  const installationId = searchParams.get("installation_id");
  const redirectUrl = `/onboarding/step2?installation_id=${installationId}`;

  const getCallbackUrl = (verificationUrl: URL, code: string) => {
    const callbackUrl = new URL(
      verificationUrl.searchParams.get("redirect_uri") as string
    );
    callbackUrl.searchParams.set(
      "state",
      verificationUrl.searchParams.get("state") as string
    );
    callbackUrl.searchParams.set("code", code);
    return callbackUrl.href;
  };

  useEffect(() => {
    async function effect() {
      if (!isUserLoaded || !isSignInLoaded) {
        return;
      }
      let callbackUrl;
      if (isSignedIn) {
        const newExternalAccount = await user.createExternalAccount({
          strategy: "oauth_github",
          redirectUrl: redirectUrl,
        });
        const verificationUrl = newExternalAccount.verification
          ?.externalVerificationRedirectURL as URL;
        window.location.href = getCallbackUrl(
          verificationUrl,
          oauthCode as string
        );
      } else {
        const newSignIn = await signIn.create({
          strategy: "oauth_github",
          redirectUrl: `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}/sso-callback`,
          actionCompleteRedirectUrl: redirectUrl,
        });
        const verificationUrl = newSignIn.firstFactorVerification
          .externalVerificationRedirectURL as URL;
        window.location.href = getCallbackUrl(
          verificationUrl,
          oauthCode as string
        );
      }
    }
    effect();
  }, [user, signIn, isSignedIn, isSignInLoaded, isUserLoaded]);

  return null;
}
