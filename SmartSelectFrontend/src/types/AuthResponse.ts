import { User } from "./User";

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}