import { PROFILETYPE } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiCoreFoundation } from './SupabaseApi.core.foundation';
export interface SupabaseApiCoreStorage {
  [key: string]: any;
}
export class SupabaseApiCoreStorage extends SupabaseApiCoreFoundation {
  async addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE,
  ): Promise<string | null> {
    const extension = file.name.split('.').pop(); // Get file extension
    const newName = `ProfilePicture_${profileType}_${Date.now()}.${extension}`; // Rename the file
    const folderName = encodeURIComponent(String(id));
    const filePath = `${profileType}/${folderName}/${newName}`; // Path inside the bucket
    // Attempt to delete existing files
    const removeResponse = await this.supabase?.storage
      .from('profile-images')
      .remove(
        (
          await this.supabase?.storage
            .from('profile-images')
            .list(`${profileType}/${folderName}`, { limit: 2 })
        )?.data?.map((file) => `${profileType}/${folderName}/${file.name}`) ||
          [],
      );
    // Convert File to Blob (necessary for renaming)
    const renamedFile = new File([file], newName, { type: file.type });
    // Upload the new file (allow overwrite)
    const uploadResponse = await this.supabase?.storage
      .from('profile-images')
      .upload(filePath, renamedFile, { upsert: true });
    if (uploadResponse?.error) {
      logger.error('Error uploading file:', uploadResponse.error.message);
      return null;
    }
    // Get the Public URL of the uploaded file
    const urlData = this.supabase?.storage
      .from('profile-images')
      .getPublicUrl(filePath);
    const imageUrl = urlData?.data.publicUrl;
    return imageUrl || null;
  }

  async uploadSchoolVisitMediaFile(params: {
    schoolId: string;
    file: File;
  }): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized.');
    }

    const { schoolId, file } = params;
    const filePath = `${file.name}`;

    const uploadResponse = await this.supabase.storage
      .from('school-visits')
      .upload(filePath, file, { upsert: true });

    if (uploadResponse.error) {
      logger.error('Error uploading school visit media:', uploadResponse.error);
      throw uploadResponse.error;
    }

    const urlData = this.supabase.storage
      .from('school-visits')
      .getPublicUrl(filePath);

    const publicUrl = urlData.data.publicUrl;
    if (!publicUrl) {
      throw new Error('Failed to generate public URL for uploaded media.');
    }

    return publicUrl;
  }
}
