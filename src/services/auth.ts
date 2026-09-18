import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types/lorebound";

export interface SignUpResult {
  user: User;
  requiresEmailConfirmation: boolean;
}

function createInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "LB";
}

export function mapSupabaseUser(
  user: SupabaseUser,
): User {
  const email = user.email ?? "";
  const emailName = email.split("@")[0] ?? "Writer";

  const displayNameValue =
    user.user_metadata["display_name"];

  const penNameValue =
    user.user_metadata["pen_name"];

  const name =
    typeof displayNameValue === "string"
      ? displayNameValue
      : emailName;

  const baseUser: User = {
    id: user.id,
    name,
    email,
    initials: createInitials(name),
    joinedAt: user.created_at,
  };

  if (
    typeof penNameValue === "string" &&
    penNameValue.trim()
  ) {
    return {
      ...baseUser,
      penName: penNameValue,
    };
  }

  return baseUser;
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Supabase did not return a user.");
    }

    return mapSupabaseUser(data.user);
  },

  async signup(
    name: string,
    email: string,
    password: string,
  ): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: name.trim(),
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Supabase did not create the user.");
    }

    return {
      user: mapSupabaseUser(data.user),
      requiresEmailConfirmation: data.session === null,
    };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user ? mapSupabaseUser(data.user) : null;
  },

  async requestPasswordReset(
    email: string,
  ): Promise<{ sentTo: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      sentTo: email.trim(),
    };
  },
};