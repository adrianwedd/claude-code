import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_CONFIG, STORAGE_KEYS, HTTP_STATUS} from '@/constants';
import {APIResponse, PaginatedResponse, User, Project, Session, ChatMessage, CIStatus} from '@/types';

class APIService {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<APIResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === HTTP_STATUS.UNAUTHORIZED) {
          // Token expired, redirect to login
          await this.clearAuthData();
          throw new Error('Authentication expired');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error(`API request failed (attempt ${attempt}):`, error);

      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        await this.delay(1000 * attempt);
        return this.request<T>(endpoint, options, attempt + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private shouldRetry(error: any): boolean {
    return (
      error.name === 'AbortError' ||
      error.message.includes('Network') ||
      error.message.includes('fetch')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  // Authentication
  async login(githubToken: string): Promise<APIResponse<{user: User; token: string}>> {
    return this.request<{user: User; token: string}>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({githubToken}),
    });
  }

  async refreshToken(): Promise<APIResponse<{token: string}>> {
    return this.request<{token: string}>('/auth/refresh', {
      method: 'POST',
    });
  }

  async logout(): Promise<APIResponse<void>> {
    const result = await this.request<void>('/auth/logout', {
      method: 'POST',
    });
    await this.clearAuthData();
    return result;
  }

  // User
  async getCurrentUser(): Promise<APIResponse<User>> {
    return this.request<User>('/user/me');
  }

  async updateUserProfile(data: Partial<User>): Promise<APIResponse<User>> {
    return this.request<User>('/user/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Projects
  async getProjects(page = 1, limit = 20): Promise<PaginatedResponse<Project>> {
    return this.request<Project[]>(`/projects?page=${page}&limit=${limit}`);
  }

  async getProject(id: string): Promise<APIResponse<Project>> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: Partial<Project>): Promise<APIResponse<Project>> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<APIResponse<Project>> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Sessions
  async getSessions(projectId: string, page = 1, limit = 20): Promise<PaginatedResponse<Session>> {
    return this.request<Session[]>(`/projects/${projectId}/sessions?page=${page}&limit=${limit}`);
  }

  async getSession(projectId: string, sessionId: string): Promise<APIResponse<Session>> {
    return this.request<Session>(`/projects/${projectId}/sessions/${sessionId}`);
  }

  async createSession(projectId: string, data: Partial<Session>): Promise<APIResponse<Session>> {
    return this.request<Session>(`/projects/${projectId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSession(
    projectId: string,
    sessionId: string,
    data: Partial<Session>
  ): Promise<APIResponse<Session>> {
    return this.request<Session>(`/projects/${projectId}/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSession(projectId: string, sessionId: string): Promise<APIResponse<void>> {
    return this.request<void>(`/projects/${projectId}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Chat Messages
  async sendMessage(
    projectId: string,
    sessionId: string,
    content: string
  ): Promise<APIResponse<ChatMessage>> {
    return this.request<ChatMessage>(`/projects/${projectId}/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({content}),
    });
  }

  async getMessages(
    projectId: string,
    sessionId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<ChatMessage>> {
    return this.request<ChatMessage[]>(
      `/projects/${projectId}/sessions/${sessionId}/messages?page=${page}&limit=${limit}`
    );
  }

  // Files
  async getFileTree(projectId: string, path = ''): Promise<APIResponse<any>> {
    return this.request<any>(`/projects/${projectId}/files/tree?path=${encodeURIComponent(path)}`);
  }

  async getFileContent(projectId: string, filePath: string): Promise<APIResponse<string>> {
    return this.request<string>(
      `/projects/${projectId}/files/content?path=${encodeURIComponent(filePath)}`
    );
  }

  async updateFileContent(
    projectId: string,
    filePath: string,
    content: string
  ): Promise<APIResponse<void>> {
    return this.request<void>(`/projects/${projectId}/files/content`, {
      method: 'PUT',
      body: JSON.stringify({path: filePath, content}),
    });
  }

  // CI/CD
  async getCIStatus(projectId: string): Promise<APIResponse<CIStatus[]>> {
    return this.request<CIStatus[]>(`/projects/${projectId}/ci`);
  }

  async getCIDetails(projectId: string, ciId: string): Promise<APIResponse<CIStatus>> {
    return this.request<CIStatus>(`/projects/${projectId}/ci/${ciId}`);
  }

  async getCILogs(projectId: string, ciId: string): Promise<APIResponse<string[]>> {
    return this.request<string[]>(`/projects/${projectId}/ci/${ciId}/logs`);
  }

  async triggerCI(projectId: string, branch?: string): Promise<APIResponse<CIStatus>> {
    return this.request<CIStatus>(`/projects/${projectId}/ci/trigger`, {
      method: 'POST',
      body: JSON.stringify({branch}),
    });
  }

  // Notifications
  async getNotifications(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request<any[]>(`/notifications?page=${page}&limit=${limit}`);
  }

  async markNotificationRead(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async clearAllNotifications(): Promise<APIResponse<void>> {
    return this.request<void>('/notifications', {
      method: 'DELETE',
    });
  }

  // Health Check
  async healthCheck(): Promise<APIResponse<{status: string; timestamp: string}>> {
    return this.request<{status: string; timestamp: string}>('/health');
  }
}

export const apiService = new APIService();