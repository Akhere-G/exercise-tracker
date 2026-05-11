import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required().min(8),
});

export const registerSchema = yup.object({
  username: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().required().min(8),
  repeatPassword: yup
    .string()
    .test("passwords-match", "Passwords must match", function (value) {
      return value === this.parent.password;
    }),
});

export type LoginSchema = yup.InferType<typeof loginSchema>;
export type RegisterSchema = yup.InferType<typeof registerSchema>;

export type Token = {
  access_token: string;
  token_type: string;
};
