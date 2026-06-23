"use server";

import { getAdminAuth, getAdminDb } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  try {
    const auth = await getAdminAuth();

    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION * 1000, // milliseconds
    });

    // Set cookie in the browser
    cookieStore.set("session", sessionCookie, {
      maxAge: SESSION_DURATION,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return { success: true as const };
  } catch (error) {
    console.error("Failed to create session cookie:", error);
    return {
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create session cookie.",
    };
  }
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    const db = await getAdminDb();

    // check if user exists in db
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    // save user to db
    await db.collection("users").doc(uid).set({
      name,
      email,
      // profileURL,
      // resumeURL,
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error?.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    if (error?.code === "auth/invalid-credential") {
      return {
        success: false,
        message:
          "Firebase Admin credentials are invalid or incomplete. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
      };
    }

    return {
      success: false,
      message: error?.message
        ? `Failed to create account: ${error.message}`
        : "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    const auth = await getAdminAuth();

    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord)
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };

    const sessionResult = await setSessionCookie(idToken);
    if (!sessionResult.success) {
      return {
        success: false,
        message: sessionResult.message,
      };
    }

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error: any) {
    console.error("Error logging in user:", error);

    if (error?.code === "auth/invalid-credential") {
      return {
        success: false,
        message:
          "Firebase Admin credentials are invalid or incomplete. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
      };
    }

    return {
      success: false,
      message: error?.message
        ? `Failed to log into account: ${error.message}`
        : "Failed to log into account. Please try again.",
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const auth = await getAdminAuth();
    const db = await getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // get user info from db
    let userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    if (!userRecord.exists) {
      // Auto-create missing user document if sign-up was previously interrupted
      await db.collection("users").doc(decodedClaims.uid).set({
        name: decodedClaims.name || decodedClaims.email?.split("@")[0] || "User",
        email: decodedClaims.email || "",
      });
      userRecord = await db.collection("users").doc(decodedClaims.uid).get();
    }

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.log(error);

    // Invalid or expired session
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}
