import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { SystemSettings } from "@/lib/types";

const SETTINGS_DOC_ID = "global";
const COLLECTION_NAME = "settings";

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    try {
      const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as SystemSettings;
      } else {
        // Initialize default settings if they don't exist
        const defaultSettings: SystemSettings = {
          id: SETTINGS_DOC_ID,
          siteName: "SMART LABS",
          maintenanceMode: false,
          supportEmail: "support@smartlabs.com",
          updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      throw error;
    }
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
      await updateDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  },
};
