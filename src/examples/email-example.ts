import { pipeResult } from "../helpers/pipe";
import { type Result, error, isError, ok } from "../helpers/result";
import { type Tag } from "../helpers/tag";

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

const validateEmail: ValidateEmail = (email) => {
  if (!email.includes("@")) return error("InvalidEmail");
  return ok({
    _tag: "Email",
    value: email,
  });
};

const verifyEmail: VerifyEmail = (email) => {
  return ok({
    _tag: "VerifiedEmail",
    value: email,
  });
};

const sendResetPasswordEmail: SendResetPasswordEmail = (verifiedEmail) => {
  return ok({
    _tag: "ResetPasswordEmailSent",
    value: {
      to: verifiedEmail,
    },
  });
};

const updateEmail: UpdateEmail = (verifiedEmail) => {
  return ok({
    _tag: "UnverifiedEmail",
    value: verifiedEmail.value,
  });
};

// ======================================================
// Examples

export function emailExamples() {
  const validateEmailResult = validateEmail("test@test.com");
  if (isError(validateEmailResult)) return;

  const verifyEmailResult = verifyEmail(validateEmailResult.data);
  if (isError(verifyEmailResult)) return;

  const sendResetPasswordEmailResult = sendResetPasswordEmail(
    verifyEmailResult.data
  );
  if (isError(sendResetPasswordEmailResult)) return;

  const updateEmailResult = updateEmail(
    sendResetPasswordEmailResult.data.value.to
  );
  if (isError(updateEmailResult)) return;

  return updateEmailResult.data;
}

// ======================================================
// Pipe Examples

export function emailPipeExamples() {
  const result = pipeResult(validateEmail("test@test.com"))
    .flatMap((email) => verifyEmail(email))
    .flatMap((verifiedEmail) => sendResetPasswordEmail(verifiedEmail))
    .flatMap((verifiedEmail) => updateEmail(verifiedEmail.value.to))
    .unwrap();

  if (isError(result)) return;
  return result.data;
}
