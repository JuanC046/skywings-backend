export interface Credentials {
  username: string;
  email: string;
  password: string;
}

export interface UserName {
  username: string;
}

export interface PasswordChange {
  username: string;
  currentPassword: string;
  newPassword: string;
}
