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
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Journal, JournalMessage, ReflectionEvolution, UserProfile } from "../types";

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
  const userRef = doc(db, "users", user.uid);
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
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// User-scoped Journal Management: /users/{uid}/journals
export async function getUserJournals(uid: string): Promise<Journal[]> {
  const journalsRef = collection(db, "users", uid, "journals");
  const q = query(journalsRef, orderBy("updatedAt", "desc"), limit(100));
  const snap = await getDocs(q);

  const journals: Journal[] = [];
  snap.forEach((docSnap) => {
    journals.push({ id: docSnap.id, ...docSnap.data() } as Journal);
  });
  return journals;
}

export async function getJournal(uid: string, journalId: string): Promise<Journal | null> {
  const journalRef = doc(db, "users", uid, "journals", journalId);
  const snap = await getDoc(journalRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Journal;
}

export async function createJournal(
  uid: string,
  initialData?: Partial<Journal>
): Promise<Journal> {
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

  await setDoc(newDocRef, sanitizePayload(newJournal));
  return newJournal;
}

export async function updateJournal(
  uid: string,
  journalId: string,
  data: Partial<Journal>
): Promise<void> {
  const journalRef = doc(db, "users", uid, "journals", journalId);
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  await updateDoc(journalRef, sanitizePayload(updateData));
}

export async function deleteJournal(uid: string, journalId: string): Promise<void> {
  // Delete all messages in the subcollection first
  const messagesRef = collection(db, "users", uid, "journals", journalId, "messages");
  const messagesSnap = await getDocs(messagesRef);
  const deletePromises = messagesSnap.docs.map((m) => deleteDoc(m.ref));
  await Promise.all(deletePromises);

  // Delete the journal document
  const journalRef = doc(db, "users", uid, "journals", journalId);
  await deleteDoc(journalRef);
}

// User-scoped Messages: /users/{uid}/journals/{journalId}/messages
export async function getJournalMessages(uid: string, journalId: string): Promise<JournalMessage[]> {
  const messagesRef = collection(db, "users", uid, "journals", journalId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  const snap = await getDocs(q);

  const messages: JournalMessage[] = [];
  snap.forEach((docSnap) => {
    messages.push({ id: docSnap.id, ...docSnap.data() } as JournalMessage);
  });
  return messages;
}

export async function addJournalMessage(
  uid: string,
  journalId: string,
  message: { role: "user" | "assistant"; content: string; actionType?: JournalMessage["actionType"] }
): Promise<JournalMessage> {
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

  await setDoc(newMsgRef, sanitizePayload(newMsg));

  // Update journal metadata
  const journalRef = doc(db, "users", uid, "journals", journalId);
  const preview = message.content.slice(0, 120);
  await updateDoc(journalRef, sanitizePayload({
    updatedAt: now,
    lastMessagePreview: preview
  }));

  return newMsg;
}

// User-scoped Reflection Evolution Insights: /users/{uid}/evolutions
export async function saveEvolutionInsight(
  uid: string,
  data: Omit<ReflectionEvolution, "id" | "userId" | "timestamp">
): Promise<ReflectionEvolution> {
  const evolutionsRef = collection(db, "users", uid, "evolutions");
  const newDocRef = doc(evolutionsRef);
  const now = new Date().toISOString();

  const evolution: ReflectionEvolution = {
    id: newDocRef.id,
    userId: uid,
    timestamp: now,
    ...data
  };

  await setDoc(newDocRef, sanitizePayload(evolution));
  return evolution;
}

export async function getUserEvolutions(uid: string): Promise<ReflectionEvolution[]> {
  const evolutionsRef = collection(db, "users", uid, "evolutions");
  const q = query(evolutionsRef, orderBy("timestamp", "desc"), limit(20));
  const snap = await getDocs(q);

  const evolutions: ReflectionEvolution[] = [];
  snap.forEach((docSnap) => {
    evolutions.push({ id: docSnap.id, ...docSnap.data() } as ReflectionEvolution);
  });
  return evolutions;
}
