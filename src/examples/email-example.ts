import { pipeResult } from "../helpers/pipe";
import { type Result, error, isError, ok } from "../helpers/result";
import { type Tag } from "../helpers/tag";

/**
 * Illegal states avoided by types:
 * - An email string should NEVER be used before it is validated
 * - A reset password should NEVER be sent to an unverified email
 * - An updated email should NEVER be used before it is verified
 */

// ======================================================
// Types

type Email = Tag<"Email", string>;
type UnverifiedEmail = Tag<"UnverifiedEmail", Email>;
type VerifiedEmail = Tag<"VerifiedEmail", Email>;

// ======================================================
// Events

type ResetPasswordEmailSent = Tag<
  "ResetPasswordEmailSent",
  { to: VerifiedEmail }
>;

// ======================================================
// Functions Types

type ValidateEmail = (email: string) => Result<Email, "InvalidEmail">;

type VerifyEmail = (
  email: Email
) => Result<VerifiedEmail, "UnableToVerifyEmail">;

type SendResetPasswordEmail = (
  email: VerifiedEmail
) => Result<ResetPasswordEmailSent, "UnableToSendResetPasswordEmail">;

type UpdateEmail = (
  email: VerifiedEmail
) => Result<UnverifiedEmail, "UnableToUpdateEmail">;

// ======================================================
// Functions
// Function names starting with "try" are not guaranteed to succeed and should return a Result type

const tryValidateEmail: ValidateEmail = (email = "") => {
  if (!email.includes("@")) return error("InvalidEmail");
  return ok({
    _tag: "Email",
    value: email,
  });
};

const tryVerifyEmail: VerifyEmail = (email) => {
  return ok({
    _tag: "VerifiedEmail",
    value: email,
  });
};

const trySendResetPasswordEmail: SendResetPasswordEmail = (verifiedEmail) => {
  return ok({
    _tag: "ResetPasswordEmailSent",
    value: {
      to: verifiedEmail,
    },
  });
};

const tryUpdateEmail: UpdateEmail = (verifiedEmail) => {
  return ok({
    _tag: "UnverifiedEmail",
    value: verifiedEmail.value,
  });
};

// ======================================================
// Examples

export function emailExamples() {
  const validateEmailResult = tryValidateEmail("test@test.com");
  if (isError(validateEmailResult)) return;

  const verifyEmailResult = tryVerifyEmail(validateEmailResult.data);
  if (isError(verifyEmailResult)) return;

  const sendResetPasswordEmailResult = trySendResetPasswordEmail(
    verifyEmailResult.data
  );
  if (isError(sendResetPasswordEmailResult)) return;

  const updateEmailResult = tryUpdateEmail(
    sendResetPasswordEmailResult.data.value.to
  );
  if (isError(updateEmailResult)) return;

  return updateEmailResult.data;
}

// ======================================================
// Pipe Examples

export function emailPipeExamples() {
  const result = pipeResult(tryValidateEmail("test@test.com"))
    .flatMap((email) => tryVerifyEmail(email))
    .flatMap((verifiedEmail) => trySendResetPasswordEmail(verifiedEmail))
    .flatMap((verifiedEmail) => tryUpdateEmail(verifiedEmail.value.to))
    .unwrap();

  if (isError(result)) return;
  return result.data;
}
