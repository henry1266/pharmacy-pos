import axios from 'axios';

const API_URL = '/api/auth';

/**
 * Logs in a user.
 * @param {object} credentials - The user's credentials.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's password.
 * @returns {Promise<object>} A promise that resolves to the login response data (including token and user info).
 * @throws {Error} If the login request fails.
 */
export const login = async ({ email, password }) => {
  try {
    const response = await axios.post(API_URL, {
      email,
      password,
    });
    // The response should contain { token, user }
    if (response.data?.token && response.data?.user) {
      return response.data;
    } else {
      throw new Error('登入失敗，未收到完整的驗證資訊。');
    }
  } catch (err) {
    console.error('登入失敗 (service):', err);
    // Re-throw a more specific error message if available
    const errorMessage =
      err.response?.data?.msg ||
      (err.response?.data?.errors?.map(e => e.msg).join(', ')) ||
      '登入失敗，請檢查您的憑證或稍後再試。';
    throw new Error(errorMessage);
  }
};

const authService = {
  login,
};

export default authService;

