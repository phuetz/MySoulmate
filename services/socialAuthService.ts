import api from './api';

export const socialAuthService = {
  async loginWithGoogle(idToken: string) {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  }
};
