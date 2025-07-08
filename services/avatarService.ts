import api from './api';

export async function generateAvatar(imageUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: 'photo.jpg',
    type: 'image/jpeg'
  } as any);

  const response = await api.post('/avatars/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.avatarUrl;
}
