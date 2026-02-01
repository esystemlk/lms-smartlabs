import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const BUNNY_STREAM_URL = "https://video.bunnycdn.com/library";

export const bunnyService = {
  async getSettings() {
    const docRef = doc(db, "settings", "general");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    throw new Error("System settings not configured. Please set up Bunny.net in Settings.");
  },

  async createVideo(title: string) {
    const settings = await this.getSettings();
    const { bunnyLibraryId, bunnyApiKey } = settings;

    if (!bunnyLibraryId || !bunnyApiKey) {
      throw new Error("Bunny.net credentials missing in Settings.");
    }

    const response = await fetch(`${BUNNY_STREAM_URL}/${bunnyLibraryId}/videos`, {
      method: "POST",
      headers: {
        "AccessKey": bunnyApiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create video object");
    }

    return await response.json(); // Returns { guid, ... }
  },

  async uploadVideo(file: File, videoId: string, onProgress?: (percent: number) => void) {
    const settings = await this.getSettings();
    const { bunnyLibraryId, bunnyApiKey } = settings;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `${BUNNY_STREAM_URL}/${bunnyLibraryId}/videos/${videoId}`, true);
      xhr.setRequestHeader("AccessKey", bunnyApiKey);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });
  },

  async getVideos(page = 1, itemsPerPage = 100, search = "") {
    const settings = await this.getSettings();
    const { bunnyLibraryId, bunnyApiKey } = settings;

    if (!bunnyLibraryId || !bunnyApiKey) return { items: [] };

    const url = new URL(`${BUNNY_STREAM_URL}/${bunnyLibraryId}/videos`);
    url.searchParams.append("page", page.toString());
    url.searchParams.append("itemsPerPage", itemsPerPage.toString());
    if (search) url.searchParams.append("search", search);
    url.searchParams.append("orderBy", "date");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "AccessKey": bunnyApiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
        // Handle case where library might be empty or invalid credentials gracefully if possible, or throw
        throw new Error("Failed to fetch videos from Bunny.net");
    }

    return await response.json();
  },

  async deleteVideo(videoId: string) {
    const settings = await this.getSettings();
    const { bunnyLibraryId, bunnyApiKey } = settings;

    const response = await fetch(`${BUNNY_STREAM_URL}/${bunnyLibraryId}/videos/${videoId}`, {
      method: "DELETE",
      headers: {
        "AccessKey": bunnyApiKey,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete video");
    }
    return true;
  },

  getVideoUrl(videoId: string, cdnHostname?: string) {
    // If cdnHostname is provided (e.g. video.smartlabs.com), use it.
    // Otherwise construct default? Bunny usually gives a pull zone URL.
    // For Stream, it's usually: https://{env}.b-cdn.net/{videoId}/playlist.m3u8
    // But better to use the Embed or Direct Play url.
    // We'll rely on the user settings or return the GUID for the player component to handle.
    return videoId; 
  }
};
