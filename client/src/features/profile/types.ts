export interface ProfileFormInputs {
  name: string;
  username: string;
  bio: string;
  email?: string;
  password?: string;
}

export interface ProfileFormErrors {
  name?: string;
  username?: string;
}
