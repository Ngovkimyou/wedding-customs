export const LOGIN_ERROR_MESSAGE = "Invalid email or password";
export const SIGNUP_ERROR_MESSAGE = "Unable to create account";
export const CAPTCHA_FAILED_ERROR_MESSAGE = "The security check could not be verified. Please try again.";

/**
 * Keep provider details out of user-facing authentication errors. In
 * particular, login must not reveal whether an email address exists.
 */
export function getAuthErrorMessage({ isLogin, error } = {}) {
  if (error?.code === "captcha_failed") {
    return CAPTCHA_FAILED_ERROR_MESSAGE;
  }

  return isLogin ? LOGIN_ERROR_MESSAGE : SIGNUP_ERROR_MESSAGE;
}
