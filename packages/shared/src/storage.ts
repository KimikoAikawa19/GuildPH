export interface HostedImageStorage {
  putImage(input: {
    key: string;
    contentType: "image/jpeg" | "image/png" | "image/webp";
    data: Uint8Array;
  }): Promise<string>;

  deleteImage(key: string): Promise<void>;
}
