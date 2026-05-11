import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required().min(8),
});

export type LoginSchema = yup.InferType<typeof loginSchema>;

export type Token = {
  access_token: string;
  token_type: string;
};
