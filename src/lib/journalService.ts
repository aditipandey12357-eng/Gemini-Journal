import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Journal, JournalMessage, ReflectionEvolution, UserProfile } from "../types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Zero-Crash Payload Hygiene: Strip all undefined values from payload
function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Timestamp)) {
        cleaned[key] = sanitizePayload(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

// User Profile Management
export async function syncUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }): Promise<UserProfile> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, "users", user.uid);
  try {
    const snap = await getDoc(userRef);
    const now = new Date().toISOString();
    if (snap.exists()) {
      const data = snap.data();
      const updated: Partial<UserProfile> = {
        lastLoginAt: now,
        displayName: user.displayName || data.displayName || "Reflection Explorer",
        photoURL: user.photoURL || data.photoURL || null,
        email: user.email || data.email || null
      };
      await updateDoc(userRef, sanitizePayload(updated));
      return { ...data, ...updated } as UserProfile;
    } else {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Reflection Explorer",
        photoURL: user.photoURL,
        createdAt: now,
        lastLoginAt: now,
        streakCount: 1,
        totalJournals: 0
      };
      await setDoc(userRef, sanitizePayload(newProfile));
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
    throw error;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userPath = `users/${uid}`;
  const userRef = doc(db, "users", uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
    return null;
  }
}

// User-scoped Journal Management: /users/{uid}/journals
export async function getUserJournals(uid: string): Promise<Journal[]> {
  const journalsPath = `users/${uid}/journals`;
  const journalsRef = collection(db, "users", uid, "journals");
  const q = query(journalsRef, orderBy("updatedAt", "desc"), limit(100));
  try {
    const snap = await getDocs(q);
    const journals: Journal[] = [];
    snap.forEach((docSnap) => {
      journals.push({ id: docSnap.id, ...docSnap.data() } as Journal);
    });
    return journals;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, journalsPath);
    return [];
  }
}

export async function getJournal(uid: string, journalId: string): Promise<Journal | null> {
  const journalPath = `users/${uid}/journals/${journalId}`;
  const journalRef = doc(db, "users", uid, "journals", journalId);
  try {
    const snap = await getDoc(journalRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Journal;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, journalPath);
    return null;
  }
}

export async function createJournal(
  uid: string,
  initialData?: Partial<Journal>
): Promise<Journal> {
  const journalsPath = `users/${uid}/journals`;
  const journalsRef = collection(db, "users", uid, "journals");
  const newDocRef = doc(journalsRef);
  const now = new Date().toISOString();

  const newJournal: Journal = {
    id: newDocRef.id,
    userId: uid,
    title: initialData?.title || "New Reflection",
    summary: initialData?.summary || "Private reflection session.",
    mood: initialData?.mood || "Reflective",
    topics: initialData?.topics || ["Personal"],
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    lastMessagePreview: initialData?.lastMessagePreview || "",
    keyInsight: initialData?.keyInsight || ""
  };

  try {
    await setDoc(newDocRef, sanitizePayload(newJournal));
    return newJournal;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, journalsPath);
    throw error;
  }
}

export async function updateJournal(
  uid: string,
  journalId: string,
  data: Partial<Journal>
): Promise<void> {
  const journalPath = `users/${uid}/journals/${journalId}`;
  const journalRef = doc(db, "users", uid, "journals", journalId);
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  try {
    await updateDoc(journalRef, sanitizePayload(updateData));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, journalPath);
    throw error;
  }
}

export async function deleteJournal(uid: string, journalId: string): Promise<void> {
  const journalPath = `users/${uid}/journals/${journalId}`;
  try {
    // Delete all messages in the subcollection first
    const messagesRef = collection(db, "users", uid, "journals", journalId, "messages");
    const messagesSnap = await getDocs(messagesRef);
    const deletePromises = messagesSnap.docs.map((m) => deleteDoc(m.ref));
    await Promise.all(deletePromises);

    // Delete the journal document
    const journalRef = doc(db, "users", uid, "journals", journalId);
    await deleteDoc(journalRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, journalPath);
    throw error;
  }
}

// User-scoped Messages: /users/{uid}/journals/{journalId}/messages
export async function getJournalMessages(uid: string, journalId: string): Promise<JournalMessage[]> {
  const messagesPath = `users/${uid}/journals/${journalId}/messages`;
  const messagesRef = collection(db, "users", uid, "journals", journalId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  try {
    const snap = await getDocs(q);
    const messages: JournalMessage[] = [];
    snap.forEach((docSnap) => {
      messages.push({ id: docSnap.id, ...docSnap.data() } as JournalMessage);
    });
    return messages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, messagesPath);
    return [];
  }
}

export async function addJournalMessage(
  uid: string,
  journalId: string,
  message: { role: "user" | "assistant"; content: string; actionType?: JournalMessage["actionType"] }
): Promise<JournalMessage> {
  const messagesPath = `users/${uid}/journals/${journalId}/messages`;
  const messagesRef = collection(db, "users", uid, "journals", journalId, "messages");
  const newMsgRef = doc(messagesRef);
  const now = new Date().toISOString();

  const newMsg: JournalMessage = {
    id: newMsgRef.id,
    journalId,
    role: message.role,
    content: message.content,
    timestamp: now,
    actionType: message.actionType
  };

  try {
    await setDoc(newMsgRef, sanitizePayload(newMsg));

    // Update journal metadata
    const journalRef = doc(db, "users", uid, "journals", journalId);
    const preview = message.content.slice(0, 120);
    await updateDoc(journalRef, sanitizePayload({
      updatedAt: now,
      lastMessagePreview: preview
    }));

    return newMsg;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, messagesPath);
    throw error;
  }
}

// User-scoped Reflection Evolution Insights: /users/{uid}/evolutions
export async function saveEvolutionInsight(
  uid: string,
  data: Omit<ReflectionEvolution, "id" | "userId" | "timestamp">
): Promise<ReflectionEvolution> {
  const evolutionsPath = `users/${uid}/evolutions`;
  const evolutionsRef = collection(db, "users", uid, "evolutions");
  const newDocRef = doc(evolutionsRef);
  const now = new Date().toISOString();

  const evolution: ReflectionEvolution = {
    id: newDocRef.id,
    userId: uid,
    timestamp: now,
    ...data
  };

  try {
    await setDoc(newDocRef, sanitizePayload(evolution));
    return evolution;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, evolutionsPath);
    throw error;
  }
}

export async function getUserEvolutions(uid: string): Promise<ReflectionEvolution[]> {
  const evolutionsPath = `users/${uid}/evolutions`;
  const evolutionsRef = collection(db, "users", uid, "evolutions");
  const q = query(evolutionsRef, orderBy("timestamp", "desc"), limit(20));
  try {
    const snap = await getDocs(q);
    const evolutions: ReflectionEvolution[] = [];
    snap.forEach((docSnap) => {
      evolutions.push({ id: docSnap.id, ...docSnap.data() } as ReflectionEvolution);
    });
    return evolutions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, evolutionsPath);
    return [];
  }
}
