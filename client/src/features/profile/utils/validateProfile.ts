import { ProfileFormErrors, ProfileFormInputs } from "../types";

export const validateProfileSetup = (
  inputs: Pick<ProfileFormInputs, "name" | "username">
): ProfileFormErrors => {
  const errors: ProfileFormErrors = {};

  if (!inputs.name.trim()) {
    errors.name = "Display name is required";
  }

  if (!inputs.username.trim()) {
    errors.username = "Username is required";
  } else if (inputs.username.length < 3) {
    errors.username = "Username must be at least 3 characters";
  } else if (!/^[a-zA-Z0-9_]+$/.test(inputs.username)) {
    errors.username =
      "Username can only contain letters, numbers, and underscores";
  }

  return errors;
};
