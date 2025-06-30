interface UploadResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  uploadId?: string;
}

interface VideoMetadata {
  fileName: string;
  fileSize: number;
  duration: number;
  width: number;
  height: number;
  uploadDate: string;
}

class VideoUploadService {
  private readonly STORAGE_KEY = "uploaded-videos";
  private uploadedVideos: Map<
    string,
    { url: string; metadata: VideoMetadata }
  > = new Map();

  constructor() {
    this.loadStoredVideos();
  }

  // Upload video and generate viewable link
  async uploadVideo(file: File, analysisId: string): Promise<UploadResult> {
    try {
      console.log(
        `Uploading video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );

      // Get video metadata
      const metadata = await this.getVideoMetadata(file);

      // Create object URL for local viewing
      const videoUrl = URL.createObjectURL(file);

      // Generate thumbnail
      const thumbnailUrl = await this.generateThumbnail(file);

      // Store video reference
      const uploadId = `video_${analysisId}_${Date.now()}`;
      this.uploadedVideos.set(uploadId, {
        url: videoUrl,
        metadata: {
          ...metadata,
          fileName: file.name,
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
        },
      });

      // Save to localStorage for persistence
      this.saveStoredVideos();

      // In a real implementation, you would upload to a cloud service like:
      // - Firebase Storage
      // - AWS S3
      // - Google Cloud Storage
      // - Cloudinary
      // For now, we'll use local object URLs with a fallback system

      return {
        success: true,
        videoUrl: this.createShareableLink(uploadId),
        thumbnailUrl,
        uploadId,
      };
    } catch (error) {
      console.error("Video upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown upload error",
      };
    }
  }

  // Get video metadata
  private async getVideoMetadata(
    file: File,
  ): Promise<Omit<VideoMetadata, "fileName" | "fileSize" | "uploadDate">> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error("Failed to load video metadata"));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  }

  // Generate video thumbnail
  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Seek to 10% of video duration for thumbnail
        video.currentTime = video.duration * 0.1;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(thumbnailUrl);
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error("Failed to generate thumbnail"));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  }

  // Create shareable link (in real implementation, this would be a cloud URL)
  private createShareableLink(uploadId: string): string {
    // In a real implementation, this would return a cloud storage URL
    // For now, we'll create a reference that can be used within the app
    const baseUrl = window.location.origin;
    return `${baseUrl}/video/${uploadId}`;
  }

  // Get video by upload ID
  getVideo(uploadId: string): { url: string; metadata: VideoMetadata } | null {
    return this.uploadedVideos.get(uploadId) || null;
  }

  // Get all uploaded videos
  getAllVideos(): Array<{ id: string; url: string; metadata: VideoMetadata }> {
    return Array.from(this.uploadedVideos.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  // Delete uploaded video
  deleteVideo(uploadId: string): boolean {
    const video = this.uploadedVideos.get(uploadId);
    if (video) {
      URL.revokeObjectURL(video.url);
      this.uploadedVideos.delete(uploadId);
      this.saveStoredVideos();
      return true;
    }
    return false;
  }

  // Load stored videos from localStorage
  private loadStoredVideos(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Note: Object URLs are not persistent across sessions
        // In a real implementation, you would restore from cloud storage
        this.uploadedVideos = new Map(data);
      }
    } catch (error) {
      console.error("Error loading stored videos:", error);
    }
  }

  // Save video references to localStorage
  private saveStoredVideos(): void {
    try {
      const data = Array.from(this.uploadedVideos.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving video references:", error);
    }
  }

  // Upload to cloud service (placeholder for real implementation)
  async uploadToCloud(
    file: File,
    provider: "firebase" | "aws" | "cloudinary" = "firebase",
  ): Promise<string> {
    // This is where you would implement actual cloud upload
    // For now, return a placeholder URL

    switch (provider) {
      case "firebase":
        return await this.uploadToFirebase(file);
      case "aws":
        return await this.uploadToAWS(file);
      case "cloudinary":
        return await this.uploadToCloudinary(file);
      default:
        throw new Error("Unsupported cloud provider");
    }
  }

  // Firebase Storage upload (placeholder)
  private async uploadToFirebase(file: File): Promise<string> {
    // Real Firebase implementation would be:
    /*
    import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    
    const storage = getStorage();
    const videoRef = ref(storage, `videos/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(videoRef, file);
    return await getDownloadURL(snapshot.ref);
    */

    // Placeholder implementation
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate upload
    return `https://firebasestorage.googleapis.com/videos/${Date.now()}_${file.name}`;
  }

  // AWS S3 upload (placeholder)
  private async uploadToAWS(file: File): Promise<string> {
    // Real AWS implementation would use AWS SDK
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate upload
    return `https://your-bucket.s3.amazonaws.com/videos/${Date.now()}_${file.name}`;
  }

  // Cloudinary upload (placeholder)
  private async uploadToCloudinary(file: File): Promise<string> {
    // Real Cloudinary implementation
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate upload
    return `https://res.cloudinary.com/your-cloud/video/upload/v1/${Date.now()}_${file.name}`;
  }

  // Generate embeddable video player HTML
  generateEmbedCode(uploadId: string): string {
    const video = this.getVideo(uploadId);
    if (!video) return "";

    return `
      <video controls width="640" height="360" preload="metadata">
        <source src="${video.url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;
  }

  // Get video stats
  getStats(): {
    totalVideos: number;
    totalSize: number;
    totalDuration: number;
    averageFileSize: number;
  } {
    const videos = this.getAllVideos();
    const totalSize = videos.reduce(
      (sum, video) => sum + video.metadata.fileSize,
      0,
    );
    const totalDuration = videos.reduce(
      (sum, video) => sum + video.metadata.duration,
      0,
    );

    return {
      totalVideos: videos.length,
      totalSize,
      totalDuration,
      averageFileSize: videos.length > 0 ? totalSize / videos.length : 0,
    };
  }
}

// Singleton instance
export const videoUploadService = new VideoUploadService();

// Helper functions
export const videoHelpers = {
  // Format duration
  formatDuration: (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // Validate video file
  isValidVideoFile: (file: File): boolean => {
    const validTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/avi",
      "video/mov",
    ];
    return validTypes.includes(file.type);
  },

  // Get video quality based on resolution
  getVideoQuality: (width: number, height: number): string => {
    if (width >= 1920) return "1080p+";
    if (width >= 1280) return "720p";
    if (width >= 854) return "480p";
    if (width >= 640) return "360p";
    return "240p";
  },
};

export type { UploadResult, VideoMetadata };
