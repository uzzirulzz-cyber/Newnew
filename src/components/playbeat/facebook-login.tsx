"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Loader2, LogOut } from "lucide-react";
import { withFacebookSDK } from "./meta-pixel";
import { toast } from "sonner";

interface FbUser {
  userID: string;
  name: string;
  email?: string;
  picture?: string;
  accessToken: string;
}

/**
 * Facebook Login Button (Login for Business).
 *
 * Uses the Facebook JavaScript SDK with a Configuration ID (config_id)
 * instead of manually specifying scopes. The scopes are configured in the
 * Facebook App Dashboard → Facebook Login → Settings → Configuration.
 *
 * Config ID: 1768887737439036
 * App ID: 1768887737439036
 *
 * After login, the user's name + avatar are displayed with a logout button.
 * The login status is checked on page load via FB.getLoginStatus().
 *
 * Docs: https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business
 */
export function FacebookLogin() {
  const [user, setUser] = React.useState<FbUser | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Check login status on mount
  React.useEffect(() => {
    withFacebookSDK((FB) => {
      FB.getLoginStatus((response: any) => {
        if (response.status === "connected") {
          fetchUserInfo(FB, response.authResponse);
        }
      });
    });
  }, []);

  const fetchUserInfo = (FB: any, authResponse: any) => {
    FB.api(
      "/me",
      { fields: "id,name,email,picture" },
      (userInfo: any) => {
        if (userInfo && !userInfo.error) {
          setUser({
            userID: authResponse.userID,
            name: userInfo.name || "Facebook User",
            email: userInfo.email,
            picture: userInfo.picture?.data?.url,
            accessToken: authResponse.accessToken,
          });
        }
      },
    );
  };

  const handleLogin = () => {
    setLoading(true);
    withFacebookSDK((FB) => {
      FB.login(
        (response: any) => {
          setLoading(false);
          if (response.status === "connected") {
            fetchUserInfo(FB, response.authResponse);
            toast.success("Logged in with Facebook");
          } else if (response.status === "not_authorized") {
            toast.error("Please authorize the app to log in");
          } else {
            toast.error("Facebook login cancelled");
          }
        },
        { config_id: "1768887737439036" },
      );
    });
  };

  const handleLogout = () => {
    withFacebookSDK((FB) => {
      FB.logout(() => {
        setUser(null);
        toast.success("Logged out of Facebook");
      });
    });
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-1.5">
        <Loader2 size={14} className="animate-spin" />
        Connecting…
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="size-6 rounded-full border"
          />
        )}
        <span className="text-xs font-medium hidden sm:inline">
          {user.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-1 text-muted-foreground"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogin}
      className="gap-1.5 border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2]/10"
    >
      <Facebook size={14} />
      <span className="hidden sm:inline">Login with Facebook</span>
      <span className="sm:hidden">FB</span>
    </Button>
  );
}
