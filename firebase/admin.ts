type AdminServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type AdminClients = {
  auth: Awaited<ReturnType<typeof import("firebase-admin/auth").getAuth>>;
  db: Awaited<ReturnType<typeof import("firebase-admin/firestore").getFirestore>>;
};

let adminClientsPromise: Promise<AdminClients> | null = null;

function normalizePrivateKey(privateKey?: string) {
  return privateKey?.replace(/\\n/g, "\n");
}

function getServiceAccount(): AdminServiceAccount {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };

      if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_KEY is missing project_id, client_email, or private_key."
        );
      }

      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: normalizePrivateKey(parsed.private_key)!,
      };
    } catch (error) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON for a Firebase service account.",
        { cause: error }
      );
    }
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  const missingVars = [
    !projectId && "FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID)",
    !clientEmail && "FIREBASE_CLIENT_EMAIL",
    !privateKey && "FIREBASE_PRIVATE_KEY",
  ].filter(Boolean);

  if (missingVars.length) {
    throw new Error(
      `Missing Firebase Admin environment variables: ${missingVars.join(", ")}.`
    );
  }

  return {
    projectId: projectId!,
    clientEmail: clientEmail!,
    privateKey: privateKey!,
  };
}

async function initFirebaseAdmin(): Promise<AdminClients> {
  if (!adminClientsPromise) {
    adminClientsPromise = (async () => {
      const [{ initializeApp, getApps, cert }, { getAuth }, { getFirestore }] =
        await Promise.all([
          import("firebase-admin/app"),
          import("firebase-admin/auth"),
          import("firebase-admin/firestore"),
        ]);

      const apps = getApps();

      if (!apps.length) {
        const serviceAccount = getServiceAccount();

        initializeApp({
          credential: cert(serviceAccount),
        });
      }

      return {
        auth: getAuth(),
        db: getFirestore(),
      };
    })();
  }

  return adminClientsPromise;
}

export async function getAdminAuth() {
  return (await initFirebaseAdmin()).auth;
}

export async function getAdminDb() {
  return (await initFirebaseAdmin()).db;
}
